"""Vercel/FastAPI entry point when the backend directory is deployed."""
from app.main import app

__all__ = ["app"]
