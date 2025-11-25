"""Reservation model and booking helpers."""

from __future__ import annotations

from datetime import datetime

from .db import get_connection, row_to_dict, rows_to_dicts


def create_reservation(user_id: int, lot_id: int, vehicle_number: str) -> dict[str, object] | None:
    with get_connection() as conn:
        spot = conn.execute(
            "SELECT id FROM parking_spots WHERE lot_id = ? AND status = 'A' ORDER BY id LIMIT 1",
            (lot_id,),
        ).fetchone()
        if spot is None:
            return None
        spot_id = spot["id"]
        conn.execute("UPDATE parking_spots SET status = 'O' WHERE id = ?", (spot_id,))
        cursor = conn.execute(
            "INSERT INTO reservations (spot_id, user_id, vehicle_number) VALUES (?, ?, ?)",
            (spot_id, user_id, vehicle_number),
        )
        conn.commit()
        reservation_id = cursor.lastrowid
        row = conn.execute(
            """
            SELECT r.id, r.spot_id, r.user_id, r.vehicle_number, r.parked_at, r.left_at, r.cost,
                   l.name AS lot_name, l.id AS lot_id
            FROM reservations AS r
            JOIN parking_spots AS s ON s.id = r.spot_id
            JOIN parking_lots AS l ON l.id = s.lot_id
            WHERE r.id = ?
            """,
            (reservation_id,),
        ).fetchone()
    data = row_to_dict(row) or {}
    data["lot"] = data.pop("lot_name", None)
    return data


def release_reservation(reservation_id: int, user_id: int) -> dict[str, object] | None:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT r.id, r.spot_id, r.user_id, r.vehicle_number, r.parked_at, r.left_at, r.cost,
                   l.price_per_hour, l.name AS lot_name
            FROM reservations AS r
            JOIN parking_spots AS s ON s.id = r.spot_id
            JOIN parking_lots AS l ON l.id = s.lot_id
            WHERE r.id = ?
            """,
            (reservation_id,),
        ).fetchone()
        if row is None or row["user_id"] != user_id:
            return None
        if row["left_at"]:
            return row_to_dict(row)
        parked_at = datetime.fromisoformat(str(row["parked_at"]))
        left_at = datetime.utcnow()
        hours = max((left_at - parked_at).total_seconds() / 3600, 1)
        cost = hours * float(row["price_per_hour"])
        conn.execute(
            "UPDATE reservations SET left_at = ?, cost = ? WHERE id = ?",
            (left_at.isoformat(), cost, reservation_id),
        )
        conn.execute("UPDATE parking_spots SET status = 'A' WHERE id = ?", (row["spot_id"],))
        conn.commit()
        updated = conn.execute(
            """
            SELECT r.id, r.spot_id, r.user_id, r.vehicle_number, r.parked_at, r.left_at, r.cost,
                   l.name AS lot_name
            FROM reservations AS r
            JOIN parking_spots AS s ON s.id = r.spot_id
            JOIN parking_lots AS l ON l.id = s.lot_id
            WHERE r.id = ?
            """,
            (reservation_id,),
        ).fetchone()
    data = row_to_dict(updated) or {}
    data["lot"] = data.pop("lot_name", None)
    return data


def list_user_reservations(user_id: int) -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT r.id, r.spot_id, r.user_id, r.vehicle_number, r.parked_at, r.left_at, r.cost,
                   l.name AS lot
            FROM reservations AS r
            JOIN parking_spots AS s ON s.id = r.spot_id
            JOIN parking_lots AS l ON l.id = s.lot_id
            WHERE r.user_id = ?
            ORDER BY r.id DESC
            """,
            (user_id,),
        ).fetchall()
    return rows_to_dicts(rows)


def recent_activity_count(user_id: int, since_iso: str) -> int:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM reservations WHERE user_id = ? AND parked_at >= ?",
            (user_id, since_iso),
        ).fetchone()
    return int(row["cnt"]) if row else 0


def monthly_summary(user_id: int, since_iso: str) -> list[dict[str, object]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT r.id, r.spot_id, r.parked_at, r.left_at, r.cost, l.name AS lot
            FROM reservations AS r
            JOIN parking_spots AS s ON s.id = r.spot_id
            JOIN parking_lots AS l ON l.id = s.lot_id
            WHERE r.user_id = ? AND r.parked_at >= ?
            ORDER BY r.parked_at DESC
            """,
            (user_id, since_iso),
        ).fetchall()
    return rows_to_dicts(rows)
