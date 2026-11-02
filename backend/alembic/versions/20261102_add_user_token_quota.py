"""Add monthly AI token quota fields to user settings.

Revision ID: 20261102_user_token_quota
Revises: 20261101_legacy_schema
Create Date: 2026-11-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20261102_user_token_quota"
down_revision = "20261101_legacy_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("user_settings")}
    with op.batch_alter_table("user_settings") as batch_op:
        if "monthly_token_used" not in columns:
            batch_op.add_column(sa.Column("monthly_token_used", sa.Integer(), nullable=False, server_default="0"))
        if "token_quota" not in columns:
            batch_op.add_column(sa.Column("token_quota", sa.Integer(), nullable=False, server_default="50000"))


def downgrade() -> None:
    with op.batch_alter_table("user_settings") as batch_op:
        batch_op.drop_column("token_quota")
        batch_op.drop_column("monthly_token_used")
