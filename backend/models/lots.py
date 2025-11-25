"""Parking lot model and management helpers."""

from __future__ import annotations

from typing import Any, Dict, Iterable, List, Optional, Tuple

from .db import get_connection, row_to_dict, rows_to_dicts


def _normalize_lot(row: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if row is None:
        return None
    data = dict(row)
    if "price_per_hour" in data and data["price_per_hour"] is not None:
        data["price_per_hour"] = float(data["price_per_hour"])
    if "total_spots" in data and data["total_spots"] is not None:
        data["total_spots"] = int(data["total_spots"])
    return data


def list_all_lots(include_available: bool = False) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT id, name, price_per_hour, address, pin_code, total_spots, created_at FROM parking_lots ORDER BY id"
        ).fetchall()
        lots = [_normalize_lot(row) for row in rows_to_dicts(rows)]
        if include_available:
            for lot in lots:
                lot["available_spots"] = available_spots(int(lot["id"]))
        return lots


def available_spots(lot_id: int) -> int:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS cnt FROM parking_spots WHERE lot_id = ? AND status = 'A'",
            (lot_id,),
        ).fetchone()
    return int(row["cnt"]) if row else 0


def create_lot(name: str, price_per_hour: float, total_spots: int, address: str | None, pin_code: str | None) -> Dict[str, Any]:
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO parking_lots (name, price_per_hour, address, pin_code, total_spots) VALUES (?, ?, ?, ?, ?)",
            (name, price_per_hour, address, pin_code, total_spots),
        )
        lot_id = cursor.lastrowid
        conn.executemany(
            "INSERT INTO parking_spots (lot_id, status) VALUES (?, 'A')",
            [(lot_id,) for _ in range(total_spots)],
        )
        conn.commit()
        row = conn.execute("SELECT * FROM parking_lots WHERE id = ?", (lot_id,)).fetchone()
    data = _normalize_lot(row_to_dict(row) or {}) or {}
    data["available_spots"] = available_spots(lot_id)
    return data


def update_lot(
    lot_id: int,
    *,
    name: Optional[str] = None,
    price_per_hour: Optional[float] = None,
    total_spots: Optional[int] = None,
    address: Optional[str] = None,
    pin_code: Optional[str] = None,
) -> Tuple[str, Optional[Dict[str, Any]]]:
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM parking_lots WHERE id = ?", (lot_id,)).fetchone()
        if row is None:
            return "not_found", None
        current_total = row["total_spots"]
        updates: List[Tuple[str, Any]] = []
        if name is not None:
            updates.append(("name", name))
        if price_per_hour is not None:
            updates.append(("price_per_hour", price_per_hour))
        if address is not None:
            updates.append(("address", address))
        if pin_code is not None:
            updates.append(("pin_code", pin_code))
        if updates:
            set_clause = ", ".join(f"{col} = ?" for col, _ in updates)
            conn.execute(
                f"UPDATE parking_lots SET {set_clause} WHERE id = ?",
                tuple(val for _, val in updates) + (lot_id,),
            )
        if total_spots is not None and total_spots != current_total:
            delta = total_spots - current_total
            if delta > 0:
                conn.executemany(
                    "INSERT INTO parking_spots (lot_id, status) VALUES (?, 'A')",
                    [(lot_id,) for _ in range(delta)],
                )
            else:
                removable = conn.execute(
                    "SELECT id FROM parking_spots WHERE lot_id = ? AND status = 'A' LIMIT ?",
                    (lot_id, abs(delta)),
                ).fetchall()
                if len(removable) < abs(delta):
                    return "occupied", None
                conn.executemany(
                    "DELETE FROM parking_spots WHERE id = ?",
                    [(row["id"],) for row in removable],
                )
            conn.execute(
                "UPDATE parking_lots SET total_spots = ? WHERE id = ?",
                (total_spots, lot_id),
            )
        conn.commit()
        updated = conn.execute(
            "SELECT id, name, price_per_hour, address, pin_code, total_spots, created_at FROM parking_lots WHERE id = ?",
            (lot_id,),
        ).fetchone()
    result = _normalize_lot(row_to_dict(updated))
    if result is not None:
        result["available_spots"] = available_spots(lot_id)
    return "ok", result


def delete_lot(lot_id: int) -> str:
    with get_connection() as conn:
        exists = conn.execute("SELECT id FROM parking_lots WHERE id = ?", (lot_id,)).fetchone()
        if exists is None:
            return "not_found"
        occupied = conn.execute(
            "SELECT COUNT(*) AS cnt FROM parking_spots WHERE lot_id = ? AND status = 'O'",
            (lot_id,),
        ).fetchone()
        if occupied and int(occupied["cnt"]) > 0:
            return "occupied"
        conn.execute("DELETE FROM parking_spots WHERE lot_id = ?", (lot_id,))
        deleted = conn.execute("DELETE FROM parking_lots WHERE id = ?", (lot_id,))
        conn.commit()
        return "deleted" if deleted.rowcount else "not_found"


def admin_dashboard_stats() -> Dict[str, int]:
    with get_connection() as conn:
        lots = conn.execute("SELECT COUNT(*) AS cnt FROM parking_lots").fetchone()
        spots = conn.execute("SELECT COUNT(*) AS cnt FROM parking_spots").fetchone()
        occupied = conn.execute(
            "SELECT COUNT(*) AS cnt FROM parking_spots WHERE status = 'O'"
        ).fetchone()
    return {
        "lots": int(lots["cnt"]) if lots else 0,
        "total_spots": int(spots["cnt"]) if spots else 0,
        "occupied": int(occupied["cnt"]) if occupied else 0,
    }


def list_available_lots() -> List[Dict[str, Any]]:
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT l.id, l.name, l.price_per_hour, l.address, l.pin_code, l.total_spots,
                   COUNT(s.id) AS available_spots
            FROM parking_lots AS l
            JOIN parking_spots AS s ON s.lot_id = l.id
            WHERE s.status = 'A'
            GROUP BY l.id, l.name, l.price_per_hour, l.address, l.pin_code, l.total_spots
            ORDER BY l.id
            """
        ).fetchall()
    lots = rows_to_dicts(rows)
    for lot in lots:
        lot["price_per_hour"] = float(lot["price_per_hour"])
        lot["total_spots"] = int(lot["total_spots"])
        lot["available_spots"] = int(lot["available_spots"])
    return lots
