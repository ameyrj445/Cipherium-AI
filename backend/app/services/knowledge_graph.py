"""
Knowledge Graph Service: Constructs and evaluates curriculum Directed Acyclic Graphs (DAG),
computes topological depths, detects circular dependencies, and resolves student lock/unlock states.
"""
from typing import List, Dict, Any, Tuple, Optional
import json

def parse_prerequisites(prereqs: Any) -> List[str]:
    """Safely parses prerequisite codes into a list of strings."""
    if not prereqs:
        return []
    if isinstance(prereqs, list):
        return [str(p).strip() for p in prereqs if p]
    if isinstance(prereqs, str):
        try:
            parsed = json.loads(prereqs)
            if isinstance(parsed, list):
                return [str(p).strip() for p in parsed if p]
        except (json.JSONDecodeError, TypeError):
            # Fallback for comma-separated string
            return [p.strip() for p in prereqs.split(",") if p.strip()]
    return []

def calculate_topological_depths(topics: List[Any]) -> Dict[str, int]:
    """
    Computes topological depth layers using Kahn's algorithm.
    Root nodes with 0 prerequisites are placed at depth 0.
    Direct child nodes are placed at depth 1, etc.
    """
    code_map = {}
    graph: Dict[str, List[str]] = {}
    in_degree: Dict[str, int] = {}
    depths: Dict[str, int] = {}

    for t in topics:
        code = t.get("code") if isinstance(t, dict) else getattr(t, "code", "")
        if not code:
            continue
        code_map[code] = t
        graph[code] = []
        in_degree[code] = 0
        depths[code] = 0

    for t in topics:
        target_code = t.get("code") if isinstance(t, dict) else getattr(t, "code", "")
        prereqs_val = t.get("prerequisites") if isinstance(t, dict) else getattr(t, "prerequisites", "[]")
        prereqs = parse_prerequisites(prereqs_val)

        for src in prereqs:
            if src in graph and src != target_code:
                graph[src].append(target_code)
                in_degree[target_code] = in_degree.get(target_code, 0) + 1

    # Queue of nodes with in_degree == 0
    queue = [code for code, deg in in_degree.items() if deg == 0]

    while queue:
        curr = queue.pop(0)
        curr_depth = depths[curr]

        for neighbor in graph.get(curr, []):
            depths[neighbor] = max(depths[neighbor], curr_depth + 1)
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    return depths

def detect_circular_dependencies(topics: List[Any]) -> Tuple[bool, List[str]]:
    """
    Checks for circular dependency cycles using 3-color Depth-First Search.
    Returns (has_cycle: bool, cycle_path: List[str]).
    """
    graph: Dict[str, List[str]] = {}
    for t in topics:
        code = t.get("code") if isinstance(t, dict) else getattr(t, "code", "")
        prereqs_val = t.get("prerequisites") if isinstance(t, dict) else getattr(t, "prerequisites", "[]")
        graph[code] = parse_prerequisites(prereqs_val)

    # 0 = unvisited, 1 = visiting, 2 = visited
    state: Dict[str, int] = {k: 0 for k in graph}
    path: List[str] = []

    def dfs(node: str) -> Optional[List[str]]:
        state[node] = 1
        path.append(node)

        for parent in graph.get(node, []):
            if parent not in state:
                continue
            if state[parent] == 1:
                idx = path.index(parent)
                return path[idx:] + [parent]
            if state[parent] == 0:
                cycle = dfs(parent)
                if cycle:
                    return cycle

        path.pop()
        state[node] = 2
        return None

    for node in graph:
        if state[node] == 0:
            cycle = dfs(node)
            if cycle:
                return True, cycle

    return False, []

