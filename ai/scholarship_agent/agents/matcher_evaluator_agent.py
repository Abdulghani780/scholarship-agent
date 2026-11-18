"""
Matcher & Evaluator Sub-Agent (Tasks 3, 5)
===========================================
Native AI Agent with Hybrid Scoring (Programmatic + LLM Semantic Alignment)
Supports configurable models and custom API keys/endpoints.
"""

from __future__ import annotations

import json
import logging
import os
import urllib.request
from typing import Any

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

logger = logging.getLogger(__name__)

from .llm_client import call_llm, DEFAULT_MODEL, DEFAULT_GEMINI_KEY as DEFAULT_API_KEY

WEIGHTS: dict[str, float] = {
    "gpa":           0.20,
    "degree":        0.20,
    "language":      0.15,
    "nationality":   0.10,
    "major":         0.10,
    "semantic":      0.15,
    "experience":    0.05,
    "publications":  0.05,
}

_LEVEL_ORDER = [e.value for e in LanguageLevel]

def _lang_level_num(level: LanguageLevel) -> int:
    return _LEVEL_ORDER.index(level.value) if level.value in _LEVEL_ORDER else 0

def _score_gpa(student: StudentProfile, scholarship: Scholarship) -> float:
    req = scholarship.requirements
    if req.min_gpa and student.gpa < req.min_gpa:
        return 0.0
    if req.max_gpa and student.gpa > req.max_gpa:
        return 0.0
    if req.min_gpa is None:
        return 100.0
    return min(100.0, 60.0 + (student.gpa - req.min_gpa) / (4.0 - req.min_gpa) * 40.0)

def _score_degree(student: StudentProfile, scholarship: Scholarship) -> float:
    return 100.0 if student.target_degree in scholarship.requirements.degree_levels else 0.0

def _score_language(student: StudentProfile, scholarship: Scholarship) -> float:
    req_langs = scholarship.requirements.language_requirements
    if not req_langs:
        return 100.0

    scores: list[float] = []
    for req in req_langs:
        matches = [l for l in student.languages if l.language.lower() == req.language.lower()]
        if not matches:
            scores.append(0.0)
            continue
        best = max(matches, key=lambda l: _lang_level_num(l.level))
        s_num = _lang_level_num(best.level)
        r_num = _lang_level_num(req.level)
        if s_num < r_num:
            scores.append(0.0)
        else:
            scores.append(min(100.0, 80.0 + (s_num - r_num) * 10.0))

    return sum(scores) / len(scores) if scores else 100.0

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
    for field in scholarship.fields_of_study:
        for interest in student.target_fields:
            if field.lower() in interest.lower() or interest.lower() in field.lower():
                return 70.0
    return 0.0

def _score_experience(student: StudentProfile, _scholarship: Scholarship) -> float:
    return min(100.0, len(student.experiences) * 25.0)

def _score_publications(student: StudentProfile, scholarship: Scholarship) -> float:
    req_min = scholarship.requirements.min_publications
    if req_min == 0:
        return 100.0 if student.publications == 0 else min(100.0, 80.0 + student.publications * 10.0)
    if student.publications < req_min:
        return 0.0
    return min(100.0, 80.0 + (student.publications - req_min) * 10.0)

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
        out.append(f"المعدل {student.gpa:.2f} أقل من الحد الأدنى المطلوب {req.min_gpa:.2f}")
    if student.target_degree not in req.degree_levels:
        out.append(f"المرحلة الدراسية '{student.target_degree.value}' غير مشمولة في شروط المنحة")
    if req.eligible_nationalities and student.nationality.lower() not in [n.lower() for n in req.eligible_nationalities]:
        out.append(f"الجنسية '{student.nationality}' غير مؤهلة لهذه المنحة")
    return out


def compute_programmatic_scores(student: StudentProfile, scholarships: list[Scholarship]) -> dict[str, dict]:
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
            "required_docs":     s.requirements.required_documents,
        }
    return result

