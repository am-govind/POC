from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from .config import FRONTEND_URL
from .deps import get_db, require_admin
from .routers import admin, auth, cart, orders, products
from .routers.admin import summary

app = FastAPI(title="BottleShop API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok", "service": "bottleshop-api"}


@app.get("/api/dashboard/summary")
def dashboard_summary(
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    return summary(session=session, _admin=_admin)
