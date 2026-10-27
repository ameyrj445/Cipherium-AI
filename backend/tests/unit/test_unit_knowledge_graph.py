import pytest
import json
from app.services.knowledge_graph import (
    build_curriculum_dag,
    detect_circular_dependencies,
    calculate_topological_depths,
    evaluate_node_states
)

def test_calculate_topological_depths():
    # Linear chain: A -> B -> C
    topics = [
        {"id": 1, "code": "A", "prerequisites": "[]"},
        {"id": 2, "code": "B", "prerequisites": '["A"]'},
        {"id": 3, "code": "C", "prerequisites": '["B"]'},
        {"id": 4, "code": "D", "prerequisites": "[]"}, # independent root
    ]
    depths = calculate_topological_depths(topics)
    assert depths["A"] == 0
    assert depths["B"] == 1
    assert depths["C"] == 2
    assert depths["D"] == 0

def test_detect_circular_dependencies():
    # Circular: A -> B -> C -> A
    cyclic_topics = [
        {"id": 1, "code": "A", "prerequisites": '["C"]'},
        {"id": 2, "code": "B", "prerequisites": '["A"]'},
        {"id": 3, "code": "C", "prerequisites": '["B"]'},
    ]
    has_cycle, cycle_path = detect_circular_dependencies(cyclic_topics)
    assert has_cycle is True
    assert len(cycle_path) > 0

    # Acyclic
    acyclic_topics = [
        {"id": 1, "code": "A", "prerequisites": "[]"},
        {"id": 2, "code": "B", "prerequisites": '["A"]'},
    ]
    has_cycle, _ = detect_circular_dependencies(acyclic_topics)
    assert has_cycle is False

def test_evaluate_node_states_locked_and_unlocked():
    topics = [
        {"id": 1, "code": "DSA-ARRAYS", "name": "Arrays", "prerequisites": "[]"},
        {"id": 2, "code": "DSA-LINKEDLIST", "name": "Linked Lists", "prerequisites": '["DSA-ARRAYS"]'},
        {"id": 3, "code": "DSA-TREES", "name": "Trees", "prerequisites": '["DSA-LINKEDLIST"]'},
    ]
    # Student has not attempted anything
    user_mastery_map = {}
    bkt_map = {}
    nodes = evaluate_node_states(topics, user_mastery_map, bkt_map)

    node_dict = {n["code"]: n for n in nodes}
    # Root is unlocked
    assert node_dict["DSA-ARRAYS"]["status"] == "unlocked"
    assert len(node_dict["DSA-ARRAYS"]["blocked_by"]) == 0

    # Child is locked because parent has no mastery
    assert node_dict["DSA-LINKEDLIST"]["status"] == "locked"
    assert "Arrays" in node_dict["DSA-LINKEDLIST"]["blocked_by"]

    # Grandchild is also locked
    assert node_dict["DSA-TREES"]["status"] == "locked"

def test_evaluate_node_states_transitions_to_mastered_and_unlocked():
    topics = [
        {"id": 1, "code": "DSA-ARRAYS", "name": "Arrays", "prerequisites": "[]"},
        {"id": 2, "code": "DSA-LINKEDLIST", "name": "Linked Lists", "prerequisites": '["DSA-ARRAYS"]'},
    ]
    # Student mastered Arrays (BKT prob = 0.88)
    user_mastery_map = {"DSA-ARRAYS": 0.85}
    bkt_map = {"DSA-ARRAYS": 0.88}
    nodes = evaluate_node_states(topics, user_mastery_map, bkt_map)

    node_dict = {n["code"]: n for n in nodes}
    assert node_dict["DSA-ARRAYS"]["status"] == "mastered"
    # Linked Lists should now be unlocked!
    assert node_dict["DSA-LINKEDLIST"]["status"] == "unlocked"
    assert len(node_dict["DSA-LINKEDLIST"]["blocked_by"]) == 0

def test_build_curriculum_dag_full_structure():
    topics = [
        {"id": 1, "code": "DSA-ARRAYS", "name": "Arrays", "category": "DSA", "description": "Array basics", "prerequisites": "[]"},
        {"id": 2, "code": "DSA-LINKEDLIST", "name": "Linked Lists", "category": "DSA", "description": "Pointer chains", "prerequisites": '["DSA-ARRAYS"]'},
    ]
    graph = build_curriculum_dag(topics, user_masteries={}, bkt_states={})
    assert "nodes" in graph
    assert "edges" in graph
    assert "total_nodes" in graph
    assert graph["total_nodes"] == 2
    assert len(graph["edges"]) == 1
    assert graph["edges"][0]["source_code"] == "DSA-ARRAYS"
    assert graph["edges"][0]["target_code"] == "DSA-LINKEDLIST"
