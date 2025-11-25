"""Authentication routes for login, registration, and profile."""

from __future__ import annotations

from flask import Blueprint, request
from flask_login import current_user, login_required, login_user, logout_user

from ..extensions import login_manager
from ..models.users import AuthUser, create_user, get_user_by_id, verify_credentials

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@login_manager.user_loader
def load_user(user_id: str) -> AuthUser | None:
    return get_user_by_id(int(user_id))


@bp.post("/register")
def register():
    # Handle user registration.
    payload = request.get_json() or {}
    username = payload.get("username")
    password = payload.get("password")
    email = payload.get("email")
    if not username or not password or not email:
        return {"error": "username, password, and email are required"}, 400
    
    # Validate Gmail format
    if not email.endswith("@gmail.com"):
        return {"error": "email must be a valid Gmail address (e.g., user@gmail.com)"}, 400
    
    created = create_user(username=username, password=password, email=email)
    if not created:
        return {"error": "username already exists, please choose a different username"}, 400
    return {"message": "registered"}


@bp.post("/login")
def login():
    # Verify credentials and log user in.
    payload = request.get_json() or {}
    username = payload.get("username")
    password = payload.get("password")
    user = verify_credentials(username, password)
    if not user:
        return {"error": "invalid creds"}, 401
    login_user(user)
    return {"message": "logged"}


@bp.post("/logout")
@login_required
def logout():
    # Log user out.
    logout_user()
    return {"message": "logged out"}


@bp.get("/profile")
def profile():
    if not current_user.is_authenticated:
        return {"user": None}
    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "role": current_user.role,
        }
    }
