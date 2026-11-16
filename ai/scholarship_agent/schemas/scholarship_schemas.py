"""
Scholarship Agent — Shared Pydantic Schemas
Defines all data contracts between agents, tools, and the application layer.
"""

from __future__ import annotations

from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class LanguageLevel(str, Enum):
    A1 = "A1"
    A2 = "A2"
    B1 = "B1"
    B2 = "B2"
    C1 = "C1"
    C2 = "C2"
    NATIVE = "native"


class DegreeLevel(str, Enum):
    HIGH_SCHOOL = "high_school"
    BACHELOR = "bachelor"
    MASTER = "master"
    PHD = "phd"


class MatchTier(str, Enum):
    EXCELLENT = "excellent"   # >= 80%
    GOOD = "good"             # >= 60%
    FAIR = "fair"             # >= 40%
    WEAK = "weak"             # < 40%


class DocumentStatus(str, Enum):
    REQUIRED = "required"
    OPTIONAL = "optional"
    CONDITIONAL = "conditional"


# ---------------------------------------------------------------------------
# Student Profile
# ---------------------------------------------------------------------------


class LanguageScore(BaseModel):
    language: str = Field(..., description="e.g. English, Arabic, German")
    level: LanguageLevel
    test_name: str | None = Field(None, description="e.g. IELTS, TOEFL, Goethe")
    score: float | None = Field(None, description="Numeric score if applicable")


class StudentProfile(BaseModel):
    student_id: str
    name: str
    degree_level: DegreeLevel = Field(..., description="Current or most recent degree")
    gpa: float = Field(..., ge=0.0, le=4.0, description="GPA on 4.0 scale")
    major: str
    research_interests: list[str] = Field(default_factory=list)
    languages: list[LanguageScore] = Field(default_factory=list)
    nationality: str
    country_of_residence: str
    experiences: list[str] = Field(
        default_factory=list,
        description="Research, volunteer, internship, work experiences",
    )
    publications: int = Field(0, description="Number of published papers")
    extracurriculars: list[str] = Field(default_factory=list)
    target_degree: DegreeLevel = Field(..., description="Degree being applied for")
    target_countries: list[str] = Field(default_factory=list)
    target_fields: list[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Scholarship Definition
# ---------------------------------------------------------------------------


class ScholarshipRequirements(BaseModel):
    min_gpa: float | None = Field(None, ge=0.0, le=4.0)
    max_gpa: float | None = Field(None, ge=0.0, le=4.0)
    degree_levels: list[DegreeLevel]
    eligible_majors: list[str] = Field(default_factory=list, description="Empty = all majors")
    eligible_nationalities: list[str] = Field(default_factory=list, description="Empty = all nationalities")
    language_requirements: list[LanguageScore] = Field(default_factory=list)
    required_documents: list[str] = Field(default_factory=list)
    min_publications: int = Field(0)


class Scholarship(BaseModel):
    scholarship_id: str
    name: str
    provider: str
    country: str
    description: str
    mission_statement: str = Field(..., description="Used for semantic alignment scoring")
    requirements: ScholarshipRequirements
    deadline: str = Field(..., description="ISO date string YYYY-MM-DD")
    funding_type: str = Field(..., description="full / partial / stipend")
    fields_of_study: list[str] = Field(default_factory=list)
    application_url: str | None = None
    extra_info: dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Match Result
# ---------------------------------------------------------------------------


class ScoreBreakdown(BaseModel):
    gpa_score: float = Field(..., ge=0.0, le=100.0)
    degree_score: float = Field(..., ge=0.0, le=100.0)
    language_score: float = Field(..., ge=0.0, le=100.0)
    nationality_score: float = Field(..., ge=0.0, le=100.0)
    major_score: float = Field(..., ge=0.0, le=100.0)
    semantic_alignment_score: float = Field(..., ge=0.0, le=100.0, description="LLM-based research interest alignment")
    experience_score: float = Field(..., ge=0.0, le=100.0)
    publications_score: float = Field(..., ge=0.0, le=100.0)


class MatchResult(BaseModel):
    scholarship_id: str
    scholarship_name: str
    match_percentage: float = Field(..., ge=0.0, le=100.0)
    tier: MatchTier
    breakdown: ScoreBreakdown
    recommendation_reasons: list[str]
    disqualifying_factors: list[str] = Field(default_factory=list)
    missing_documents: list[str] = Field(default_factory=list)
    deadline: str


# ---------------------------------------------------------------------------
# Student Analysis
# ---------------------------------------------------------------------------


class StrengthWeaknessAnalysis(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    competitive_gaps: list[str] = Field(
        ..., description="Gaps vs. typical scholarship winner profiles"
    )
    improvement_suggestions: list[str]
    overall_competitiveness: str = Field(
        ..., description="Short narrative: how competitive this student is overall"
    )


# ---------------------------------------------------------------------------
# Evaluator Agent Output
# ---------------------------------------------------------------------------


class EvaluatorOutput(BaseModel):
    student_id: str
    analysis: StrengthWeaknessAnalysis
    ranked_matches: list[MatchResult]
    trigger_external_search: bool = Field(
        False,
        description="True when no internal match exceeds 40% — signals main agent to run external search",
    )
    external_search_reason: str | None = Field(
        None, description="Why external search was triggered"
    )
    top_match_percentage: float


# ---------------------------------------------------------------------------
# Application Plan
# ---------------------------------------------------------------------------


class DocumentItem(BaseModel):
    name: str
    status: DocumentStatus
    description: str
    tips: str | None = None


class ApplicationStep(BaseModel):
    step_number: int
    title: str
    description: str
    due_by: str = Field(..., description="ISO date or relative e.g. '2 weeks before deadline'")
    is_critical: bool = Field(False)


class ScholarshipPlan(BaseModel):
    scholarship_id: str
    scholarship_name: str
    deadline: str
    priority_rank: int
    match_percentage: float
    required_documents: list[DocumentItem]
    application_steps: list[ApplicationStep]
    estimated_preparation_days: int
    key_tips: list[str]


class ApplicationPlan(BaseModel):
    student_id: str
    generated_at: str
    scholarship_plans: list[ScholarshipPlan]
    overall_timeline_summary: str
