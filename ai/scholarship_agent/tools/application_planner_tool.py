"""
Application Planner Tool (Task 8)
==================================
Native Roadmap & Plan Generator using Gemini 2.5 Flash
"""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from datetime import date, datetime
from typing import Any

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

logger = logging.getLogger(__name__)

API_KEY = os.environ.get("GEMINI_API_KEY", "AQ.Ab8RN6Kq5VehOTFWzMN3-dVh2Wzsx_nlYlR4FT5gR9OnW-QnoA")
MODEL = os.environ.get("SCHOLARSHIP_LLM", "gemini-2.5-flash")

_COMMON_DOCS = [
    ("سجل الدرجات الأكاديمي (Transcript)", DocumentStatus.REQUIRED, "نسخة رسمية ومترجمة مصدقة من كليتك أو جامعتك"),
    ("خطاب الدافع / بيان الغرض (Motivation Letter / SOP)", DocumentStatus.REQUIRED, "بيان شخصي من صفحة إلى صفحتين يوضح أهدافك وتوافقك مع المنحة"),
    ("السيرة الذاتية الأكاديمية (Academic CV)", DocumentStatus.REQUIRED, "سيرة ذاتية بصيغة Europass أو معيارية للأبحاث والخبرات"),
    ("رسائل التوصية الأكاديمية (2x Recommendation Letters)", DocumentStatus.REQUIRED, "من أساتذة أو مشرفين أكاديميين تابعوا إنجازاتك"),
    ("شهادة اختبار اللغة (IELTS / TOEFL)", DocumentStatus.CONDITIONAL, "مطلوبة بحسب اشتراطات كل منحة وجهة مانحة"),
    ("المقترح البحثي (Research Proposal)", DocumentStatus.CONDITIONAL, "مطلوب لبرامج الدراسات العليا ذات الطابع البحثي"),
    ("صورة جواز السفر ساري المفعول", DocumentStatus.REQUIRED, "صلاحية لا تقل عن 6 أشهر بعد موعد بدء البرنامج"),
]

def _days_until(deadline_str: str) -> int:
    try:
        deadline = date.fromisoformat(deadline_str)
        return max(0, (deadline - date.today()).days)
    except Exception:
        return 90

def _build_base_steps(days_until_deadline: int, scholarship_name: str) -> list[ApplicationStep]:
    if days_until_deadline >= 60:
        steps_data = [
            ("فحص المعايير والشروط الخاصة", f"دراسة تفاصيل وشروط منحة {scholarship_name} وقراءة تجارب المقبولين سابقاً.", "خلال 3 أيام", False),
            ("طلب الوثائق الرسمية والمصدقة", "طلب السجلات الأكاديمية والشهادات وترجمتها واعتمادها من الجامعة.", "خلال 10 أيام", True),
            ("مراسلة الأساتذة لرسائل التوصية", "تحديد أستاذين أكاديميين وتزويدهم بملخص إنجازاتك والمنحة المطلوبة.", "خلال أسبوعين", True),
            ("كتابة المسودة الأولى لخطاب الدافع", "صياغة خطاب غرض مخصص يبرز الرؤية، الأثر المجتمعي، والدافع الأكاديمي.", "خلال 3 أسابيع", True),
            ("مراجعة وتدقيق المقترح والخطاب", "عرض الخطاب على موجه أكاديمي أو زملاء لتنقيح الصياغة وتنسيقها.", "قبل الموعد بـ 4 أسابيع", False),
            ("مراجعة الملف النهائي والرفع", f"التأكد من اكتمال كافة المتطلبات والرفع عبر بوابة التقديم الرسمية.", "قبل الموعد بـ 3 أيام", True),
        ]
    else:
        steps_data = [
            ("المراجعة الفورية للأهلية", "التأكد العاجل من استيفاء جميع الشروط الإلزامية للمنحة.", "خلال 24 ساعة", True),
            ("التحصيل السريع للتوصيات والوثائق", "متابعة الموصين مباشرة للحصول على خطابات التوصية في أسرع وقت.", "خلال 48 ساعة", True),
            ("إنهاء خطاب الدافع والمقترح", "إنجاز النسخة النهائية لخطاب التقديم والتركيز على النقاط الجوهرية.", "خلال 5 أيام", True),
            ("رفع الملف والتقديم النهائي", "مراجعة checklist الوثائق واعتماد الطلب.", "قبل الإغلاق بـ 48 ساعة", True),
        ]

    steps: list[ApplicationStep] = []
    for i, (title, desc, due, crit) in enumerate(steps_data, 1):
        steps.append(ApplicationStep(
            step_number=i,
            title=title,
            description=desc,
            due_by=due,
            is_critical=crit
        ))
    return steps

