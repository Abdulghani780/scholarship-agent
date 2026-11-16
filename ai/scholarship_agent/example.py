"""
Integration example — shows how the orchestrating crew calls your sub-agent.

    python -m ai.scholarship_agent.example
"""

from __future__ import annotations

from ai.scholarship_agent.agents.matcher_evaluator_agent import build_crew
from ai.scholarship_agent.schemas.scholarship_schemas import (
    DegreeLevel,
    LanguageLevel,
    LanguageScore,
    Scholarship,
    ScholarshipRequirements,
    StudentProfile,
)
from ai.scholarship_agent.tools.application_planner_tool import build_application_plan

# ---------------------------------------------------------------------------
# Sample data — replace with real DB / API calls
# ---------------------------------------------------------------------------

STUDENT = StudentProfile(
    student_id="STU-001",
    name="Ahmed Al-Yamani",
    degree_level=DegreeLevel.BACHELOR,
    gpa=3.6,
    major="Artificial Intelligence",
    research_interests=["NLP", "LLM agents", "Arabic AI"],
    languages=[
        LanguageScore(language="Arabic", level=LanguageLevel.NATIVE),
        LanguageScore(language="English", level=LanguageLevel.B2, test_name="IELTS", score=6.5),
    ],
    nationality="Yemeni",
    country_of_residence="Yemen",
    experiences=["Research assistant in NLP lab", "Open-source contributor"],
    publications=0,
    extracurriculars=["AI club founder"],
    target_degree=DegreeLevel.MASTER,
    target_countries=["Germany", "United States"],
    target_fields=["AI", "NLP", "Machine Learning"],
)

SCHOLARSHIPS = [
    Scholarship(
        scholarship_id="DAAD-2025",
        name="DAAD Research Scholarship",
        provider="DAAD",
        country="Germany",
        description="Funds master's and PhD research at German universities.",
        mission_statement="Support outstanding international students to conduct cutting-edge research in Germany.",
        requirements=ScholarshipRequirements(
            min_gpa=3.0,
            degree_levels=[DegreeLevel.MASTER, DegreeLevel.PHD],
            language_requirements=[LanguageScore(language="English", level=LanguageLevel.B2)],
            required_documents=["Motivation Letter", "Research Proposal", "Transcript"],
        ),
        deadline="2025-10-31",
        funding_type="full",
        fields_of_study=["Computer Science", "AI", "Engineering"],
        application_url="https://www.daad.de",
    ),
    Scholarship(
        scholarship_id="FULBRIGHT-2025",
        name="Fulbright Foreign Student Program",
        provider="U.S. State Department",
        country="United States",
        description="Fully-funded master's or PhD for exceptional international students.",
        mission_statement="Build mutual understanding through educational and cultural exchange.",
        requirements=ScholarshipRequirements(
            min_gpa=3.2,
            degree_levels=[DegreeLevel.MASTER, DegreeLevel.PHD],
            language_requirements=[LanguageScore(language="English", level=LanguageLevel.C1)],
            required_documents=["Personal Essay", "Transcript", "3 Reference Letters"],
            min_publications=0,
        ),
        deadline="2025-10-15",
        funding_type="full",
        fields_of_study=["AI", "Data Science", "NLP"],
        application_url="https://foreign.fulbrightonline.org",
    ),
]


def main() -> None:
    print("=" * 60)
    print("Step 1: Running Matcher & Evaluator Agent...")
    print("=" * 60)

    evaluator_output = build_crew(STUDENT, SCHOLARSHIPS)

    print(f"\n✅ Analysis complete.")
    print(f"Top match: {evaluator_output.top_match_percentage:.1f}%")
    print(f"External search needed: {evaluator_output.trigger_external_search}")
    print(f"\nStrengths: {evaluator_output.analysis.strengths[:2]}")
    print(f"Weaknesses: {evaluator_output.analysis.weaknesses[:2]}")

    print("\n" + "=" * 60)
    print("Step 2: Building Application Plan...")
    print("=" * 60)

    plan = build_application_plan(STUDENT, evaluator_output, top_n=3)

    print(f"\n📋 Plan for {len(plan.scholarship_plans)} scholarship(s):")
    for sp in plan.scholarship_plans:
        print(f"\n  [{sp.priority_rank}] {sp.scholarship_name}")
        print(f"      Match: {sp.match_percentage:.0f}%  |  Deadline: {sp.deadline}")
        print(f"      Prep time: ~{sp.estimated_preparation_days} days")
        if sp.key_tips:
            print(f"      Tip #1: {sp.key_tips[0]}")

    print(f"\n📌 Timeline: {plan.overall_timeline_summary}")


if __name__ == "__main__":
    main()
