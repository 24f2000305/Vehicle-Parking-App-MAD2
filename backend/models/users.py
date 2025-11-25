"""User model and authentication helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

import sqlite3

from flask_login import UserMixin
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_connection, row_to_dict, rows_to_dicts


@dataclass
class AuthUser(UserMixin):
    id: int
    username: str
    role: str
    email: str | None

    def get_id(self) -> str:  # noqa: D401
        return str(self.id)


def get_user_by_id(user_id: int) -> Optional[AuthUser]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if row:
        return AuthUser(
            id=row["id"],
            username=row["username"],
            role=row["role"],
            email=row["email"],
        )
    return None


def get_user_by_username(username: str) -> Optional[dict[str, object]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    return row_to_dict(row)


def create_user(username: str, password: str, email: str | None) -> bool:
    with get_connection() as conn:
        try:
            conn.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'user')",
                (username, email, generate_password_hash(password)),
            )
            conn.commit()
            return True
        except sqlite3.IntegrityError:
            # Handle duplicate username gracefully.
            return False


def verify_credentials(username: str, password: str) -> Optional[AuthUser]:
    record = get_user_by_username(username)
    if not record:
        return None
    if not check_password_hash(record["password_hash"], password):  # type: ignore[index]
        return None
    return AuthUser(
        id=record["id"],
        username=record["username"],
        role=record["role"],
        email=record.get("email"),
    )


def list_non_admin_users() -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, username, email, role, created_at FROM users WHERE role != 'admin' ORDER BY id"
        ).fetchall()
    return rows_to_dicts(rows)


def list_all_users() -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute("SELECT * FROM users ORDER BY id").fetchall()
    return rows_to_dicts(rows)
