"""Students module — schemas."""

from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class LanguageScoreIn(BaseModel):
    language: str
    level: str  # A1-C2 / native
    test_name: str | None = None
    score: float | None = None


class CreateStudentRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    gpa: float = Field(ge=0.0, le=4.0)
    major: str = Field(min_length=2, max_length=120)
    degree_level: str
    target_degree: str
    nationality: str
    country_of_residence: str
    research_interests: list[str] = []
    languages: list[LanguageScoreIn] = []
    experiences: list[str] = []
    extracurriculars: list[str] = []
    target_countries: list[str] = []
    target_fields: list[str] = []
    publications: int = Field(0, ge=0)


class StudentResponse(BaseModel):
    id: str
    name: str
    email: str
    gpa: float
    major: str
    degree_level: str
    target_degree: str
    nationality: str
    country_of_residence: str
    research_interests: list[str]
    languages: list[dict]
    experiences: list[str]
    extracurriculars: list[str]
    target_countries: list[str]
    target_fields: list[str]
    publications: int
    created_at: str
