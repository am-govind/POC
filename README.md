# BottleShop

Flipkart-style online liquor store — FastAPI backend, React storefront, Supabase PostgreSQL.

## Stack

- **Backend:** FastAPI, JWT auth, modular routers
- **Frontend:** React 19, Vite, Tailwind CSS (Flipkart blue/white UI)
- **Database:** Supabase local Postgres

## Run locally

```bash
supabase start
supabase db reset    # migrations + base seed (users, categories)

# Load full product catalog (~48 SKUs with images)
export DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
pip install psycopg
python scripts/seed_catalog.py

# API
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

- Storefront: http://localhost:5173  
- Admin: http://localhost:5173/admin  
- API docs: http://localhost:8000/docs  

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bottleshop.local | admin123 |
| Customer | customer@bottleshop.local | customer123 |

## Catalog data

- Edit [`supabase/seed/catalog.json`](supabase/seed/catalog.json) — 48 products across 8 categories with images, MRP, highlights
- Re-run `python scripts/seed_catalog.py` after changes
- Admin can also add/edit products at `/admin/products`

## Features

- Flipkart-style browse, search, filters, discount badges, image galleries
- Cart → checkout with age verification (DOB) and back navigation
- Admin: products, inventory with audit log, orders

## Configuration

| Variable | Default |
|----------|---------|
| `JWT_SECRET` | dev secret |
| `MIN_AGE_YEARS` | 21 |
| `VITE_API_URL` | http://localhost:8000 |
