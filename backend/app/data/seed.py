import json
import os
import uuid
from datetime import datetime, timezone, timedelta, date
from pathlib import Path

from app.models import (
    Topic, Question, Resource, SubjectRoadmap, TopicPrerequisite, User,
    UserSettings, StudyPlan, DailyTask, TopicMastery, ReviewSchedule,
    QuizSession, QuizAttempt, TutorConversation, TutorMessage, Feedback,
    MasteryEvent, RecommendationArm
)
from app.services.auth import hash_password

TOPICS_DATA = [
    {
        "code": "DSA-ARRAYS",
        "name": "Arrays & Two-Pointer Patterns",
        "category": "Data Structures & Algorithms",
        "description": "Continuous memory operations, sliding windows, prefix sums, and dual-pointer techniques.",
        "prerequisites": "[]"
    },
    {
        "code": "DSA-LINKEDLIST",
        "name": "Linked Lists & Pointer Manipulation",
        "category": "Data Structures & Algorithms",
        "description": "Singly and doubly linked lists, fast/slow pointer cycle detection, and reversing nodes.",
        "prerequisites": '["DSA-ARRAYS"]'
    },
    {
        "code": "DSA-TREES",
        "name": "Binary Trees & BST Search",
        "category": "Data Structures & Algorithms",
        "description": "Tree traversals (In-order, Pre-order, Post-order), BST operations, and recursive depth-first exploration.",
        "prerequisites": '["DSA-LINKEDLIST"]'
    },
    {
        "code": "DSA-GRAPHS",
        "name": "Graph Traversal (BFS & DFS)",
        "category": "Data Structures & Algorithms",
        "description": "Adjacency representations, breadth-first search, depth-first search, and shortest path algorithms.",
        "prerequisites": '["DSA-TREES"]'
    },
    {
        "code": "SQL-INDEXES",
        "name": "Database Indexing & Query Optimization",
        "category": "Databases & Backend",
        "description": "B-Tree indexes, query execution plans, hash indexes, and minimizing table scan bottlenecks.",
        "prerequisites": "[]"
    },
    {
        "code": "SYS-REST",
        "name": "RESTful API Architecture & Authentication",
        "category": "Databases & Backend",
        "description": "Stateless HTTP methods, idempotent updates, JWT tokens, and OAuth2 security patterns.",
        "prerequisites": "[]"
    },
    {
        "code": "ML-REGRESSION",
        "name": "Linear Models & Regularization",
        "category": "Machine Learning",
        "description": "Ordinary Least Squares, Lasso (L1) and Ridge (L2) penalties, and gradient descent optimization.",
        "prerequisites": "[]"
    },
    {
        "code": "ML-CLASSIFICATION",
        "name": "Supervised Classification & Model Evaluation",
        "category": "Machine Learning",
        "description": "Logistic regression, decision trees, Precision/Recall trade-offs, and ROC-AUC curves.",
        "prerequisites": '["ML-REGRESSION"]'
    }
]

