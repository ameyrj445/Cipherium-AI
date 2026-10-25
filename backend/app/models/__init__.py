from sqlalchemy import Column, Integer, String, Text, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="student")
    created_at = Column(DateTime, default=datetime.utcnow)

    attempts = relationship("QuizAttempt", back_populates="user")
    masteries = relationship("TopicMastery", back_populates="user")
    study_plans = relationship("StudyPlan", back_populates="user")
    messages = relationship("TutorMessage", back_populates="user")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, index=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), default="Computer Science")
    description = Column(Text, nullable=True)
    parent_topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    prerequisites = Column(Text, default="[]") # JSON string list of prerequisite topic codes

    questions = relationship("Question", back_populates="topic")
    resources = relationship("Resource", back_populates="topic")
    masteries = relationship("TopicMastery", back_populates="topic")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    options = Column(Text, nullable=False) # JSON array of string options
    correct_answer = Column(String(255), nullable=False)
    difficulty = Column(Integer, default=1) # 1 to 5
    explanation = Column(Text, nullable=True)

    topic = relationship("Topic", back_populates="questions")
    attempts = relationship("QuizAttempt", back_populates="question")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    selected_answer = Column(String(255), nullable=False)
    is_correct = Column(Boolean, nullable=False)
    time_taken_seconds = Column(Integer, default=0)
    attempted_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="attempts")
    question = relationship("Question", back_populates="attempts")

class TopicMastery(Base):
    __tablename__ = "topic_mastery"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    mastery_score = Column(Float, default=0.0) # 0.00 to 1.00
    status = Column(String(50), default="insufficient_data") # insufficient_data, weak, developing, strong
    attempt_count = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="masteries")
    topic = relationship("Topic", back_populates="masteries")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=False)
    title = Column(String(255), nullable=False)
    resource_type = Column(String(50), default="article") # video, article, exercise, cheatsheet
    url = Column(String(500), nullable=False)
    difficulty = Column(Integer, default=1) # 1 to 5
    estimated_minutes = Column(Integer, default=15)
    summary = Column(Text, nullable=True)

    topic = relationship("Topic", back_populates="resources")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    target_hours_per_week = Column(Integer, default=10)
    plan_json = Column(Text, nullable=False) # JSON generated roadmap items
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="study_plans")

class SubjectRoadmap(Base):
    __tablename__ = "subject_roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(50), unique=True, index=True, nullable=False)
    roadmap_json = Column(Text, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class TutorMessage(Base):
    __tablename__ = "tutor_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False) # user or assistant
    message = Column(Text, nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="messages")
