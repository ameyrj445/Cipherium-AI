from app.models import Topic, TopicPrerequisite
from app.services.knowledge_graph import calculate_topological_depths, detect_circular_dependencies


def test_graph_uses_normalized_prerequisite_edges(db_session):
    root = Topic(code="JUNCTION-ROOT", name="Root", prerequisites="[]")
    child = Topic(code="JUNCTION-CHILD", name="Child", prerequisites="[]")
    db_session.add_all([root, child])
    db_session.flush()
    db_session.add(TopicPrerequisite(topic_id=child.id, prerequisite_id=root.id))
    db_session.flush()

    depths = calculate_topological_depths([root, child])
    assert depths["JUNCTION-ROOT"] == 0
    assert depths["JUNCTION-CHILD"] == 1

    db_session.add(TopicPrerequisite(topic_id=root.id, prerequisite_id=child.id))
    db_session.flush()
    db_session.expire_all()
    has_cycle, _ = detect_circular_dependencies([root, child])
    assert has_cycle is True
