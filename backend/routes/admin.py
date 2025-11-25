"""Admin routes for lot management and statistics."""

from __future__ import annotations

from flask import Blueprint, abort, request
from flask_login import current_user, login_required

from .. import cache_keys
from ..extensions import cache
from ..models.lots import admin_dashboard_stats, create_lot, delete_lot, list_all_lots, update_lot
from ..models.users import list_non_admin_users

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


def require_admin() -> None:
    if not current_user.is_authenticated or current_user.role != "admin":
        abort(403, description="admin only")


def _bust_cache(*keys: str) -> None:
    for key in keys:
        cache.delete(key)


@bp.get("/lots")
@login_required
def lots_index():
    require_admin()
    cached = cache.get(cache_keys.ADMIN_LOTS_CACHE_KEY)
    if cached is not None:
        return {"lots": cached}
    lots = list_all_lots(include_available=True)
    cache.set(cache_keys.ADMIN_LOTS_CACHE_KEY, lots, timeout=300)
    return {"lots": lots}


@bp.post("/lots")
@login_required
def lots_create():
    require_admin()
    payload = request.get_json() or {}
    try:
        name = payload["name"]
        price_per_hour = float(payload["price_per_hour"])
        total_spots = int(payload["total_spots"])
    except (KeyError, ValueError):
        return {"error": "invalid payload"}, 400
    if price_per_hour <= 0 or total_spots <= 0:
        return {"error": "invalid values"}, 400
    data = create_lot(
        name=name,
        price_per_hour=price_per_hour,
        total_spots=total_spots,
        address=payload.get("address"),
        pin_code=payload.get("pin_code"),
    )
    _bust_cache(
        cache_keys.ADMIN_LOTS_CACHE_KEY,
        cache_keys.ADMIN_DASHBOARD_CACHE_KEY,
        cache_keys.USER_LOTS_CACHE_KEY,
    )
    return data, 201


@bp.patch("/lots/<int:lot_id>")
@login_required
def lots_update(lot_id: int):
    require_admin()
    payload = request.get_json() or {}
    status, record = update_lot(
        lot_id,
        name=payload.get("name"),
        price_per_hour=float(payload["price_per_hour"]) if "price_per_hour" in payload else None,
        total_spots=int(payload["total_spots"]) if "total_spots" in payload else None,
        address=payload.get("address"),
        pin_code=payload.get("pin_code"),
    )
    if status == "not_found":
        return {"error": "not found"}, 404
    if status == "occupied":
        return {"error": "occupied spots prevent shrink"}, 400
    _bust_cache(
        cache_keys.ADMIN_LOTS_CACHE_KEY,
        cache_keys.ADMIN_DASHBOARD_CACHE_KEY,
        cache_keys.USER_LOTS_CACHE_KEY,
    )
    return record


@bp.delete("/lots/<int:lot_id>")
@login_required
def lots_delete(lot_id: int):
    require_admin()
    status = delete_lot(lot_id)
    if status == "not_found":
        return {"error": "not found"}, 404
    if status == "occupied":
        return {"error": "occupied spots"}, 400
    _bust_cache(
        cache_keys.ADMIN_LOTS_CACHE_KEY,
        cache_keys.ADMIN_DASHBOARD_CACHE_KEY,
        cache_keys.USER_LOTS_CACHE_KEY,
    )
    return {"message": "deleted"}


@bp.get("/users")
@login_required
def list_users():
    require_admin()
    return {"users": list_non_admin_users()}


@bp.get("/reservations")
@login_required
def list_all_reservations():
    require_admin()
    from ..models.db import get_connection, rows_to_dicts
    with get_connection() as conn:
        rows = conn.execute(
            """
            SELECT r.id, r.spot_id, r.vehicle_number, r.parked_at, r.left_at, r.cost,
                   u.username, l.name AS lot_name
            FROM reservations r
            JOIN users u ON u.id = r.user_id
            JOIN parking_spots s ON s.id = r.spot_id
            JOIN parking_lots l ON l.id = s.lot_id
            ORDER BY r.parked_at DESC
            LIMIT 100
            """
        ).fetchall()
    return {"reservations": rows_to_dicts(rows)}


@bp.get("/dashboard")
@login_required
def dashboard_stats():
    require_admin()
    cached = cache.get(cache_keys.ADMIN_DASHBOARD_CACHE_KEY)
    if cached is not None:
        return cached
    stats = admin_dashboard_stats()
    cache.set(cache_keys.ADMIN_DASHBOARD_CACHE_KEY, stats, timeout=300)
    return stats
