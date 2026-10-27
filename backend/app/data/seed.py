import json
from pathlib import Path
from app.models import Topic, Question, Resource, SubjectRoadmap, User
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
        "explanation": "Dynamic arrays double their capacity when full, spreading out memory reallocation costs so that individual append operations take O(1) amortized time."
    },
    {
        "topic_code": "DSA-ARRAYS",
        "question_text": "Which algorithmic technique is optimal for finding a contiguous subarray that sums to a target in an array containing only positive integers?",
        "options": ["Sliding Window (Two Pointers)", "Dijkstra's Algorithm", "Binary Exponentiation", "Depth First Search"],
        "correct_answer": "Sliding Window (Two Pointers)",
        "difficulty": 2,
        "explanation": "Because all numbers are positive, expanding the right pointer monotonically increases the sum, and shrinking the left pointer monotonically decreases it, enabling O(n) runtime."
    },
    {
        "topic_code": "DSA-ARRAYS",
        "question_text": "In a 2D sorted matrix where each row and column is sorted in ascending order, what is the most optimal search time complexity starting from the top-right corner?",
        "options": ["O(m + n)", "O(m * n)", "O(log(m * n))", "O(m log n)"],
        "correct_answer": "O(m + n)",
        "difficulty": 3,
        "explanation": "From the top-right corner, if the target is smaller, we move left; if larger, we move down. This eliminates an entire row or column in each step, taking O(m + n) time."
    },
    # Linked Lists
    {
        "topic_code": "DSA-LINKEDLIST",
        "question_text": "What is Floyd's Cycle-Finding Algorithm (Tortoise and Hare) space complexity for detecting a loop in a linked list?",
        "options": ["O(1)", "O(n)", "O(log n)", "O(n^2)"],
        "correct_answer": "O(1)",
        "difficulty": 2,
        "explanation": "Floyd's algorithm uses only two pointer references (slow moving 1 step, fast moving 2 steps), requiring O(1) auxiliary space without hash tables."
    },
    {
        "topic_code": "DSA-LINKEDLIST",
        "question_text": "When reversing a singly linked list in-place iteratively, how many auxiliary pointer variables are typically required?",
        "options": ["3 pointers (prev, curr, next)", "1 pointer", "None (0 pointers)", "An array of pointers"],
        "correct_answer": "3 pointers (prev, curr, next)",
        "difficulty": 2,
        "explanation": "Standard in-place reversal maintains a pointer to the previous node, current node, and temporarily holds the next node before modifying curr.next."
    },
    # Trees
    {
        "topic_code": "DSA-TREES",
        "question_text": "Which tree traversal order yields node values in strictly ascending numerical order for a valid Binary Search Tree (BST)?",
        "options": ["In-order Traversal (Left, Root, Right)", "Pre-order Traversal (Root, Left, Right)", "Post-order Traversal (Left, Right, Root)", "Level-order Traversal"],
        "correct_answer": "In-order Traversal (Left, Root, Right)",
        "difficulty": 2,
        "explanation": "In a BST, all keys in the left subtree are smaller than the root, and all keys in the right are greater. Visiting Left -> Root -> Right yields keys in sorted order."
    },
    {
        "topic_code": "DSA-TREES",
        "question_text": "What is the worst-case lookup time complexity in an unbalanced, skewed Binary Search Tree with n nodes?",
        "options": ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
        "correct_answer": "O(n)",
        "difficulty": 2,
        "explanation": "If elements are inserted in strictly sorted order without balancing, the BST degenerates into a linear linked list with O(n) search time."
    },
    # Graphs
    {
        "topic_code": "DSA-GRAPHS",
        "question_text": "Which graph traversal algorithm guarantees the shortest path between two nodes in an unweighted graph?",
        "options": ["Breadth-First Search (BFS)", "Depth-First Search (DFS)", "Topological Sort", "Kruskal's Algorithm"],
        "correct_answer": "Breadth-First Search (BFS)",
        "difficulty": 2,
        "explanation": "BFS explores vertices level by level in order of distance from the source node, ensuring the first time a destination is reached, the path length is minimal."
    },
    {
        "topic_code": "DSA-GRAPHS",
        "question_text": "What is the time complexity of Breadth-First Search implemented with an adjacency list representation with V vertices and E edges?",
        "options": ["O(V + E)", "O(V * E)", "O(V^2)", "O(E log V)"],
        "correct_answer": "O(V + E)",
        "difficulty": 3,
        "explanation": "Every vertex is enqueued and dequeued once (O(V)), and every edge is traversed once for directed or twice for undirected graphs (O(E))."
    },
    # SQL
    {
        "topic_code": "SQL-INDEXES",
        "question_text": "Which underlying data structure is standard for primary key indexes in most relational database systems like PostgreSQL and MySQL?",
        "options": ["B+ Tree", "Hash Map", "Linked List", "Binary Heap"],
        "correct_answer": "B+ Tree",
        "difficulty": 2,
        "explanation": "B+ Trees maintain balanced depth, store data pointers exclusively in leaves, and link leaves sequentially for exceptionally fast range scans."
    },
    {
        "topic_code": "SQL-INDEXES",
        "question_text": "What is a major potential downside of placing too many indexes on a database table?",
        "options": ["Slower INSERT, UPDATE, and DELETE operations", "Decreased disk space utilization", "Inability to perform JOINs", "Disabling foreign key constraints"],
        "correct_answer": "Slower INSERT, UPDATE, and DELETE operations",
        "difficulty": 2,
        "explanation": "Every write operation must update not only the table heap but also each existing index tree, adding write latency and IO consumption."
    },
    # Systems
    {
        "topic_code": "SYS-REST",
        "question_text": "Which HTTP method is defined by RFC specifications as idempotent?",
        "options": ["PUT", "POST", "PATCH (non-standard state)", "CONNECT"],
        "correct_answer": "PUT",
        "difficulty": 2,
        "explanation": "An idempotent method can be invoked repeatedly with identical results. PUT replaces the entire target resource state, so multiple identical requests have the same end outcome."
    },
    # ML
    {
        "topic_code": "ML-REGRESSION",
        "question_text": "What distinctive effect does L1 (Lasso) regularization have on feature coefficients compared to L2 (Ridge) regularization?",
        "options": ["It can drive irrelevant coefficients exactly to zero (sparsity)", "It always preserves all features equally", "It prevents linear scaling", "It transforms the problem into a classification model"],
        "correct_answer": "It can drive irrelevant coefficients exactly to zero (sparsity)",
        "difficulty": 2,
        "explanation": "L1 norm geometry features sharp corners at axes in parameter space, causing gradient updates to zero out weights and perform automatic feature selection."
    },
    {
        "topic_code": "ML-CLASSIFICATION",
        "question_text": "In a highly imbalanced medical diagnosis dataset (e.g., 99% negative, 1% positive), which evaluation metric is least informative?",
        "options": ["Raw Accuracy", "Precision", "Recall", "F1-Score"],
        "correct_answer": "Raw Accuracy",
        "difficulty": 2,
        "explanation": "A trivial model that predicts 'negative' for 100% of samples achieves 99% accuracy while failing completely to identify any disease occurrences."
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
                    explanation=q_info["explanation"]
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
