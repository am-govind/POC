from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..deps import get_db, require_user
from ..schemas import CartItemCreate, CartItemUpdate

router = APIRouter(prefix="/api/cart", tags=["cart"])


def _get_cart(session: Session, user_id: str):
    rows = session.execute(
        text(
            """select ci.id::text,ci.product_id::text,ci.quantity,p.name,p.price,p.image_url,
            (ci.quantity*p.price) as line_total
            from carts c join cart_items ci on ci.cart_id=c.id
            join products p on p.id=ci.product_id
            where c.user_id=:user"""
        ),
        {"user": user_id},
    ).mappings()
    items = [dict(r) for r in rows]
    return {
        "items": items,
        "total": sum((r["line_total"] for r in items), Decimal(0)),
    }


@router.get("")
def get_cart(user=Depends(require_user), session: Session = Depends(get_db)):
    return _get_cart(session, user["sub"])


@router.post("/items")
def add_cart_item(
    payload: CartItemCreate,
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    if payload.quantity < 1:
        raise HTTPException(400, "Quantity must be positive")
    user_id = user["sub"]
    stock = session.execute(
        text("select stock_quantity from inventory where product_id=:id"),
        {"id": payload.product_id},
    ).scalar()
    current = (
        session.execute(
            text(
                "select coalesce(ci.quantity, 0) from carts c "
                "left join cart_items ci on ci.cart_id=c.id and ci.product_id=:product "
                "where c.user_id=:user"
            ),
            {"product": payload.product_id, "user": user_id},
        ).scalar()
        or 0
    )
    if stock is None or stock < current + payload.quantity:
        raise HTTPException(400, "Insufficient stock")
    cart = session.execute(
        text(
            "insert into carts(user_id) values(:user) "
            "on conflict(user_id) do update set user_id=excluded.user_id returning id"
        ),
        {"user": user_id},
    ).scalar_one()
    session.execute(
        text(
            "insert into cart_items(cart_id,product_id,quantity) values(:cart,:product,:qty) "
            "on conflict(cart_id,product_id) do update set "
            "quantity=cart_items.quantity+excluded.quantity"
        ),
        {"cart": cart, "product": payload.product_id, "qty": payload.quantity},
    )
    session.commit()
    return _get_cart(session, user_id)


@router.patch("/items/{item_id}")
def update_cart_item(
    item_id: str,
    payload: CartItemUpdate,
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    user_id = user["sub"]
    row = session.execute(
        text(
            "select ci.product_id, ci.quantity from cart_items ci "
            "join carts c on c.id=ci.cart_id where ci.id=:id and c.user_id=:user"
        ),
        {"id": item_id, "user": user_id},
    ).mappings().first()
    if not row:
        raise HTTPException(404, "Cart item not found")
    stock = session.execute(
        text("select stock_quantity from inventory where product_id=:id"),
        {"id": row["product_id"]},
    ).scalar()
    if stock is None or stock < payload.quantity:
        raise HTTPException(400, "Insufficient stock")
    session.execute(
        text("update cart_items set quantity=:qty where id=:id"),
        {"qty": payload.quantity, "id": item_id},
    )
    session.commit()
    return _get_cart(session, user_id)


@router.delete("/items/{item_id}", status_code=204)
def remove_cart_item(
    item_id: str,
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    result = session.execute(
        text(
            "delete from cart_items ci using carts c "
            "where ci.cart_id=c.id and ci.id=:id and c.user_id=:user"
        ),
        {"id": item_id, "user": user["sub"]},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Cart item not found")
    session.commit()
