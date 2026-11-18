"""
Web Search Tool for Academic Scholarships
=========================================
Performs live web searches to find verified official portals, direct application links,
and requirements for academic scholarships worldwide.
"""

from __future__ import annotations

import re
import logging
from typing import Any

logger = logging.getLogger(__name__)

DISALLOWED_DOMAINS = {
    "bing.com",
    "googleadservices.com",
    "doubleclick.net",
    "adclick",
    "aclick",
    "outbrain.com",
    "taboola.com",
}

# Known verified portals for instant accuracy & fallback
KNOWN_VERIFIED_PORTALS = {
    "daad": {
        "title": "بوابة التقديم الرسمية لمنحة DAAD الألمانية (Deutscher Akademischer Austauschdienst)",
        "url": "https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database/",
        "portal_url": "https://www.meindaad.de/en/",
    },
    "chevening": {
        "title": "بوابة التقديم الرسمية لمنحة تشيفنينغ البريطانية (Chevening Scholarship - UK)",
        "url": "https://www.chevening.org/apply/",
        "portal_url": "https://www.chevening.org/",
    },
    "turkiye": {
        "title": "بوابة التقديم الرسمية لمنحة الحكومة التركية (Türkiye Bursları Portal)",
        "url": "https://tbbs.turkiyeburslari.gov.tr/",
        "portal_url": "https://www.turkiyeburslari.gov.tr/",
    },
    "fulbright": {
        "title": "بوابة برنامج فولبرايت للطلاب الأجانب (Fulbright Foreign Student Program)",
        "url": "https://foreign.fulbrightonline.org/about/foreign-student-program",
        "portal_url": "https://foreign.fulbrightonline.org/",
    },
    "mext": {
        "title": "بوابة منحة الحكومة اليابانية MEXT الرسمية (Study in Japan)",
        "url": "https://www.studyinjapan.go.jp/en/planning/by-style/mext-scholarships/",
        "portal_url": "https://www.studyinjapan.go.jp/",
    },
    "erasmus": {
        "title": "دليل كتالوج ماجستير إيراسموس موندوس المشترك (Erasmus Mundus EMJM Catalogue)",
        "url": "https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en",
        "portal_url": "https://erasmus-plus.ec.europa.eu/",
    },
    "eiffel": {
        "title": "منحة إيفل الفرنسية للتميز (Campus France Eiffel Scholarship)",
        "url": "https://www.campusfrance.org/en/the-eiffel-scholarship-program-of-excellence",
        "portal_url": "https://www.campusfrance.org/",
    },
    "kaust": {
        "title": "بوابة زمالة جامعة الملك عبد الله للعلوم والتقنية (KAUST Fellowship)",
        "url": "https://admissions.kaust.edu.sa/fellowship.html",
        "portal_url": "https://admissions.kaust.edu.sa/",
    },
    "gates": {
        "title": "منحة غيتس كامبريدج (Gates Cambridge Trust)",
        "url": "https://www.gatescambridge.org/apply/",
        "portal_url": "https://www.gatescambridge.org/",
    },
    "rhodes": {
        "title": "منحة رودس بجامعة أكسفورد (Rhodes Trust - Oxford)",
        "url": "https://www.rhodeshouse.ox.ac.uk/scholarships/applications/",
        "portal_url": "https://www.rhodeshouse.ox.ac.uk/",
    },
    "swiss": {
        "title": "منح التميز للحكومة السويسرية (Swiss Government Excellence Scholarships)",
        "url": "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants/swiss-government-excellence-scholarships.html",
        "portal_url": "https://www.sbfi.admin.ch/",
    },
}


def is_valid_url(url: str) -> bool:
    if not url or not url.startswith("http"):
        return False
    lower = url.lower()
    return not any(bad in lower for bad in DISALLOWED_DOMAINS)


def search_scholarship_web(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """
    Executes live web search using ddgs to retrieve genuine scholarship portals.
    Falls back gracefully to known verified portals if network is restricted.
    """
    clean_query = query.strip()
    results: list[dict[str, str]] = []

    # Check for direct matches in known verified list first
    lower_query = clean_query.lower()
    for key, portal in KNOWN_VERIFIED_PORTALS.items():
        if key in lower_query or (key == "turkiye" and any(w in lower_query for w in ["تركيا", "تركي", "turkey", "burslari"])):
            results.append({
                "title": f"⭐ البوابة المعتمدة: {portal['title']}",
                "url": portal["url"],
                "snippet": f"الرابط المباشر الرسمي للتقديم والتحقق من الشروط والمواعيد: {portal['portal_url']}",
            })
        elif key == "chevening" and any(w in lower_query for w in ["تشيفنينغ", "بريطانيا", "بريطانية"]):
            results.append({
                "title": f"⭐ البوابة المعتمدة: {portal['title']}",
                "url": portal["url"],
                "snippet": f"الرابط المباشر الرسمي لتقديم منحة تشيفنينغ: {portal['url']}",
            })
        elif key == "daad" and any(w in lower_query for w in ["داد", "daad", "ألمانيا", "المانيا", "المانية"]):
            results.append({
                "title": f"⭐ البوابة المعتمدة: {portal['title']}",
                "url": portal["url"],
                "snippet": f"بوابة قاعدة بيانات منح DAAD وبوابة MeinDAAD للتقديم الإلكتروني: {portal['url']}",
            })
        elif key == "fulbright" and any(w in lower_query for w in ["فولبرايت", "امريكا", "أمريكا"]):
            results.append({
                "title": f"⭐ البوابة المعتمدة: {portal['title']}",
                "url": portal["url"],
                "snippet": f"البوابة الرسمية لبرنامج فولبرايت الدولي: {portal['url']}",
            })

    # Perform live web search via ddgs
    try:
        from ddgs import DDGS
        with DDGS() as ddgs:
            # Craft an optimized query
            search_term = f"{clean_query} official scholarship application portal apply"
            raw_results = list(ddgs.text(search_term, max_results=max_results + 3))

            for r in raw_results:
                href = r.get("href", "")
                title = r.get("title", "")
                body = r.get("body", "")

                if not is_valid_url(href):
                    continue

                # Don't add duplicate URLs
                if any(existing["url"] == href for existing in results):
                    continue

                results.append({
                    "title": title,
                    "url": href,
                    "snippet": body[:250],
                })
                if len(results) >= max_results:
                    break
    except Exception as exc:
        logger.warning("Live web search via ddgs failed or timed out: %s", exc)

    return results


def format_search_results_for_prompt(results: list[dict[str, str]]) -> str:
    """
    Formats the search results into a clean markdown block for LLM prompt injection.
    """
    if not results:
        return "لم تسفر عملية البحث عن روابط إضافية مباشرة."

    lines = ["نتائج البحث المباشر في الويب (روابط ومواقع رسمية موثقة):"]
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. [{r['title']}]({r['url']})")
        if r.get("snippet"):
            lines.append(f"   الوصف والبيانات: {r['snippet']}")
    return "\n".join(lines)