QUESTIONS_DATA = [
    # Arrays
    {
        "topic_code": "DSA-ARRAYS",
        "question_text": "What is the amortized time complexity of appending an element to a dynamically sized array (like Python's list or C++ vector)?",
        "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        "correct_answer": "O(1)",
        "difficulty": 1,
        "explanation": "Dynamic arrays double their capacity when full, spreading out memory reallocation costs so that individual append operations take O(1) amortized time.",
        "status": "published"
    },
    {
        "topic_code": "DSA-ARRAYS",
        "question_text": "Which algorithmic technique is optimal for finding a contiguous subarray that sums to a target in an array containing only positive integers?",
        "options": ["Sliding Window (Two Pointers)", "Dijkstra's Algorithm", "Binary Exponentiation", "Depth First Search"],
        "correct_answer": "Sliding Window (Two Pointers)",
        "difficulty": 2,
        "explanation": "Because all numbers are positive, expanding the right pointer monotonically increases the sum, and shrinking the left pointer monotonically decreases it, enabling O(n) runtime.",
        "status": "published"
    },
    {
        "topic_code": "DSA-ARRAYS",
        "question_text": "In a 2D sorted matrix where each row and column is sorted in ascending order, what is the most optimal search time complexity starting from the top-right corner?",
        "options": ["O(m + n)", "O(m * n)", "O(log(m * n))", "O(m log n)"],
        "correct_answer": "O(m + n)",
        "difficulty": 3,
        "explanation": "From the top-right corner, if the target is smaller, we move left; if larger, we move down. This eliminates an entire row or column in each step, taking O(m + n) time.",
        "status": "published"
    },
    # Linked Lists
    {
        "topic_code": "DSA-LINKEDLIST",
        "question_text": "What is Floyd's Cycle-Finding Algorithm (Tortoise and Hare) space complexity for detecting a loop in a linked list?",
        "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        "correct_answer": "O(1)",
        "difficulty": 2,
        "explanation": "Floyd's algorithm uses only two pointer references (slow moving 1 step, fast moving 2 steps), requiring O(1) auxiliary space without hash tables.",
        "status": "published"
    },
    {
        "topic_code": "DSA-LINKEDLIST",
        "question_text": "When reversing a singly linked list in-place iteratively, how many auxiliary pointer variables are typically required?",
        "options": ["3 pointers (prev, curr, next)", "1 pointer", "None (0 pointers)", "An array of pointers"],
        "correct_answer": "3 pointers (prev, curr, next)",
        "difficulty": 2,
        "explanation": "Standard in-place reversal maintains a pointer to the previous node, current node, and temporarily holds the next node before modifying curr.next.",
        "status": "published"
    },
    # Trees
    {
        "topic_code": "DSA-TREES",
        "question_text": "Which tree traversal order yields node values in strictly ascending numerical order for a valid Binary Search Tree (BST)?",
        "options": ["In-order Traversal (Left, Root, Right)", "Pre-order Traversal (Root, Left, Right)", "Post-order Traversal (Left, Right, Root)", "Level-order Traversal"],
        "correct_answer": "In-order Traversal (Left, Root, Right)",
        "difficulty": 2,
        "explanation": "In a BST, all keys in the left subtree are smaller than the root, and all keys in the right are greater. Visiting Left -> Root -> Right yields keys in sorted order.",
        "status": "published"
    },
    {
        "topic_code": "DSA-TREES",
        "question_text": "What is the worst-case lookup time complexity in an unbalanced, skewed Binary Search Tree with n nodes?",
        "options": ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
        "correct_answer": "O(n)",
        "difficulty": 2,
        "explanation": "If elements are inserted in strictly sorted order without balancing, the BST degenerates into a linear linked list with O(n) search time.",
        "status": "published"
    },
    # Graphs
    {
        "topic_code": "DSA-GRAPHS",
        "question_text": "Which graph traversal algorithm guarantees the shortest path between two nodes in an unweighted graph?",
        "options": ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Topological Sort", "Kruskal's Algorithm"],
        "correct_answer": "Breadth-First Search (BFS)",
        "difficulty": 2,
        "explanation": "BFS explores vertices level by level in order of distance from the source node, ensuring the first time a destination is reached, the path length is minimal.",
        "status": "published"
    },
    {
        "topic_code": "DSA-GRAPHS",
        "question_text": "What is the time complexity of Breadth-First Search implemented with an adjacency list representation with V vertices and E edges?",
        "options": ["O(V + E)", "O(V * E)", "O(V^2)", "O(E log V)"],
        "correct_answer": "O(V + E)",
        "difficulty": 3,
        "explanation": "Every vertex is enqueued and dequeued once (O(V)), and every edge is traversed once for directed or twice for undirected graphs (O(E)).",
        "status": "published"
    },
    {
        "topic_code": "DSA-GRAPHS",
        "question_text": "What is the worst-case time complexity of Tarjan's Strongly Connected Components algorithm for a directed graph with V vertices and E edges?",
        "options": ["O(V + E)", "O(V * E)", "O(V^2)", "O(E log V)"],
        "correct_answer": "O(V + E)",
        "difficulty": 3,
        "explanation": "Tarjan's algorithm uses a single depth-first search pass tracking discovery times and low-link values, achieving linear O(V + E) complexity.",
        "status": "draft"
    },
    # SQL
    {
        "topic_code": "SQL-INDEXES",
        "question_text": "Which underlying data structure is standard for primary key indexes in most relational database systems like PostgreSQL and MySQL?",
        "options": ["B+ Tree", "Hash Map", "Linked List", "Binary Heap"],
        "correct_answer": "B+ Tree",
        "difficulty": 2,
        "explanation": "B+ Trees maintain balanced depth, store data pointers exclusively in leaves, and link leaves sequentially for exceptionally fast range scans.",
        "status": "published"
    },
    {
        "topic_code": "SQL-INDEXES",
        "question_text": "What is a major potential downside of placing too many indexes on a database table?",
        "options": ["Slower INSERT, UPDATE, and DELETE operations", "Decreased disk space utilization", "Inability to perform JOINs", "Disabling foreign key constraints"],
        "correct_answer": "Slower INSERT, UPDATE, and DELETE operations",
        "difficulty": 2,
        "explanation": "Every write operation must update not only the table heap but also each existing index tree, adding write latency and IO consumption.",
        "status": "published"
    },
    {
        "topic_code": "SQL-INDEXES",
        "question_text": "How does Write-Ahead Logging (WAL) guarantee durability (ACID) in database crash recovery?",
        "options": [
            "Changes are written to sequential append-only log on disk before dirty buffer pages are flushed",
            "It writes immediately to secondary indexes before updating heap pages",
            "It keeps all table data in RAM and disables disk writes",
            "It periodically compresses table files"
        ],
        "correct_answer": "Changes are written to sequential append-only log on disk before dirty buffer pages are flushed",
        "difficulty": 2,
        "explanation": "Under WAL protocol, log records describing state transitions must reach non-volatile storage before corresponding page modifications are written to database files.",
        "status": "review"
    },
    # Systems
    {
        "topic_code": "SYS-REST",
        "question_text": "Which HTTP method is defined by RFC specifications as idempotent?",
        "options": ["PUT", "POST", "PATCH (non-standard state)", "CONNECT"],
        "correct_answer": "PUT",
        "difficulty": 2,
        "explanation": "An idempotent method can be invoked repeatedly with identical results. PUT replaces the entire target resource state, so multiple identical requests have the same end outcome.",
        "status": "published"
    },
    # ML
    {
        "topic_code": "ML-REGRESSION",
        "question_text": "What distinctive effect does L1 (Lasso) regularization have on feature coefficients compared to L2 (Ridge) regularization?",
        "options": ["It can drive irrelevant coefficients exactly to zero (sparsity)", "It always preserves all features equally", "It prevents linear scaling", "It transforms the problem into a classification model"],
        "correct_answer": "It can drive irrelevant coefficients exactly to zero (sparsity)",
        "difficulty": 2,
        "explanation": "L1 norm geometry features sharp corners at axes in parameter space, causing gradient updates to zero out weights and perform automatic feature selection.",
        "status": "published"
    },
    {
        "topic_code": "ML-CLASSIFICATION",
        "question_text": "In a highly imbalanced medical diagnosis dataset (e.g., 99% negative, 1% positive), which evaluation metric is least informative?",
        "options": ["Raw Accuracy", "Precision", "Recall", "F1-Score"],
        "correct_answer": "Raw Accuracy",
        "difficulty": 2,
        "explanation": "A trivial model that predicts 'negative' for 100% of samples achieves 99% accuracy while failing completely to identify any disease occurrences.",
        "status": "published"
    }
]

