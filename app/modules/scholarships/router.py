"""Scholarships router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from modules.scholarships.repository import ScholarshipRepository
from modules.scholarships.schemas import CreateScholarshipRequest, ScholarshipResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/scholarships", tags=["Scholarships"])


@router.post("", response_model=ScholarshipResponse, status_code=status.HTTP_201_CREATED)
async def create_scholarship(body: CreateScholarshipRequest) -> ScholarshipResponse:
    s = await ScholarshipRepository.create(body.model_dump())
    return ScholarshipResponse(**s)


@router.get("", response_model=list[ScholarshipResponse])
async def list_scholarships() -> list[ScholarshipResponse]:
    rows = await ScholarshipRepository.list_active()
    return [ScholarshipResponse(**r) for r in rows]


@router.get("/{scholarship_id}", response_model=ScholarshipResponse)
async def get_scholarship(scholarship_id: str) -> ScholarshipResponse:
    s = await ScholarshipRepository.get_by_id(scholarship_id)
    if not s:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Scholarship not found")
    return ScholarshipResponse(**s)
