from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class Product(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    brand: str
    category: str | None = None
    category_slug: str | None = None
    description: str = ""
    image_url: str | None = None
    images: list[str] = []
    price: Decimal
    mrp: Decimal | None = None
    country_of_origin: str | None = None
    highlights: list[str] = []
    sku: str | None = None
    alcohol_percentage: Decimal
    volume_ml: int
    stock_quantity: int
    reorder_level: int
    is_active: bool = True


class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    limit: int
    pages: int


class StockUpdate(BaseModel):
    stock_quantity: int | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)


class StockAdjust(BaseModel):
    delta: int
    reason: str = Field(min_length=1, max_length=200)


class BulkRestock(BaseModel):
    product_ids: list[str] = Field(min_length=1)
    delta: int = Field(gt=0)
    reason: str = Field(min_length=1, max_length=200)


class ProductCreate(BaseModel):
    name: str
    brand: str
    category_id: str | None = None
    description: str = ""
    alcohol_percentage: Decimal
    volume_ml: int = Field(gt=0)
    price: Decimal = Field(ge=0)
    mrp: Decimal | None = None
    image_url: str | None = None
    images: list[str] = []
    country_of_origin: str | None = None
    highlights: list[str] = []
    sku: str | None = None
    stock_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)


class RegisterRequest(BaseModel):
    email: str
    full_name: str = ""
    date_of_birth: date | None = None
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdate(BaseModel):
    date_of_birth: date
    full_name: str | None = None


class CartItemCreate(BaseModel):
    product_id: str
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class OrderCreate(BaseModel):
    delivery_address: str = Field(min_length=5)


class OrderStatusUpdate(BaseModel):
    status: str


class InventoryRow(BaseModel):
    id: str
    name: str
    brand: str
    category: str | None = None
    category_slug: str | None = None
    stock_quantity: int
    reorder_level: int
    price: Decimal
    updated_at: str | None = None
    status: str
