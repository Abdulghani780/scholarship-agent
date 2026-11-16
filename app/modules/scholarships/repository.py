"""Scholarships repository."""

from __future__ import annotations

import json
import uuid
from typing import Any

from database import Database


class ScholarshipRepository:
    @staticmethod
    async def create(data: dict[str, Any]) -> dict[str, Any]:
        sid = f"SCH-{str(uuid.uuid4())[:8].upper()}"
        await Database.execute(
            """INSERT INTO scholarships
               (id, name, provider, country, description, mission_statement,
                requirements, deadline, funding_type, fields_of_study, application_url)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (
                sid,
                data["name"],
                data["provider"],
                data["country"],
                data["description"],
                data["mission_statement"],
                json.dumps(data.get("requirements", {}), ensure_ascii=False),
                data["deadline"],
                data["funding_type"],
                json.dumps(data.get("fields_of_study", []), ensure_ascii=False),
                data.get("application_url"),
            ),
        )
        return await ScholarshipRepository.get_by_id(sid)  # type: ignore

    @staticmethod
    async def get_by_id(sid: str) -> dict[str, Any] | None:
        row = await Database.fetch_one("SELECT * FROM scholarships WHERE id = ?", (sid,))
        return _deserialize(row) if row else None

    @staticmethod
    async def list_active() -> list[dict[str, Any]]:
        rows = await Database.fetch_all(
            "SELECT * FROM scholarships WHERE is_active = 1 ORDER BY deadline ASC"
        )
        return [_deserialize(r) for r in rows]


def _deserialize(row: dict) -> dict:
    for key in ("requirements", "fields_of_study"):
        if isinstance(row.get(key), str):
            row[key] = json.loads(row[key])
    row["is_active"] = bool(row.get("is_active", 1))
    return row