RESOURCES_DATA = [
    {
        "topic_code": "DSA-ARRAYS",
        "title": "Mastering Dynamic Arrays & Two Pointers",
        "resource_type": "video",
        "url": "https://www.youtube.com/watch?v=example_arrays",
        "difficulty": 1,
        "estimated_minutes": 20,
        "summary": "Deep dive into memory layout, contiguous allocation, and solving sliding window challenges."
    },
    {
        "topic_code": "DSA-LINKEDLIST",
        "title": "Pointer Mastery: Singly & Doubly Linked Lists",
        "resource_type": "article",
        "url": "https://cipherium.ai/articles/linked-lists-guide",
        "difficulty": 2,
        "estimated_minutes": 25,
        "summary": "Step-by-step visual pointer reassignments and cycle detection strategies."
    },
    {
        "topic_code": "DSA-TREES",
        "title": "Binary Search Trees & Recursive Traversals",
        "resource_type": "cheatsheet",
        "url": "https://cipherium.ai/cheatsheets/bst-traversals",
        "difficulty": 2,
        "estimated_minutes": 15,
        "summary": "Concise diagram of In-order, Pre-order, and Post-order recursive and iterative traversals."
    },
    {
        "topic_code": "DSA-GRAPHS",
        "title": "Graph Algorithms Visualized: BFS vs DFS",
        "resource_type": "video",
        "url": "https://www.youtube.com/watch?v=example_graphs",
        "difficulty": 3,
        "estimated_minutes": 30,
        "summary": "Intuitive breakdown of queue-based BFS and stack/recursive DFS for real-world graphs."
    },
    {
        "topic_code": "SQL-INDEXES",
        "title": "Under the Hood: B-Trees and Query Execution Plans",
        "resource_type": "article",
        "url": "https://cipherium.ai/articles/database-indexing-secrets",
        "difficulty": 2,
        "estimated_minutes": 20,
        "summary": "How database planners leverage index scans, index-only scans, and multi-column indexes."
    },
    {
        "topic_code": "SYS-REST",
        "title": "Clean REST API Architecture & Token Security",
        "resource_type": "article",
        "url": "https://cipherium.ai/articles/clean-rest-apis",
        "difficulty": 2,
        "estimated_minutes": 18,
        "summary": "Best practices for HTTP status codes, stateless JWT tokens, and CORS configuration."
    },
    {
        "topic_code": "ML-REGRESSION",
        "title": "Regularization Techniques: Ridge vs. Lasso Explained",
        "resource_type": "article",
        "url": "https://cipherium.ai/articles/l1-vs-l2-regularization",
        "difficulty": 2,
        "estimated_minutes": 22,
        "summary": "Mathematical intuition and Python Scikit-learn code for shrinking coefficients."
    },
    {
        "topic_code": "ML-CLASSIFICATION",
        "title": "Model Evaluation Metrics: Beyond Raw Accuracy",
        "resource_type": "video",
        "url": "https://www.youtube.com/watch?v=example_metrics",
        "difficulty": 2,
        "estimated_minutes": 25,
        "summary": "Comprehensive overview of Confusion Matrices, Precision, Recall, and ROC Curves."
    }
]


