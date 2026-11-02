"""Persisted spaced-repetition review schedule for one learner-topic pair."""

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class ReviewSchedule(Base):
    __tablename__ = "review_schedules"
    __table_args__ = (UniqueConstraint("user_id", "topic_id", name="uq_review_schedules_user_topic"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False, index=True)
    next_review_at = Column(DateTime, nullable=False, index=True)
    memory_stability = Column(Float, nullable=False, default=1.0)
    review_count = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="review_schedules")
    topic = relationship("Topic", back_populates="review_schedules")
