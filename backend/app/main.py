from decimal import Decimal
from typing import Generator
from datetime import date
import os

from fastapi import Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

# Supabase commonly provides a plain postgresql:// URL. SQLAlchemy must be
# told explicitly to use the installed psycopg (v3) driver; otherwise it
# falls back to psycopg2, which is not in requirements.txt.
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:postgres@127.0.0.1:54322/postgres")
if DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

app = FastAPI(title="BottleShop API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")], allow_methods=["*"], allow_headers=["*"])

ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

def require_admin(x_admin_key: str | None = Header(default=None)):
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(403, "Admin API key required")

def db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try: yield session
    finally: session.close()

class Product(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    brand: str
    category: str | None = None
    price: Decimal
    alcohol_percentage: Decimal
    volume_ml: int
    stock_quantity: int
    reorder_level: int
    is_active: bool

class StockUpdate(BaseModel):
    stock_quantity: int = Field(ge=0)
    reorder_level: int | None = Field(default=None, ge=0)

class ProductCreate(BaseModel):
    name: str
    brand: str
    category_id: str | None = None
    description: str = ''
    alcohol_percentage: Decimal
    volume_ml: int = Field(gt=0)
    price: Decimal = Field(ge=0)
    image_url: str | None = None
    stock_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)

class UserCreate(BaseModel):
    email: str
    full_name: str = ''
    date_of_birth: date | None = None

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1

class OrderCreate(BaseModel):
    user_id: str
    delivery_address: str

def product_query():
    return text("""
      select p.id::text, p.name, p.brand, c.name as category, p.price,
             p.alcohol_percentage, p.volume_ml, p.is_active,
             coalesce(i.stock_quantity, 0) as stock_quantity,
             coalesce(i.reorder_level, 10) as reorder_level
      from products p left join categories c on c.id = p.category_id
      left join inventory i on i.product_id = p.id
      where p.is_active = true
    """)

def product_by_id(session, product_id):
    row = session.execute(text(str(product_query().text) + " and p.id=:id"), {"id": product_id}).mappings().first()
    if not row: raise HTTPException(404, "Product not found")
    return Product(**row)

@app.get("/health")
def health(): return {"status": "ok", "service": "bottleshop-api"}

@app.get("/api/products", response_model=list[Product])
def products(search: str | None = None, category: str | None = None, low_stock: bool = False, session: Session = Depends(db)):
    query = product_query()
    conditions = []
    params = {}
    if search: conditions.append("(lower(p.name) like lower(:search) or lower(p.brand) like lower(:search))"); params["search"] = f"%{search}%"
    if category: conditions.append("lower(c.slug) = lower(:category)"); params["category"] = category
    if low_stock: conditions.append("coalesce(i.stock_quantity, 0) <= coalesce(i.reorder_level, 10)")
    if conditions: query = text(str(query.text) + " and " + " and ".join(conditions))
    return [Product(**row) for row in session.execute(query, params).mappings()]

@app.get("/api/products/{product_id}", response_model=Product)
def get_product(product_id: str, session: Session = Depends(db)): return product_by_id(session, product_id)

@app.post("/api/products", response_model=Product, status_code=201, dependencies=[Depends(require_admin)])
def create_product(payload: ProductCreate, session: Session = Depends(db)):
    if payload.stock_quantity < 0 or payload.reorder_level < 0: raise HTTPException(400, "Stock values cannot be negative")
    values = {"category_id": payload.category_id, "name": payload.name, "brand": payload.brand, "description": payload.description, "abv": payload.alcohol_percentage, "volume": payload.volume_ml, "price": payload.price, "image": payload.image_url}
    row = session.execute(text("""insert into products (category_id,name,brand,description,alcohol_percentage,volume_ml,price,image_url)
      values (:category_id,:name,:brand,:description,:abv,:volume,:price,:image) returning id"""), values).scalar_one()
    session.execute(text("insert into inventory (product_id,stock_quantity,reorder_level) values (:id,:stock,:level)"), {"id": row, "stock": payload.stock_quantity, "level": payload.reorder_level})
    session.commit()
    return product_by_id(session, row)

@app.put("/api/products/{product_id}", response_model=Product, dependencies=[Depends(require_admin)])
def edit_product(product_id: str, payload: ProductCreate, session: Session = Depends(db)):
    data = payload.model_dump(); data['id'] = product_id
    result = session.execute(text("""update products set category_id=:category_id,name=:name,brand=:brand,description=:description,
      alcohol_percentage=:alcohol_percentage,volume_ml=:volume_ml,price=:price,image_url=:image_url,updated_at=now() where id=:id"""), data)
    if result.rowcount == 0: raise HTTPException(404, "Product not found")
    session.execute(text("update inventory set stock_quantity=:stock,reorder_level=:level where product_id=:id"), {"stock": payload.stock_quantity, "level": payload.reorder_level, "id": product_id})
    session.commit(); return product_by_id(session, product_id)