def build_crew(
    student: StudentProfile,
    scholarships: list[Scholarship],
    model_name: str | None = None,
    api_key: str | None = None,
) -> EvaluatorOutput:
    prog_scores = compute_programmatic_scores(student, scholarships)

    prompt = f"""
You are the Senior Scholarship Evaluator & Matcher Agent.
Analyze this student profile against the scholarships provided.

Student Profile:
{student.model_dump_json(indent=2)}

Available Scholarships & Pre-computed Hard Filter Scores:
{json.dumps(prog_scores, ensure_ascii=False, indent=2)}

Scholarship Missions:
{json.dumps([{"id": s.scholarship_id, "name": s.name, "mission": s.mission_statement, "fields": s.fields_of_study} for s in scholarships], ensure_ascii=False, indent=2)}

Task:
1. Provide a comprehensive student profile analysis (Task 5) with strengths, weaknesses, competitive_gaps, improvement_suggestions, and overall_competitiveness (in Arabic).
2. For each scholarship:
   - Assess semantic_alignment_score (0-100) between student research interests and scholarship mission.
   - Calculate final match_percentage combining all weights:
     gpa: 0.20, degree: 0.20, language: 0.15, nationality: 0.10, major: 0.10, semantic: 0.15, experience: 0.05, publications: 0.05.
     If there are hard disqualifiers (e.g. GPA or degree score is 0), match_percentage MUST be 0.
   - Provide 2-3 specific recommendation_reasons in Arabic.
3. Sort scholarships descending by match_percentage.
4. Set trigger_external_search = true if top match_percentage < 40.0.

Return strictly JSON matching this structure:
{{
  "analysis": {{
    "strengths": ["..."],
    "weaknesses": ["..."],
    "competitive_gaps": ["..."],
    "improvement_suggestions": ["..."],
    "overall_competitiveness": "..."
  }},
  "ranked_matches": [
    {{
      "scholarship_id": "...",
      "scholarship_name": "...",
      "match_percentage": 85.0,
      "tier": "excellent" | "good" | "fair" | "weak",
      "breakdown": {{
        "gpa_score": 90.0,
        "degree_score": 100.0,
        "language_score": 95.0,
        "nationality_score": 100.0,
        "major_score": 100.0,
        "semantic_alignment_score": 90.0,
        "experience_score": 80.0,
        "publications_score": 75.0
      }},
      "recommendation_reasons": ["..."],
      "disqualifying_factors": ["..."],
      "missing_documents": ["..."],
      "deadline": "YYYY-MM-DD"
    }}
  ],
  "trigger_external_search": false,
  "external_search_reason": null
}}
"""

    try:
        raw_resp = call_llm(prompt, model_name=model_name, api_key=api_key)
        data = json.loads(raw_resp)
    except Exception as e:
        logger.warning("LLM model %s failed: %s. Using deterministic fallback.", model_name, e)
        ranked: list[dict] = []
        for s in scholarships:
            ps = prog_scores[s.scholarship_id]
            is_disqualified = bool(ps["disqualifiers"])
            sem_score = 75.0 if not is_disqualified else 0.0
            total_pct = 0.0 if is_disqualified else (
                ps["gpa_score"] * 0.20 +
                ps["degree_score"] * 0.20 +
                ps["language_score"] * 0.15 +
                ps["nationality_score"] * 0.10 +
                ps["major_score"] * 0.10 +
                sem_score * 0.15 +
                ps["experience_score"] * 0.05 +
                ps["publications_score"] * 0.05
            )
            tier_val = _tier(total_pct).value
            reasons = ["توافق أكاديمي متين مع المعايير المطلوبة"] if not is_disqualified else []
            ranked.append({
                "scholarship_id": s.scholarship_id,
                "scholarship_name": s.name,
                "match_percentage": round(total_pct, 1),
                "tier": tier_val,
                "breakdown": {
                    "gpa_score": ps["gpa_score"],
                    "degree_score": ps["degree_score"],
                    "language_score": ps["language_score"],
                    "nationality_score": ps["nationality_score"],
                    "major_score": ps["major_score"],
                    "semantic_alignment_score": sem_score,
                    "experience_score": ps["experience_score"],
                    "publications_score": ps["publications_score"],
                },
                "recommendation_reasons": reasons,
                "disqualifying_factors": ps["disqualifiers"],
                "missing_documents": ps["required_docs"],
                "deadline": s.deadline
            })
        ranked.sort(key=lambda x: x["match_percentage"], reverse=True)
        data = {
            "analysis": {
                "strengths": [f"معدل تراكمي متميز ({student.gpa:.2f}/4.0)", f"خلفية قوية في {student.major}"],
                "weaknesses": ["الحاجة لتعزيز الأوراق البحثية المنشورة إن وجدت"],
                "competitive_gaps": ["تطوير ملف المشاريع العملية المعززة برسائل التوصية"],
                "improvement_suggestions": ["التركيز على صياغة مقترح بحثي قوي يعكس رؤية المنحة"],
                "overall_competitiveness": f"ملف تنافسي واعد للمرحلة {student.target_degree.value}"
            },
            "ranked_matches": ranked,
            "trigger_external_search": len(ranked) == 0 or ranked[0]["match_percentage"] < 40.0,
            "external_search_reason": "نسب المطابقة أقل من الحد المطلوب" if ranked and ranked[0]["match_percentage"] < 40.0 else None
        }

    analysis = StrengthWeaknessAnalysis(**data["analysis"])
    ranked_matches = [MatchResult(**m) for m in data.get("ranked_matches", [])]
    top_pct = ranked_matches[0].match_percentage if ranked_matches else 0.0
    trigger = data.get("trigger_external_search", False) or (top_pct < 40.0)
    ext_reason = data.get("external_search_reason") or ("جميع المنح الداخلية حققت نسبة أقل من 40%" if trigger else None)

    return EvaluatorOutput(
        student_id=student.student_id,
        analysis=analysis,
        ranked_matches=ranked_matches,
        trigger_external_search=trigger,
        external_search_reason=ext_reason,
        top_match_percentage=top_pct,
    )
