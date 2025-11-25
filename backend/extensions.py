"""Shared Flask extensions for caching and authentication."""

from flask_caching import Cache
from flask_login import LoginManager

cache = Cache()
login_manager = LoginManager()
