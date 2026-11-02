"""Bring legacy user tables in line with the account model.

Revision ID: 20261101_user_account_fields
Revises: 20261101_quiz_sessions
Create Date: 2026-11-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20261101_user_account_fields"
down_revision = "20261101_quiz_sessions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    existing_indexes = {index["name"] for index in inspector.get_indexes("users")}
    with op.batch_alter_table("users") as batch_op:
        if "is_active" not in existing_columns:
            batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()))
        if "deleted_at" not in existing_columns:
            batch_op.add_column(sa.Column("deleted_at", sa.DateTime(), nullable=True))
        if "password_reset_token" not in existing_columns:
            batch_op.add_column(sa.Column("password_reset_token", sa.String(length=255), nullable=True))
        if "reset_token_expires_at" not in existing_columns:
            batch_op.add_column(sa.Column("reset_token_expires_at", sa.DateTime(), nullable=True))
        if "ix_users_password_reset_token" not in existing_indexes:
            batch_op.create_index("ix_users_password_reset_token", ["password_reset_token"])


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_index("ix_users_password_reset_token")
        batch_op.drop_column("reset_token_expires_at")
        batch_op.drop_column("password_reset_token")
        batch_op.drop_column("deleted_at")
        batch_op.drop_column("is_active")
