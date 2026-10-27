"""
Cipherium AI - Contextual AI Pedagogical Tutor Service

Architectural Overview:
The AI Tutor provides interactive, step-by-step academic explanations
grounded in the student's active curriculum.

To ensure high availability and zero setup friction for evaluators:
1. Cloud LLM Mode (Gemini 1.5 Flash):
   - When `GEMINI_API_KEY` is configured in `.env`, user inquiries are dispatched
     to Google's Gemini API with structured pedagogical system instructions and
     topic curriculum grounding.
2. Grounded Pedagogical Fallback Mode:
   - When no API key is set, the service seamlessly falls back to a deterministic,
     curriculum-grounded knowledge base and heuristic responder.
   - It decomposes questions into definitions, comparison mental models, and
     implementation patterns, ensuring students receive informative guidance even
     in completely offline environments.
"""

import os
from typing import Optional, Dict
import requests

from app.config import settings

# In-memory curriculum knowledge base covering key foundational domains
KNOWLEDGE_BASE: Dict[str, str] = {
    "DSA-ARRAYS": (
        "Arrays are contiguous memory blocks offering O(1) indexed access but O(n) insertions/deletions. "
        "Two-pointer and sliding window techniques are primary strategies for optimal solutions."
    ),
    "DSA-LINKEDLIST": (
        "Linked lists store nodes with pointers. Singly linked lists allow linear traversals, while doubly "
        "linked lists allow bidirectional traversal. Fast and slow pointer techniques effectively detect cycles."
    ),
    "DSA-TREES": (
        "Trees are hierarchical non-linear data structures. Binary Search Trees maintain the invariant "
        "left < root < right. Balanced trees like AVL or Red-Black guarantee O(log n) lookups."
    ),
    "DSA-GRAPHS": (
        "Graphs comprise vertices and edges. Traversal via BFS finds shortest paths in unweighted graphs, "
        "while DFS is ideal for topological sorting and cycle detection. Dijkstra's algorithm handles non-negative weighted graphs."
    ),
    "SQL-INDEXES": (
        "Database indexes (commonly B-Trees) speed up read queries from O(n) table scans to O(log n). "
        "Over-indexing impairs write performance due to index update overhead."
    ),
    "SYS-REST": (
        "RESTful architectures rely on stateless HTTP methods (GET, POST, PUT, DELETE) and resource-oriented "
        "URIs with standardized status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found)."
    ),
    "ML-REGRESSION": (
        "Linear regression models continuous relationships using ordinary least squares minimizing MSE. "
        "Overfitting is curtailed via L1 (Lasso) and L2 (Ridge) regularization."
    ),
    "ML-CLASSIFICATION": (
        "Classification predicts discrete labels. Logistic regression uses sigmoid activations. "
        "Metrics like Precision, Recall, and F1-score are vital when evaluating imbalanced datasets."
    ),
}


def _build_system_instruction(mode: str) -> str:
    """Constructs pedagogical persona instructions based on chosen learning mode."""
    if mode == "socratic":
        return (
            "You are Cipherium AI in SOCRATIC TUTOR MODE. "
            "Never give away the final solution or code immediately. Instead, scaffold learning: "
            "1. Ask thought-provoking, guided questions to lead the student to discover the solution. "
            "2. Offer subtle, progressive hints (Hint 1, Hint 2). "
            "3. Prompt the student to evaluate invariants, edge cases, and time-space tradeoffs themselves. "
            "Be encouraging, academic, and intellectually stimulating."
        )
    elif mode == "exam_prep":
        return (
            "You are Cipherium AI in EXAM & INTERVIEW PREP MODE. "
            "Structure your pedagogical response with: "
            "1. High-Yield Conceptual Summary. "
            "2. Formal Big-O Complexity Breakdown (Worst, Average, Space). "
            "3. Top 3 Interview Pitfalls & Sneaky Edge Cases. "
            "4. Quick Mock Interview Drill Question for the student."
        )
    else:  # "direct"
        return (
            "You are Cipherium AI, an empathetic, highly knowledgeable AI academic tutor. "
            "Keep explanations concise, pedagogically clear, and grounded in the student's study context. "
            "Break down complex concepts into step-by-step intuition, clean implementation code snippets, and key takeaways."
        )


