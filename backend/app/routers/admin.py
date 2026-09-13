from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..deps import get_db, require_admin
from ..schemas import BulkRestock, InventoryRow, StockAdjust, StockUpdate
from ..services.products import get_product, inventory_status, product_query_base

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard/summary")
def summary(session: Session = Depends(get_db), _admin=Depends(require_admin)):
    row = session.execute(
        text(
            "select count(p.id) as products, coalesce(sum(i.stock_quantity),0) as units, "
            "count(*) filter (where coalesce(i.stock_quantity,0) <= coalesce(i.reorder_level,10)) "
            "as low_stock from products p left join inventory i on i.product_id=p.id "
            "where p.is_active=true"
        )
    ).mappings().one()
    return dict(row)


@router.get("/dashboard/low-stock")
def low_stock_items(session: Session = Depends(get_db), _admin=Depends(require_admin)):
    rows = session.execute(
        text(
            """select p.id::text,p.name,p.brand,c.name as category,
            coalesce(i.stock_quantity,0) as stock_quantity,
            coalesce(i.reorder_level,10) as reorder_level
            from products p
            left join categories c on c.id=p.category_id
            left join inventory i on i.product_id=p.id
            where p.is_active=true
            and coalesce(i.stock_quantity,0) <= coalesce(i.reorder_level,10)
            order by coalesce(i.stock_quantity,0) asc limit 5"""
        )
    ).mappings()
    return [dict(r) for r in rows]


@router.get("/inventory", response_model=list[InventoryRow])
def list_inventory(
    search: str | None = None,
    category: str | None = None,
    status: str | None = None,
    sort: str = "name",
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    conditions = ["p.is_active = true"]
    params: dict = {}
    if search:
        conditions.append(
            "(lower(p.name) like lower(:search) or lower(p.brand) like lower(:search))"
        )
        params["search"] = f"%{search}%"
    if category:
        conditions.append("lower(c.slug) = lower(:category)")
        params["category"] = category
    if status == "out_of_stock":
        conditions.append("coalesce(i.stock_quantity,0) = 0")
    elif status == "low_stock":
        conditions.append(
            "coalesce(i.stock_quantity,0) > 0 and "
            "coalesce(i.stock_quantity,0) <= coalesce(i.reorder_level,10)"
        )
    elif status == "in_stock":
        conditions.append(
            "coalesce(i.stock_quantity,0) > coalesce(i.reorder_level,10)"
        )

    sort_map = {
        "name": "p.name asc",
        "stock": "coalesce(i.stock_quantity,0) asc",
        "updated_at": "i.updated_at desc",
    }
    order_by = sort_map.get(sort, sort_map["name"])
    where = " and ".join(conditions)
    query = f"""
      select p.id::text,p.name,p.brand,c.name as category,c.slug as category_slug,
             coalesce(i.stock_quantity,0) as stock_quantity,
             coalesce(i.reorder_level,10) as reorder_level,p.price,
             i.updated_at::text as updated_at
      from products p
      left join categories c on c.id=p.category_id
      left join inventory i on i.product_id=p.id
      where {where}
      order by {order_by}
    """
    rows = session.execute(text(query), params).mappings().all()
    result = []
    for row in rows:
        data = dict(row)
        data["status"] = inventory_status(
            data["stock_quantity"], data["reorder_level"]
        )
        result.append(InventoryRow(**data))
    return result


@router.patch("/inventory/{product_id}")
def update_inventory(
    product_id: str,
    payload: StockUpdate,
    session: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    if payload.stock_quantity is None and payload.reorder_level is None:
        raise HTTPException(400, "Provide stock_quantity or reorder_level")
    current = session.execute(
        text("select stock_quantity from inventory where product_id=:id"),
        {"id": product_id},
    ).scalar()
    if current is None:
        raise HTTPException(404, "Product inventory not found")
    new_stock = payload.stock_quantity if payload.stock_quantity is not None else current
    session.execute(
        text(
            "update inventory set stock_quantity=:stock, "
            "reorder_level=coalesce(:level, reorder_level), updated_at=now() "
            "where product_id=:id"
        ),
        {"stock": new_stock, "level": payload.reorder_level, "id": product_id},
    )
    if payload.stock_quantity is not None and payload.stock_quantity != current:
        session.execute(
            text(
                """insert into inventory_adjustments
                (product_id,admin_id,delta,quantity_before,quantity_after,reason)
                values (:product,:admin,:delta,:before,:after,:reason)"""
            ),
            {
                "product": product_id,
                "admin": admin["sub"],
                "delta": payload.stock_quantity - current,
                "before": current,
                "after": payload.stock_quantity,
                "reason": "manual_set",
            },
        )
    session.commit()
    return get_product(session, product_id, active_only=False)


@router.post("/inventory/{product_id}/adjust")
def adjust_inventory(
    product_id: str,
    payload: StockAdjust,
    session: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    current = session.execute(
        text("select stock_quantity from inventory where product_id=:id"),
        {"id": product_id},
    ).scalar()
    if current is None:
        raise HTTPException(404, "Product inventory not found")
    new_stock = current + payload.delta
    if new_stock < 0:
        raise HTTPException(400, "Stock cannot go below zero")
    session.execute(
        text(
            "update inventory set stock_quantity=:stock, updated_at=now() where product_id=:id"
        ),
        {"stock": new_stock, "id": product_id},
    )
    session.execute(
        text(
            """insert into inventory_adjustments
            (product_id,admin_id,delta,quantity_before,quantity_after,reason)
            values (:product,:admin,:delta,:before,:after,:reason)"""
        ),
        {
            "product": product_id,
            "admin": admin["sub"],
            "delta": payload.delta,
            "before": current,
            "after": new_stock,
            "reason": payload.reason,
        },
    )
    session.commit()
    return get_product(session, product_id, active_only=False)


@router.post("/inventory/bulk-restock")
def bulk_restock(
    payload: BulkRestock,
    session: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    updated = []
    for product_id in payload.product_ids:
        current = session.execute(
            text("select stock_quantity from inventory where product_id=:id"),
            {"id": product_id},
        ).scalar()
        if current is None:
            continue
        new_stock = current + payload.delta
        session.execute(
            text(
                "update inventory set stock_quantity=:stock, updated_at=now() "
                "where product_id=:id"
            ),
            {"stock": new_stock, "id": product_id},
        )
        session.execute(
            text(
                """insert into inventory_adjustments
                (product_id,admin_id,delta,quantity_before,quantity_after,reason)
                values (:product,:admin,:delta,:before,:after,:reason)"""
            ),
            {
                "product": product_id,
                "admin": admin["sub"],
                "delta": payload.delta,
                "before": current,
                "after": new_stock,
                "reason": payload.reason,
            },
        )
        updated.append(product_id)
    session.commit()
    return {"updated": updated, "count": len(updated)}


@router.get("/inventory/{product_id}/history")
def inventory_history(
    product_id: str,
    page: int = 1,
    limit: int = 20,
    session: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    page = max(1, page)
    limit = min(max(1, limit), 100)
    offset = (page - 1) * limit
    rows = session.execute(
        text(
            """select a.id::text,a.delta,a.quantity_before,a.quantity_after,a.reason,
            a.created_at::text,p.email as admin_email
            from inventory_adjustments a
            join profiles p on p.id=a.admin_id
            where a.product_id=:product
            order by a.created_at desc limit :limit offset :offset"""
        ),
        {"product": product_id, "limit": limit, "offset": offset},
    ).mappings()
    return [dict(r) for r in rows]
