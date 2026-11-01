"""Add telemetry fields to tutor messages.

Revision ID: 20261101_tutor_telemetry
Revises: 20261101_user_account_fields
Create Date: 2026-11-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20261101_tutor_telemetry"
down_revision = "20261101_user_account_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    existing_columns = {column["name"] for column in sa.inspect(op.get_bind()).get_columns("tutor_messages")}
    with op.batch_alter_table("tutor_messages") as batch_op:
        if "latency_ms" not in existing_columns:
            batch_op.add_column(sa.Column("latency_ms", sa.Integer(), nullable=True))
        if "token_count" not in existing_columns:
            batch_op.add_column(sa.Column("token_count", sa.Integer(), nullable=True))
        if "retrieval_chunk_ids" not in existing_columns:
            batch_op.add_column(sa.Column("retrieval_chunk_ids", sa.Text(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("tutor_messages") as batch_op:
        batch_op.drop_column("retrieval_chunk_ids")
        batch_op.drop_column("token_count")
        batch_op.drop_column("latency_ms")
