import os
import json
from typing import Optional, List, Dict
import requests

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

# Fallback intelligent contextual knowledge base for topics
KNOWLEDGE_BASE: Dict[str, str] = {
    "DSA-ARRAYS": "Arrays are contiguous memory blocks offering O(1) indexed access but O(n) insertions/deletions. Two-pointer and sliding window techniques are primary strategies for optimal solutions.",
    "DSA-LINKEDLIST": "Linked lists store nodes with pointers. Singly linked lists allow linear traversals, while doubly linked lists allow bidirectional traversal. Fast and slow pointer techniques effectively detect cycles.",
    "DSA-TREES": "Trees are hierarchical non-linear data structures. Binary Search Trees maintain the invariant left < root < right. Balanced trees like AVL or Red-Black guarantee O(log n) lookups.",
    "DSA-GRAPHS": "Graphs comprise vertices and edges. Traversal via BFS finds shortest paths in unweighted graphs, while DFS is ideal for topological sorting and cycle detection. Dijkstra's handles non-negative weighted graphs.",
    "SQL-INDEXES": "Database indexes (commonly B-Trees) speed up read queries from O(n) table scans to O(log n). Over-indexing impairs write performance due to index update overhead.",
    "SYS-REST": "RESTful architectures rely on stateless HTTP methods (GET, POST, PUT, DELETE) and resource-oriented URIs with standardized status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found).",
    "ML-REGRESSION": "Linear regression models continuous relationships using ordinary least squares minimizing MSE. Overfitting is curtailed via L1 (Lasso) and L2 (Ridge) regularization.",
    "ML-CLASSIFICATION": "Classification predicts discrete labels. Logistic regression uses sigmoid activations. Metrics like Precision, Recall, and F1-score are vital when evaluating imbalanced datasets."
}

def ask_ai_tutor(user_message: str, topic_code: Optional[str] = None, topic_name: Optional[str] = None) -> str:
    """
    Calls the Gemini API if GEMINI_API_KEY is configured.
    Otherwise, uses an intelligent pedagogical tutor engine grounded in syllabus context.
    """
    context = ""
    if topic_code and topic_code in KNOWLEDGE_BASE:
        context = f"Relevant curriculum knowledge for {topic_name or topic_code}: {KNOWLEDGE_BASE[topic_code]}"

    if GEMINI_API_KEY and GEMINI_API_KEY != "replace_with_your_key":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
            system_instruction = (
                "You are Cipherium AI, an empathetic, highly knowledgeable AI academic tutor. "
                "Keep explanations concise, pedagogically clear, and grounded in the student's study context. "
                "Break down complex concepts into step-by-step intuition, code snippets if requested, and key takeaways."
            )
            payload = {
                "contents": [
                    {
                        "parts": [
                            {"text": f"{system_instruction}\nContext: {context}\nStudent asks: {user_message}"}
                        ]
                    }
                ]
            }
            resp = requests.post(url, json=payload, timeout=8)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
        except Exception as e:
            # Fall back to internal pedagogical generation
            pass

    # Intelligent contextual pedagogical responder
    clean_msg = user_message.lower()
    t_name = topic_name or "Computer Science & Engineering"
    
    if any(q in clean_msg for q in ["what is", "explain", "how does", "tell me about", "definition"]):
        base_desc = KNOWLEDGE_BASE.get(topic_code, f"The study of {t_name} is foundational to computational problem solving.")
        return (
            f"### Understanding {t_name}\n\n"
            f"{base_desc}\n\n"
            f"**Key Mental Model:**\n"
            f"1. **Core Concept:** When breaking down problems in this domain, always identify the time-space tradeoffs.\n"
            f"2. **Practical Application:** Start by constructing a brute-force approach, identify the bottleneck, and apply structured patterns.\n"
            f"3. **Next Step:** Try solving the corresponding diagnostic quiz questions in your dashboard to test your intuition!"
        )
    elif any(w in clean_msg for w in ["why", "when to use", "difference"]):
        return (
            f"### Choosing the Right Pattern in {t_name}\n\n"
            f"A common point of confusion is selecting between different algorithmic or structural trade-offs.\n\n"
            f"- **Speed vs. Memory:** In-memory caching/indexing dramatically accelerates query response times at the expense of storage and write overhead.\n"
            f"- **Edge Cases:** Always evaluate boundaries (empty inputs, single-element data, extreme values).\n\n"
            f"Check the curated learning resources tab in your Cipherium dashboard for step-by-step visual walkthroughs."
        )
    elif any(w in clean_msg for w in ["example", "code", "implementation"]):
        return (
            f"### Code Example & Implementation Pattern\n\n"
            f"Here is a clean implementation pattern relevant to {t_name}:\n\n"
            f"```python\n"
            f"# Efficient pattern for {t_name}\n"
            f"def process_data(elements):\n"
            f"    if not elements:\n"
            f"        return None\n"
            f"    \n"
            f"    # Linear scan maintaining state\n"
            f"    seen = set()\n"
            f"    for item in elements:\n"
            f"        if item not in seen:\n"
            f"            seen.add(item)\n"
            f"    return list(seen)\n"
            f"```\n\n"
            f"Notice how leveraging a set achieves O(1) average lookups compared to repeated O(n) array searches."
        )
    else:
        return (
            f"### Academic Tutor Guidance for {t_name}\n\n"
            f"Regarding your question: *\"{user_message}\"*\n\n"
            f"To master this area effectively:\n"
            f"1. Re-read the foundational concept in your assigned study plan.\n"
            f"2. Solve at least 3 practice questions to build recognition of the underlying pattern.\n"
            f"3. Focus on understanding the error messages and time complexities.\n\n"
            f"Feel free to ask me for specific code examples, trade-offs, or detailed explanations on any sub-topic!"
        )
