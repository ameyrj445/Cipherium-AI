"""
Analytics and Adaptive Scoring Algorithms:
As specified in Cipherium AI Guide:
- Mastery score combines recent accuracy and recency-weighted performance:
  M = 0.7 * accuracy + 0.3 * recency_score
- Scores < 0.50 => 'weak'
- Scores 0.50 - 0.75 => 'developing'
- Scores > 0.75 => 'strong'
- If attempts < 3 (or 5) => 'insufficient_data'

- Recommendation score:
  S = 0.5 * weak_topic_relevance + 0.3 * difficulty_fit + 0.2 * prerequisite_fit

- Adaptive difficulty adjustment:
  if recent_accuracy >= 0.85: return min(current + 1, 5)
  if recent_accuracy < 0.50: return max(current - 1, 1)
  return current
"""
from typing import List, Tuple
from app.models import QuizAttempt

def classify_mastery(accuracy: float, attempts: int) -> str:
    if attempts < 3:
        return "insufficient_data"
    if accuracy < 0.50:
        return "weak"
    if accuracy <= 0.75:
        return "developing"
    return "strong"

def calculate_topic_mastery(attempts: List[QuizAttempt]) -> Tuple[float, str, int, int]:
    if not attempts:
        return 0.0, "insufficient_data", 0, 0
    
    total_attempts = len(attempts)
    correct_count = sum(1 for a in attempts if a.is_correct)
    overall_accuracy = correct_count / total_attempts

    # Recency score from the last 5 attempts
    recent_attempts = attempts[-5:]
    recent_correct = sum(1 for a in recent_attempts if a.is_correct)
    recency_accuracy = recent_correct / len(recent_attempts)

    # Mastery formulation: M = 0.7 * accuracy + 0.3 * recency_accuracy
    mastery_score = round(0.7 * overall_accuracy + 0.3 * recency_accuracy, 3)
    status = classify_mastery(mastery_score, total_attempts)

    return mastery_score, status, total_attempts, correct_count

def calculate_adaptive_difficulty(current_difficulty: int, recent_attempts: List[QuizAttempt]) -> int:
    if not recent_attempts:
        return current_difficulty
    
    recent_correct = sum(1 for a in recent_attempts if a.is_correct)
    recent_accuracy = recent_correct / len(recent_attempts)

    if recent_accuracy >= 0.85:
        return min(current_difficulty + 1, 5)
    elif recent_accuracy < 0.50:
        return max(current_difficulty - 1, 1)
    return current_difficulty

def compute_recommendation_score(
    topic_status: str,
    mastery_score: float,
    resource_difficulty: int,
    user_avg_difficulty: float = 2.0,
    prerequisites_met: bool = True
) -> Tuple[float, str]:
    # Relevance to weak topics
    if topic_status == "weak":
        topic_relevance = 1.0
        reason = "Targeted remediation for diagnosed weak topic."
    elif topic_status == "insufficient_data":
        topic_relevance = 0.8
        reason = "Foundational reinforcement while data is accumulating."
    elif topic_status == "developing":
        topic_relevance = 0.6
        reason = "Advancing knowledge to attain strong topic mastery."
    else: # strong
        topic_relevance = 0.2
        reason = "Advanced refresher and comprehensive review."

    # Difficulty fit
    difficulty_diff = abs(resource_difficulty - user_avg_difficulty)
    difficulty_fit = max(0.0, 1.0 - (difficulty_diff * 0.25))

    # Prerequisite fit
    prereq_fit = 1.0 if prerequisites_met else 0.2

    # S = 0.5 * weak-topic relevance + 0.3 * difficulty fit + 0.2 * prerequisite fit
    score = round(0.5 * topic_relevance + 0.3 * difficulty_fit + 0.2 * prereq_fit, 3)
    return score, reason
