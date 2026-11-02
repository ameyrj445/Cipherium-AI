"""Per-user reward state for contextual resource recommendations."""

from sqlalchemy import Column, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class RecommendationArm(Base):
    __tablename__ = "recommendation_arms"
    __table_args__ = (UniqueConstraint("user_id", "resource_id", name="uq_recommendation_arms_user_resource"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    resource_id = Column(String(64), nullable=False, index=True)
    reward = Column(Float, nullable=False, default=0.0)
    pull_count = Column(Integer, nullable=False, default=0)

    user = relationship("User", back_populates="recommendation_arms")