def _call_gemini_tips(student: StudentProfile, matches: list[MatchResult]) -> dict[str, Any]:
    prompt = f"""
You are the Strategic Scholarship Planner Agent.
For each scholarship in the list below, generate tailored advice for this student.

Student Profile:
- Name: {student.name}
- Major: {student.major}
- Target Degree: {student.target_degree.value}
- Research Interests: {', '.join(student.research_interests)}
- GPA: {student.gpa}

Scholarships:
{json.dumps([{"id": m.scholarship_id, "name": m.scholarship_name, "deadline": m.deadline, "match_pct": m.match_percentage} for m in matches], ensure_ascii=False, indent=2)}

Return strictly a JSON object keyed by scholarship_id:
{{
  "SCHOLARSHIP_ID": {{
    "estimated_preparation_days": 35,
    "key_tips": [
      "نصيحة استراتيجية مخصصة 1",
      "نصيحة استراتيجية مخصصة 2",
      "نصيحة استراتيجية مخصصة 3"
    ],
    "document_tips": {{
      "Motivation Letter": "نصيحة لكتابة الخطاب خصيصاً لهذه المنحة"
    }}
  }}
}}
"""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"}
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return json.loads(data["candidates"][0]["content"]["parts"][0]["text"])
    except Exception as e:
        logger.warning("Planner LLM enrichment fallback: %s", e)
        return {}

def build_application_plan(
    student: StudentProfile,
    evaluator_output: EvaluatorOutput,
    top_n: int = 5,
) -> ApplicationPlan:
    viable = [m for m in evaluator_output.ranked_matches if m.match_percentage > 0 and not m.disqualifying_factors][:top_n]
    if not viable:
        viable = evaluator_output.ranked_matches[:top_n]

    enrichment = _call_gemini_tips(student, viable) if viable else {}

    plans: list[ScholarshipPlan] = []
    for rank, match in enumerate(viable, 1):
        enrich = enrichment.get(match.scholarship_id, {})
        est_days = enrich.get("estimated_preparation_days", 30)
        tips = enrich.get("key_tips", [
            "ركّز على إبراز توافق اهتماماتك البحثية مع محاور المنحة في خطاب الدافع.",
            "احرص على الحصول على رسائل توصية أكاديمية تشير إلى مشاريعك الفعلية.",
            "قدّم قبل الموعد النهائي بـ 5 أيام لتفادي ضغط البوابات الإلكترونية."
        ])
        doc_tips = enrich.get("document_tips", {})

        days_left = _days_until(match.deadline)
        steps = _build_base_steps(days_left, match.scholarship_name)

        docs: list[DocumentItem] = []
        for name, status, desc in _COMMON_DOCS:
            tip = doc_tips.get(name) or doc_tips.get(name.split(" ")[0])
            docs.append(DocumentItem(name=name, status=status, description=desc, tips=tip))

        plans.append(ScholarshipPlan(
            scholarship_id=match.scholarship_id,
            scholarship_name=match.scholarship_name,
            deadline=match.deadline,
            priority_rank=rank,
            match_percentage=match.match_percentage,
            required_documents=docs,
            application_steps=steps,
            estimated_preparation_days=est_days,
            key_tips=tips,
        ))

    plans.sort(key=lambda p: (p.deadline, -p.match_percentage))
    for i, p in enumerate(plans, 1):
        p.priority_rank = i

    summary = (
        f"تتضمن خطتك {len(plans)} منح دراسية ذات أولوية. "
        f"المنحة الأعلى تطابقاً هي '{plans[0].scholarship_name}' بنسبة {plans[0].match_percentage:.0f}% "
        f"(الموعد النهائي: {plans[0].deadline}). يُوصى بالبدء الفوري في جمع الوثائق الأكاديمية ومراسلة الموصين."
        if plans
        else "لم يتم العثور على منح متوافقة بدرجة كافية. يُوصى بتفعيل البحث الخارجي."
    )

    return ApplicationPlan(
        student_id=student.student_id,
        generated_at=datetime.utcnow().isoformat() + "Z",
        scholarship_plans=plans,
        overall_timeline_summary=summary,
    )
