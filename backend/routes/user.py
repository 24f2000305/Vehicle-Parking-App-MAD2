"""User routes for reservations, lots, and exports."""

from __future__ import annotations

from flask import Blueprint, abort, request, send_file, url_for
from flask_login import current_user, login_required

from .. import cache_keys
from ..extensions import cache
from ..models import export_jobs
from ..models.lots import list_available_lots
from ..models.reservations import create_reservation, list_user_reservations, release_reservation
from ..tasks import enqueue_export

bp = Blueprint("user", __name__, url_prefix="/api/user")


def require_user() -> None:
    if not current_user.is_authenticated or current_user.role != "user":
        abort(403, description="user only")


def _bust_lot_caches() -> None:
    # Clear cached lot data.
    cache.delete(cache_keys.USER_LOTS_CACHE_KEY)
    cache.delete(cache_keys.ADMIN_LOTS_CACHE_KEY)
    cache.delete(cache_keys.ADMIN_DASHBOARD_CACHE_KEY)


@bp.get("/lots")
@login_required
def lots_index() -> dict[str, object]:
    require_user()
    cached = cache.get(cache_keys.USER_LOTS_CACHE_KEY)
    if cached is not None:
        return {"lots": cached}
    lots = list_available_lots()
    cache.set(cache_keys.USER_LOTS_CACHE_KEY, lots, timeout=120)
    return {"lots": lots}


@bp.get("/reservations")
@login_required
def reservations_index() -> dict[str, object]:
    require_user()
    data = list_user_reservations(current_user.id)
    return {"reservations": data}


@bp.post("/reservations")
@login_required
def reservations_create():
    require_user()
    payload = request.get_json() or {}
    try:
        lot_id = int(payload["lot_id"])
        quantity = int(payload.get("quantity", 1))
        vehicle_number = payload.get("vehicle_number", "").strip().upper()
        
        if quantity < 1 or quantity > 10:
            return {"error": "quantity must be between 1 and 10"}, 400
        
        # Validate vehicle number format: XXNNXXNNNN (2 letters, 2 digits, 2 letters, 4 digits)
        import re
        if not vehicle_number or not re.match(r'^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$', vehicle_number):
            return {"error": "vehicle number must be in format XXNNXXNNNN (e.g., AB12CD3456)"}, 400
            
    except (KeyError, TypeError, ValueError):
        return {"error": "invalid parameters"}, 400
    
    # Create multiple reservations
    records = []
    for _ in range(quantity):
        record = create_reservation(current_user.id, lot_id, vehicle_number)
        if not record:
            break
        records.append(record)
    
    if not records:
        return {"error": "no spots available"}, 400
    
    _bust_lot_caches()
    return {"reservations": records, "booked": len(records), "requested": quantity}, 201


@bp.post("/reservations/<int:reservation_id>/release")
@login_required
def reservations_release(reservation_id: int):
    require_user()
    record = release_reservation(reservation_id, current_user.id)
    if not record:
        return {"error": "not found"}, 404
    _bust_lot_caches()
    return record


@bp.post("/exports")
@login_required
def request_export():
    require_user()
    job = export_jobs.create_job(current_user.id)
    job_id = job.get("id")
    if job_id is None:
        return {"error": "export failed"}, 500
    enqueue_export(int(job_id))
    return {"job": job}, 202


@bp.get("/exports")
@login_required
def list_exports() -> dict[str, object]:
    require_user()
    jobs = export_jobs.list_jobs_for_user(current_user.id)
    for job in jobs:
        if job.get("file_path"):
            job["download_url"] = url_for("user.download_export", job_id=job["id"])
    return {"jobs": jobs}


@bp.get("/exports/<int:job_id>/download")
@login_required
def download_export(job_id: int):
    require_user()
    job = export_jobs.get_job(job_id)
    if not job or int(job.get("user_id", 0)) != current_user.id or not job.get("file_path"):
        abort(404, description="not found")
    return send_file(job["file_path"], as_attachment=True)
