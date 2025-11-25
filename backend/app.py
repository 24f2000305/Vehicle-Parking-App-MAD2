"""Flask app and Celery setup for the parking system."""

from __future__ import annotations

from pathlib import Path
from typing import Any

from celery import Celery
from celery.schedules import crontab
from flask import Flask, jsonify, send_from_directory

from .extensions import cache, login_manager
from .models import initialize_database
from .routes import admin, auth, user

FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"


def create_app() -> Flask:
    app = Flask(
        __name__,
        static_folder=str(FRONTEND_DIR),
        static_url_path="",
    )
    app.config.update(
        SECRET_KEY="dev-key",
        CACHE_TYPE="RedisCache",
        CACHE_REDIS_HOST="localhost",
        CACHE_REDIS_PORT=6379,
        CACHE_DEFAULT_TIMEOUT=300,
        REDIS_URL="redis://localhost:6379/0",
        CELERY_BROKER_URL="redis://localhost:6379/1",
        CELERY_RESULT_BACKEND="redis://localhost:6379/2",
    )
    app.config.setdefault("CACHE_REDIS_URL", app.config["REDIS_URL"])

    cache.init_app(app)
    login_manager.init_app(app)

    initialize_database()

    app.register_blueprint(auth.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(user.bp)

    @app.get("/")
    def serve_index() -> Any:
        # Serve the frontend index page.
        return send_from_directory(FRONTEND_DIR, "index.html")

    @app.get("/health")
    def health() -> dict[str, str]:
        # Return health status.
        return {"status": "ok"}

    @app.errorhandler(403)
    @app.errorhandler(404)
    @app.errorhandler(400)
    def handle_errors(error):
        # Send uniform error response.
        return jsonify({"error": getattr(error, "description", str(error))}), error.code

    return app


def make_celery(flask_app: Flask) -> Celery:
    celery = Celery(
        flask_app.import_name,
        broker=flask_app.config["CELERY_BROKER_URL"],
        backend=flask_app.config["CELERY_RESULT_BACKEND"],
    )
    celery.conf.update(flask_app.config)

    class ContextTask(celery.Task):
        def __call__(self, *args: Any, **kwargs: Any) -> Any:  # type: ignore[override]
            with flask_app.app_context():
                return self.run(*args, **kwargs)

    celery.Task = ContextTask
    celery.conf.beat_schedule = {
        "daily-reminder": {
            "task": "backend.tasks.send_daily_reminders",
            "schedule": crontab(hour=18, minute=0),
        },
        "monthly-report": {
            "task": "backend.tasks.send_monthly_reports",
            "schedule": crontab(day_of_month="1", hour=18, minute=10),
        },
    }
    celery.conf.timezone = "UTC"
    return celery


app = create_app()
celery = make_celery(app)

# Register Celery tasks.
from . import tasks as task_module  # noqa: E402

task_module.configure(celery)


__all__ = ["app", "celery"]
