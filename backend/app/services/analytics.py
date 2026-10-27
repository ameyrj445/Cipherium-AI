"""
Cipherium AI - Learning Analytics & Adaptive Scoring Engine

Pedagogical Background & Mathematical Formulations:

1. Topic Mastery Formula (M):
   M = 0.7 * overall_accuracy + 0.3 * recency_accuracy
   
   - Cumulative Accuracy (70% weight): Measures holistic mastery depth across all
     recorded attempts, preventing transient guessing streaks from inflating scores.
   - Recency Accuracy (30% weight): Evaluates the student's last 5 attempts to capture
     recent cognitive retention and concept breakthroughs.

2. Mastery Classification Thresholds:
   - Total attempts < 3: 'insufficient_data' (cold-start protection)
   - M < 0.50:          'weak' (targeted remediation required)
   - 0.50 <= M <= 0.75: 'developing' (progressing through learning curve)
   - M > 0.75:          'strong' (mastery achieved, ready for advanced concepts)

3. Zone of Proximal Development (ZPD) Recommendation Ranking (S):
   S = 0.5 * weak_topic_relevance + 0.3 * difficulty_fit + 0.2 * prerequisite_fit
   
   - Ensures recommendations prioritize diagnosed weak topics while matching the
     student's current cognitive capability tier.

4. Adaptive Question Difficulty Ladder (Levels 1–5):
   - Recent accuracy >= 85%: Step up difficulty (min(current + 1, 5))
   - Recent accuracy < 50%:  Step down difficulty (max(current - 1, 1))
"""

from typing import List, Tuple, Dict, Any
from app.models import QuizAttempt
from app.services.bkt_service import evaluate_bkt_and_retention

def calculate_topic_cognitive_state(attempts: List[QuizAttempt]) -> Dict[str, Any]:
    """
    Evaluates attempts using Bayesian Knowledge Tracing and Ebbinghaus Spaced Repetition.
    Returns bkt_probability, retention_rate, next_review_due, and retention_status.
    """
    return evaluate_bkt_and_retention(attempts)

def classify_mastery(accuracy: float, attempts: int) -> str:
    """
    Categorizes student proficiency based on evaluated score and attempt volume.
    
    Args:
        accuracy: Calculated mastery score (0.0 to 1.0).
        attempts: Cumulative question attempt count.
        
    Returns:
        str: 'insufficient_data', 'weak', 'developing', or 'strong'.
    """
    # Guard against cold-start volatility: need at least 3 samples to make a valid claim
    if attempts < 3:
        return "insufficient_data"
    if accuracy < 0.50:
        return "weak"
    if accuracy <= 0.75:
        return "developing"
    return "strong"


def calculate_topic_mastery(attempts: List[QuizAttempt]) -> Tuple[float, str, int, int]:
    """
    Computes weighted mastery score, qualitative status, and attempt statistics.
    
    Args:
        attempts: List of historical QuizAttempt records for a specific topic,
                  ordered chronologically.
                  
    Returns:
        Tuple containing:
          - mastery_score (float, 0.0 - 1.0)
          - status (str: 'insufficient_data', 'weak', 'developing', 'strong')
          - total_attempts (int)
          - correct_count (int)
    """
    if not attempts:
        return 0.0, "insufficient_data", 0, 0
    
    total_attempts = len(attempts)
    correct_count = sum(1 for a in attempts if a.is_correct)
    overall_accuracy = correct_count / total_attempts

    # Recency window: sample the latest 5 attempts to gauge retention momentum
    recent_attempts = attempts[-5:]
    recent_correct = sum(1 for a in recent_attempts if a.is_correct)
    recency_accuracy = recent_correct / len(recent_attempts)

    # Core academic mastery equation: M = 0.7 * overall + 0.3 * recency
    mastery_score = round(0.7 * overall_accuracy + 0.3 * recency_accuracy, 3)
    status = classify_mastery(mastery_score, total_attempts)

    return mastery_score, status, total_attempts, correct_count


def calculate_adaptive_difficulty(current_difficulty: int, recent_attempts: List[QuizAttempt]) -> int:
    """
    Dynamically adjusts question difficulty according to the student's short-term precision.
    Implements a responsive staircase adaptation algorithm (Levels 1 to 5).
    
    Args:
        current_difficulty: Baseline difficulty level (1-5).
        recent_attempts: Recent question attempts by this user.
        
    Returns:
        int: Adjusted difficulty level bounded between 1 and 5.
    """
    if not recent_attempts:
        return current_difficulty
    
    recent_correct = sum(1 for a in recent_attempts if a.is_correct)
    recent_accuracy = recent_correct / len(recent_attempts)

    # If student is consistently answering correctly (>= 85%), promote difficulty
    if recent_accuracy >= 0.85:
        return min(current_difficulty + 1, 5)
    # If student is struggling (< 50%), lower difficulty to rebuild conceptual confidence
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
    """
    Ranks educational resources using a multi-factor pedagogical fit equation:
      S = 0.5 * topic_relevance + 0.3 * difficulty_fit + 0.2 * prerequisite_fit
      
    Args:
        topic_status: 'weak', 'developing', 'strong', or 'insufficient_data'
        mastery_score: Current mastery score on this topic (0.0 - 1.0)
        resource_difficulty: Resource complexity rating (1-5)
        user_avg_difficulty: Student's demonstrated working difficulty level
        prerequisites_met: Boolean flag indicating if prerequisite topics are passed
        
    Returns:
        Tuple of (score: float, reason: str)
    """
    # 1. Relevance weight: Higher priority for diagnosed weak or unverified topics
    if topic_status == "weak":
        topic_relevance = 1.0
        reason = "Targeted remediation for diagnosed weak topic."
    elif topic_status == "insufficient_data":
        topic_relevance = 0.8
        reason = "Foundational reinforcement while assessment data is accumulating."
    elif topic_status == "developing":
        topic_relevance = 0.6
        reason = "Advancing knowledge to attain strong topic mastery."
    else:  # strong
        topic_relevance = 0.2
        reason = "Advanced refresher and comprehensive review."

    # 2. Difficulty fit: Penalizes resources that are too trivial or excessively complex
    difficulty_diff = abs(resource_difficulty - user_avg_difficulty)
    difficulty_fit = max(0.0, 1.0 - (difficulty_diff * 0.25))

    # 3. Prerequisite fit: Gate advanced resources until foundational dependencies are mastered
    prereq_fit = 1.0 if prerequisites_met else 0.2

    # Weighted composite score
    score = round(0.5 * topic_relevance + 0.3 * difficulty_fit + 0.2 * prereq_fit, 3)
    return score, reason
