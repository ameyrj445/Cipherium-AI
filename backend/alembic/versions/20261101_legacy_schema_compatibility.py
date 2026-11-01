"""Add model columns missing from legacy deployed databases.

Revision ID: 20261101_legacy_schema
Revises: 20261101_tutor_telemetry
Create Date: 2026-11-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20261101_legacy_schema"
down_revision = "20261101_tutor_telemetry"
branch_labels = None
depends_on = None


def _columns(table_name: str) -> set[str]:
    return {column["name"] for column in sa.inspect(op.get_bind()).get_columns(table_name)}


def upgrade() -> None:
    columns = _columns("questions")
    with op.batch_alter_table("questions") as batch_op:
        if "status" not in columns:
            batch_op.add_column(sa.Column("status", sa.String(length=50), nullable=False, server_default="published"))
        if "version" not in columns:
            batch_op.add_column(sa.Column("version", sa.Integer(), nullable=False, server_default="1"))

    columns = _columns("resources")
    with op.batch_alter_table("resources") as batch_op:
        if "version" not in columns:
            batch_op.add_column(sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
        if "is_active" not in columns:
            batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))

    columns = _columns("tutor_messages")
    with op.batch_alter_table("tutor_messages") as batch_op:
        if "conversation_id" not in columns:
            batch_op.add_column(sa.Column("conversation_id", sa.Integer(), nullable=True))

    columns = _columns("user_settings")
    with op.batch_alter_table("user_settings") as batch_op:
        if "notification_retention" not in columns:
            batch_op.add_column(sa.Column("notification_retention", sa.Boolean(), nullable=False, server_default=sa.true()))


def downgrade() -> None:
    with op.batch_alter_table("user_settings") as batch_op:
        batch_op.drop_column("notification_retention")
    with op.batch_alter_table("tutor_messages") as batch_op:
        batch_op.drop_column("conversation_id")
    with op.batch_alter_table("resources") as batch_op:
        batch_op.drop_column("is_active")
        batch_op.drop_column("version")
    with op.batch_alter_table("questions") as batch_op:
        batch_op.drop_column("version")
        batch_op.drop_column("status")
