"""Matching router."""

from __future__ import annotations

import logging
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from modules.matching.service import MatchingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/match", tags=["Matching Agent"])

_service = MatchingService()


class MatchOptions(BaseModel):
    model_name: str | None = None
    api_key: str | None = None


@router.post("/{student_id}")
async def run_match(student_id: str, options: MatchOptions = MatchOptions()) -> dict:
    """
    Triggers the Hybrid Matcher & Evaluator agent for a student.
    Supports dynamic model selection and custom API key.
    """
    try:
        result = await _service.run(
            student_id,
            model_name=options.model_name,
            api_key=options.api_key,
        )
        return result
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Match failed for student %s", student_id)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Agent error: {e}")
