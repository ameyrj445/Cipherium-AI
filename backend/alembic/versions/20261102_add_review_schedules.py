"""Persist SM-2 review schedules.

Revision ID: 20261102_review_schedules
Revises: 20261102_user_token_quota
Create Date: 2026-11-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20261102_review_schedules"
down_revision = "20261102_user_token_quota"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if "review_schedules" not in sa.inspect(op.get_bind()).get_table_names():
        op.create_table(
            "review_schedules",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("topic_id", sa.Integer(), sa.ForeignKey("topics.id"), nullable=False),
            sa.Column("next_review_at", sa.DateTime(), nullable=False),
            sa.Column("memory_stability", sa.Float(), nullable=False, server_default="1.0"),
            sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
            sa.UniqueConstraint("user_id", "topic_id", name="uq_review_schedules_user_topic"),
        )
        op.create_index("ix_review_schedules_user_id", "review_schedules", ["user_id"])
        op.create_index("ix_review_schedules_topic_id", "review_schedules", ["topic_id"])
        op.create_index("ix_review_schedules_next_review_at", "review_schedules", ["next_review_at"])


def downgrade() -> None:
    op.drop_table("review_schedules")
