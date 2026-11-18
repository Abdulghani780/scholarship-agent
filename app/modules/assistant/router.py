"""
Academic Advisor Assistant Router
=================================
Provides conversational AI advisor for students and scholarships.
Deeply integrated with registered student records and active scholarship database.
Supports OpenRouter, local AI gateway, and Google Gemini with automatic fallback.
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
    Grounds all responses in real student records and scholarship criteria.
    """
    try:
        # 1. Load active scholarships
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
                "degree_levels": s.get("requirements", {}).get("degree_levels", []),
                "languages": s.get("requirements", {}).get("language_requirements", []),
                "required_docs": s.get("requirements", {}).get("required_documents", []),
                "mission": s.get("mission_statement", "")[:180],
            }
            for s in scholarships
        ]

        # 2. Load all registered students
        all_students = await StudentRepository.list_all()
        selected_student = None

        if req.student_id:
            selected_student = await StudentRepository.get_by_id(req.student_id)
        if not selected_student and all_students:
            selected_student = all_students[0]

        if selected_student:
            langs_str = ", ".join([
                f"{l.get('language')} ({l.get('level')}{' - ' + str(l.get('test_name', '')) + ' ' + str(l.get('score', '')) if l.get('score') else ''})"
                for l in selected_student.get("languages", [])
            ]) or "غير محدد"

            student_ctx = f"""
ملف الطالب المعتمد حالياً في الجلسة:
- الاسم: {selected_student['name']}
- البريد الأكاديمي: {selected_student.get('email', '')}
- التخصص الحالي: {selected_student['major']}
- المعدل التراكمي (GPA): {selected_student['gpa']:.2f} من 4.00
- الدرجة العلمية الحالية: {selected_student['degree_level']}
- المرحلة المستهدفة: {selected_student['target_degree']}
- الجنسية: {selected_student['nationality']}
- بلد الإقامة: {selected_student.get('country_of_residence', '')}
- الكفاءة اللغوية: {langs_str}
- الاهتمامات البحثية الدقيقة: {', '.join(selected_student.get('research_interests', []))}
- الخبرات الأكاديمية والعملية: {', '.join(selected_student.get('experiences', []))}
- الأوراق البحثية المنشورة: {selected_student.get('publications', 0)} ورقة علمية
- الدول المفضلة للدراسة: {', '.join(selected_student.get('target_countries', []))}
- مجالات الاهتمام الأكاديمي: {', '.join(selected_student.get('target_fields', []))}
"""
        else:
            student_ctx = "لم يتم العثور على سجلات طلاب مسجلين حالياً. قدم نصائح عامة واسأل المستخدم عن تخصص ومعدل الطالب."

        other_students = [
            f"- {st['name']} (التخصص: {st['major']} | المعدل: {st['gpa']} | المرحلة: {st['target_degree']})"
            for st in all_students
            if selected_student and st['id'] != selected_student['id']
        ]
        other_students_str = "\n".join(other_students) if other_students else "لا يوجد طلاب آخرون مسجلون."

        system_instruction = f"""أنت "المستشار الأكاديمي الذكي" المعتمد لمنصة المنح الدراسية.
أنت مرتبط بقاعدة بيانات السجل الأكاديمي للطلاب وبنك المنح الرسمية.

{student_ctx}

سجلات الطلاب الآخرين المسجلين في المنصة (إذا سأل المستخدم عن مقارنة أو طالب آخر):
{other_students_str}

قاعدة بيانات المنح المتاحة حالياً في المنصة:
{json.dumps(sch_summary, ensure_ascii=False, indent=2)}

قواعد الاستشارة الذكية:
1. عند التحدث مع الطالب، خاطبه باسمه واعتمد دائماً على مؤهلاته الحقيقية المذكورة في ملفه أعلاه (معدله، لغته، تخصصه، وأبحاثه).
2. قارن شروط المنحة مع ملف الطالب بالأرقام (مثلاً: إذا كان معدله 3.72 وشرط المنحة 3.0، وضح له أنه متفوق ومستوفٍ للشرط بأريحية).
3. عند سؤاله عن نقاط ضعفه أو فجواته التنافسية، استند إلى ملفه (مثلاً: نشر أبحاث إضافية، رفع مستوى اللغة، أو تحصيل رسائل توصية موجهة).
4. إذا سأل الطالب عن دولة أو تخصص غير مشمول في المنح الحالية، أو طلب منحاً إضافية، وضح له أن بإمكانك تفعيل إشارة البحث الخارجي (trigger_external_search = True) للبحث له عن منح دولية بديلة فوراً.
5. حافظ على أسلوب ودود، مشجع، علمي رصين، ومنظم بنقاط واضحة.
"""

        conversation_lines = [f"System: {system_instruction}"]
        for m in req.messages[-6:]:
            role_label = "المستخدم" if m.role == "user" else "المستشار الأكاديمي"
            conversation_lines.append(f"{role_label}: {m.content}")

        conversation_lines.append("المستشار الأكاديمي: ")
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
            "reply": "أهلاً بك! أنا مستشارك الأكاديمي. بناءً على سجلك الأكاديمي المعتمد، يسعدني مساعدتك في فحص نسب قبولك في المنح وصياغة ملف تقديم تنافسي."
        }
