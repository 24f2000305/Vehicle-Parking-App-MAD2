"""Database connection and schema initialization."""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Iterable, Sequence

from werkzeug.security import generate_password_hash

DB_PATH = Path(__file__).resolve().parent.parent / "parking.db"

SCHEMA: Sequence[str] = (
    """
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS parking_lots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price_per_hour REAL NOT NULL,
        address TEXT,
        pin_code TEXT,
        total_spots INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS parking_spots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lot_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'A',
        FOREIGN KEY (lot_id) REFERENCES parking_lots (id) ON DELETE CASCADE
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS reservations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        spot_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        vehicle_number TEXT NOT NULL,
        parked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        left_at DATETIME,
        cost REAL DEFAULT 0,
        FOREIGN KEY (spot_id) REFERENCES parking_spots (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """,
    """
    CREATE TABLE IF NOT EXISTS export_jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        file_path TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    """,
)


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_database() -> None:
    # Initialize database schema.
    with get_connection() as conn:
        for statement in SCHEMA:
            conn.execute(statement)
        conn.commit()
    ensure_admin()


def ensure_admin() -> None:
    # Seed default admin user.
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        ).fetchone()
        if row is None:
            conn.execute(
                "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
                ("admin", "admin@example.com", generate_password_hash("admin123"), "admin"),
            )
            conn.commit()


def row_to_dict(row: sqlite3.Row | None) -> dict[str, object] | None:
    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def rows_to_dicts(rows: Iterable[sqlite3.Row]) -> list[dict[str, object]]:
    result: list[dict[str, object]] = []
    for row in rows:
        if row is None:
            continue
        result.append({key: row[key] for key in row.keys()})
    return result
