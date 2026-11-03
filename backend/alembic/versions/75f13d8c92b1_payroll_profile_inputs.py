"""collect payroll jurisdiction and salary components

Revision ID: 75f13d8c92b1
Revises: c172a6f59d31
Create Date: 2026-11-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "75f13d8c92b1"
down_revision: Union[str, None] = "c172a6f59d31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("organizations", sa.Column("country", sa.String(length=100), nullable=True))
    op.add_column("organizations", sa.Column("state", sa.String(length=100), nullable=True))
    op.add_column("employees", sa.Column("basic_salary", sa.Numeric(12, 2), nullable=True))
    op.add_column("employees", sa.Column("dearness_allowance", sa.Numeric(12, 2), nullable=True))
    op.add_column("employees", sa.Column("house_rent_allowance", sa.Numeric(12, 2), nullable=True))
    op.add_column("employees", sa.Column("other_allowances", sa.Numeric(12, 2), nullable=True))
    op.add_column(
        "employees",
        sa.Column("tax_regime", sa.String(length=10), server_default="new", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("employees", "tax_regime")
    op.drop_column("employees", "other_allowances")
    op.drop_column("employees", "house_rent_allowance")
    op.drop_column("employees", "dearness_allowance")
    op.drop_column("employees", "basic_salary")
    op.drop_column("organizations", "state")
    op.drop_column("organizations", "country")
