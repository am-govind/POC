# BottleShop

Premium animated liquor e-commerce — FastAPI backend, React + Three.js storefront, and admin dashboard.

## Stack

- **Backend:** FastAPI, SQLAlchemy, JWT auth, Supabase PostgreSQL
- **Frontend:** React 19, Vite, Tailwind CSS, Three.js (R3F), Framer Motion
- **Database:** Supabase local Postgres (Docker)

## Run locally

```bash
# 1. Start Supabase (Docker + Supabase CLI)
supabase start
supabase db reset   # applies migrations + seed

# 2. API
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
```

- API docs: http://localhost:8000/docs  
- Storefront: http://localhost:5173  
- Admin: http://localhost:5173/admin  

## Demo accounts

| Role     | Email                      | Password     |
|----------|----------------------------|--------------|
| Admin    | admin@bottleshop.local     | admin123     |
| Customer | customer@bottleshop.local  | customer123  |

## Configuration

Copy `backend/.env.example` → `backend/.env` and `frontend/.env.example` → `frontend/.env`.

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | local Supabase | Postgres connection |
| `JWT_SECRET` | dev secret | Change in production |
| `FRONTEND_URL` | http://localhost:5173 | CORS origin |
| `VITE_API_URL` | http://localhost:8000 | API base URL |
| `MIN_AGE_YEARS` | 21 | Minimum age for checkout |

## Features

**Storefront:** Three.js hero, 3D product viewer, category browse, cart, checkout, order history, age gate on checkout.

**Admin:** Dashboard with low-stock alerts, product CRUD, inventory management with audit log, order status updates.

## Checks

```bash
python3 -m py_compile backend/app/main.py backend/app/routers/*.py
cd frontend && npm ci && npm run build
```

## Warehouse CSV import

See `scripts/import_warehouse_sales.py` for bulk historical data import (optional).