def seed_presentation_demo_data(db):
    """
    Populates comprehensive, production-grade presentation demo data for:
      - student@cipherium.ai (Active Roadmap, Stats Strip, Heatmap, BKT Radar, Tasks, Tutor)
      - admin@cipherium.ai (CMS Questions Lifecycle, User Telemetry, Moderation Feedback)
    Only runs in non-test runtime environments (e.g., live uvicorn server startup).
    """
    if os.environ.get("TESTING") == "true":
        return

    student = db.query(User).filter(User.email == "student@cipherium.ai").first()
    if not student:
        return

    now = datetime.now(timezone.utc)
    today = date.today()
    today_str = today.isoformat()

    # 1. User Settings Profile
    settings = db.query(UserSettings).filter(UserSettings.user_id == student.id).first()
    if not settings:
        settings = UserSettings(
            user_id=student.id,
            target_role="Full-Stack Software Engineer",
            weekly_hours=6,
            difficulty_mode="standard",
            daily_streak_reminder=True,
            diagnostic_quiz_alert=True,
            weak_topic_ping=True,
            notification_retention=True,
            monthly_token_used=14250,
            token_quota=50000
        )
        db.add(settings)
    else:
        settings.target_role = "Full-Stack Software Engineer"
        settings.weekly_hours = 6
        settings.monthly_token_used = max(settings.monthly_token_used or 0, 14250)
        settings.token_quota = 50000
    db.commit()

    # 2. Active Curriculum Study Plan (drives Dashboard HeroBanner & StatCards)
    plans = db.query(StudyPlan).filter(StudyPlan.user_id == student.id).order_by(StudyPlan.updated_at.desc(), StudyPlan.id.desc()).all()
    has_valid_milestones_plan = False
    for p in plans:
        try:
            d = json.loads(p.plan_json)
            if isinstance(d, dict) and "milestones" in d and len(d["milestones"]) > 0:
                has_valid_milestones_plan = True
                break
        except Exception:
            continue

    if not has_valid_milestones_plan:
        demo_plan = {
            "id": "plan-demo-fullstack",
            "subject": "Full-Stack & Systems Engineering",
            "skill_level": "Intermediate",
            "duration_weeks": 4,
            "target_hours_per_week": 6,
            "learning_goal": "Master Algorithms, Scalable Systems & Production APIs",
            "total_estimated_hours": 24.0,
            "completed_hours": 16.5,
            "milestones": [
                {
                    "id": "m-fullstack-1",
                    "stage_number": 1,
                    "title": "Stage 1: Arrays, Two Pointers & Fast Indexing",
                    "description": "Master memory layouts, two-pointer search patterns, and prefix sums for instant lookups.",
                    "estimated_hours": 6.0,
                    "subtopics": [
                        "Contiguous memory layout & amortized O(1) dynamic scaling",
                        "Two-pointer opposite-end search for sorted arrays",
                        "Sliding window pattern for contiguous subarray bounds",
                        "Prefix sum arrays for range query acceleration",
                        "Binary search boundary conditions and bisect patterns"
                    ],
                    "completed_subtopics": [
                        "Contiguous memory layout & amortized O(1) dynamic scaling",
                        "Two-pointer opposite-end search for sorted arrays",
                        "Sliding window pattern for contiguous subarray bounds",
                        "Prefix sum arrays for range query acceleration",
                        "Binary search boundary conditions and bisect patterns"
                    ],
                    "resources": [
                        {
                            "id": "res-demo-arr-1",
                            "title": "Mastering Dynamic Arrays & Two Pointers",
                            "resource_type": "video",
                            "url": "https://www.youtube.com/watch?v=example_arrays",
                            "estimated_minutes": 20,
                            "summary": "Deep dive into memory layout, contiguous allocation, and sliding windows.",
                            "completed": True
                        },
                        {
                            "id": "res-demo-arr-2",
                            "title": "NeetCode - Two Pointer Patterns",
                            "resource_type": "article",
                            "url": "https://neetcode.io/practice",
                            "estimated_minutes": 25,
                            "summary": "Visual pattern diagrams and code walkthroughs.",
                            "completed": True
                        }
                    ],
                    "status": "completed"
                },
                {
                    "id": "m-fullstack-2",
                    "stage_number": 2,
                    "title": "Stage 2: Linked Lists, Dynamic Memory & Pointers",
                    "description": "Pointer mutation, fast/slow cycle detection, and in-place reversing.",
                    "estimated_hours": 5.5,
                    "subtopics": [
                        "Singly and doubly linked lists node pointer operations",
                        "Floyd's Tortoise & Hare cycle detection in O(1) space",
                        "Iterative & recursive in-place linked list reversal",
                        "Sentinel head nodes for edge-case simplification",
                        "Fast/slow pointer median finding"
                    ],
                    "completed_subtopics": [
                        "Singly and doubly linked lists node pointer operations",
                        "Floyd's Tortoise & Hare cycle detection in O(1) space",
                        "Iterative & recursive in-place linked list reversal",
                        "Sentinel head nodes for edge-case simplification",
                        "Fast/slow pointer median finding"
                    ],
                    "resources": [
                        {
                            "id": "res-demo-ll-1",
                            "title": "Pointer Mastery: Singly & Doubly Linked Lists",
                            "resource_type": "article",
                            "url": "https://cipherium.ai/articles/linked-lists-guide",
                            "estimated_minutes": 25,
                            "summary": "Step-by-step visual pointer reassignments and cycle detection.",
                            "completed": True
                        }
                    ],
                    "status": "completed"
                },
                {
                    "id": "m-fullstack-3",
                    "stage_number": 3,
                    "title": "Stage 3: Trees, Binary Search & Database Indexing",
                    "description": "Tree traversals, BST invariants, and how B+ Tree indexes power SQL execution engines.",
                    "estimated_hours": 6.5,
                    "subtopics": [
                        "In-order, Pre-order and Level-order tree traversals",
                        "Binary Search Tree validation and lookup efficiency",
                        "B+ Tree index mechanics and disk I/O page alignment",
                        "Multi-column composite indexes and leftmost prefix rule"
                    ],
                    "completed_subtopics": [
                        "In-order, Pre-order and Level-order tree traversals",
                        "Binary Search Tree validation and lookup efficiency"
                    ],
                    "resources": [
                        {
                            "id": "res-demo-tree-1",
                            "title": "Binary Search Trees & Recursive Traversals",
                            "resource_type": "cheatsheet",
                            "url": "https://cipherium.ai/cheatsheets/bst-traversals",
                            "estimated_minutes": 15,
                            "summary": "Concise diagram of In-order, Pre-order, and Post-order traversals.",
                            "completed": True
                        },
                        {
                            "id": "res-demo-sql-1",
                            "title": "Under the Hood: B-Trees and Query Execution Plans",
                            "resource_type": "article",
                            "url": "https://cipherium.ai/articles/database-indexing-secrets",
                            "estimated_minutes": 20,
                            "summary": "How database planners leverage index scans and multi-column indexes.",
                            "completed": False
                        }
                    ],
                    "status": "in_progress"
                },
                {
                    "id": "m-fullstack-4",
                    "stage_number": 4,
                    "title": "Stage 4: Graph Traversals, Distributed APIs & Rate Limiting",
                    "description": "BFS/DFS exploration, shortest paths, idempotent REST design, and token bucket rate limits.",
                    "estimated_hours": 6.0,
                    "subtopics": [
                        "Adjacency list representations & BFS shortest-path exploration",
                        "DFS cycle detection and topological sorting",
                        "Idempotent REST APIs & HTTP status code contracts",
                        "Token bucket rate limiting and Redis sliding window counters"
                    ],
                    "completed_subtopics": [],
                    "resources": [
                        {
                            "id": "res-demo-graph-1",
                            "title": "Graph Algorithms Visualized: BFS vs DFS",
                            "resource_type": "video",
                            "url": "https://www.youtube.com/watch?v=example_graphs",
                            "estimated_minutes": 30,
                            "summary": "Breakdown of queue-based BFS and recursive DFS.",
                            "completed": False
                        },
                        {
                            "id": "res-demo-sys-1",
                            "title": "Clean REST API Architecture & Token Security",
                            "resource_type": "article",
                            "url": "https://cipherium.ai/articles/clean-rest-apis",
                            "estimated_minutes": 18,
                            "summary": "Best practices for HTTP methods, stateless JWT tokens, and CORS.",
                            "completed": False
                        }
                    ],
                    "status": "pending"
                }
            ],
            "generated_by": "gemini",
            "created_at": (now - timedelta(days=14)).strftime("%Y-%m-%d %H:%M:%S"),
            "updated_at": now.strftime("%Y-%m-%d %H:%M:%S")
        }
        active_plan = StudyPlan(
            user_id=student.id,
            target_hours_per_week=6,
            plan_json=json.dumps(demo_plan),
            created_at=now - timedelta(days=14),
            updated_at=now
        )
        db.add(active_plan)
        db.commit()

    # 3. Daily Tasks for Today
    today_tasks = db.query(DailyTask).filter(
        DailyTask.user_id == student.id,
        DailyTask.date_str == today_str
    ).all()
    has_custom_demo_tasks = any("Arrays" in t.title for t in today_tasks)
    if not has_custom_demo_tasks:
        for t in today_tasks:
            db.delete(t)
        db.commit()

        demo_tasks = [
            {"title": "Review Arrays & Two-Pointer practice quiz", "duration": "15 min", "is_done": False},
            {"title": "Explore B-Tree vs Hash index trade-offs", "duration": "20 min", "is_done": True},
            {"title": "Practice Graph BFS shortest-path challenge", "duration": "30 min", "is_done": False},
            {"title": "Consult AI Tutor on idempotent API patterns", "duration": "15 min", "is_done": False},
        ]
        for t_spec in demo_tasks:
            db.add(DailyTask(
                user_id=student.id,
                title=t_spec["title"],
                duration=t_spec["duration"],
                is_done=t_spec["is_done"],
                date_str=today_str,
                created_at=now - timedelta(hours=4)
            ))
        db.commit()

    # 4. Topic Mastery Scores (Competency Radar & Weak-Topic Cards)
    topics_by_code = {t.code: t for t in db.query(Topic).all()}
    mastery_configs = {
        "DSA-ARRAYS": {"score": 0.88, "status": "strong", "attempts": 12, "correct": 11},
        "DSA-LINKEDLIST": {"score": 0.82, "status": "strong", "attempts": 10, "correct": 8},
        "DSA-TREES": {"score": 0.68, "status": "developing", "attempts": 8, "correct": 5},
        "DSA-GRAPHS": {"score": 0.42, "status": "weak", "attempts": 7, "correct": 3},
        "SQL-INDEXES": {"score": 0.76, "status": "developing", "attempts": 9, "correct": 7},
        "SYS-REST": {"score": 0.92, "status": "strong", "attempts": 10, "correct": 9},
        "ML-REGRESSION": {"score": 0.38, "status": "weak", "attempts": 6, "correct": 2},
        "ML-CLASSIFICATION": {"score": 0.58, "status": "developing", "attempts": 8, "correct": 5},
    }
    for code, conf in mastery_configs.items():
        topic = topics_by_code.get(code)
        if not topic:
            continue
        tm = db.query(TopicMastery).filter(
            TopicMastery.user_id == student.id,
            TopicMastery.topic_id == topic.id
        ).first()
        if not tm:
            tm = TopicMastery(
                user_id=student.id,
                topic_id=topic.id,
                mastery_score=conf["score"],
                status=conf["status"],
                attempt_count=conf["attempts"],
                correct_count=conf["correct"],
                updated_at=now - timedelta(hours=2)
            )
            db.add(tm)
        else:
            tm.mastery_score = conf["score"]
            tm.status = conf["status"]
            tm.attempt_count = conf["attempts"]
            tm.correct_count = conf["correct"]
    db.commit()

    # 5. Spaced Repetition Retention Schedules (2 Due Today)
    retention_configs = {
        "DSA-GRAPHS": {"offset_hours": -3, "stability": 0.45, "reviews": 2},
        "ML-REGRESSION": {"offset_hours": -1, "stability": 0.55, "reviews": 1},
        "DSA-TREES": {"offset_days": 2, "stability": 2.5, "reviews": 3},
        "SQL-INDEXES": {"offset_days": 4, "stability": 4.2, "reviews": 4},
        "DSA-LINKEDLIST": {"offset_days": 5, "stability": 5.0, "reviews": 5},
        "DSA-ARRAYS": {"offset_days": 7, "stability": 7.0, "reviews": 6},
        "SYS-REST": {"offset_days": 12, "stability": 10.5, "reviews": 7},
        "ML-CLASSIFICATION": {"offset_days": 3, "stability": 3.0, "reviews": 3},
    }
    for code, conf in retention_configs.items():
        topic = topics_by_code.get(code)
        if not topic:
            continue
        rs = db.query(ReviewSchedule).filter(
            ReviewSchedule.user_id == student.id,
            ReviewSchedule.topic_id == topic.id
        ).first()
        if "offset_hours" in conf:
            next_rev = now + timedelta(hours=conf["offset_hours"])
        else:
            next_rev = now + timedelta(days=conf["offset_days"])
        if not rs:
            rs = ReviewSchedule(
                user_id=student.id,
                topic_id=topic.id,
                next_review_at=next_rev,
                memory_stability=conf["stability"],
                review_count=conf["reviews"]
            )
            db.add(rs)
        else:
            rs.next_review_at = next_rev
            rs.memory_stability = conf["stability"]
            rs.review_count = conf["reviews"]
    db.commit()

    # 6. Historical Practice Attempts (7-Day Streak & 365-Day Heatmap)
    student_attempts_count = db.query(QuizAttempt).filter(QuizAttempt.user_id == student.id).count()
    if student_attempts_count < 25:
        db.query(QuizAttempt).filter(QuizAttempt.user_id == student.id).delete()
        db.query(QuizSession).filter(QuizSession.user_id == student.id).delete()
        db.commit()

        all_questions = db.query(Question).all()
        q_by_topic = {}
        for q in all_questions:
            q_by_topic.setdefault(q.topic_id, []).append(q)

        # Consecutive active streak: Days 0..6 (today back to 6 days ago)
        # Plus calendar clusters across past months
        day_offsets = [0, 1, 2, 3, 4, 5, 6, 10, 14, 18, 22, 28, 35, 42, 50, 60, 75, 90, 110, 135, 160]
        for offset in day_offsets:
            day_dt = now - timedelta(days=offset, hours=2)
            session = QuizSession(
                user_id=student.id,
                session_type="adaptive",
                status="completed",
                started_at=day_dt - timedelta(minutes=15),
                completed_at=day_dt
            )
            db.add(session)
            db.flush()

            quiz_id_uuid = str(uuid.uuid4())
            num_attempts = 4 if offset in [0, 1, 4, 22, 60] else (3 if offset in [2, 3, 5, 6, 14, 42, 90] else 2)

            for a_idx in range(num_attempts):
                t_idx = (offset + a_idx) % len(topics_by_code)
                t_obj = list(topics_by_code.values())[t_idx]
                qs = q_by_topic.get(t_obj.id, [])
                if not qs:
                    continue
                q_obj = qs[a_idx % len(qs)]
                is_correct = (a_idx % 3 != 0) if t_obj.code in ["DSA-GRAPHS", "ML-REGRESSION"] else (a_idx % 4 != 3)

                try:
                    options_list = json.loads(q_obj.options)
                except Exception:
                    options_list = [q_obj.correct_answer]

                selected_answer = q_obj.correct_answer if is_correct else (
                    options_list[1] if len(options_list) > 1 and options_list[0] == q_obj.correct_answer else options_list[0]
                )

                db.add(QuizAttempt(
                    user_id=student.id,
                    question_id=q_obj.id,
                    session_id=session.id,
                    selected_answer=selected_answer,
                    is_correct=is_correct,
                    time_taken_seconds=12 + (a_idx * 5),
                    quiz_id=quiz_id_uuid,
                    hint_count=1 if not is_correct else 0,
                    is_finalized=True,
                    attempted_at=day_dt - timedelta(minutes=12 - (a_idx * 3))
                ))
        db.commit()

    # 7. Mastery History Timeline Events (BKT Posterior Audit Trail)
    mastery_events_count = db.query(MasteryEvent).filter(MasteryEvent.user_id == student.id).count()
    if mastery_events_count < 10:
        event_specs = [
            ("DSA-ARRAYS", 0.25, 0.48, 6),
            ("DSA-ARRAYS", 0.48, 0.72, 3),
            ("DSA-ARRAYS", 0.72, 0.88, 0),
            ("SYS-REST", 0.30, 0.62, 5),
            ("SYS-REST", 0.62, 0.82, 2),
            ("SYS-REST", 0.82, 0.92, 0),
            ("DSA-TREES", 0.25, 0.48, 4),
            ("DSA-TREES", 0.48, 0.68, 1),
            ("SQL-INDEXES", 0.30, 0.55, 4),
            ("SQL-INDEXES", 0.55, 0.76, 1),
            ("DSA-GRAPHS", 0.25, 0.32, 5),
            ("DSA-GRAPHS", 0.32, 0.42, 2),
            ("ML-REGRESSION", 0.25, 0.38, 3),
        ]
        for t_code, prior, post, days_ago in event_specs:
            t = topics_by_code.get(t_code)
            if not t:
                continue
            db.add(MasteryEvent(
                user_id=student.id,
                topic_id=t.id,
                prior=prior,
                posterior=post,
                event_type="quiz_attempt",
                created_at=now - timedelta(days=days_ago, hours=3)
            ))
        db.commit()

    # 8. Saved Multi-Turn AI Tutor Conversations
    existing_titles = {c.title for c in db.query(TutorConversation).filter_by(user_id=student.id).all()}
    t_arrays = topics_by_code.get("DSA-ARRAYS")
    t_sql = topics_by_code.get("SQL-INDEXES")
    t_sys = topics_by_code.get("SYS-REST")

    if "Optimizing Two-Pointer Approach" not in existing_titles:
        conv1 = TutorConversation(
            user_id=student.id,
            topic_id=t_arrays.id if t_arrays else None,
            title="Optimizing Two-Pointer Approach",
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2, hours=1)
        )
        db.add(conv1)
        db.flush()

        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv1.id,
            role="user",
            message="How do I decide between a sliding window and a two-pointer technique on sorted arrays?",
            topic_id=t_arrays.id if t_arrays else None,
            created_at=now - timedelta(days=2, minutes=10)
        ))
        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv1.id,
            role="assistant",
            message="""Great question! Both techniques run in linear time $O(n)$, but their mechanics differ based on pointer direction:

1. **Two Pointers (Opposite Ends)**:
   - Typically used on **sorted arrays** when finding pairs matching an exact sum or condition.
   - Pointers move *toward each other* (`left` increases, `right` decreases).
   ```python
   def two_sum_sorted(arr, target):
       left, right = 0, len(arr) - 1
       while left < right:
           curr = arr[left] + arr[right]
           if curr == target:
               return [left, right]
           elif curr < target:
               left += 1
           else:
               right -= 1
       return []
   ```

2. **Sliding Window**:
   - Used when searching for **contiguous subarrays** or substrings satisfying a boundary condition (e.g., minimum window size, longest substring).
   - Both pointers typically move in the *same direction* (`right` expands the window, `left` shrinks it).

Would you like to explore an example with negative numbers?""",
            topic_id=t_arrays.id if t_arrays else None,
            latency_ms=185,
            token_count=195,
            created_at=now - timedelta(days=2, minutes=9)
        ))
        db.commit()

    if "Database Indexing & B-Trees" not in existing_titles:
        conv2 = TutorConversation(
            user_id=student.id,
            topic_id=t_sql.id if t_sql else None,
            title="Database Indexing & B-Trees",
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1, hours=3)
        )
        db.add(conv2)
        db.flush()

        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv2.id,
            role="user",
            message="Why do relational databases use B+ trees instead of standard binary search trees?",
            topic_id=t_sql.id if t_sql else None,
            created_at=now - timedelta(days=1, minutes=30)
        ))
        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv2.id,
            role="assistant",
            message="""Relational database storage engines (PostgreSQL, MySQL InnoDB) optimize primarily for **disk I/O and block cache lines**:

- **High Fanout & Low Tree Height**: A standard BST has a fanout of 2, so 1,000,000 rows requires ~20 pointer hops. A B+ Tree node matches a 16KB disk page and holds hundreds of keys, keeping the tree depth strictly between 2 to 4 levels!
- **Contiguous Leaf Chaining**: In a B+ Tree, data pointers live exclusively in leaf nodes, linked as a doubly-linked list. Range queries (`WHERE created_at >= '2026-01-01'`) simply seek to the first leaf and scan sequentially across disk pages without traversing internal nodes.
- **Predictable Disk Block Reads**: Each node retrieval loads an entire page into the buffer pool, maximizing hardware memory bandwidth.

Would you like to examine an `EXPLAIN ANALYZE` execution plan to see an Index Scan in action?""",
            topic_id=t_sql.id if t_sql else None,
            latency_ms=210,
            token_count=215,
            created_at=now - timedelta(days=1, minutes=29)
        ))
        db.commit()

    if "System Design: Rate Limiting Patterns" not in existing_titles:
        conv3 = TutorConversation(
            user_id=student.id,
            topic_id=t_sys.id if t_sys else None,
            title="System Design: Rate Limiting Patterns",
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=5)
        )
        db.add(conv3)
        db.flush()

        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv3.id,
            role="user",
            message="What is the cleanest way to enforce rate limits on high-throughput REST endpoints?",
            topic_id=t_sys.id if t_sys else None,
            created_at=now - timedelta(hours=6, minutes=5)
        ))
        db.add(TutorMessage(
            user_id=student.id,
            conversation_id=conv3.id,
            role="assistant",
            message="""For production REST APIs, the standard industry pattern combines an in-memory Redis cluster with the **Token Bucket** algorithm:

1. **Token Bucket Algorithm**:
   - Each client IP or API key has a bucket refilled at a constant rate $r$ tokens/sec up to capacity $C$.
   - Each incoming request consumes 1 token. If the bucket is empty, respond with `429 Too Many Requests`.

2. **Standard HTTP Response Headers**:
   ```http
   HTTP/1.1 429 Too Many Requests
   Retry-After: 30
   X-RateLimit-Limit: 60
   X-RateLimit-Remaining: 0
   X-RateLimit-Reset: 1730764800
   ```

In FastAPI, this is enforced automatically via SlowAPI middleware using Redis or memory storage.""",
            topic_id=t_sys.id if t_sys else None,
            latency_ms=165,
            token_count=180,
            created_at=now - timedelta(hours=6, minutes=4)
        ))
        db.commit()

    # 9. Admin Moderation Feedback Queue
    feedback_with_comments = db.query(Feedback).filter(Feedback.comment.isnot(None)).count()
    if feedback_with_comments < 3:
        db.add(Feedback(
            user_id=student.id,
            feedback_type="tutor_rating",
            target_id=1,
            rating=1,
            comment="The Socratic guided hints for the two-pointer problem helped me find the invariant on my own!",
            created_at=now - timedelta(days=2)
        ))
        db.add(Feedback(
            user_id=student.id,
            feedback_type="rec_rating",
            target_id=1,
            rating=1,
            comment="The recommended Abdul Bari video on dynamic array reallocation was crystal clear.",
            created_at=now - timedelta(days=3)
        ))
        db.add(Feedback(
            user_id=student.id,
            feedback_type="bug",
            target_id=4,
            rating=0,
            comment="Minor note on graph traversal explanation: would be great to mention recursive call stack depth.",
            created_at=now - timedelta(days=5)
        ))
        db.commit()

    # 10. Multi-Armed Bandit Recommendation Arms
    if db.query(RecommendationArm).filter(RecommendationArm.user_id == student.id).count() == 0:
        bandit_arms = [
            ("res-demo-arr-1", 4.5, 5),
            ("res-demo-ll-1", 4.0, 4),
            ("res-demo-sql-1", 3.8, 3),
            ("res-demo-sys-1", 4.8, 6),
        ]
        for res_id, rwd, pulls in bandit_arms:
            db.add(RecommendationArm(
                user_id=student.id,
                resource_id=res_id,
                reward=rwd,
                pull_count=pulls
            ))
        db.commit()

    # 11. Ensure Draft and Review status questions exist for CMS Moderation
    draft_q = db.query(Question).filter(Question.status == "draft").first()
    if not draft_q and "DSA-GRAPHS" in topics_by_code:
        t = topics_by_code["DSA-GRAPHS"]
        db.add(Question(
            topic_id=t.id,
            question_text="What is the worst-case time complexity of Tarjan's Strongly Connected Components algorithm for a directed graph with V vertices and E edges?",
            options=json.dumps(["O(V + E)", "O(V * E)", "O(V^2)", "O(E log V)"]),
            correct_answer="O(V + E)",
            difficulty=3,
            explanation="Tarjan's algorithm uses a single depth-first search pass tracking discovery times and low-link values, achieving linear O(V + E) complexity.",
            status="draft",
            version=1
        ))
        db.commit()

    review_q = db.query(Question).filter(Question.status == "review").first()
    if not review_q and "SQL-INDEXES" in topics_by_code:
        t = topics_by_code["SQL-INDEXES"]
        db.add(Question(
            topic_id=t.id,
            question_text="How does Write-Ahead Logging (WAL) guarantee durability (ACID) in database crash recovery?",
            options=json.dumps([
                "Changes are written to sequential append-only log on disk before dirty buffer pages are flushed",
                "It writes immediately to secondary indexes before updating heap pages",
                "It keeps all table data in RAM and disables disk writes",
                "It periodically compresses table files"
            ]),
            correct_answer="Changes are written to sequential append-only log on disk before dirty buffer pages are flushed",
            difficulty=2,
            explanation="Under WAL protocol, log records describing state transitions must reach non-volatile storage before corresponding page modifications are written to database files.",
            status="review",
            version=1
        ))
        db.commit()


