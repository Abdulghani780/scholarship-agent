"""Students router."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, status

from modules.students.repository import StudentRepository
from modules.students.schemas import CreateStudentRequest, StudentResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/students", tags=["Students"])


@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(body: CreateStudentRequest) -> StudentResponse:
    student = await StudentRepository.create(body.model_dump())
    return StudentResponse(**student)


@router.get("", response_model=list[StudentResponse])
async def list_students() -> list[StudentResponse]:
    students = await StudentRepository.list_all()
    return [StudentResponse(**s) for s in students]


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str) -> StudentResponse:
    student = await StudentRepository.get_by_id(student_id)
    if not student:
        raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Student not found")
    return StudentResponse(**student)
