"""Celery background tasks for exports, reminders, and reports."""

from __future__ import annotations

from collections import Counter
from datetime import datetime, timedelta
from pathlib import Path
from typing import Callable

from celery import Celery, Task

from .models import export_jobs, lots, reservations, users

EXPORT_DIR = Path("exports")
NOTIFICATION_DIR = Path("notifications")
REPORT_DIR = Path("reports")

_run_export_task: Task | None = None
_daily_task: Task | None = None
_monthly_task: Task | None = None


def _ensure_dir(path: Path) -> Path:
    # Ensure directory exists.
    path.mkdir(exist_ok=True)
    return path


def _register(celery_app: Celery, func: Callable[..., None], name: str) -> Task:
    return celery_app.task(name=name)(func)


def configure(celery_app: Celery) -> None:
    # Register Celery tasks.
    global _run_export_task, _daily_task, _monthly_task
    _run_export_task = _register(celery_app, run_export_job, "backend.tasks.run_export_job")
    _daily_task = _register(celery_app, send_daily_reminders, "backend.tasks.send_daily_reminders")
    _monthly_task = _register(celery_app, send_monthly_reports, "backend.tasks.send_monthly_reports")


def enqueue_export(job_id: int) -> None:
    # Queue export job for async processing.
    if _run_export_task is None:
        raise RuntimeError("Celery tasks not configured")
    _run_export_task.delay(job_id)


def run_export_job(job_id: int) -> None:
    # Generate CSV export for user reservations.
    job = export_jobs.get_job(job_id)
    if not job:
        return
    export_jobs.mark_processing(job_id)
    rows = reservations.list_user_reservations(int(job["user_id"]))
    export_dir = _ensure_dir(EXPORT_DIR)
    file_path = export_dir / f"export_{job['user_id']}_{job_id}.csv"
    lines = ["reservation_id,spot_id,lot,parked_at,left_at,cost"]
    for row in rows:
        lines.append(
            ",".join(
                [
                    str(row.get("id", "")),
                    str(row.get("spot_id", "")),
                    str(row.get("lot", "")),
                    str(row.get("parked_at", "")),
                    str(row.get("left_at", "")),
                    str(row.get("cost", "")),
                ]
            )
        )
    file_path.write_text("\n".join(lines), encoding="utf-8")
    export_jobs.mark_completed(job_id, str(file_path.resolve()))


def send_daily_reminders() -> None:
    # Send daily reminder logs for inactive users.
    cutoff = datetime.utcnow() - timedelta(days=1)
    since = cutoff.isoformat()
    if not lots.list_available_lots():
        return
    reminders: list[str] = []
    for user in users.list_all_users():
        if user.get("role") != "user":
            continue
        recent = reservations.recent_activity_count(int(user["id"]), since)
        if recent == 0:
            reminders.append(
                f"{datetime.utcnow().isoformat()} :: {user['username']} :: please book a spot if needed"
            )
    if reminders:
        log_file = _ensure_dir(NOTIFICATION_DIR) / f"reminders_{datetime.utcnow().date()}.txt"
        with log_file.open("a", encoding="utf-8") as handle:
            handle.write("\n".join(reminders) + "\n")


def send_monthly_reports() -> None:
    # Generate monthly activity reports for all users.
    window_start = datetime.utcnow() - timedelta(days=30)
    since = window_start.isoformat()
    report_dir = _ensure_dir(REPORT_DIR)
    for user in users.list_all_users():
        if user.get("role") != "user":
            continue
        bookings = reservations.monthly_summary(int(user["id"]), since)
        if not bookings:
            continue
        total_cost = sum(float(entry.get("cost") or 0) for entry in bookings)
        lot_counter = Counter(entry.get("lot") for entry in bookings if entry.get("lot"))
        most_used = lot_counter.most_common(1)[0][0] if lot_counter else "N/A"
        rows = "".join(
            f"<tr><td>{entry.get('id')}</td><td>{entry.get('lot')}</td><td>{entry.get('parked_at')}</td><td>{entry.get('left_at') or ''}</td><td>{entry.get('cost')}</td></tr>"
            for entry in bookings
        )
        html = f"""
        <html>
          <body>
            <h2>Monthly Activity Report for {user.get('username')}</h2>
            <p>Total Reservations: {len(bookings)}</p>
            <p>Total Cost: {total_cost:.2f}</p>
            <p>Most Used Lot: {most_used}</p>
            <table border="1" cellpadding="4">
              <thead><tr><th>ID</th><th>Lot</th><th>Parked At</th><th>Left At</th><th>Cost</th></tr></thead>
              <tbody>{rows}</tbody>
            </table>
          </body>
        </html>
        """
        report_file = report_dir / f"report_{user.get('username')}_{datetime.utcnow().date()}.html"
        report_file.write_text(html, encoding="utf-8")


__all__ = ["configure", "enqueue_export"]
