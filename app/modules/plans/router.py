"""Application Plans router."""

from __future__ import annotations

import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from database import Database
from modules.matching.service import MatchingService, _to_student_profile
from modules.students.repository import StudentRepository
from ai.scholarship_agent.tools.application_planner_tool import build_application_plan
from ai.scholarship_agent.schemas.scholarship_schemas import EvaluatorOutput, StrengthWeaknessAnalysis, MatchResult

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/plans", tags=["Application Plans"])

_executor = ThreadPoolExecutor(max_workers=3)


class PlanOptions(BaseModel):
    top_n: int = 5
    model_name: str | None = None
    api_key: str | None = None


@router.post("/{student_id}")
async def generate_plan(student_id: str, options: PlanOptions = PlanOptions()) -> dict:
    """
    Generate a full application plan for the top-N matched scholarships.
    Supports dynamic model selection and custom API key.
    """
    student_row = await StudentRepository.get_by_id(student_id)
    if not student_row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Student not found")

    result_row = await Database.fetch_one(
        "SELECT * FROM match_results WHERE student_id = ? ORDER BY ran_at DESC LIMIT 1",
        (student_id,),
    )

    if not result_row:
        try:
            await MatchingService().run(
                student_id,
                model_name=options.model_name,
                api_key=options.api_key,
            )
        except Exception as e:
            raise HTTPException(500, detail=f"Matching failed: {e}")
        result_row = await Database.fetch_one(
            "SELECT * FROM match_results WHERE student_id = ? ORDER BY ran_at DESC LIMIT 1",
            (student_id,),
        )

    analysis = StrengthWeaknessAnalysis(**json.loads(result_row["analysis_json"]))
    matches = [MatchResult(**m) for m in json.loads(result_row["matches_json"])]
    evaluator_output = EvaluatorOutput(
        student_id=student_id,
        analysis=analysis,
        ranked_matches=matches,
        trigger_external_search=bool(result_row["trigger_external_search"]),
        external_search_reason=result_row.get("external_search_reason"),
        top_match_percentage=result_row["top_match_percentage"],
    )

    student = _to_student_profile(student_row)

    loop = asyncio.get_event_loop()
    plan = await loop.run_in_executor(
        _executor,
        lambda: build_application_plan(student, evaluator_output, top_n=options.top_n),
    )

    plan_json = plan.model_dump_json()

    await Database.execute(
        "INSERT INTO application_plans (student_id, result_id, plan_json) VALUES (?,?,?)",
        (student_id, result_row["id"], plan_json),
    )

    return plan.model_dump()


@router.get("/{student_id}/latest")
async def get_latest_plan(student_id: str) -> dict:
    row = await Database.fetch_one(
        "SELECT * FROM application_plans WHERE student_id = ? ORDER BY generated_at DESC LIMIT 1",
        (student_id,),
    )
    if not row:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="No plan found. Run POST /plans/{student_id} first.")
    return json.loads(row["plan_json"])
