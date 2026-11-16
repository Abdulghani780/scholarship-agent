"""Scholarships module — schemas."""

from __future__ import annotations

from pydantic import BaseModel, Field


class LanguageRequirementIn(BaseModel):
    language: str
    level: str
    test_name: str | None = None
    score: float | None = None


class RequirementsIn(BaseModel):
    min_gpa: float | None = Field(None, ge=0, le=4)
    max_gpa: float | None = Field(None, ge=0, le=4)
    degree_levels: list[str] = []
    eligible_majors: list[str] = []
    eligible_nationalities: list[str] = []
    language_requirements: list[LanguageRequirementIn] = []
    required_documents: list[str] = []
    min_publications: int = 0


class CreateScholarshipRequest(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    provider: str
    country: str
    description: str
    mission_statement: str
    requirements: RequirementsIn = RequirementsIn()
    deadline: str = Field(..., description="YYYY-MM-DD")
    funding_type: str = Field(..., description="full / partial / stipend")
    fields_of_study: list[str] = []
    application_url: str | None = None


class ScholarshipResponse(BaseModel):
    id: str
    name: str
    provider: str
    country: str
    description: str
    mission_statement: str
    requirements: dict
    deadline: str
    funding_type: str
    fields_of_study: list[str]
    application_url: str | None
    is_active: bool
    created_at: str
