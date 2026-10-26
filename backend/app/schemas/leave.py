from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import AliasChoices, EmailStr, Field

from app.schemas.common import ApiSchema


class LeaveTypeCreate(ApiSchema):
    name: str = Field(min_length=2, max_length=50)
    code: str = Field(min_length=2, max_length=10, pattern="^[A-Za-z0-9_-]+$")
    description: str = Field(min_length=5, max_length=200)
    annual_allocation: int = Field(ge=0, le=365)
    paid: bool
    carry_forward: bool
    max_consecutive_days: int = Field(ge=1, le=365)


class LeaveTypeUpdate(ApiSchema):
    name: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = Field(default=None, min_length=5, max_length=200)
    annual_allocation: int | None = Field(default=None, ge=0, le=365)
    paid: bool | None = None
    carry_forward: bool | None = None
    max_consecutive_days: int | None = Field(default=None, ge=1, le=365)


class LeaveApply(ApiSchema):
    leave_type: str = Field(
        validation_alias=AliasChoices("type", "leaveType", "leave_type"),
        min_length=1,
        max_length=50,
    )
    start_date: date
    end_date: date
    reason: str = Field(min_length=5, max_length=1000)


class LeaveDecision(ApiSchema):
    rejection_reason: str | None = Field(
        default=None,
        validation_alias=AliasChoices("rejectionReason", "rejection_reason", "reason"),
        max_length=1000,
    )


class LeaveTypePublic(ApiSchema):
    id: UUID
    name: str
    code: str
    description: str
    annual_allocation: int
    paid: bool
    carry_forward: bool
    max_consecutive_days: int
    status: str


class LeaveRequestPublic(ApiSchema):
    id: UUID
    employee_id: UUID
    employee_name: str
    employee_email: EmailStr
    department: str
    leave_type: str
    start_date: date
    end_date: date
    days: Decimal
    reason: str
    status: str
    applied_on: date
    reviewed_on: datetime | None
    reviewed_by: str | None
    rejection_reason: str | None
