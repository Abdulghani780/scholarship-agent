"""Students repository."""

from __future__ import annotations

import json
import uuid
from typing import Any

from database import Database


class StudentRepository:
    @staticmethod
    async def create(data: dict[str, Any]) -> dict[str, Any]:
        student_id = str(uuid.uuid4())
        await Database.execute(
            """INSERT INTO students (id, name, email, gpa, major, degree_level,
               target_degree, nationality, country_of_residence,
               research_interests, languages, experiences, extracurriculars,
               target_countries, target_fields, publications)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                student_id,
                data["name"],
                data["email"],
                data["gpa"],
                data["major"],
                data["degree_level"],
                data["target_degree"],
                data["nationality"],
                data["country_of_residence"],
                json.dumps(data.get("research_interests", []), ensure_ascii=False),
                json.dumps(data.get("languages", []), ensure_ascii=False),
                json.dumps(data.get("experiences", []), ensure_ascii=False),
                json.dumps(data.get("extracurriculars", []), ensure_ascii=False),
                json.dumps(data.get("target_countries", []), ensure_ascii=False),
                json.dumps(data.get("target_fields", []), ensure_ascii=False),
                data.get("publications", 0),
            ),
        )
        return await StudentRepository.get_by_id(student_id)  # type: ignore

    @staticmethod
    async def get_by_id(student_id: str) -> dict[str, Any] | None:
        row = await Database.fetch_one("SELECT * FROM students WHERE id = ?", (student_id,))
        return _deserialize(row) if row else None

    @staticmethod
    async def list_all() -> list[dict[str, Any]]:
        rows = await Database.fetch_all("SELECT * FROM students ORDER BY created_at DESC")
        return [_deserialize(r) for r in rows]


def _deserialize(row: dict) -> dict:
    for key in ("research_interests", "languages", "experiences",
                "extracurriculars", "target_countries", "target_fields"):
        if isinstance(row.get(key), str):
            row[key] = json.loads(row[key])
    return row
