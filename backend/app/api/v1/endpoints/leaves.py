from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.auth_deps import get_current_user, require_roles
from app.api.deps import get_db
from app.models.user import User
from app.schemas.common import ApiSchema
from app.schemas.leave import LeaveApply, LeaveDecision, LeaveTypeCreate, LeaveTypeUpdate
from app.services import leaves as leave_service


router = APIRouter(tags=["leaves"])
AdminUser = Annotated[User, Depends(require_roles("admin"))]
AuthenticatedUser = Annotated[User, Depends(get_current_user)]


class LeaveTypeStatusUpdate(ApiSchema):
    status: Literal["Active", "Inactive"]


@router.get("/leaves/requests")
def get_requests(
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
    status_filter: str | None = Query(None, alias="status", pattern="^(Pending|Approved|Rejected)$"),
    search: str | None = Query(None, max_length=100),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
) -> dict:
    return leave_service.list_requests(
        db,
        user.organization_id,
        page=page,
        page_size=page_size,
        status_filter=status_filter,
        search=search,
    )


@router.get("/leaves/summary")
def get_leave_summary(user: AdminUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    return leave_service.leave_stats(db, user.organization_id)


@router.get("/leaves/balances")
def get_leave_balances(user: AdminUser, db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    return leave_service.get_all_balances(db, user.organization_id)


@router.get("/leaves/requests/{request_id}")
def get_request(
    request_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.get_request(db, user.organization_id, request_id)


@router.post("/leaves/requests/{request_id}/approve")
def approve_request(
    request_id: UUID,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.decide_request(
        db, user.organization_id, request_id, user, approve=True, reason=None
    )


@router.post("/leaves/requests/{request_id}/reject")
def reject_request(
    request_id: UUID,
    payload: LeaveDecision,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.decide_request(
        db, user.organization_id, request_id, user, approve=False, reason=payload.rejection_reason
    )


@router.get("/leave-types")
def get_leave_types(
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
) -> list[dict]:
    return leave_service.list_types(db, user.organization_id)


@router.get("/leave-types/{type_id}")
def get_leave_type(
    type_id: UUID,
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.get_type(db, user.organization_id, type_id)


@router.post("/leave-types", status_code=status.HTTP_201_CREATED)
def create_leave_type(
    payload: LeaveTypeCreate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.create_type(db, user.organization_id, payload)


@router.patch("/leave-types/{type_id}")
def update_leave_type(
    type_id: UUID,
    payload: LeaveTypeUpdate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.update_type(db, user.organization_id, type_id, payload)


@router.patch("/leave-types/{type_id}/status")
def update_leave_type_status(
    type_id: UUID,
    payload: LeaveTypeStatusUpdate,
    user: AdminUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.update_type_status(
        db, user.organization_id, type_id, payload.status == "Active"
    )


@router.get("/me/leaves")
def get_my_leaves(user: AuthenticatedUser, db: Annotated[Session, Depends(get_db)]) -> dict:
    return leave_service.my_requests(db, user)


@router.post("/me/leaves", status_code=status.HTTP_201_CREATED)
def apply_for_leave(
    payload: LeaveApply,
    user: AuthenticatedUser,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    return leave_service.create_request(db, user, payload)
