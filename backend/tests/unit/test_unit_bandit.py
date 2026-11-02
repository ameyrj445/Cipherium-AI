from app.services.bandit import choose_resource


class FixedRng:
    def __init__(self, value, choice_index=0):
        self.value = value
        self.choice_index = choice_index

    def random(self):
        return self.value

    def choice(self, values):
        return values[self.choice_index]


def test_bandit_exploration_chooses_random_candidate():
    candidates = [{"id": 1, "relevance_score": 0.9}, {"id": 2, "relevance_score": 0.2}]

    chosen = choose_resource(candidates, {"1": 100.0}, rng=FixedRng(0.05, choice_index=1))

    assert chosen["id"] == 2


def test_bandit_exploitation_chooses_highest_reward_arm():
    candidates = [{"id": 1, "relevance_score": 0.9}, {"id": 2, "relevance_score": 0.2}]

    chosen = choose_resource(candidates, {"1": 1.0, "2": 5.0}, rng=FixedRng(0.5))

    assert chosen["id"] == 2
