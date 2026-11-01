"""add quiz attempt session finalization and hint telemetry

Revision ID: 20261101_quiz_session
Revises:
Create Date: 2026-11-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20261101_quiz_session"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # hint_count is the required telemetry field.  The two session fields are
    # required to identify and finalize the rows addressed by /complete.
    bind = op.get_bind()
    existing_columns = {column["name"] for column in sa.inspect(bind).get_columns("quiz_attempts")}
    existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("quiz_attempts")}
    with op.batch_alter_table("quiz_attempts") as batch_op:
        if "hint_count" not in existing_columns:
            batch_op.add_column(sa.Column("hint_count", sa.Integer(), nullable=False, server_default="0"))
        if "quiz_id" not in existing_columns:
            batch_op.add_column(sa.Column("quiz_id", sa.String(length=36), nullable=True))
        if "is_finalized" not in existing_columns:
            batch_op.add_column(sa.Column("is_finalized", sa.Boolean(), nullable=False, server_default=sa.false()))
        if "ix_quiz_attempts_quiz_id" not in existing_indexes:
            batch_op.create_index("ix_quiz_attempts_quiz_id", ["quiz_id"])


def downgrade() -> None:
    with op.batch_alter_table("quiz_attempts") as batch_op:
        batch_op.drop_index("ix_quiz_attempts_quiz_id")
        batch_op.drop_column("is_finalized")
        batch_op.drop_column("quiz_id")
        batch_op.drop_column("hint_count")
