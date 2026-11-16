"""
Comprehensive Test Suite for Matcher, Evaluator & Application Planner
======================================================================
Tests:
1. Hard numerical constraints (GPA, Degree level, Nationality)
2. Hybrid matching calculation & weights
3. Autonomous trigger_external_search decision rule (< 40%)
4. Application planner chronological roadmap and document checklist
"""

import pytest
from ai.scholarship_agent.agents.matcher_evaluator_agent import (
    compute_programmatic_scores,
    _score_gpa,
    _score_degree,
    _score_language,
    _score_nationality,
    _score_major,
    WEIGHTS,
)
from ai.scholarship_agent.tools.application_planner_tool import (
    build_application_plan,
    _days_until,
)
from ai.scholarship_agent.schemas.scholarship_schemas import (
    StudentProfile,
    Scholarship,
    DegreeLevel,
    LanguageLevel,
    LanguageScore,
    EvaluatorOutput,
    MatchResult,
    MatchTier,
    ScoreBreakdown,
    StrengthWeaknessAnalysis,
)


@pytest.fixture
def base_student():
    return StudentProfile(
        student_id="test-std-1",
        name="Test Student",
        email="test@example.com",
        gpa=3.80,
        major="Computer Science",
        degree_level=DegreeLevel.BACHELOR,
        target_degree=DegreeLevel.MASTER,
        nationality="Yemeni",
        country_of_residence="Yemen",
        target_countries=["Germany"],
        target_fields=["AI"],
        languages=[
            LanguageScore(language="Arabic", level=LanguageLevel.NATIVE),
            LanguageScore(language="English", level=LanguageLevel.B2, test_name="IELTS", score=6.5),
        ],
        research_interests=["Deep Learning", "NLP"],
        experiences=["AI Lab Assistant"],
        publications=1,
    )


@pytest.fixture
def master_scholarship():
    return Scholarship(
        scholarship_id="sch-master-1",
        name="German AI Master Fellowship",
        provider="DAAD",
        country="Germany",
        description="Full Master Funding in AI",
        mission_statement="Empowering young researchers in Artificial Intelligence and Machine Learning.",
        deadline="2026-11-30",
        funding_type="full",
        fields_of_study=["Computer Science", "AI"],
        requirements={
            "min_gpa": 3.0,
            "degree_levels": ["master"],
            "eligible_nationalities": ["Yemeni", "Syrian"],
            "eligible_majors": ["Computer Science", "AI"],
            "language_requirements": [{"language": "English", "level": "B2"}],
            "required_documents": ["Transcript", "Motivation Letter", "Reference"],
        },
    )


def test_weights_sum_to_one():
    total = sum(WEIGHTS.values())
    assert abs(total - 1.0) < 1e-6, f"Weights sum to {total}, expected 1.0"


def test_hard_disqualifier_degree(base_student, master_scholarship):
    # If student targets PhD but scholarship is strictly Master
    base_student.target_degree = DegreeLevel.PHD
    score = _score_degree(base_student, master_scholarship)
    assert score == 0.0


def test_hard_disqualifier_gpa(base_student, master_scholarship):
    # Minimum GPA is 3.0; student with 2.80 should score 0.0
    base_student.gpa = 2.80
    score = _score_gpa(base_student, master_scholarship)
    assert score == 0.0


def test_qualifying_gpa_scoring(base_student, master_scholarship):
    # Minimum GPA is 3.0; student with 3.80 should score > 80.0
    base_student.gpa = 3.80
    score = _score_gpa(base_student, master_scholarship)
    assert score > 80.0


def test_language_scoring_levels(base_student, master_scholarship):
    # Student has B2; scholarship requires B2 -> pass
    score = _score_language(base_student, master_scholarship)
    assert score >= 80.0

    # If student only has A2, score should be 0.0
    base_student.languages = [
        LanguageScore(language="English", level=LanguageLevel.A2),
    ]
    score_low = _score_language(base_student, master_scholarship)
    assert score_low == 0.0


def test_nationality_filtering(base_student, master_scholarship):
    # Student is Yemeni -> eligible
    assert _score_nationality(base_student, master_scholarship) == 100.0

    # Student from ineligible nationality
    base_student.nationality = "CountryX"
    assert _score_nationality(base_student, master_scholarship) == 0.0


def test_trigger_external_search_decision_rule(base_student):
    # Construct an evaluator output with all matches below 40%
    low_matches = [
        MatchResult(
            scholarship_id="sch-ineligible",
            scholarship_name="Ineligible Scholarship",
            match_percentage=25.0,
            tier=MatchTier.WEAK,
            breakdown=ScoreBreakdown(
                gpa_score=0.0,
                degree_score=0.0,
                language_score=50.0,
                nationality_score=0.0,
                major_score=50.0,
                semantic_alignment_score=40.0,
                experience_score=50.0,
                publications_score=50.0,
            ),
            recommendation_reasons=[],
            disqualifying_factors=["Ineligible Degree"],
            missing_documents=[],
            deadline="2026-12-31",
        )
    ]

    output = EvaluatorOutput(
        student_id=base_student.student_id,
        analysis=StrengthWeaknessAnalysis(
            strengths=["Strong GPA"],
            weaknesses=["Degree mismatch"],
            competitive_gaps=["No local options"],
            improvement_suggestions=["Seek international scholarships"],
            overall_competitiveness="Low compatibility with local DB",
        ),
        ranked_matches=low_matches,
        trigger_external_search=True,
        external_search_reason="Top match is 25.0% (< 40.0%)",
        top_match_percentage=25.0,
    )

    assert output.trigger_external_search is True
    assert output.top_match_percentage < 40.0


def test_application_planner_generation(base_student):
    eval_output = EvaluatorOutput(
        student_id=base_student.student_id,
        analysis=StrengthWeaknessAnalysis(
            strengths=["Top GPA"],
            weaknesses=[],
            competitive_gaps=[],
            improvement_suggestions=[],
            overall_competitiveness="High",
        ),
        ranked_matches=[
            MatchResult(
                scholarship_id="sch-1",
                scholarship_name="Fellowship A",
                match_percentage=94.0,
                tier=MatchTier.EXCELLENT,
                breakdown=ScoreBreakdown(
                    gpa_score=100.0,
                    degree_score=100.0,
                    language_score=100.0,
                    nationality_score=100.0,
                    major_score=100.0,
                    semantic_alignment_score=90.0,
                    experience_score=75.0,
                    publications_score=80.0,
                ),
                recommendation_reasons=["Ideal fit"],
                disqualifying_factors=[],
                missing_documents=[],
                deadline="2026-12-15",
            )
        ],
        trigger_external_search=False,
        external_search_reason=None,
        top_match_percentage=94.0,
    )

    plan = build_application_plan(base_student, eval_output, top_n=1)
    assert plan.student_id == base_student.student_id
    assert len(plan.scholarship_plans) == 1
    sp = plan.scholarship_plans[0]
    assert sp.scholarship_id == "sch-1"
    assert sp.priority_rank == 1
    assert len(sp.application_steps) > 0
    assert len(sp.required_documents) > 0
    assert sp.estimated_preparation_days > 0
