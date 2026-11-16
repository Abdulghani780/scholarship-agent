"""Seed initial realistic scholarships and sample students."""

import asyncio
import json
import logging
from pathlib import Path
import aiosqlite

DB_PATH = Path(__file__).parent / "data" / "app.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

from migrations.initial import MIGRATION_SQL

SCHOLARSHIPS = [
    (
        "SCH-DAAD-2025",
        "منحة DAAD للدراسات العليا والبحث العلمي",
        "الهيئة الألمانية للتبادل الثقافي (DAAD)",
        "ألمانيا (Germany)",
        "منحة كاملة لدراسة الماجستير والدكتوراه وإجراء الأبحاث في الجامعات ومراكز الأبحاث الألمانية المرموقة.",
        "دعم الطلاب المتميزين أكاديمياً وبحثياً لنقل المعرفة وبناء شراكات بحثية رائدة ومستدامة بين ألمانيا ودول العالم في مجالات التكنولوجيا والعلوم.",
        json.dumps({
            "min_gpa": 3.0,
            "degree_levels": ["master", "phd"],
            "eligible_majors": ["Computer Science", "Artificial Intelligence", "Data Science", "Software Engineering", "Information Technology"],
            "eligible_nationalities": [],
            "language_requirements": [{"language": "English", "level": "B2", "test_name": "IELTS", "score": 6.5}],
            "required_documents": ["Transcript", "Motivation Letter", "Research Proposal", "2 Recommendation Letters"],
            "min_publications": 0
        }, ensure_ascii=False),
        "2026-10-31",
        "full",
        json.dumps(["Artificial Intelligence", "Computer Science", "Data Science"], ensure_ascii=False),
        "https://www.daad.de/en/",
        1
    ),
    (
        "SCH-FULBRIGHT-2025",
        "برنامج فولبرايت للطلاب الأجانب (Fulbright Program)",
        "وزارة الخارجية الأمريكية (U.S. Department of State)",
        "الولايات المتحدة (USA)",
        "برنامج التبادل التعليمي المرموق الممول بالكامل للماجستير والدكتوراه والزمالات الأكاديمية في أفضل الجامعات الأمريكية.",
        "تعزيز التفاهم الثقافي والتعاون العلمي الدولي من خلال استقطاب قادة المستقبل وتمكينهم من إجراء أبحاث متقدمة في مجالات الذكاء الاصطناعي والتقنيات الناشئة.",
        json.dumps({
            "min_gpa": 3.2,
            "degree_levels": ["master", "phd"],
            "eligible_majors": [],
            "eligible_nationalities": [],
            "language_requirements": [{"language": "English", "level": "C1", "test_name": "TOEFL / IELTS", "score": 7.0}],
            "required_documents": ["Official Transcripts", "Statement of Purpose", "Personal Statement", "3 Reference Letters", "GRE (Optional)"],
            "min_publications": 0
        }, ensure_ascii=False),
        "2026-09-15",
        "full",
        json.dumps(["AI", "NLP", "Machine Learning", "Public Policy", "Engineering"], ensure_ascii=False),
        "https://foreign.fulbrightonline.org/",
        1
    ),
    (
        "SCH-CHEVENING-2025",
        "منحة تشيفنينغ البريطانية (Chevening Scholarship)",
        "وزارة الخارجية والكومنولث والتنمية البريطانية (FCDO)",
        "المملكة المتحدة (UK)",
        "برنامج التمويل الكامل للحصول على درجة الماجستير لمدة عام واحد في أي من جامعات المملكة المتحدة الرائدة للمهنيين وقادة المستقبل.",
        "تمكين القادة والمهنيين المتميزين من تطوير خبراتهم في القيادة والابتكار التكنولوجي وإحداث تأثير إيجابي ملموس في مجتمعاتهم.",
        json.dumps({
            "min_gpa": 2.8,
            "degree_levels": ["master"],
            "eligible_majors": [],
            "eligible_nationalities": [],
            "language_requirements": [{"language": "English", "level": "B2", "test_name": "IELTS", "score": 6.5}],
            "required_documents": ["Degree Certificate", "Academic Transcripts", "2 Work Reference Letters", "Chevening Leadership Essays"],
            "min_publications": 0
        }, ensure_ascii=False),
        "2026-11-05",
        "full",
        json.dumps(["Computer Science", "Information Systems", "Business & Technology"], ensure_ascii=False),
        "https://www.chevening.org/",
        1
    ),
    (
        "SCH-TURKIYE-2025",
        "المنحة التركية (Türkiye Bursları)",
        "رئاسة أتراك المهجر والمجتمعات ذات القربى (YTB)",
        "تركيا (Turkey)",
        "منحة حكومية ممولة بالكامل تشمل الرسوم الدراسية الكاملة، السكن الجامعي، راتب شهري، وتأمين صحي وسنة تحضيرية لدراسة اللغة.",
        "بناء جسور التواصل الأكاديمي الدولي وتأهيل الكفاءات العلمية في مختلف التخصصات الهندسية والتقنية الحديثة.",
        json.dumps({
            "min_gpa": 3.0,
            "degree_levels": ["bachelor", "master", "phd"],
            "eligible_majors": [],
            "eligible_nationalities": [],
            "language_requirements": [],
            "required_documents": ["Passport", "Diploma", "Transcript", "Intent Letter"],
            "min_publications": 0
        }, ensure_ascii=False),
        "2027-02-20",
        "full",
        json.dumps(["Engineering", "Computer Science", "Information Technology"], ensure_ascii=False),
        "https://www.turkiyeburslari.gov.tr/",
        1
    )
]

