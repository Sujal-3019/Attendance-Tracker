"""support employee self-registration and onboarding actions

Revision ID: 8d62c31a4ef0
Revises: 4ab385a0c838
Create Date: 2026-11-02
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "8d62c31a4ef0"
down_revision: Union[str, None] = "4ab385a0c838"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "employees",
        sa.Column(
            "profile_complete",
            sa.Boolean(),
            server_default=sa.true(),
            nullable=False,
        ),
    )
    op.alter_column("employees", "profile_complete", server_default=None)
    op.add_column("notifications", sa.Column("action_url", sa.String(length=300)))
    op.add_column(
        "notifications",
        sa.Column("related_employee_id", sa.Uuid(), nullable=True),
    )
    op.create_foreign_key(
        "fk_notifications_related_employee_id_employees",
        "notifications",
        "employees",
        ["related_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "ix_notifications_onboarding_employee",
        "notifications",
        ["organization_id", "related_employee_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notifications_onboarding_employee",
        table_name="notifications",
    )
    op.drop_constraint(
        "fk_notifications_related_employee_id_employees",
        "notifications",
        type_="foreignkey",
    )
    op.drop_column("notifications", "related_employee_id")
    op.drop_column("notifications", "action_url")
    op.drop_column("employees", "profile_complete")
