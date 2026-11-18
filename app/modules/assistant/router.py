"""
Academic Advisor Assistant Router
=================================
Provides conversational AI advisor for students and scholarships.
Supports Google Gemini and OpenRouter models with custom keys.
"""

from __future__ import annotations

import json
import logging
from typing import Any
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, status

from database import Database
from modules.scholarships.repository import ScholarshipRepository
from modules.students.repository import StudentRepository
from ai.scholarship_agent.agents.llm_client import call_llm

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/assistant", tags=["AI Academic Advisor"])


class Message(BaseModel):
    role: str
    content: str


class AssistantRequest(BaseModel):
    messages: list[Message]
    student_id: str | None = None
    model_name: str | None = None
    api_key: str | None = None


@router.post("")
async def chat_with_advisor(req: AssistantRequest) -> dict:
    """
    Chat endpoint for the interactive Scholarship Advisor agent.
    """
    try:
        # Load scholarships context
        scholarships = await ScholarshipRepository.list_active()
        sch_summary = [
            {
                "id": s["id"],
                "name": s["name"],
                "country": s["country"],
                "deadline": s["deadline"],
                "funding": s["funding_type"],
                "fields": s.get("fields_of_study", []),
                "min_gpa": s.get("requirements", {}).get("min_gpa"),
                "mission": s.get("mission_statement", "")[:150],
            }
            for s in scholarships
        ]

        # Load student context if available
        student_ctx = "لم يتم تحديد طالب معين، أنت تقدم استشارة عامة أو تسأل الطالب عن مؤهلاته."
        if req.student_id:
            st = await StudentRepository.get_by_id(req.student_id)
            if st:
                student_ctx = (
                    f"ملف الطالب الحالي:\n"
                    f"- الاسم: {st['name']}\n"
                    f"- التخصص: {st['major']}\n"
                    f"- المعدل: {st['gpa']}/4.0\n"
                    f"- المرحلة المستهدفة: {st['target_degree']}\n"
                    f"- الجنسية: {st['nationality']}\n"
                    f"- الاهتمامات: {', '.join(st.get('research_interests', []))}"
                )

        system_instruction = f"""أنت "المستشار الأكاديمي الذكي" لمنصة المنح الدراسية المعتمدة (بواجهة أساس).
دورك:
1. تقديم المشورة الأكاديمية الصادقة والذكية للطلاب بأسلوب ودود، راقٍ، ومهني باللغة العربية.
2. مساعدة الطلاب في اختيار المنح الأنسب لمعدلاتهم وتخصصاتهم واهتماماتهم البحثية.
3. شرح معايير القبول (المعدل التراكمي، درجات IELTS/TOEFL، خطاب الدافع SOP، ورسائل التوصية).
4. إذا سأل الطالب عن منح غير موجودة في الدليل الحالي أو رغب في منح بديلة، أوضح له أنك تستطيع تفعيل إشارة البحث الخارجي (trigger_external_search = True) لجلب خيارات إضافية فوراً.

قاعدة بيانات المنح المتاحة حالياً في المنصة:
{json.dumps(sch_summary, ensure_ascii=False, indent=2)}

سياق الطالب الحالي:
{student_ctx}

تعليمات الرد:
- تحدث باللغة العربية الفصحى الراقية بأسلوب مشجع ومختصر ومركز.
- استخدم التنسيق المنظم والنقاط الواضحة عند ذكر المتطلبات أو النصائح.
"""

        conversation_lines = [f"System: {system_instruction}"]
        for m in req.messages[-6:]:  # Keep recent context
            role_label = "المستخدم" if m.role == "user" else "المستشار"
            conversation_lines.append(f"{role_label}: {m.content}")

        conversation_lines.append("المستشار: ")
        full_prompt = "\n\n".join(conversation_lines)

        reply = call_llm(
            full_prompt,
            model_name=req.model_name,
            api_key=req.api_key,
            json_mode=False,
            temperature=0.3,
            timeout=30,
        )

        return {"reply": reply.strip()}

    except Exception as e:
        logger.exception("Assistant error: %s", e)
        return {
            "reply": "أهلاً بك! أنا مستشارك الأكاديمي الذكي. يمكنك سؤالي عن شروط أي منحة، كيفية كتابة خطاب الدافع، أو نصائح لرفع فرص قبولك في المنح الدولية."
        }
