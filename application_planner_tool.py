#!/usr/bin/env python3
"""
أداة التخطيط الزمني للتقديم
(Application Planner Sub-Agent Tool)
=====================================
Authoritative Standalone Module & CLI Tool
Implements Task 8:
- Chronological Roadmap & Milestones (Application Steps with Due Dates)
- Official Document Checklist (Required, Optional, Conditional) with Admission Tips
- Priority Sorting by Deadline and Match Score
- Strategic Application Advice

Usage:
    python application_planner_tool.py
    python application_planner_tool.py --top-n 3
    python application_planner_tool.py --json
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

from ai.scholarship_agent.tools.application_planner_tool import (
    build_application_plan,
)
from ai.scholarship_agent.schemas.scholarship_schemas import (
    ApplicationPlan,
    StudentProfile,
    Scholarship,
)
from matcher_evaluator_agent import MatcherEvaluatorAgent, get_sample_data


class ApplicationPlannerTool:
    """Wrapper class providing an object-oriented interface to the application planner."""

    def __init__(self, model_name: str | None = None, api_key: str | None = None):
        self.model_name = model_name
        self.api_key = api_key
        self.matcher = MatcherEvaluatorAgent(model_name=model_name, api_key=api_key)

    def generate_plan(
        self,
        student: StudentProfile,
        scholarships: list[Scholarship],
        top_n: int = 4,
    ) -> ApplicationPlan:
        """Run evaluation first, then generate customized roadmap for top matching scholarships."""
        eval_output = self.matcher.evaluate(student, scholarships)
        return build_application_plan(
            student=student,
            evaluator_output=eval_output,
            top_n=top_n,
            model_name=self.model_name,
            api_key=self.api_key,
        )


def main():
    parser = argparse.ArgumentParser(
        description="أداة التخطيط الزمني للتقديم (Application Planner Tool)"
    )
    parser.add_argument("--top-n", type=int, default=3, help="عدد المنح المستهدفة في الخطة (افتراضي: 3)")
    parser.add_argument("--model", type=str, default=None, help="نموذج الذكاء الاصطناعي (Gemini أو OpenRouter)")
    parser.add_argument("--api-key", type=str, default=None, help="مفتاح API الخاص (Gemini أو OpenRouter sk-or-...)")
    parser.add_argument("--json", action="store_true", help="إخراج الخطة بصيغة JSON فقط")
    args = parser.parse_args()

    student, scholarships = get_sample_data()
    planner = ApplicationPlannerTool(model_name=args.model, api_key=args.api_key)
    plan = planner.generate_plan(student, scholarships, top_n=args.top_n)

    if args.json:
        print(plan.model_dump_json(indent=2))
        return

    print("=" * 72)
    print("خطة وخارطة طريق التقديم الأكاديمي (Application Roadmap)")
    print("=" * 72)
    print(f"الطالب: {student.name} | التخصص: {student.major}")
    print(f"تاريخ التوليد: {plan.generated_at}")
    print("-" * 72)
    print(f"\n[الجدول الزمني العام ومسار الإجراءات]:\n{plan.overall_timeline_summary}\n")

    for p in plan.scholarship_plans:
        print("=" * 72)
        print(f"الأولوية #{p.priority_rank}: {p.scholarship_name}")
        print(f"الموعد النهائي: {p.deadline} | نسبة التطابق: {p.match_percentage:.0f}% | التجهيز المقدر: ~{p.estimated_preparation_days} يوماً")
        print("-" * 72)

        print("\n  [1] التوجيهات الاستراتيجية لمعايير القبول:")
        for tip in p.key_tips:
            print(f"      • {tip}")

        print("\n  [2] قائمة الوثائق والمستندات المطلوبة (Checklist):")
        for doc in p.required_documents:
            status_ar = "إلزامي" if doc.status.value == "required" else "اختياري" if doc.status.value == "optional" else "مشروط"
            print(f"      - [{status_ar}] {doc.name}")
            if doc.description:
                print(f"          الوصف: {doc.description}")
            if doc.tips:
                print(f"          توجيه: {doc.tips}")

        print("\n  [3] المراحل والخطوات التنفيذية بالتسلسل الزمني (Milestones):")
        for step in p.application_steps:
            crit = " [مرحلة حرجة]" if step.is_critical else ""
            print(f"      {step.step_number}. {step.title}{crit} (الموعد: {step.due_by})")
            print(f"          {step.description}")
        print()

    print("=" * 72)


if __name__ == "__main__":
    main()
