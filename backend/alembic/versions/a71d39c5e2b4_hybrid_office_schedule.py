"""add recurring hybrid office-day schedules

Revision ID: a71d39c5e2b4
Revises: 75f13d8c92b1
Create Date: 2026-11-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a71d39c5e2b4"
down_revision: Union[str, None] = "75f13d8c92b1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column(
            "hybrid_office_days",
            sa.JSON(),
            server_default=sa.text("'[]'"),
            nullable=False,
        ),
    )
    op.execute(
        "UPDATE employees "
        "SET hybrid_office_days = '[\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\"]' "
        "WHERE work_mode = 'Hybrid'"
    )


def downgrade() -> None:
    op.drop_column("employees", "hybrid_office_days")
