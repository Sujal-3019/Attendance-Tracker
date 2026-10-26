import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class LeaveType(TimestampMixin, Base):
    __tablename__ = "leave_types"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_leave_type_org_code"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    description: Mapped[str] = mapped_column(String(200), nullable=False)
    annual_allocation: Mapped[int] = mapped_column(Integer, nullable=False)
    paid: Mapped[bool] = mapped_column(Boolean, nullable=False)
    carry_forward: Mapped[bool] = mapped_column(Boolean, nullable=False)
    max_consecutive_days: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class LeaveRequest(TimestampMixin, Base):
    __tablename__ = "leave_requests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    requested_days: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Pending", index=True, nullable=False)
    decision_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )
    decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    decision_reason: Mapped[str | None] = mapped_column(Text)


class LeaveBalance(TimestampMixin, Base):
    __tablename__ = "leave_balances"
    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "balance_year", name="uq_leave_balance_year"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    balance_year: Mapped[int] = mapped_column(Integer, nullable=False)
    allocated_days: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
    used_days: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0"), nullable=False)
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)


class LeaveLedgerEntry(TimestampMixin, Base):
    __tablename__ = "leave_ledger_entries"
    __table_args__ = (
        UniqueConstraint("leave_request_id", "entry_type", name="uq_leave_ledger_request_type"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    leave_type_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("leave_types.id", ondelete="RESTRICT"), nullable=False
    )
    leave_request_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("leave_requests.id", ondelete="RESTRICT"), nullable=False
    )
    entry_type: Mapped[str] = mapped_column(String(20), nullable=False)
    days: Mapped[Decimal] = mapped_column(Numeric(6, 2), nullable=False)