@app.delete("/api/products/{product_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_product(product_id: str, session: Session = Depends(db)):
    result = session.execute(text("update products set is_active=false where id=:id"), {"id": product_id})
    if result.rowcount == 0: raise HTTPException(404, "Product not found")
    session.commit()

@app.get("/api/categories")
def categories(session: Session = Depends(db)):
    return [dict(row) for row in session.execute(text("select id::text,name,slug from categories order by name")).mappings()]

@app.patch("/api/inventory/{product_id}", response_model=Product, dependencies=[Depends(require_admin)])
def update_inventory(product_id: str, payload: StockUpdate, session: Session = Depends(db)):
    if payload.stock_quantity < 0 or (payload.reorder_level is not None and payload.reorder_level < 0): raise HTTPException(400, "Stock values cannot be negative")
    result = session.execute(text("update inventory set stock_quantity=:stock, reorder_level=coalesce(:level, reorder_level), updated_at=now() where product_id=:id"), {"stock": payload.stock_quantity, "level": payload.reorder_level, "id": product_id})
    if result.rowcount == 0: raise HTTPException(404, "Product inventory not found")
    session.commit()
    return product_by_id(session, product_id)

@app.get("/api/dashboard/summary")
def summary(session: Session = Depends(db)):
    row = session.execute(text("select count(p.id) as products, coalesce(sum(i.stock_quantity),0) as units, count(*) filter (where coalesce(i.stock_quantity,0) <= coalesce(i.reorder_level,10)) as low_stock from products p left join inventory i on i.product_id=p.id where p.is_active=true")).mappings().one()
    return dict(row)

@app.post("/api/users", status_code=201)
def create_user(payload: UserCreate, session: Session = Depends(db)):
    row = session.execute(text("insert into profiles(email,full_name,date_of_birth) values (:email,:full_name,:date_of_birth) on conflict(email) do update set full_name=excluded.full_name returning id::text,email,full_name,role"), payload.model_dump()).mappings().one()
    session.commit(); return dict(row)

@app.get("/api/cart/{user_id}")
def get_cart(user_id: str, session: Session = Depends(db)):
    rows = session.execute(text("""select ci.id::text,ci.product_id::text,ci.quantity,p.name,p.price,
      (ci.quantity*p.price) as line_total from carts c join cart_items ci on ci.cart_id=c.id join products p on p.id=ci.product_id where c.user_id=:user"""), {"user": user_id}).mappings()
    items = [dict(r) for r in rows]; return {"items": items, "total": sum((r['line_total'] for r in items), Decimal(0))}

@app.post("/api/cart/{user_id}/items")
def add_cart_item(user_id: str, payload: CartItemCreate, session: Session = Depends(db)):
    if payload.quantity < 1: raise HTTPException(400, "Quantity must be positive")
    stock = session.execute(text("select stock_quantity from inventory where product_id=:id"), {"id": payload.product_id}).scalar()
    current = session.execute(text("select coalesce(ci.quantity, 0) from carts c left join cart_items ci on ci.cart_id=c.id and ci.product_id=:product where c.user_id=:user"), {"product": payload.product_id, "user": user_id}).scalar() or 0
    if stock is None or stock < current + payload.quantity: raise HTTPException(400, "Insufficient stock")
    cart = session.execute(text("insert into carts(user_id) values(:user) on conflict(user_id) do update set user_id=excluded.user_id returning id"), {"user": user_id}).scalar_one()
    session.execute(text("insert into cart_items(cart_id,product_id,quantity) values(:cart,:product,:qty) on conflict(cart_id,product_id) do update set quantity=cart_items.quantity+excluded.quantity"), {"cart": cart, "product": payload.product_id, "qty": payload.quantity})
    session.commit(); return get_cart(user_id, session)

@app.delete("/api/cart/items/{item_id}", status_code=204)
def remove_cart_item(item_id: str, session: Session = Depends(db)):
    session.execute(text("delete from cart_items where id=:id"), {"id": item_id}); session.commit()

@app.post("/api/orders", status_code=201)
def create_order(payload: OrderCreate, session: Session = Depends(db)):
    items = session.execute(text("""select ci.product_id,ci.quantity,p.price from carts c join cart_items ci on ci.cart_id=c.id join products p on p.id=ci.product_id where c.user_id=:user"""), {"user": payload.user_id}).mappings().all()
    if not items: raise HTTPException(400, "Cart is empty")
    for i in items:
        updated = session.execute(text("update inventory set stock_quantity=stock_quantity-:qty,updated_at=now() where product_id=:product and stock_quantity >= :qty"), {"qty": i['quantity'], "product": i['product_id']})
        if updated.rowcount != 1:
            session.rollback()
            raise HTTPException(409, "One or more items are out of stock")
    total = sum((i['price'] * i['quantity'] for i in items), Decimal(0))
    order = session.execute(text("insert into orders(user_id,total_amount,delivery_address) values(:user,:total,:address) returning id::text"), {"user":payload.user_id,"total":total,"address":payload.delivery_address}).scalar_one()
    for i in items:
        session.execute(text("insert into order_items(order_id,product_id,quantity,price) values(:order,:product,:qty,:price)"), {"order":order,**dict(i)})
    session.execute(text("delete from cart_items where cart_id=(select id from carts where user_id=:user)"), {"user":payload.user_id}); session.commit()
    return {"id": order, "total_amount": total, "status": "pending"}

@app.get("/api/orders")
def orders(user_id: str | None = None, session: Session = Depends(db)):
    params = {}; where = ''
    if user_id: where = ' where o.user_id=:user'; params['user'] = user_id
    return [dict(r) for r in session.execute(text("select o.id::text,o.user_id::text,o.total_amount,o.status,o.payment_status,o.delivery_address,o.created_at from orders o" + where + " order by o.created_at desc"), params).mappings()]
