"""Thin module exposing backend app and celery for runners."""

from backend.app import app, celery

__all__ = ["app", "celery"]


if __name__ == "__main__":
    app.run(debug=True)
