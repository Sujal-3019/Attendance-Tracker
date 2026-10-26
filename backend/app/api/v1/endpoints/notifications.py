from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user
from app.api.deps import get_db
from app.models.payroll import Notification
from app.models.user import User


router = APIRouter(prefix="/notifications", tags=["notifications"])
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("")
def list_notifications(
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
) -> dict:
    statement = select(Notification).where(
        Notification.organization_id == user.organization_id,
        Notification.user_id == user.id,
    )
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    rows = db.scalars(
        statement.order_by(Notification.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()
    return {
        "items": [
            {
                "id": item.id,
                "title": item.title,
                "message": item.message,
                "category": item.category,
                "createdAt": item.created_at,
                "read": item.read_at is not None,
            }
            for item in rows
        ],
        "total": total,
        "page": page,
        "pageSize": page_size,
    }


@router.get("/unread-count")
def unread_count(user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    count = db.scalar(
        select(func.count(Notification.id)).where(
            Notification.organization_id == user.organization_id,
            Notification.user_id == user.id,
            Notification.read_at.is_(None),
        )
    ) or 0
    return {"count": count}


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: UUID,
    user: CurrentUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    item = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.organization_id == user.organization_id,
            Notification.user_id == user.id,
        )
    )
    if item is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    item.read_at = item.read_at or datetime.now(UTC)
    db.commit()
    return {"id": item.id, "read": True}


@router.patch("/read-all")
def mark_all_read(user: CurrentUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    result = db.execute(
        update(Notification)
        .where(
            Notification.organization_id == user.organization_id,
            Notification.user_id == user.id,
            Notification.read_at.is_(None),
        )
        .values(read_at=datetime.now(UTC))
    )
    db.commit()
    return {"updated": result.rowcount or 0}
