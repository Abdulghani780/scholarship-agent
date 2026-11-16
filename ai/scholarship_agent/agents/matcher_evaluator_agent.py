"""
Matcher & Evaluator Sub-Agent  (Tasks 3, 5)
===========================================

Responsibilities
----------------
1. Task 5 — Student Profile Analysis:
   Inspect the student's qualifications (GPA, major, language, interests,
   experiences) and produce a StrengthWeaknessAnalysis against typical
   scholarship winner profiles.

2. Task 3 — Hybrid Match Engine:
   For every available scholarship, compute a match_percentage built from:
     - Programmatic hard filters  (GPA, degree, language, nationality)
     - Semantic LLM alignment     (research interests vs. scholarship mission)
   Sort results descending and return a ranked list with per-score breakdown
   and human-readable reasoning.

3. External-Search Trigger:
   When no internal scholarship exceeds 40 %, set trigger_external_search=True
   so the orchestrating crew can activate the external-search sub-agent.

Usage (standalone)
------------------
    from ai.scholarship_agent.agents.matcher_evaluator_agent import build_crew
    result: EvaluatorOutput = asyncio.run(build_crew(profile, scholarships))
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any

from crewai import Agent, Crew, Process, Task
from crewai.tools import BaseTool
from pydantic import Field

from ..schemas.scholarship_schemas import (
    DegreeLevel,
    EvaluatorOutput,
    LanguageLevel,
    MatchResult,
    MatchTier,
    ScoreBreakdown,
    Scholarship,
    StrengthWeaknessAnalysis,
    StudentProfile,
)

# ---------------------------------------------------------------------------
# LLM Configuration  — reuse project provider; override via env
# ---------------------------------------------------------------------------

_DEFAULT_MODEL = os.environ.get("SCHOLARSHIP_LLM", "gemini/gemini-2.0-flash")
_MAX_ITER = int(os.environ.get("SCHOLARSHIP_MAX_ITER", "5"))

# ---------------------------------------------------------------------------
# Weights for the Hybrid Score
# ---------------------------------------------------------------------------

WEIGHTS: dict[str, float] = {
    "gpa":           0.20,
    "degree":        0.20,
    "language":      0.15,
    "nationality":   0.10,
    "major":         0.10,
    "semantic":      0.15,   # LLM-computed research alignment
    "experience":    0.05,
    "publications":  0.05,
}
assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-6, "Weights must sum to 1.0"

# ---------------------------------------------------------------------------
# Hard-filter helpers (programmatic — deterministic)
# ---------------------------------------------------------------------------

_LEVEL_ORDER = [e.value for e in LanguageLevel]


def _lang_level_num(level: LanguageLevel) -> int:
    return _LEVEL_ORDER.index(level.value)


def _score_gpa(student: StudentProfile, scholarship: Scholarship) -> float:
    req = scholarship.requirements
    if req.min_gpa and student.gpa < req.min_gpa:
        return 0.0                              # hard disqualify
    if req.max_gpa and student.gpa > req.max_gpa:
        return 0.0
    if req.min_gpa is None:
        return 100.0
    # linear scale: at min_gpa → 60, at 4.0 → 100
    return min(100.0, 60.0 + (student.gpa - req.min_gpa) / (4.0 - req.min_gpa) * 40.0)


def _score_degree(student: StudentProfile, scholarship: Scholarship) -> float:
    return 100.0 if student.target_degree in scholarship.requirements.degree_levels else 0.0


def _score_language(student: StudentProfile, scholarship: Scholarship) -> float:
    req_langs = scholarship.requirements.language_requirements
    if not req_langs:
        return 100.0

    scores: list[float] = []
    for req in req_langs:
        matches = [
            lang for lang in student.languages
            if lang.language.lower() == req.language.lower()
        ]
        if not matches:
            scores.append(0.0)
            continue
        best = max(matches, key=lambda l: _lang_level_num(l.level))
        student_num = _lang_level_num(best.level)
        req_num = _lang_level_num(req.level)
        if student_num < req_num:
            scores.append(0.0)
        else:
            # bonus for exceeding requirement
            scores.append(min(100.0, 80.0 + (student_num - req_num) * 10.0))

    return sum(scores) / len(scores)


def _score_nationality(student: StudentProfile, scholarship: Scholarship) -> float:
    eligible = scholarship.requirements.eligible_nationalities
    if not eligible:
        return 100.0
    return 100.0 if student.nationality.lower() in [n.lower() for n in eligible] else 0.0


def _score_major(student: StudentProfile, scholarship: Scholarship) -> float:
    eligible = scholarship.requirements.eligible_majors
    if not eligible:
        return 100.0
    student_major = student.major.lower()
    for m in eligible:
        if m.lower() in student_major or student_major in m.lower():
            return 100.0
    # partial: check target_fields overlap
    for field in scholarship.fields_of_study:
        for interest in student.target_fields:
            if field.lower() in interest.lower() or interest.lower() in field.lower():
                return 60.0
    return 0.0


def _score_experience(student: StudentProfile, _scholarship: Scholarship) -> float:
    n = len(student.experiences)
    return min(100.0, n * 20.0)


def _score_publications(student: StudentProfile, scholarship: Scholarship) -> float:
    req_min = scholarship.requirements.min_publications
    if req_min == 0:
        return 100.0 if student.publications == 0 else min(100.0, 80.0 + student.publications * 10.0)
    if student.publications < req_min:
        return 0.0
    return min(100.0, 80.0 + (student.publications - req_min) * 5.0)


def _tier(pct: float) -> MatchTier:
    if pct >= 80:
        return MatchTier.EXCELLENT
    if pct >= 60:
        return MatchTier.GOOD
    if pct >= 40:
        return MatchTier.FAIR
    return MatchTier.WEAK


def _get_disqualifiers(student: StudentProfile, scholarship: Scholarship) -> list[str]:
    out: list[str] = []
    req = scholarship.requirements
    if req.min_gpa and student.gpa < req.min_gpa:
        out.append(f"GPA {student.gpa:.2f} is below minimum {req.min_gpa:.2f}")
    if student.target_degree not in req.degree_levels:
        out.append(f"Degree level '{student.target_degree.value}' not eligible")
    eligible_nat = req.eligible_nationalities
    if eligible_nat and student.nationality.lower() not in [n.lower() for n in eligible_nat]:
        out.append(f"Nationality '{student.nationality}' not in eligible list")
    return out


def _get_missing_docs(student: StudentProfile, scholarship: Scholarship) -> list[str]:
    # Placeholder: real implementation checks uploaded document registry
    # For now we just return required doc names as a reminder
    return scholarship.requirements.required_documents

# ---------------------------------------------------------------------------
# CrewAI Tools
# ---------------------------------------------------------------------------


class ProgrammaticMatcherTool(BaseTool):
    """Runs deterministic hard-filter scoring for one (student, scholarship) pair."""

    name: str = "programmatic_matcher"
    description: str = (
        "Compute hard-filter scores (GPA, degree, language, nationality, major, "
        "experience, publications) for a student against a scholarship. "
        "Returns a JSON ScoreBreakdown (without semantic_alignment_score)."
    )

    # injected via model_fields
    student: StudentProfile = Field(...)
    scholarship: Scholarship = Field(...)

    def _run(self, *_args: Any, **_kwargs: Any) -> str:
        breakdown = {
            "gpa_score":          _score_gpa(self.student, self.scholarship),
            "degree_score":       _score_degree(self.student, self.scholarship),
            "language_score":     _score_language(self.student, self.scholarship),
            "nationality_score":  _score_nationality(self.student, self.scholarship),
            "major_score":        _score_major(self.student, self.scholarship),
            "semantic_alignment_score": 0.0,   # filled by LLM task
            "experience_score":   _score_experience(self.student, self.scholarship),
            "publications_score": _score_publications(self.student, self.scholarship),
        }
        return json.dumps(breakdown, ensure_ascii=False)


class ScholarshipListTool(BaseTool):
    """Returns the full list of internal scholarships as JSON."""

    name: str = "list_scholarships"
    description: str = "Return all available scholarships as a JSON array for the agent to process."
    scholarships: list[Scholarship] = Field(...)

    def _run(self, *_args: Any, **_kwargs: Any) -> str:
        return json.dumps(
            [s.model_dump() for s in self.scholarships],
            ensure_ascii=False,
            default=str,
        )


class StudentProfileTool(BaseTool):
    """Returns the student profile as JSON."""

    name: str = "get_student_profile"
    description: str = "Return the student profile as JSON for analysis."
    student: StudentProfile = Field(...)

    def _run(self, *_args: Any, **_kwargs: Any) -> str:
        return self.student.model_dump_json(indent=2)


# ---------------------------------------------------------------------------
# Agent + Task builders
# ---------------------------------------------------------------------------


def _build_profile_analyst_agent(
    student: StudentProfile,
) -> tuple[Agent, Task]:
    """Task 5: Analyze student profile → StrengthWeaknessAnalysis."""

    agent = Agent(
        role="Student Profile Analyst",
        goal=(
            "Analyze the student's academic profile in depth. "
            "Identify concrete strengths, weaknesses, and competitive gaps "
            "compared to typical scholarship winner profiles."
        ),
        backstory=(
            "You are a senior scholarship counselor with 15+ years of experience "
            "evaluating student applications for competitive international scholarships. "
            "You give honest, actionable assessments — not empty encouragement."
        ),
        tools=[StudentProfileTool(student=student)],
        llm=_DEFAULT_MODEL,
        max_iter=_MAX_ITER,
        verbose=False,
    )

    task = Task(
        description=(
            "1. Call get_student_profile to retrieve the student's data.\n"
            "2. Evaluate the profile across: GPA competitiveness, research depth, "
            "language proficiency, field alignment, publications, and experiences.\n"
            "3. Return a JSON object matching StrengthWeaknessAnalysis schema:\n"
            "   { strengths, weaknesses, competitive_gaps, improvement_suggestions, "
            "overall_competitiveness }\n"
            "Be specific — cite actual values (GPA=X, languages=Y) in your analysis."
        ),
        expected_output=(
            "A JSON object with keys: strengths (list[str]), weaknesses (list[str]), "
            "competitive_gaps (list[str]), improvement_suggestions (list[str]), "
            "overall_competitiveness (str)."
        ),
        agent=agent,
        output_pydantic=StrengthWeaknessAnalysis,
    )

    return agent, task


def _build_matcher_agent(
    student: StudentProfile,
    scholarships: list[Scholarship],
    programmatic_scores: dict[str, dict],
) -> tuple[Agent, Task]:
    """Task 3: Hybrid matching → ranked MatchResult list."""

    # Build a compact scores summary to inject as context
    scores_summary = json.dumps(programmatic_scores, ensure_ascii=False, indent=2)

    agent = Agent(
        role="Scholarship Matcher & Scoring Engine",
        goal=(
            "For each scholarship, combine the pre-computed hard-filter scores "
            "with a semantic assessment of research interest alignment. "
            "Produce a final match_percentage and clear recommendation reasons."
        ),
        backstory=(
            "You are a data-driven scholarship matching engine. "
            "You are given numeric sub-scores for each scholarship and a student profile. "
            "Your job is to assess semantic alignment (research interests vs. scholarship mission) "
            "on a 0-100 scale, combine it with the numeric scores using the defined weights, "
            "and produce a ranked list of matches with honest reasons."
        ),
        tools=[
            ScholarshipListTool(scholarships=scholarships),
            StudentProfileTool(student=student),
        ],
        llm=_DEFAULT_MODEL,
        max_iter=_MAX_ITER,
        verbose=False,
    )

    weights_str = json.dumps(WEIGHTS, indent=2)

    task = Task(
        description=(
            f"Pre-computed hard-filter scores per scholarship (JSON):\n{scores_summary}\n\n"
            f"Score weights:\n{weights_str}\n\n"
            "Instructions:\n"
            "1. For each scholarship, assess semantic_alignment_score (0-100) by comparing "
            "the student's research_interests and target_fields with the scholarship's "
            "mission_statement and fields_of_study. Be rigorous.\n"
            "2. Compute final match_percentage = weighted sum of all sub-scores.\n"
            "3. Classify tier: excellent(≥80), good(≥60), fair(≥40), weak(<40).\n"
            "4. Write 2-4 concrete recommendation_reasons and list disqualifying_factors.\n"
            "5. Return a JSON array of MatchResult objects, sorted descending by match_percentage.\n"
            "6. Set trigger_external_search=true if ALL scholarships score < 40%.\n"
        ),
        expected_output=(
            "A JSON object: { ranked_matches: [MatchResult...], trigger_external_search: bool, "
            "external_search_reason: str|null }"
        ),
        agent=agent,
        context=[],   # will be linked to profile task at crew level
    )

    return agent, task


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def compute_programmatic_scores(
    student: StudentProfile,
    scholarships: list[Scholarship],
) -> dict[str, dict]:
    """
    Run all deterministic hard-filter scores synchronously.
    Returns { scholarship_id: ScoreBreakdown-dict (without semantic) }
    """
    result: dict[str, dict] = {}
    for s in scholarships:
        result[s.scholarship_id] = {
            "scholarship_name": s.name,
            "deadline": s.deadline,
            "gpa_score":         _score_gpa(student, s),
            "degree_score":      _score_degree(student, s),
            "language_score":    _score_language(student, s),
            "nationality_score": _score_nationality(student, s),
            "major_score":       _score_major(student, s),
            "experience_score":  _score_experience(student, s),
            "publications_score":_score_publications(student, s),
            "disqualifiers":     _get_disqualifiers(student, s),
            "missing_documents": _get_missing_docs(student, s),
        }
    return result


def build_crew(
    student: StudentProfile,
    scholarships: list[Scholarship],
) -> EvaluatorOutput:
    """
    Assemble and run the Matcher & Evaluator crew.

    Flow (sequential):
      1. Profile Analyst   → StrengthWeaknessAnalysis
      2. Matcher Agent     → ranked MatchResult list (uses profile analysis as context)

    Returns EvaluatorOutput ready for the orchestrating crew or the planner.
    """
    # Step 1: pre-compute hard-filter scores (deterministic — fast, cheap)
    programmatic_scores = compute_programmatic_scores(student, scholarships)

    # Step 2: build agents & tasks
    analyst_agent, analyst_task = _build_profile_analyst_agent(student)
    matcher_agent, matcher_task = _build_matcher_agent(student, scholarships, programmatic_scores)

    # Wire context: matcher sees analyst output
    matcher_task.context = [analyst_task]

    crew = Crew(
        agents=[analyst_agent, matcher_agent],
        tasks=[analyst_task, matcher_task],
        process=Process.sequential,
        verbose=False,
        max_rpm=10,
    )

    raw = crew.kickoff()

    # ---------------------------------------------------------------------------
    # Parse outputs
    # ---------------------------------------------------------------------------
    # analyst_task.output.pydantic gives StrengthWeaknessAnalysis
    analysis: StrengthWeaknessAnalysis = analyst_task.output.pydantic

    # matcher_task raw output is JSON — parse manually
    matcher_raw: str = matcher_task.output.raw
    try:
        matcher_data = json.loads(matcher_raw)
    except json.JSONDecodeError:
        # Attempt to extract JSON block if the LLM wrapped it in markdown
        import re
        m = re.search(r"\{.*\}", matcher_raw, re.DOTALL)
        matcher_data = json.loads(m.group()) if m else {}

    ranked_matches: list[MatchResult] = [
        MatchResult(**item) for item in matcher_data.get("ranked_matches", [])
    ]

    trigger = matcher_data.get("trigger_external_search", False)
    ext_reason = matcher_data.get("external_search_reason")
    top_pct = ranked_matches[0].match_percentage if ranked_matches else 0.0

    # Safety: if no match exceeds 40 % but flag wasn't set by LLM
    if top_pct < 40.0 and not trigger:
        trigger = True
        ext_reason = ext_reason or "All internal matches scored below 40%; external search required."

    return EvaluatorOutput(
        student_id=student.student_id,
        analysis=analysis,
        ranked_matches=ranked_matches,
        trigger_external_search=trigger,
        external_search_reason=ext_reason,
        top_match_percentage=top_pct,
    )
