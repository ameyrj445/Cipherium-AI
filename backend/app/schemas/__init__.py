from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# Auth schemas
class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    name: str
    email: str

class UserProfile(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

# Topic schemas
class TopicResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: Optional[str] = None
    prerequisites: Optional[str] = "[]"

    class Config:
        from_attributes = True

# Question schemas
class QuestionResponse(BaseModel):
    id: int
    topic_id: int
    topic_name: Optional[str] = None
    question_text: str
    options: List[str]
    difficulty: int
    explanation: Optional[str] = None

class QuizAttemptSubmit(BaseModel):
    question_id: int
    selected_answer: str
    time_taken_seconds: int = 10

class QuizAttemptResult(BaseModel):
    id: int
    is_correct: bool
    correct_answer: str
    explanation: Optional[str] = None
    topic_id: int
    topic_name: str
    new_mastery_score: float
    new_status: str

# Analytics & Mastery schemas
class TopicMasteryDetail(BaseModel):
    topic_id: int
    topic_name: str
    topic_code: str
    category: str
    mastery_score: float
    status: str
    attempt_count: int
    correct_count: int
    accuracy_percentage: float
    ml_weak_probability: Optional[float] = 0.0
    ml_prediction: Optional[str] = "Normal"

class MasteryAnalyticsResponse(BaseModel):
    total_quizzes_taken: int
    overall_accuracy: float
    strong_topics_count: int
    developing_topics_count: int
    weak_topics_count: int
    topics: List[TopicMasteryDetail]

# Resource & Recommendation schemas
class ResourceResponse(BaseModel):
    id: int
    topic_id: int
    topic_name: Optional[str] = None
    title: str
    resource_type: str
    url: str
    difficulty: int
    estimated_minutes: int
    summary: Optional[str] = None
    relevance_score: Optional[float] = None
    recommendation_reason: Optional[str] = None

class GenerateRoadmapRequest(BaseModel):
    target_hours_per_week: int = 10

class RoadmapTask(BaseModel):
    task_id: str
    topic_id: int
    topic_name: str
    priority: str # High, Medium, Low
    estimated_hours: float
    recommended_resources: List[ResourceResponse]
    milestone: str
    status: str # pending, in_progress, completed

class RoadmapResponse(BaseModel):
    target_hours_per_week: int
    total_estimated_hours: float
    tasks: List[RoadmapTask]
    generated_at: str

# Custom Study Plan & Tracker Schemas
class CustomPlanResource(BaseModel):
    id: str
    title: str
    resource_type: str
    url: str
    estimated_minutes: int
    summary: str
    completed: bool = False

class CustomPlanMilestone(BaseModel):
    id: str
    stage_number: int
    title: str
    description: str
    estimated_hours: float
    subtopics: List[str]
    completed_subtopics: List[str] = []
    resources: List[CustomPlanResource] = []
    status: str = "pending" # pending, in_progress, completed

class CreateCustomPlanRequest(BaseModel):
    subject: str
    duration_weeks: int = 4
    target_hours_per_week: int = 10
    skill_level: str = "Beginner"
    learning_goal: str = "Full Mastery"

class UpdatePlanProgressRequest(BaseModel):
    plan_id: Optional[str] = None
    milestone_id: Optional[str] = None
    subtopic_name: Optional[str] = None
    subtopic_completed: Optional[bool] = None
    resource_id: Optional[str] = None
    resource_completed: Optional[bool] = None
    logged_hours_delta: Optional[float] = 0.0
    milestone_status: Optional[str] = None

# Tutor chat schemas
class TutorChatRequest(BaseModel):
    message: str
    topic_id: Optional[int] = None

class TutorChatResponse(BaseModel):
    response: str
    topic_name: Optional[str] = None
    suggested_resources: List[ResourceResponse] = []