def seed_database(db):
    # Curated Explore subjects live in the database. A local fixture may seed
    # an empty database, but it is optional and intentionally not committed.
    if db.query(SubjectRoadmap).count() == 0:
        fixture_path = Path(__file__).with_name("subject_roadmaps.json")
        roadmaps = {}
        if fixture_path.exists():
            try:
                with fixture_path.open(encoding="utf-8") as fixture:
                    roadmaps = json.load(fixture)
            except Exception:
                roadmaps = {}
        if not roadmaps:
            roadmaps = {
                "dsa": {
                    "id": "dsa",
                    "title": "Data Structures & Algorithms",
                    "tagline": "Master arrays, pointer manipulation, graphs, and dynamic programming.",
                    "icon": "⚡",
                    "color": "#818CF8",
                    "borderColor": "rgba(99, 102, 241, 0.4)",
                    "bgGlow": "rgba(40, 30, 90, 0.25)",
                    "category": "Core CS",
                    "stages": [
                        {
                            "title": "Stage 1: Arrays, Two Pointers & Hashing",
                            "topics": [
                                {
                                    "id": "dsa-arr-1",
                                    "name": "Static & Dynamic Arrays, Amortized Complexity",
                                    "icon": "📊",
                                    "resources": [
                                        {"title": "Abdul Bari - Array Data Structures", "url": "https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O", "resource_type": "video"}
                                    ]
                                },
                                {
                                    "id": "dsa-arr-2",
                                    "name": "Two-Pointer Techniques & Sliding Windows",
                                    "icon": "🔄",
                                    "resources": [
                                        {"title": "NeetCode - Two Pointer Patterns", "url": "https://neetcode.io/practice", "resource_type": "article"}
                                    ]
                                }
                            ]
                        }
                    ]
                }
            }
        for slug, roadmap in roadmaps.items():
            db.add(SubjectRoadmap(slug=slug, roadmap_json=json.dumps(roadmap)))
        db.commit()

    # Seed Topics if empty
    if db.query(Topic).count() == 0:
        topic_map = {}
        for t_info in TOPICS_DATA:
            topic = Topic(
                code=t_info["code"],
                name=t_info["name"],
                category=t_info["category"],
                description=t_info["description"],
                prerequisites=t_info["prerequisites"]
            )
            db.add(topic)
            db.commit()
            db.refresh(topic)
            topic_map[topic.code] = topic.id

        # Keep the legacy JSON value and normalized graph edges in sync for
        # transitional clients that still consume `Topic.prerequisites`.
        for t_info in TOPICS_DATA:
            for prerequisite_code in json.loads(t_info["prerequisites"]):
                prerequisite_id = topic_map.get(prerequisite_code)
                if prerequisite_id and prerequisite_id != topic_map[t_info["code"]]:
                    db.add(TopicPrerequisite(
                        topic_id=topic_map[t_info["code"]], prerequisite_id=prerequisite_id
                    ))

        # Seed Questions
        for q_info in QUESTIONS_DATA:
            t_id = topic_map.get(q_info["topic_code"])
            if t_id:
                question = Question(
                    topic_id=t_id,
                    question_text=q_info["question_text"],
                    options=json.dumps(q_info["options"]),
                    correct_answer=q_info["correct_answer"],
                    difficulty=q_info["difficulty"],
                    explanation=q_info["explanation"],
                    status=q_info.get("status", "published")
                )
                db.add(question)

        # Seed Resources
        for r_info in RESOURCES_DATA:
            t_id = topic_map.get(r_info["topic_code"])
            if t_id:
                resource = Resource(
                    topic_id=t_id,
                    title=r_info["title"],
                    resource_type=r_info["resource_type"],
                    url=r_info["url"],
                    difficulty=r_info["difficulty"],
                    estimated_minutes=r_info["estimated_minutes"],
                    summary=r_info["summary"]
                )
                db.add(resource)

        db.commit()

    # Seed Default Test User if not exists
    default_user = db.query(User).filter(User.email == "student@cipherium.ai").first()
    if not default_user:
        new_student = User(
            name="Alex Johnson",
            email="student@cipherium.ai",
            password_hash=hash_password("cipherium123"),
            role="student"
        )
        db.add(new_student)
        db.commit()

    # Seed Default Admin User if not exists
    default_admin = db.query(User).filter(User.email == "admin@cipherium.ai").first()
    if not default_admin:
        new_admin = User(
            name="Admin User",
            email="admin@cipherium.ai",
            password_hash=hash_password("admin123"),
            role="admin"
        )
        db.add(new_admin)
        db.commit()

    # Populate rich presentation demo data for live application runs
    seed_presentation_demo_data(db)
