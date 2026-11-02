"""Normalize topic prerequisite JSON into a junction table.

Revision ID: 20261102_topic_prerequisites
Revises: 20261102_recommendation_arms
Create Date: 2026-11-02
"""

import json

from alembic import op
import sqlalchemy as sa


revision = "20261102_topic_prerequisites"
down_revision = "20261102_recommendation_arms"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    if "topic_prerequisites" not in sa.inspect(bind).get_table_names():
        op.create_table(
            "topic_prerequisites",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("topic_id", sa.Integer(), sa.ForeignKey("topics.id"), nullable=False),
            sa.Column("prerequisite_id", sa.Integer(), sa.ForeignKey("topics.id"), nullable=False),
            sa.UniqueConstraint("topic_id", "prerequisite_id", name="uq_topic_prerequisite_edge"),
        )
        op.create_index("ix_topic_prerequisites_topic_id", "topic_prerequisites", ["topic_id"])
        op.create_index("ix_topic_prerequisites_prerequisite_id", "topic_prerequisites", ["prerequisite_id"])

    topics = sa.table(
        "topics", sa.column("id", sa.Integer), sa.column("code", sa.String), sa.column("prerequisites", sa.Text)
    )
    edges = sa.table(
        "topic_prerequisites", sa.column("topic_id", sa.Integer), sa.column("prerequisite_id", sa.Integer)
    )
    rows = bind.execute(sa.select(topics.c.id, topics.c.code, topics.c.prerequisites)).mappings().all()
    ids_by_code = {row["code"]: row["id"] for row in rows}
    existing = {
        (row["topic_id"], row["prerequisite_id"])
        for row in bind.execute(sa.select(edges.c.topic_id, edges.c.prerequisite_id)).mappings().all()
    }
    for row in rows:
        try:
            codes = json.loads(row["prerequisites"] or "[]")
        except (TypeError, json.JSONDecodeError):
            codes = []
        for code in codes if isinstance(codes, list) else []:
            prerequisite_id = ids_by_code.get(str(code))
            edge = (row["id"], prerequisite_id)
            if prerequisite_id and prerequisite_id != row["id"] and edge not in existing:
                bind.execute(sa.insert(edges).values(topic_id=row["id"], prerequisite_id=prerequisite_id))
                existing.add(edge)


def downgrade() -> None:
    op.drop_table("topic_prerequisites")
