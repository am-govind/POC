# BottleShop

Local-first alcohol inventory and e-commerce foundation.

## Stack

- FastAPI + SQLAlchemy API
- React + Vite + JavaScript UI
- Supabase local PostgreSQL via Docker

## Run locally

```bash
# 1. Start local Supabase (requires Docker + Supabase CLI)
supabase start

# 2. API
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. UI (new terminal)
cd frontend
npm install
npm run dev
```

API docs: http://localhost:8000/docs  
Frontend: http://localhost:5173

The API currently exposes products, inventory, categories, and dashboard summary endpoints. Authentication and checkout are intentionally the next slice.
# Importing the warehouse dataset

The CSV is historical movement data. Apply the migrations first, then load it with the bulk importer:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
export DATABASE_URL='postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=require'
python scripts/import_warehouse_sales.py Warehouse_and_Retail_Sales.csv
```

The importer creates/updates catalog products keyed by `source_item_code` and stores the monthly facts in `warehouse_sales`. It deliberately does not treat historical warehouse sales as current inventory, and leaves price/ABV at their defaults because the CSV does not contain those values. The staging table is truncated before and after each import, so rerunning the command is safe.
