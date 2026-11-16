#!/usr/bin/env python3
"""
وكيل التقييم والمطابقة والتخطيط الاستراتيجي
(Evaluator, Matcher & Strategic Planner Sub-Agent)
===================================================
Authoritative Standalone Module & CLI Tool
Implements Tasks 3 & 5:
- Task 5: Student Profile Evaluation (Strengths, Weaknesses, Competitive Gaps)
- Task 3: Hybrid Matching Engine (Hard Numerical Constraints + LLM Semantic Alignment)
- Autonomous Decision: trigger_external_search = True when match < 40%

Usage:
    python matcher_evaluator_agent.py
    python matcher_evaluator_agent.py --student-id 1
    python matcher_evaluator_agent.py --json
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ai.scholarship_agent.agents.matcher_evaluator_agent import (
    build_crew,
    compute_programmatic_scores,
    WEIGHTS,
    DEFAULT_MODEL,
)
from ai.scholarship_agent.schemas.scholarship_schemas import (
    StudentProfile,
    Scholarship,
    DegreeLevel,
    LanguageLevel,
    LanguageScore,
    EvaluatorOutput,
)


class MatcherEvaluatorAgent:
    """Wrapper class providing an object-oriented interface to the matcher/evaluator agent."""

    def __init__(self, model_name: str | None = None, api_key: str | None = None):
        self.model_name = model_name or DEFAULT_MODEL
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")

    def evaluate(self, student: StudentProfile, scholarships: list[Scholarship]) -> EvaluatorOutput:
        """Run the hybrid evaluation & matching pipeline."""
        return build_crew(
            student=student,
            scholarships=scholarships,
            model_name=self.model_name,
            api_key=self.api_key,
        )


def get_sample_data() -> tuple[StudentProfile, list[Scholarship]]:
    """Return realistic test dataset for CLI demonstrations."""
    student = StudentProfile(
        student_id="std-yamani",
        name="أحمد علي اليماني (Ahmed Al-Yamani)",
        email="ahmed.alyamani@example.com",
        gpa=3.72,
        major="Computer Science & AI",
        degree_level=DegreeLevel.BACHELOR,
        target_degree=DegreeLevel.MASTER,
        nationality="Yemeni",
        country_of_residence="Yemen",
        target_countries=["Germany", "United Kingdom", "Turkey"],
        target_fields=["Artificial Intelligence", "NLP", "Machine Learning"],
        languages=[
            LanguageScore(language="Arabic", level=LanguageLevel.NATIVE),
            LanguageScore(language="English", level=LanguageLevel.B2, test_name="IELTS", score=7.0),
        ],
        research_interests=[
            "Natural Language Processing (NLP)",
            "Large Language Models (LLMs)",
            "Arabic AI Systems",
            "Multi-Agent Architectures",
        ],
        experiences=[
            "مساعد باحث في مختبر الذكاء الاصطناعي ومعالجة اللغات الطبيعية (عام واحد)",
            "مطور برمجيات ذكاء اصطناعي حر وبناء وكلاء أذكياء",
            "مؤسس نادي الذكاء الاصطناعي الطلابي وتنظيم هاكاثون محلي",
        ],
        publications=1,
    )

    scholarships = [
        Scholarship(
            scholarship_id="sch-daad-master",
            name="منحة DAAD للدراسات العليا والبحث العلمي",
            provider="الهيئة الألمانية للتبادل الثقافي (DAAD)",
            country="Germany",
            description="منحة كاملة لدراسة الماجستير وإجراء الأبحاث في الجامعات ومراكز الأبحاث الألمانية المرموقة.",
            mission_statement="استقطاب الكفاءات البحثية الواعدة في تخصصات الذكاء الاصطناعي والتكنولوجيا المتقدمة وتوطيد التعاون البحثي الدولي.",
            deadline="2026-10-31",
            funding_type="full",
            fields_of_study=["Computer Science", "Artificial Intelligence", "Data Science"],
            requirements={
                "min_gpa": 3.0,
                "degree_levels": ["master", "phd"],
                "eligible_nationalities": ["Yemeni", "Egyptian", "Jordanian", "Syrian"],
                "eligible_majors": ["Computer Science", "Software Engineering", "Artificial Intelligence"],
                "language_requirements": [{"language": "English", "level": "B2"}],
                "required_documents": [
                    "Transcript",
                    "Motivation Letter",
                    "2 Reference Letters",
                    "Research Proposal",
                    "Language Certificate",
                ],
            },
        ),
        Scholarship(
            scholarship_id="sch-chevening",
            name="منحة تشيفنينغ البريطانية (Chevening Scholarship)",
            provider="وزارة الخارجية والكومنولث البريطانية (FCDO)",
            country="UK",
            description="برنامج التمويل الكامل للحصول على درجة الماجستير لمدة عام واحد في أي من جامعات المملكة المتحدة.",
            mission_statement="صناعة قادة المستقبل وتأهيل المبتكرين في العلوم والتكنولوجيا والسياسات العامة لإحداث أثر تنموي.",
            deadline="2026-11-05",
            funding_type="full",
            fields_of_study=["Computer Science", "Information Systems", "Business & Technology"],
            requirements={
                "min_gpa": 2.8,
                "degree_levels": ["master"],
                "eligible_nationalities": ["Yemeni", "Lebanese", "Moroccan"],
                "eligible_majors": ["Computer Science", "Information Technology", "Engineering"],
                "language_requirements": [{"language": "English", "level": "B2"}],
                "required_documents": [
                    "Undergraduate Transcripts",
                    "Leadership Essay",
                    "Networking Essay",
                    "Career Plan",
                    "2 References",
                ],
            },
        ),
        Scholarship(
            scholarship_id="sch-turkiye-burslari",
            name="المنحة التركية (Türkiye Bursları)",
            provider="رئاسة أتراك المهجر والمجتمعات ذات القربى (YTB)",
            country="Turkey",
            description="منحة حكومية ممولة بالكامل تشمل الرسوم، السكن، راتب شهري، وتأمين صحي وسنة لغة.",
            mission_statement="دعم التعليم العالي وتأهيل الكفاءات الدولية للمساهمة في التنمية وبناء جسور التعاون الأكاديمي الدولي.",
            deadline="2027-02-20",
            funding_type="full",
            fields_of_study=["Engineering", "Computer Science", "Information Technology"],
            requirements={
                "min_gpa": 3.0,
                "degree_levels": ["bachelor", "master", "phd"],
                "eligible_nationalities": [],
                "eligible_majors": [],
                "language_requirements": [],
                "required_documents": ["Diplomas", "Transcripts", "Statement of Purpose", "Letter of Intent"],
            },
        ),
    ]

    return student, scholarships


def main():
    parser = argparse.ArgumentParser(
        description="وكيل التقييم والمطابقة الأكاديمية (Matcher & Evaluator Agent)"
    )
    parser.add_argument("--json", action="store_true", help="إخراج النتائج بصيغة JSON فقط")
    parser.add_argument("--model", type=str, default=DEFAULT_MODEL, help="نموذج الذكاء الاصطناعي")
    parser.add_argument("--api-key", type=str, default=None, help="مفتاح API الخاص")
    args = parser.parse_args()

    student, scholarships = get_sample_data()
    agent = MatcherEvaluatorAgent(model_name=args.model, api_key=args.api_key)
    output = agent.evaluate(student, scholarships)

    if args.json:
        print(output.model_dump_json(indent=2))
        return

    print("=" * 72)
    print("تقارير وكيل التقييم والمطابقة الأكاديمية (Matcher & Evaluator Agent)")
    print("=" * 72)
    print(f"الطالب: {student.name} | التخصص: {student.major} | المعدل: {student.gpa}/4.00")
    print(f"المرحلة المستهدفة: {student.target_degree.value} | الجنسية: {student.nationality}")
    print("-" * 72)

    print("\n[1] تحليل ملف الطالب الأكاديمي (مهمة 5):")
    print("  عوامل القوة:")
    for s in output.analysis.strengths:
        print(f"    • {s}")
    print("  متطلبات تحتاج إلى تعزيز / فجوات تنافسية:")
    for w in output.analysis.weaknesses + output.analysis.competitive_gaps:
        print(f"    • {w}")
    if output.analysis.overall_competitiveness:
        print(f"  التقييم الإجمالي: {output.analysis.overall_competitiveness}")

    print("\n[2] نتائج المفاضلة ونسب التطابق الهجينة (مهمة 3):")
    for rank, m in enumerate(output.ranked_matches, 1):
        print(f"\n  #{rank} {m.scholarship_name} (الموعد: {m.deadline})")
        print(f"     نسبة التطابق: {m.match_percentage:.1f}% [{m.tier.value}]")
        print(f"     مصفوفة الأبعاد: معدل={m.breakdown.gpa_score:.0f}% | تخصص={m.breakdown.major_score:.0f}% | لغة={m.breakdown.language_score:.0f}% | توافق بحثي={m.breakdown.semantic_alignment_score:.0f}%")
        if m.recommendation_reasons:
            print("     أسباب التوصية:")
            for r in m.recommendation_reasons:
                print(f"       - {r}")
        if m.disqualifying_factors:
            print(f"     عوامل عدم الاستيفاء: {', '.join(m.disqualifying_factors)}")

    print("\n[3] قرار التوجيه الذاتي للبحث الخارجي:")
    print(f"     trigger_external_search = {output.trigger_external_search}")
    if output.external_search_reason:
        print(f"     السبب: {output.external_search_reason}")
    print("=" * 72)


if __name__ == "__main__":
    main()
