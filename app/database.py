"""Central async SQLite wrapper."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import aiosqlite

from config import settings

logger = logging.getLogger(__name__)

_db_path = Path(settings.database_url)
_db_path.parent.mkdir(parents=True, exist_ok=True)

_conn: aiosqlite.Connection | None = None


class Database:
    @classmethod
    async def initialize(cls) -> None:
        global _conn
        _conn = await aiosqlite.connect(_db_path)
        _conn.row_factory = aiosqlite.Row
        await _conn.execute("PRAGMA journal_mode=WAL")
        await _conn.execute("PRAGMA foreign_keys=ON")
        await _conn.execute("PRAGMA busy_timeout=5000")
        logger.info("Database connected: %s", _db_path)

    @classmethod
    async def close(cls) -> None:
        global _conn
        if _conn:
            await _conn.close()
            _conn = None

    @classmethod
    async def execute(cls, sql: str, params: tuple = ()) -> None:
        assert _conn, "Database not initialized"
        await _conn.execute(sql, params)
        await _conn.commit()

    @classmethod
    async def fetch_one(cls, sql: str, params: tuple = ()) -> dict[str, Any] | None:
        assert _conn, "Database not initialized"
        async with _conn.execute(sql, params) as cur:
            row = await cur.fetchone()
            return dict(row) if row else None

    @classmethod
    async def fetch_all(cls, sql: str, params: tuple = ()) -> list[dict[str, Any]]:
        assert _conn, "Database not initialized"
        async with _conn.execute(sql, params) as cur:
            rows = await cur.fetchall()
            return [dict(r) for r in rows]

    @classmethod
    async def execute_returning(cls, sql: str, params: tuple = ()) -> dict[str, Any] | None:
        assert _conn, "Database not initialized"
        async with _conn.execute(sql, params) as cur:
            await _conn.commit()
            row = await cur.fetchone()
            return dict(row) if row else None
