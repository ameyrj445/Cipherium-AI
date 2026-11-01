"""Immutable audit records for Bayesian Knowledge Tracing transitions."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.database import Base
from app.models import utc_now


class MasteryEvent(Base):
    __tablename__ = "mastery_events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    prior = Column(Float, nullable=False)
    posterior = Column(Float, nullable=False)
    event_type = Column(String(32), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False, index=True)

    user = relationship("User", back_populates="mastery_events")
    topic = relationship("Topic", back_populates="mastery_events")
