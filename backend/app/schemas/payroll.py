from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import AliasChoices, Field

from app.schemas.common import ApiSchema


class SalaryAdvanceCreate(ApiSchema):
    employee_id: UUID
    original_amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    monthly_deduction: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    start_month: str = Field(pattern="^\\d{4}-(0[1-9]|1[0-2])$")
    reason: str = Field(min_length=5, max_length=1000)


class AdvanceRepaymentCreate(ApiSchema):
    amount: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    payment_date: date | None = Field(
        default=None,
        validation_alias=AliasChoices("date", "paymentDate", "payment_date"),
    )
    method: Literal["Direct repayment", "Payroll deduction"]
    note: str = Field(default="", max_length=1000)


class AdvanceRepaymentRule(ApiSchema):
    monthly_deduction: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    start_month: str = Field(pattern="^\\d{4}-(0[1-9]|1[0-2])$")


class OvertimeDecision(ApiSchema):
    overtime_hours: Decimal | None = Field(default=None, gt=0, le=24)
    review_note: str = Field(min_length=2, max_length=1000)


class TaxRegimeUpdate(ApiSchema):
    tax_regime: Literal["old", "new"]
