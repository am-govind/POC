from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from ..config import MIN_AGE_YEARS
from ..deps import get_db, require_admin, require_user
from ..schemas import OrderCreate, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["orders"])

VALID_STATUSES = {
    "pending",
    "confirmed",
    "packed",
    "shipped",
    "delivered",
    "cancelled",
}


def _check_age(session: Session, user_id: str):
    dob = session.execute(
        text("select date_of_birth from profiles where id=:id"),
        {"id": user_id},
    ).scalar()
    if not dob:
        raise HTTPException(400, "Date of birth required before checkout")
    today = date.today()
    age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if age < MIN_AGE_YEARS:
        raise HTTPException(403, f"You must be at least {MIN_AGE_YEARS} years old to order")


@router.post("", status_code=201)
def create_order(
    payload: OrderCreate,
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    user_id = user["sub"]
    _check_age(session, user_id)
    items = session.execute(
        text(
            """select ci.product_id,ci.quantity,p.price from carts c
            join cart_items ci on ci.cart_id=c.id
            join products p on p.id=ci.product_id where c.user_id=:user"""
        ),
        {"user": user_id},
    ).mappings().all()
    if not items:
        raise HTTPException(400, "Cart is empty")
    for item in items:
        updated = session.execute(
            text(
                "update inventory set stock_quantity=stock_quantity-:qty,updated_at=now() "
                "where product_id=:product and stock_quantity >= :qty"
            ),
            {"qty": item["quantity"], "product": item["product_id"]},
        )
        if updated.rowcount != 1:
            session.rollback()
            raise HTTPException(409, "One or more items are out of stock")
    total = sum((i["price"] * i["quantity"] for i in items), Decimal(0))
    order = session.execute(
        text(
            "insert into orders(user_id,total_amount,delivery_address) "
            "values(:user,:total,:address) returning id::text"
        ),
        {"user": user_id, "total": total, "address": payload.delivery_address},
    ).scalar_one()
    for item in items:
        session.execute(
            text(
                "insert into order_items(order_id,product_id,quantity,price) "
                "values(:order,:product,:qty,:price)"
            ),
                {
                    "order": order,
                    "product": item["product_id"],
                    "qty": item["quantity"],
                    "price": item["price"],
                },
        )
    session.execute(
        text(
            "delete from cart_items where cart_id=(select id from carts where user_id=:user)"
        ),
        {"user": user_id},
    )
    session.commit()
    return {"id": order, "total_amount": total, "status": "pending"}


@router.get("")
def list_orders(
    user=Depends(require_user),
    session: Session = Depends(get_db),
):
    if user.get("role") == "admin":
        query = """
          select o.id::text,o.user_id::text,o.total_amount,o.status,o.payment_status,
          o.delivery_address,o.created_at,p.email as customer_email
          from orders o join profiles p on p.id=o.user_id
          order by o.created_at desc
        """
        return [dict(r) for r in session.execute(text(query)).mappings()]
    return [
        dict(r)
        for r in session.execute(
            text(
                "select o.id::text,o.user_id::text,o.total_amount,o.status,o.payment_status,"
                "o.delivery_address,o.created_at from orders o "
                "where o.user_id=:user order by o.created_at desc"
            ),
            {"user": user["sub"]},
        ).mappings()
    ]


@router.patch("/{order_id}/status")
def update_order_status(
    order_id: str,
    payload: OrderStatusUpdate,
    _admin=Depends(require_admin),
    session: Session = Depends(get_db),
):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(400, f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}")
    result = session.execute(
        text("update orders set status=:status where id=:id"),
        {"status": payload.status, "id": order_id},
    )
    if result.rowcount == 0:
        raise HTTPException(404, "Order not found")
    session.commit()
    row = session.execute(
        text(
            "select id::text,status,payment_status,total_amount,delivery_address "
            "from orders where id=:id"
        ),
        {"id": order_id},
    ).mappings().one()
    return dict(row)
