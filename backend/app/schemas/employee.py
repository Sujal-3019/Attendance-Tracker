from datetime import date
from decimal import Decimal
from uuid import UUID

from pydantic import ConfigDict, EmailStr, Field, model_validator

from app.schemas.common import ApiSchema


class EmployeeLeaveAllocation(ApiSchema):
    leave_type_id: UUID
    allocated_days: Decimal = Field(ge=0, le=365, max_digits=6, decimal_places=2)


class EmployeeCreate(ApiSchema):
    employee_code: str = Field(min_length=3, max_length=30)
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str = Field(min_length=10, max_length=20)
    department: str = Field(min_length=1, max_length=100)
    designation: str = Field(min_length=2, max_length=100)
    manager: str = Field(default="", max_length=100)
    employment_type: str = Field(min_length=1, max_length=30)
    work_mode: str = Field(min_length=1, max_length=30)
    location: str = Field(min_length=1, max_length=100)
    joining_date: date
    status: str = Field(default="Active", pattern="^(Active|Inactive)$")
    wage_model: str = Field(default="Monthly", pattern="^(Monthly|Daily|Hourly)$")
    base_wage: Decimal = Field(default=Decimal("0"), ge=0, max_digits=12, decimal_places=2)
    leave_allocations: list[EmployeeLeaveAllocation] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def validate_unique_leave_types(self):
        leave_type_ids = [item.leave_type_id for item in self.leave_allocations]
        if len(leave_type_ids) != len(set(leave_type_ids)):
            raise ValueError("Leave allocation types must be unique")
        return self


class EmployeeUpdate(ApiSchema):
    model_config = ConfigDict(extra="forbid")

    employee_code: str | None = Field(default=None, min_length=3, max_length=30)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, min_length=10, max_length=20)
    department: str | None = Field(default=None, min_length=1, max_length=100)
    designation: str | None = Field(default=None, min_length=2, max_length=100)
    manager: str | None = Field(default=None, max_length=100)
    employment_type: str | None = Field(default=None, min_length=1, max_length=30)
    work_mode: str | None = Field(default=None, min_length=1, max_length=30)
    location: str | None = Field(default=None, min_length=1, max_length=100)
    joining_date: date | None = None
    wage_model: str | None = Field(default=None, pattern="^(Monthly|Daily|Hourly)$")
    base_wage: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    leave_allocations: list[EmployeeLeaveAllocation] | None = Field(default=None, max_length=50)

    @model_validator(mode="after")
    def validate_unique_leave_types(self):
        if self.leave_allocations is not None:
            leave_type_ids = [item.leave_type_id for item in self.leave_allocations]
            if len(leave_type_ids) != len(set(leave_type_ids)):
                raise ValueError("Leave allocation types must be unique")
        return self


class EmployeePublic(ApiSchema):
    id: UUID
    employee_code: str
    name: str
    email: EmailStr
    phone: str
    department: str
    designation: str
    manager: str
    employment_type: str
    work_mode: str
    location: str | None
    joining_date: date
    status: str
    profile_complete: bool
    wage_model: str
    base_wage: Decimal
