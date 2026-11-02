"""Normalized prerequisite edges for the curriculum knowledge graph."""

from sqlalchemy import Column, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"
    __table_args__ = (UniqueConstraint("topic_id", "prerequisite_id", name="uq_topic_prerequisite_edge"),)

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    prerequisite_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)

    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="prerequisite_links")
    prerequisite = relationship("Topic", foreign_keys=[prerequisite_id], back_populates="dependent_links")
