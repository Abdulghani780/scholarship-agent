"""Matching router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from modules.matching.service import MatchingService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/match", tags=["Matching Agent"])

_service = MatchingService()


@router.post("/{student_id}")
async def run_match(student_id: str) -> dict:
    """
    Triggers the Hybrid Matcher & Evaluator agent for a student.
    Returns ranked scholarships + strength/weakness analysis.
    """
    try:
        result = await _service.run(student_id)
        return result
    except ValueError as e:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail=str(e))
    except Exception as e:
        logger.exception("Match failed for student %s", student_id)
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Agent error: {e}")
