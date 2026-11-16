"""
Application Planner Tool  (Task 8)
===================================

Takes the ranked output from matcher_evaluator_agent and generates a
prioritized, chronological application roadmap per scholarship — with
required documents, step-by-step actions, and estimated preparation timeline.

Usage
-----
    from ai.scholarship_agent.tools.application_planner_tool import build_application_plan

    plan: ApplicationPlan = build_application_plan(
        student=profile,
        evaluator_output=evaluator_result,
        top_n=5,              # only plan the top-N matches
    )
"""

from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta
from typing import Any

from crewai import Agent, Crew, Process, Task
from crewai.tools import BaseTool
from pydantic import Field

from ..schemas.scholarship_schemas import (
    ApplicationPlan,
    ApplicationStep,
    DocumentItem,
    DocumentStatus,
    EvaluatorOutput,
    MatchResult,
    ScholarshipPlan,
    StudentProfile,
)

_DEFAULT_MODEL = os.environ.get("SCHOLARSHIP_LLM", "gemini/gemini-2.0-flash")
_MAX_ITER = int(os.environ.get("SCHOLARSHIP_MAX_ITER", "5"))

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_COMMON_DOCS = [
    ("Transcript / Academic Records", DocumentStatus.REQUIRED, "Official sealed transcript from your university"),
    ("Personal Statement / Motivation Letter", DocumentStatus.REQUIRED, "1-2 pages explaining your goals and fit"),
    ("CV / Resume", DocumentStatus.REQUIRED, "Academic and professional background"),
    ("Reference Letters (x2)", DocumentStatus.REQUIRED, "From professors or supervisors who know your work"),
    ("Language Test Certificate", DocumentStatus.CONDITIONAL, "Required if scholarship has language prerequisite"),
    ("Research Proposal", DocumentStatus.CONDITIONAL, "Required for PhD / research-focused scholarships"),
    ("Passport Copy", DocumentStatus.REQUIRED, "Valid for at least 1 year beyond the program end date"),
]


def _days_until(deadline_str: str) -> int:
    try:
        deadline = date.fromisoformat(deadline_str)
        return max(0, (deadline - date.today()).days)
    except ValueError:
        return 90  # fallback if date format is unexpected


def _build_base_steps(days_until_deadline: int, scholarship_name: str) -> list[ApplicationStep]:
    """Generate a chronological generic step list scaled to deadline proximity."""
    today = date.today()
    steps: list[tuple[str, str, str, bool]] = []  # (title, description, due_offset_days, is_critical)

    # Adapt timeline to how far the deadline is
    if days_until_deadline >= 60:
        steps = [
            ("Research the Scholarship", f"Deep-dive into {scholarship_name}: past recipients, funding details, and eligibility nuances.", "D+3", False),
            ("Gather Academic Documents", "Request official transcripts, degree certificates, and grade letters from your university.", "D+10", True),
            ("Contact Referees", "Ask at least 2 professors/supervisors to write recommendation letters. Give them 3+ weeks.", "D+7", True),
            ("Draft Personal Statement", "Write first draft: opening hook → your story → why this scholarship → your impact plan.", "D+14", True),
            ("Revise Personal Statement", "Get feedback from a mentor or academic writing center; align with scholarship mission.", "D+21", False),
            ("Prepare Language Certificate", "If needed: register for IELTS/TOEFL or pull existing certificate.", "D+14", False),
            ("Prepare Research Proposal", "If required: outline research question, methodology, expected outcomes (1-2 pages).", "D+21", False),
            ("Compile & Review All Documents", "Checklist review: format, page limits, signatures, translations if needed.", "D+40", True),
            ("Submit Application", f"Upload all documents to the {scholarship_name} portal. Submit 3 days before deadline.", f"D+{max(0, days_until_deadline - 3)}", True),
        ]
    else:
        steps = [
            ("Immediate Eligibility Check", "Confirm you meet ALL hard requirements before spending time on this application.", "D+1", True),
            ("Rush Document Collection", "Request transcripts and reference letters immediately — explain the tight deadline.", "D+2", True),
            ("Fast-Track Personal Statement", "Write and finalize personal statement within 5 days. Focus on clarity over polish.", "D+5", True),
            ("Compile & Submit", "Review all documents for completeness and submit at least 48 hours before deadline.", f"D+{max(0, days_until_deadline - 2)}", True),
        ]

    result = []
    for i, (title, desc, due, critical) in enumerate(steps, 1):
        result.append(
            ApplicationStep(
                step_number=i,
                title=title,
                description=desc,
                due_by=due,
                is_critical=critical,
            )
        )
    return result


# ---------------------------------------------------------------------------
# CrewAI Tool
# ---------------------------------------------------------------------------


class PlannerContextTool(BaseTool):
    """Provides match results and student profile to the planner agent."""

    name: str = "get_planning_context"
    description: str = (
        "Returns a JSON object with the student profile and top scholarship matches, "
        "including deadlines, match percentages, and required documents."
    )
    student: StudentProfile = Field(...)
    top_matches: list[MatchResult] = Field(...)

    def _run(self, *_args: Any, **_kwargs: Any) -> str:
        return json.dumps(
            {
                "student": self.student.model_dump(),
                "top_matches": [m.model_dump() for m in self.top_matches],
            },
            ensure_ascii=False,
            default=str,
        )


# ---------------------------------------------------------------------------
# Planner Agent  (LLM-powered enrichment)
# ---------------------------------------------------------------------------


