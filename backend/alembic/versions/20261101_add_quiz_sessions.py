"""Create relational quiz sessions and backfill existing attempts.

Revision ID: 20261101_quiz_sessions
Revises: 20261101_mastery_events
Create Date: 2026-11-01
"""

from collections import defaultdict

from alembic import op
import sqlalchemy as sa


revision = "20261101_quiz_sessions"
down_revision = "20261101_mastery_events"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "quiz_sessions" not in inspector.get_table_names():
        op.create_table(
            "quiz_sessions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("session_type", sa.String(length=20), nullable=False, server_default="adaptive"),
            sa.Column("status", sa.String(length=20), nullable=False, server_default="active"),
            sa.Column("started_at", sa.DateTime(), nullable=False),
            sa.Column("completed_at", sa.DateTime(), nullable=True),
        )

    attempt_columns = {column["name"] for column in sa.inspect(bind).get_columns("quiz_attempts")}
    if "session_id" not in attempt_columns:
        with op.batch_alter_table("quiz_attempts") as batch_op:
            batch_op.add_column(sa.Column("session_id", sa.Integer(), nullable=True))

    attempts = sa.table(
        "quiz_attempts",
        sa.column("id", sa.Integer),
        sa.column("user_id", sa.Integer),
        sa.column("attempted_at", sa.DateTime),
        sa.column("session_id", sa.Integer),
    )
    sessions = sa.table(
        "quiz_sessions",
        sa.column("id", sa.Integer),
        sa.column("user_id", sa.Integer),
        sa.column("session_type", sa.String),
        sa.column("status", sa.String),
        sa.column("started_at", sa.DateTime),
        sa.column("completed_at", sa.DateTime),
    )
    unassigned = bind.execute(
        sa.select(attempts.c.id, attempts.c.user_id, attempts.c.attempted_at)
        .where(attempts.c.session_id.is_(None))
    ).mappings().all()
    grouped = defaultdict(list)
    for attempt in unassigned:
        grouped[(attempt["user_id"], attempt["attempted_at"].date())].append(attempt)
    for (user_id, _attempt_date), grouped_attempts in grouped.items():
        started_at = min(attempt["attempted_at"] for attempt in grouped_attempts)
        session_id = bind.execute(
            sa.insert(sessions)
            .values(user_id=user_id, session_type="adaptive", status="completed", started_at=started_at, completed_at=started_at)
            .returning(sessions.c.id)
        ).scalar_one()
        bind.execute(
            sa.update(attempts)
            .where(attempts.c.id.in_([attempt["id"] for attempt in grouped_attempts]))
            .values(session_id=session_id)
        )

    with op.batch_alter_table("quiz_attempts") as batch_op:
        batch_op.alter_column("session_id", existing_type=sa.Integer(), nullable=False)
        batch_op.create_foreign_key("fk_quiz_attempts_session_id", "quiz_sessions", ["session_id"], ["id"])
        batch_op.create_index("ix_quiz_attempts_session_id", ["session_id"])


def downgrade() -> None:
    with op.batch_alter_table("quiz_attempts") as batch_op:
        batch_op.drop_index("ix_quiz_attempts_session_id")
        batch_op.drop_constraint("fk_quiz_attempts_session_id", type_="foreignkey")
        batch_op.drop_column("session_id")
    op.drop_table("quiz_sessions")