def evaluate_node_states(
    topics: List[Any],
    user_mastery_map: Dict[str, float],
    bkt_map: Dict[str, float],
    passing_bkt: float = 0.70,
    passing_mastery: float = 0.50
) -> List[Dict[str, Any]]:
    """
    Resolves the status of each topic node:
    - 'mastered': Student has demonstrated mastery on this topic (BKT >= 0.85 or mastery >= 0.75).
    - 'unlocked': All prerequisite concepts are satisfied, ready to learn.
    - 'locked': Blocked by one or more unmet prerequisite topics.
    """
    depths = calculate_topological_depths(topics)
    nodes = []

    # Map codes to topic objects
    topic_by_code = {}
    for t in topics:
        code = t.get("code") if isinstance(t, dict) else getattr(t, "code", "")
        topic_by_code[code] = t

    for t in topics:
        code = t.get("code") if isinstance(t, dict) else getattr(t, "code", "")
        name = t.get("name") if isinstance(t, dict) else getattr(t, "name", "")
        tid = t.get("id") if isinstance(t, dict) else getattr(t, "id", 0)
        cat = t.get("category") if isinstance(t, dict) else getattr(t, "category", "General")
        desc = t.get("description") if isinstance(t, dict) else getattr(t, "description", "")
        prereqs_val = t.get("prerequisites") if isinstance(t, dict) else getattr(t, "prerequisites", "[]")
        prereqs = parse_prerequisites(prereqs_val)

        m_score = float(user_mastery_map.get(code, 0.0))
        bkt_score = float(bkt_map.get(code, 0.20))

        is_mastered = (bkt_score >= 0.85) or (m_score >= 0.75)

        # Check prerequisite constraints
        blocked_by = []
        for p_code in prereqs:
            p_m = float(user_mastery_map.get(p_code, 0.0))
            p_bkt = float(bkt_map.get(p_code, 0.20))
            p_satisfied = (p_bkt >= passing_bkt) or (p_m >= passing_mastery)
            if not p_satisfied:
                t_parent = topic_by_code.get(p_code)
                p_name = None
                if t_parent is not None:
                    p_name = t_parent.get("name") if isinstance(t_parent, dict) else getattr(t_parent, "name", None)
                blocked_by.append(p_name or p_code)

        if blocked_by:
            status = "locked"
        elif is_mastered:
            status = "mastered"
        else:
            status = "unlocked"

        nodes.append({
            "id": tid,
            "code": code,
            "name": name,
            "category": cat,
            "description": desc,
            "depth": depths.get(code, 0),
            "status": status,
            "mastery_score": m_score,
            "bkt_probability": bkt_score,
            "blocked_by": blocked_by,
            "prerequisites": prereqs
        })

    return nodes

def build_curriculum_dag(
    topics: List[Any],
    user_masteries: Optional[Dict[str, float]] = None,
    bkt_states: Optional[Dict[str, float]] = None
) -> Dict[str, Any]:
    """
    Assembles the complete Knowledge Graph representation with nodes, directed edges,
    and aggregate stats.
    """
    u_mastery = user_masteries or {}
    b_states = bkt_states or {}

    nodes = evaluate_node_states(topics, u_mastery, b_states)
    edges = []

    topic_id_by_code = {n["code"]: n["id"] for n in nodes}

    for n in nodes:
        target_code = n["code"]
        target_id = n["id"]
        for src_code in n["prerequisites"]:
            if src_code in topic_id_by_code:
                edges.append({
                    "source": topic_id_by_code[src_code],
                    "target": target_id,
                    "source_code": src_code,
                    "target_code": target_code
                })

    mastered_cnt = sum(1 for n in nodes if n["status"] == "mastered")
    unlocked_cnt = sum(1 for n in nodes if n["status"] == "unlocked")
    locked_cnt = sum(1 for n in nodes if n["status"] == "locked")

    return {
        "nodes": nodes,
        "edges": edges,
        "total_nodes": len(nodes),
        "mastered_count": mastered_cnt,
        "unlocked_count": unlocked_cnt,
        "locked_count": locked_cnt
    }