def _run_planner_agent(
    student: StudentProfile,
    top_matches: list[MatchResult],
) -> dict[str, Any]:
    """
    Runs a lightweight planner agent that enriches each scholarship's plan with:
    - scholarship-specific document tips
    - key strategic tips per scholarship
    - estimated preparation days

    Returns a dict keyed by scholarship_id.
    """
    agent = Agent(
        role="Application Strategy Planner",
        goal=(
            "For each scholarship in the top matches, produce actionable tips, "
            "document guidance, and an estimated preparation time (in days) "
            "based on the student's current profile and the scholarship's requirements."
        ),
        backstory=(
            "You are an expert scholarship coach who has helped 500+ students secure "
            "competitive funding. You give precise, strategic advice tailored to the "
            "individual — not generic copy-paste guidance."
        ),
        tools=[PlannerContextTool(student=student, top_matches=top_matches)],
        llm=_DEFAULT_MODEL,
        max_iter=_MAX_ITER,
        verbose=False,
    )

    ids_names = [(m.scholarship_id, m.scholarship_name) for m in top_matches]

    task = Task(
        description=(
            "1. Call get_planning_context to retrieve student profile and scholarship matches.\n"
            "2. For EACH scholarship, provide:\n"
            "   a. estimated_preparation_days (integer): realistic days needed given student's profile\n"
            "   b. key_tips (list[str], 3-5 items): specific strategic tips for THIS scholarship\n"
            "   c. document_tips (dict[str, str]): {document_name: specific_tip} for critical docs\n"
            f"3. Scholarships to plan: {json.dumps(ids_names)}\n"
            "4. Return a JSON object: { scholarship_id: { estimated_preparation_days, key_tips, document_tips } }\n"
            "Be specific and reference actual student data (GPA, language, interests) in tips."
        ),
        expected_output=(
            "JSON object keyed by scholarship_id, each value having: "
            "estimated_preparation_days (int), key_tips (list[str]), document_tips (dict[str,str])"
        ),
        agent=agent,
    )

    crew = Crew(
        agents=[agent],
        tasks=[task],
        process=Process.sequential,
        verbose=False,
        max_rpm=10,
    )

    crew.kickoff()
    raw = task.output.raw

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        import re
        m = re.search(r"\{.*\}", raw, re.DOTALL)
        return json.loads(m.group()) if m else {}


# ---------------------------------------------------------------------------
# Document Builder
# ---------------------------------------------------------------------------


def _build_documents(
    match: MatchResult,
    agent_tips: dict[str, str],
) -> list[DocumentItem]:
    """Merge common docs, scholarship-specific missing docs, and agent tips."""
    docs: list[DocumentItem] = []

    seen: set[str] = set()

    # 1. Common documents (always relevant)
    for name, status, desc in _COMMON_DOCS:
        tip = agent_tips.get(name)
        docs.append(DocumentItem(name=name, status=status, description=desc, tips=tip))
        seen.add(name.lower())

    # 2. Scholarship-specific missing documents from evaluator
    for doc_name in match.missing_documents:
        if doc_name.lower() not in seen:
            docs.append(
                DocumentItem(
                    name=doc_name,
                    status=DocumentStatus.REQUIRED,
                    description=f"Specific requirement for {match.scholarship_name}",
                    tips=agent_tips.get(doc_name),
                )
            )
            seen.add(doc_name.lower())

    return docs


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def build_application_plan(
    student: StudentProfile,
    evaluator_output: EvaluatorOutput,
    top_n: int = 5,
) -> ApplicationPlan:
    """
    Generate a full ApplicationPlan for the top-N matched scholarships.

    Steps:
    1. Filter to top_n, non-disqualified matches (match_percentage > 0)
    2. Run LLM planner agent for strategic tips
    3. Assemble ScholarshipPlan per scholarship
    4. Return ApplicationPlan sorted by (deadline ASC, match_percentage DESC)
    """
    # Filter viable matches
    viable = [
        m for m in evaluator_output.ranked_matches
        if m.match_percentage > 0 and not m.disqualifying_factors
    ][:top_n]

    if not viable:
        # Include all, even weak ones, so the student has something to work with
        viable = evaluator_output.ranked_matches[:top_n]

    # LLM enrichment
    agent_enrichment = _run_planner_agent(student, viable)

    plans: list[ScholarshipPlan] = []

    for rank, match in enumerate(viable, 1):
        enrich = agent_enrichment.get(match.scholarship_id, {})

        estimated_days: int = enrich.get("estimated_preparation_days", 30)
        key_tips: list[str] = enrich.get("key_tips", [])
        document_tips: dict[str, str] = enrich.get("document_tips", {})

        days_left = _days_until(match.deadline)
        steps = _build_base_steps(days_left, match.scholarship_name)
        documents = _build_documents(match, document_tips)

        plans.append(
            ScholarshipPlan(
                scholarship_id=match.scholarship_id,
                scholarship_name=match.scholarship_name,
                deadline=match.deadline,
                priority_rank=rank,
                match_percentage=match.match_percentage,
                required_documents=documents,
                application_steps=steps,
                estimated_preparation_days=estimated_days,
                key_tips=key_tips,
            )
        )

    # Sort: soonest deadline first, then by match percentage desc
    plans.sort(key=lambda p: (p.deadline, -p.match_percentage))

    # Re-rank after sort
    for i, p in enumerate(plans, 1):
        p.priority_rank = i

    overall_summary = (
        f"You have {len(plans)} scholarship(s) in your plan. "
        f"Your strongest match is {plans[0].scholarship_name} at {plans[0].match_percentage:.0f}% "
        f"(deadline: {plans[0].deadline}). "
        f"Focus your first 2 weeks on gathering documents and contacting referees — "
        f"these are always the longest lead-time items."
        if plans
        else "No viable scholarships found. External search is recommended."
    )

    return ApplicationPlan(
        student_id=student.student_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        scholarship_plans=plans,
        overall_timeline_summary=overall_summary,
    )
