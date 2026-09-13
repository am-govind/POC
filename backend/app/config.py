import os

JWT_SECRET = os.getenv("JWT_SECRET", "local-development-secret-change-me")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
MIN_AGE_YEARS = int(os.getenv("MIN_AGE_YEARS", "21"))
