"""Matching service — bridges FastAPI layer with the AI agent layer."""

from __future__ import annotations

import asyncio
import json
import logging
from concurrent.futures import ThreadPoolExecutor

from database import Database
from modules.scholarships.repository import ScholarshipRepository
from modules.students.repository import StudentRepository

# reuse the agent we built
from ai.scholarship_agent.agents.matcher_evaluator_agent import build_crew
from ai.scholarship_agent.schemas.scholarship_schemas import (
    DegreeLevel,
    LanguageLevel,
    LanguageScore,
    Scholarship,
    ScholarshipRequirements,
    StudentProfile,
)

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=2)


def _to_student_profile(row: dict) -> StudentProfile:
    langs = [
        LanguageScore(
            language=l["language"],
            level=LanguageLevel(l["level"]),
            test_name=l.get("test_name"),
            score=l.get("score"),
        )
        for l in row.get("languages", [])
    ]
    return StudentProfile(
        student_id=row["id"],
        name=row["name"],
        gpa=row["gpa"],
        major=row["major"],
        degree_level=DegreeLevel(row["degree_level"]),
        target_degree=DegreeLevel(row["target_degree"]),
        nationality=row["nationality"],
        country_of_residence=row["country_of_residence"],
        research_interests=row.get("research_interests", []),
        languages=langs,
        experiences=row.get("experiences", []),
        extracurriculars=row.get("extracurriculars", []),
        target_countries=row.get("target_countries", []),
        target_fields=row.get("target_fields", []),
        publications=row.get("publications", 0),
    )


def _to_scholarship(row: dict) -> Scholarship:
    req = row.get("requirements", {})
    lang_reqs = [
        LanguageScore(
            language=l["language"],
            level=LanguageLevel(l["level"]),
            test_name=l.get("test_name"),
            score=l.get("score"),
        )
        for l in req.get("language_requirements", [])
    ]
    return Scholarship(
        scholarship_id=row["id"],
        name=row["name"],
        provider=row["provider"],
        country=row["country"],
        description=row["description"],
        mission_statement=row["mission_statement"],
        requirements=ScholarshipRequirements(
            min_gpa=req.get("min_gpa"),
            max_gpa=req.get("max_gpa"),
            degree_levels=[DegreeLevel(d) for d in req.get("degree_levels", [])],
            eligible_majors=req.get("eligible_majors", []),
            eligible_nationalities=req.get("eligible_nationalities", []),
            language_requirements=lang_reqs,
            required_documents=req.get("required_documents", []),
            min_publications=req.get("min_publications", 0),
        ),
        deadline=row["deadline"],
        funding_type=row["funding_type"],
        fields_of_study=row.get("fields_of_study", []),
        application_url=row.get("application_url"),
    )


class MatchingService:
    async def run(self, student_id: str) -> dict:
        student_row = await StudentRepository.get_by_id(student_id)
        if not student_row:
            raise ValueError(f"Student {student_id} not found")

        scholarship_rows = await ScholarshipRepository.list_active()
        if not scholarship_rows:
            raise ValueError("No active scholarships in the database")

        student = _to_student_profile(student_row)
        scholarships = [_to_scholarship(r) for r in scholarship_rows]

        logger.info("Running match for student=%s against %d scholarships", student_id, len(scholarships))

        # CrewAI is sync — run in executor to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            _executor,
            lambda: build_crew(student, scholarships),
        )

        # Persist result
        await Database.execute(
            """INSERT INTO match_results
               (student_id, trigger_external_search, external_search_reason,
                top_match_percentage, analysis_json, matches_json)
               VALUES (?,?,?,?,?,?)""",
            (
                student_id,
                int(result.trigger_external_search),
                result.external_search_reason,
                result.top_match_percentage,
                result.analysis.model_dump_json(),
                json.dumps([m.model_dump() for m in result.ranked_matches], ensure_ascii=False, default=str),
            ),
        )

        return result.model_dump()
