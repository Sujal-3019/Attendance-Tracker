import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import TimestampMixin


class SalaryAdvance(TimestampMixin, Base):
    __tablename__ = "salary_advances"
    __table_args__ = (
        CheckConstraint("original_amount > 0", name="ck_advance_amount_positive"),
        CheckConstraint("monthly_deduction > 0", name="ck_advance_deduction_positive"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    original_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    monthly_deduction: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    start_month: Mapped[date] = mapped_column(Date, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Active", nullable=False)


class AdvanceRepayment(TimestampMixin, Base):
    __tablename__ = "advance_repayments"
    __table_args__ = (
        CheckConstraint("amount > 0", name="ck_advance_repayment_positive"),
        UniqueConstraint("idempotency_key", name="uq_advance_repayment_idempotency"),
        UniqueConstraint("advance_id", "payroll_period", name="uq_advance_repayment_payroll_period"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    advance_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("salary_advances.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    method: Mapped[str] = mapped_column(String(30), nullable=False)
    note: Mapped[str] = mapped_column(Text, default="", nullable=False)
    idempotency_key: Mapped[str | None] = mapped_column(String(100))
    payroll_period: Mapped[str | None] = mapped_column(String(7))


class PayrollSnapshot(TimestampMixin, Base):
    __tablename__ = "payroll_snapshots"
    __table_args__ = (
        UniqueConstraint("employee_id", "period", name="uq_payroll_employee_period"),
        CheckConstraint("gross_amount >= 0", name="ck_payroll_gross_nonnegative"),
        CheckConstraint("net_amount >= 0", name="ck_payroll_net_nonnegative"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    period: Mapped[str] = mapped_column(String(7), nullable=False)
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_deductions: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    net_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    calculation_snapshot: Mapped[dict] = mapped_column(JSON, nullable=False)
    finalized_by: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    finalized_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class OvertimeRequest(TimestampMixin, Base):
    __tablename__ = "overtime_requests"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    employee_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("employees.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    attendance_date: Mapped[date] = mapped_column(Date, nullable=False)
    hours: Mapped[Decimal] = mapped_column(Numeric(6, 2), default=Decimal("0"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="Pending", index=True, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    reviewer_user_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT")
    )
    review_note: Mapped[str | None] = mapped_column(Text)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    hourly_rate: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    multiplier: Mapped[Decimal | None] = mapped_column(Numeric(5, 2))
    calculated_pay: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))


class Notification(TimestampMixin, Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("organizations.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="RESTRICT"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
