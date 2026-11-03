"""archive resolved attendance corrections from the admin queue

Revision ID: c172a6f59d31
Revises: 8d62c31a4ef0
Create Date: 2026-11-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c172a6f59d31"
down_revision: Union[str, None] = "8d62c31a4ef0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "attendance_corrections",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "attendance_corrections",
        sa.Column("archived_by_user_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_attendance_corrections_archived_by_user_id_users",
        "attendance_corrections",
        "users",
        ["archived_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_attendance_corrections_archived_by_user_id_users",
        "attendance_corrections",
        type_="foreignkey",
    )
    op.drop_column("attendance_corrections", "archived_by_user_id")
    op.drop_column("attendance_corrections", "archived_at")
