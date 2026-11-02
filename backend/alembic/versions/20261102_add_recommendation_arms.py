"""Persist contextual-bandit reward arms.

Revision ID: 20261102_recommendation_arms
Revises: 20261102_review_schedules
Create Date: 2026-11-02
"""

from alembic import op
import sqlalchemy as sa


revision = "20261102_recommendation_arms"
down_revision = "20261102_review_schedules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    if "recommendation_arms" not in sa.inspect(op.get_bind()).get_table_names():
        op.create_table(
            "recommendation_arms",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("resource_id", sa.String(length=64), nullable=False),
            sa.Column("reward", sa.Float(), nullable=False, server_default="0"),
            sa.Column("pull_count", sa.Integer(), nullable=False, server_default="0"),
            sa.UniqueConstraint("user_id", "resource_id", name="uq_recommendation_arms_user_resource"),
        )
        op.create_index("ix_recommendation_arms_user_id", "recommendation_arms", ["user_id"])
        op.create_index("ix_recommendation_arms_resource_id", "recommendation_arms", ["resource_id"])


def downgrade() -> None:
    op.drop_table("recommendation_arms")