STUDENTS = [
    (
        "STU-AHMED-01",
        "أحمد علي اليماني (Ahmed Al-Yamani)",
        "ahmed.alyamani@example.com",
        3.72,
        "Computer Science & AI",
        "bachelor",
        "master",
        "Yemeni",
        "Yemen",
        json.dumps(["Natural Language Processing (NLP)", "Large Language Models (LLMs)", "Arabic AI Systems", "Multi-Agent Architectures"], ensure_ascii=False),
        json.dumps([
            {"language": "Arabic", "level": "native", "test_name": None, "score": None},
            {"language": "English", "level": "B2", "test_name": "IELTS", "score": 7.0}
        ], ensure_ascii=False),
        json.dumps([
            "مساعد باحث في مختبر معالجة اللغات الطبيعية (NLP Lab)",
            "مطور برمجيات ذكاء اصطناعي حر وبناء وكلاء ذكيين (AI Agents)",
            "مساهم في عدة مكتبات مفتوحة المصدر باللغة العربية"
        ], ensure_ascii=False),
        json.dumps(["مؤسس النادي الطلابي للذكاء الاصطناعي", "تنظيم هاكاثون الابتكار التقني"], ensure_ascii=False),
        json.dumps(["Germany", "USA", "United Kingdom"], ensure_ascii=False),
        json.dumps(["Artificial Intelligence", "NLP", "Machine Learning"], ensure_ascii=False),
        1
    ),
    (
        "STU-FATIMA-02",
        "فاطمة سالم الحكيمي (Fatima Al-Hakimi)",
        "fatima.alhakimi@example.com",
        3.91,
        "Software Engineering",
        "bachelor",
        "master",
        "Yemeni",
        "Yemen",
        json.dumps(["Cloud Computing", "Cybersecurity", "Distributed Systems", "AI Infrastructure"], ensure_ascii=False),
        json.dumps([
            {"language": "Arabic", "level": "native", "test_name": None, "score": None},
            {"language": "English", "level": "C1", "test_name": "TOEFL iBT", "score": 105.0}
        ], ensure_ascii=False),
        json.dumps([
            "مهندسة بنية تحتية سحابية متدربة في شركة اتصالات",
            "نشر ورقة بحثية في مؤتمر IEEE حول أمان النظم الموزعة"
        ], ensure_ascii=False),
        json.dumps(["عضو في جمعية مهندسي البرمجيات", "متطوعة في تدريب الفتيات على البرمجة"], ensure_ascii=False),
        json.dumps(["USA", "Germany", "United Kingdom"], ensure_ascii=False),
        json.dumps(["Software Engineering", "Cybersecurity", "AI Systems"], ensure_ascii=False),
        2
    )
]

async def seed():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(MIGRATION_SQL)
        await db.commit()

        # Seed scholarships
        for s in SCHOLARSHIPS:
            await db.execute("""
                INSERT OR REPLACE INTO scholarships
                (id, name, provider, country, description, mission_statement, requirements, deadline, funding_type, fields_of_study, application_url, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, s)

        # Seed students
        for st in STUDENTS:
            await db.execute("""
                INSERT OR REPLACE INTO students
                (id, name, email, gpa, major, degree_level, target_degree, nationality, country_of_residence,
                 research_interests, languages, experiences, extracurriculars, target_countries, target_fields, publications)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, st)

        await db.commit()
    print("✅ Database successfully initialized and seeded with realistic sample data!")

if __name__ == "__main__":
    asyncio.run(seed())
