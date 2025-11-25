"""Export job model for CSV generation."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from .db import get_connection, row_to_dict, rows_to_dicts

EXPORT_DIR = Path(__file__).resolve().parent.parent / "exports"
EXPORT_DIR.mkdir(exist_ok=True)


def create_job(user_id: int) -> dict[str, object]:
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO export_jobs (user_id, status) VALUES (?, 'queued')",
            (user_id,),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM export_jobs WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return row_to_dict(row) or {}


def get_job(job_id: int) -> Optional[dict[str, object]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM export_jobs WHERE id = ?", (job_id,)).fetchone()
    return row_to_dict(row)


def mark_processing(job_id: int) -> None:
    with get_connection() as conn:
        conn.execute("UPDATE export_jobs SET status = 'processing' WHERE id = ?", (job_id,))
        conn.commit()


def mark_completed(job_id: int, file_path: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "UPDATE export_jobs SET status = 'completed', file_path = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (file_path, job_id),
        )
        conn.commit()


def list_jobs_for_user(user_id: int) -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM export_jobs WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    return rows_to_dicts(rows)
