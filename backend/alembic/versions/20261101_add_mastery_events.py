"""Create immutable BKT mastery audit events.

Revision ID: 20261101_mastery_events
Revises: 20261101_quiz_session
Create Date: 2026-11-01
"""

from alembic import op
import sqlalchemy as sa


revision = "20261101_mastery_events"
down_revision = "20261101_quiz_session"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "mastery_events" not in inspector.get_table_names():
        op.create_table(
            "mastery_events",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("topic_id", sa.Integer(), sa.ForeignKey("topics.id"), nullable=False),
            sa.Column("prior", sa.Float(), nullable=False),
            sa.Column("posterior", sa.Float(), nullable=False),
            sa.Column("event_type", sa.String(length=32), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
        )

    existing_indexes = {index["name"] for index in sa.inspect(bind).get_indexes("mastery_events")}
    for name, columns in (
        ("ix_mastery_events_user_id", ["user_id"]),
        ("ix_mastery_events_topic_id", ["topic_id"]),
        ("ix_mastery_events_created_at", ["created_at"]),
    ):
        if name not in existing_indexes:
            op.create_index(name, "mastery_events", columns)


def downgrade() -> None:
    op.drop_index("ix_mastery_events_created_at", table_name="mastery_events")
    op.drop_index("ix_mastery_events_topic_id", table_name="mastery_events")
    op.drop_index("ix_mastery_events_user_id", table_name="mastery_events")
    op.drop_table("mastery_events")
