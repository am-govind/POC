from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..schemas import Product

PRODUCT_SELECT = """
  select p.id::text, p.name, p.brand, c.name as category, c.slug as category_slug,
         p.description, p.image_url, p.price, p.mrp, p.country_of_origin,
         coalesce(p.highlights, '{}') as highlights, p.sku,
         p.alcohol_percentage, p.volume_ml, p.is_active,
         coalesce(i.stock_quantity, 0) as stock_quantity,
         coalesce(i.reorder_level, 10) as reorder_level
  from products p
  left join categories c on c.id = p.category_id
  left join inventory i on i.product_id = p.id
"""


def inventory_status(stock: int, reorder: int) -> str:
    if stock <= 0:
        return "out_of_stock"
    if stock <= reorder:
        return "low_stock"
    return "in_stock"


def _load_images(session: Session, product_id: str) -> list[str]:
    rows = session.execute(
        text(
            "select url from product_images where product_id=:id "
            "order by is_primary desc, sort_order asc"
        ),
        {"id": product_id},
    ).scalars().all()
    return list(rows)


def product_from_row(row, images: list[str] | None = None) -> Product:
    data = dict(row)
    if images is not None:
        data["images"] = images
    else:
        data["images"] = [data["image_url"]] if data.get("image_url") else []
    highlights = data.get("highlights") or []
    data["highlights"] = list(highlights) if highlights else []
    return Product(**data)


def product_query_base(active_only: bool = True) -> str:
    query = PRODUCT_SELECT + " where 1=1"
    if active_only:
        query += " and p.is_active = true"
    return query


def sync_product_images(session: Session, product_id: str, images: list[str], primary: str | None):
    session.execute(
        text("delete from product_images where product_id=:id"),
        {"id": product_id},
    )
    urls = [u for u in images if u]
    if primary and primary not in urls:
        urls.insert(0, primary)
    if not urls and primary:
        urls = [primary]
    for i, url in enumerate(urls):
        session.execute(
            text(
                "insert into product_images (product_id, url, sort_order, is_primary) "
                "values (:pid, :url, :ord, :primary)"
            ),
            {"pid": product_id, "url": url, "ord": i, "primary": i == 0},
        )
    if urls:
        session.execute(
            text("update products set image_url=:url where id=:id"),
            {"url": urls[0], "id": product_id},
        )


def get_product(session: Session, product_id: str, active_only: bool = True) -> Product:
    query = product_query_base(active_only) + " and p.id = :id"
    row = session.execute(text(query), {"id": product_id}).mappings().first()
    if not row:
        raise HTTPException(404, "Product not found")
    images = _load_images(session, product_id)
    if not images and row.get("image_url"):
        images = [row["image_url"]]
    return product_from_row(row, images)


def list_products(
    session: Session,
    *,
    search: str | None = None,
    category: str | None = None,
    low_stock: bool = False,
    sort: str = "name",
    page: int = 1,
    limit: int = 24,
    active_only: bool = True,
):
    conditions = []
    params: dict = {}
    if search:
        conditions.append(
            "(lower(p.name) like lower(:search) or lower(p.brand) like lower(:search))"
        )
        params["search"] = f"%{search}%"
    if category:
        conditions.append("lower(c.slug) = lower(:category)")
        params["category"] = category
    if low_stock:
        conditions.append(
            "coalesce(i.stock_quantity, 0) <= coalesce(i.reorder_level, 10)"
        )

    where = product_query_base(active_only)
    if conditions:
        where += " and " + " and ".join(conditions)

    sort_map = {
        "name": "p.name asc",
        "price_asc": "p.price asc",
        "price_desc": "p.price desc",
        "stock": "coalesce(i.stock_quantity, 0) asc",
    }
    order_by = sort_map.get(sort, sort_map["name"])

    count_sql = f"select count(*) from ({where}) sub"
    total = session.execute(text(count_sql), params).scalar_one()

    offset = (page - 1) * limit
    params["limit"] = limit
    params["offset"] = offset
    list_sql = f"{where} order by {order_by} limit :limit offset :offset"
    rows = session.execute(text(list_sql), params).mappings().all()
    items = [product_from_row(r) for r in rows]
    pages = max(1, (total + limit - 1) // limit)
    return items, total, pages