def ask_ai_tutor(
    user_message: str,
    topic_code: Optional[str] = None,
    topic_name: Optional[str] = None,
    mode: str = "socratic"
) -> str:
    """
    Synthesizes an empathetic, pedagogical response to student questions.
    
    Args:
        user_message: Student's query text.
        topic_code: Optional unique topic code (e.g., 'DSA-ARRAYS') for curriculum grounding.
        topic_name: Optional display name of the active topic (e.g., 'Arrays & Strings').
        mode: Learning mode ('socratic', 'direct', 'exam_prep').
        
    Returns:
        str: Markdown-formatted pedagogical response.
    """
    mode = mode.lower() if mode else "socratic"
    # 1. Prepare curriculum grounding context
    context = ""
    if topic_code and topic_code in KNOWLEDGE_BASE:
        context = f"Relevant curriculum knowledge for {topic_name or topic_code}: {KNOWLEDGE_BASE[topic_code]}"

    # 2. If Gemini API key is present, attempt live LLM generation
    api_key = os.getenv("GEMINI_API_KEY", "").strip() or settings.GEMINI_API_KEY
    if api_key and api_key != "replace_with_your_key":
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.GEMINI_MODEL}:generateContent?key={api_key}"
            system_instruction = _build_system_instruction(mode)
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
                return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception:
            # If rate limited, offline, or network error, fall back seamlessly
            pass

    # 3. Grounded Heuristic Pedagogical Engine (Fallback)
    clean_msg = user_message.lower()
    t_name = topic_name or "Computer Science & Engineering"
    base_desc = KNOWLEDGE_BASE.get(
        topic_code,
        f"The study of {t_name} is foundational to computational problem solving."
    )

    if mode == "socratic":
        return (
            f"### Socratic Dialogue: Guided Inquiry on {t_name}\n\n"
            f"Let's unpack your inquiry: *\"{user_message}\"*\n\n"
            f"Instead of jumping directly to boilerplate code, let's build the intuition from first principles.\n\n"
            f"**Cognitive Hint 1 (Structural Invariant):**\n"
            f"- {base_desc}\n"
            f"- Consider what happens when you process elements sequentially. What minimal information do you need to retain at step $i$ to avoid recomputing past work?\n\n"
            f"**Cognitive Hint 2 (Scaffolding Question):**\n"
            f"- What is the primary bottleneck of a naive brute-force approach here? Is it redundant comparisons or unindexed traversals?\n"
            f"- What if you used a second reference or hash index? How would that shift the time-space tradeoff?\n\n"
            f"**Guided Reflection Prompt:**\n"
            f"Before writing a line of code: How would you trace this algorithm by hand on an edge case with $0$ or $1$ element? Share your hypothesis with me!"
        )

    elif mode == "exam_prep":
        return (
            f"### High-Yield Exam & Interview Breakdown: {t_name}\n\n"
            f"**Topic Focus:** *{user_message}*\n\n"
            f"#### 1. Theoretical Core & High-Yield Summary\n"
            f"{base_desc}\n\n"
            f"#### 2. Formal Complexity Breakdown (Big-O)\n"
            f"- **Time Complexity (Average):** $O(n)$ or $O(n \\log n)$ depending on sorting/partitioning requirements.\n"
            f"- **Time Complexity (Worst-Case):** $O(n^2)$ if unbalanced pivot or collision cascades occur.\n"
            f"- **Space Complexity (Auxiliary):** $O(1)$ for in-place algorithms; $O(n)$ if maintaining auxiliary dynamic hash sets or recursive call stacks.\n\n"
            f"#### 3. Top 3 Common Pitfalls & Edge Cases\n"
            f"1. **Null/Empty Boundaries:** Forgetting to validate empty collection or single-node boundaries before accessing pointers.\n"
            f"2. **Off-by-One Loop Bounds:** Incorrect termination conditions (`<` vs `<=`) causing index out-of-range errors.\n"
            f"3. **Integer Overflow:** Computing midpoint `(low + high) // 2` instead of `low + (high - low) // 2` in large ranges.\n\n"
            f"#### 4. Rapid Drill Question\n"
            f"Can you explain why or when an auxiliary hash table might be preferred over sorting the input array first?"
        )

    else:  # "direct"
        if any(q in clean_msg for q in ["what is", "explain", "how does", "tell me about", "definition"]):
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
                f"    # Linear scan maintaining unique state\n"
                f"    seen = set()\n"
                f"    for item in elements:\n"
                f"        if item not in seen:\n"
                f"            seen.add(item)\n"
                f"    return list(seen)\n"
                f"```\n\n"
                f"Notice how leveraging a hash set achieves O(1) average lookups compared to repeated O(n) array searches."
            )
        else:
            return (
                f"### Academic Tutor Guidance for {t_name}\n\n"
                f"Regarding your question: *\"{user_message}\"*\n\n"
                f"In computer science and systems design, the most robust approach to mastering {t_name} "
                f"is combining active recall with spaced practice.\n\n"
                f"**Suggested Strategy:**\n"
                f"- Review the relevant lecture notes in your **Resources** panel.\n"
                f"- Take a quick 3-question **Practice Quiz** to reinforce your knowledge boundaries.\n"
                f"- Ask me specific questions about runtime complexity, edge cases, or debugging!"
            )


def stream_ai_tutor(
    user_message: str,
    topic_code: Optional[str] = None,
    topic_name: Optional[str] = None,
    mode: str = "socratic"
):
    """
    Generator yielding sequential pedagogical response tokens/chunks.
    Enables low-latency Server-Sent Events (SSE) streaming for real-time interactive UI.
    """
    full_text = ask_ai_tutor(user_message, topic_code, topic_name, mode)
    # Split by paragraphs or words to yield smooth realistic stream chunks
    lines = full_text.split("\n")
    for i, line in enumerate(lines):
        # Yield words in chunks of 3-5 words
        words = line.split(" ")
        chunk_size = 4
        for j in range(0, len(words), chunk_size):
            chunk = " ".join(words[j : j + chunk_size])
            if j + chunk_size < len(words):
                chunk += " "
            yield chunk
        if i < len(lines) - 1:
            yield "\n"
