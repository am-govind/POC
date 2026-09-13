from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..deps import get_db, require_admin
from ..schemas import Product, ProductCreate, ProductListResponse
from ..services.products import get_product, list_products, sync_product_images

router = APIRouter(prefix="/api", tags=["products"])


@router.get("/products", response_model=ProductListResponse)
def products(
    search: str | None = None,
    category: str | None = None,
    low_stock: bool = False,
    sort: str = "name",
    page: int = 1,
    limit: int = 24,
    session: Session = Depends(get_db),
):
    page = max(1, page)
    limit = min(max(1, limit), 100)
    items, total, pages = list_products(
        session,
        search=search,
        category=category,
        low_stock=low_stock,
        sort=sort,
        page=page,
        limit=limit,
    )
    return ProductListResponse(
        items=items, total=total, page=page, limit=limit, pages=pages
    )


@router.get("/products/{product_id}", response_model=Product)
def get_product_by_id(product_id: str, session: Session = Depends(get_db)):
    return get_product(session, product_id)


@router.post("/products", response_model=Product, status_code=201)
def create_product(
    payload: ProductCreate,
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    primary = payload.image_url or (payload.images[0] if payload.images else None)
    row = session.execute(
        text(
            """insert into products
            (category_id,name,brand,description,alcohol_percentage,volume_ml,price,mrp,
             image_url,country_of_origin,highlights,sku)
            values (:category_id,:name,:brand,:description,:alcohol_percentage,:volume_ml,
             :price,:mrp,:image_url,:country_of_origin,:highlights,:sku)
            returning id"""
        ),
        {
            "category_id": payload.category_id,
            "name": payload.name,
            "brand": payload.brand,
            "description": payload.description,
            "alcohol_percentage": payload.alcohol_percentage,
            "volume_ml": payload.volume_ml,
            "price": payload.price,
            "mrp": payload.mrp or payload.price,
            "image_url": primary,
            "country_of_origin": payload.country_of_origin,
            "highlights": payload.highlights or [],
            "sku": payload.sku,
        },
    ).scalar_one()
    pid = str(row)
    session.execute(
        text(
            "insert into inventory (product_id,stock_quantity,reorder_level) "
            "values (:id,:stock,:level)"
        ),
        {"id": row, "stock": payload.stock_quantity, "level": payload.reorder_level},
    )
    sync_product_images(session, pid, payload.images, primary)
    session.commit()
    return get_product(session, pid, active_only=False)


@router.put("/products/{product_id}", response_model=Product)
def edit_product(
    product_id: str,
    payload: ProductCreate,
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    primary = payload.image_url or (payload.images[0] if payload.images else None)
    result = session.execute(
        text(
            """update products set category_id=:category_id,name=:name,brand=:brand,
            description=:description,alcohol_percentage=:alcohol_percentage,
            volume_ml=:volume_ml,price=:price,mrp=:mrp,image_url=:image_url,
            country_of_origin=:country_of_origin,highlights=:highlights,sku=:sku,
            updated_at=now() where id=:id"""
        ),
        {
            "id": product_id,
            "category_id": payload.category_id,
            "name": payload.name,
            "brand": payload.brand,
            "description": payload.description,
            "alcohol_percentage": payload.alcohol_percentage,
            "volume_ml": payload.volume_ml,
            "price": payload.price,
            "mrp": payload.mrp or payload.price,
            "image_url": primary,
            "country_of_origin": payload.country_of_origin,
            "highlights": payload.highlights or [],
            "sku": payload.sku,
        },
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Product not found")
    session.execute(
        text(
            "update inventory set stock_quantity=:stock_quantity,"
            "reorder_level=:reorder_level where product_id=:id"
        ),
        {
            "stock_quantity": payload.stock_quantity,
            "reorder_level": payload.reorder_level,
            "id": product_id,
        },
    )
    sync_product_images(session, product_id, payload.images, primary)
    session.commit()
    return get_product(session, product_id, active_only=False)


@router.delete("/products/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    result = session.execute(
        text("update products set is_active=false where id=:id"),
        {"id": product_id},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Product not found")
    session.commit()


@router.get("/categories")
def categories(session: Session = Depends(get_db)):
    return [
        dict(row)
        for row in session.execute(
            text("select id::text,name,slug from categories order by name")
        ).mappings()
    ]
