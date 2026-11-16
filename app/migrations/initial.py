"""Database migration — run once on fresh install."""

MIGRATION_SQL = """
CREATE TABLE IF NOT EXISTS students (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    gpa         REAL NOT NULL,
    major       TEXT NOT NULL,
    degree_level        TEXT NOT NULL,
    target_degree       TEXT NOT NULL,
    nationality         TEXT NOT NULL,
    country_of_residence TEXT NOT NULL,
    research_interests  TEXT NOT NULL DEFAULT '[]',
    languages           TEXT NOT NULL DEFAULT '[]',
    experiences         TEXT NOT NULL DEFAULT '[]',
    extracurriculars    TEXT NOT NULL DEFAULT '[]',
    target_countries    TEXT NOT NULL DEFAULT '[]',
    target_fields       TEXT NOT NULL DEFAULT '[]',
    publications        INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scholarships (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    provider        TEXT NOT NULL,
    country         TEXT NOT NULL,
    description     TEXT NOT NULL,
    mission_statement TEXT NOT NULL,
    requirements    TEXT NOT NULL DEFAULT '{}',
    deadline        TEXT NOT NULL,
    funding_type    TEXT NOT NULL,
    fields_of_study TEXT NOT NULL DEFAULT '[]',
    application_url TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS match_results (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id      TEXT NOT NULL REFERENCES students(id),
    ran_at          TEXT NOT NULL DEFAULT (datetime('now')),
    trigger_external_search INTEGER NOT NULL DEFAULT 0,
    external_search_reason  TEXT,
    top_match_percentage    REAL NOT NULL DEFAULT 0,
    analysis_json   TEXT NOT NULL DEFAULT '{}',
    matches_json    TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS application_plans (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id  TEXT NOT NULL REFERENCES students(id),
    result_id   INTEGER REFERENCES match_results(id),
    generated_at TEXT NOT NULL DEFAULT (datetime('now')),
    plan_json   TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_match_results_student ON match_results(student_id);
CREATE INDEX IF NOT EXISTS idx_plans_student ON application_plans(student_id);
"""
