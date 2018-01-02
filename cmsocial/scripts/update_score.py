# -*- coding: utf-8 -*-
# Thanks to Federico Glaudo <dario2994@gmail.com> for the scoring algorithm

# Algorithm description:
# difficulty = sqrt(attempts) / sum (score/ability), in [0.1 - 10]
# ability = sum (difficulty*score), normalized to have average 1
# total_score = sum(points)/num_users*ability
# score = 1 if the number of points received in that task is at least 99, else
# score = points/200

import argparse
import math

from cms.db import SessionGen

from cmsocial.db.socialtask import TaskScore, SocialTask
try:
    from cmsocial.db import SocialParticipation as ScoreClass
except:
    # legacy non-multicontest version
    from cmsocial.db.socialuser import SocialUser as ScoreClass


def get_score(s):
    return 1 if s >= 99 else s / 200.


def compute_smart_score(user_to_task, task_to_user):
    maxtask = max(task_to_user.keys()) + 1
    maxuser = max(user_to_task.keys()) + 1
    difficulties = [1. for x in range(maxtask)]
    abilities = [1. for x in range(maxuser)]
    attempts = [len(task_to_user.get(i, [])) for i in range(maxtask)]
    attempts_sqrt = map(math.sqrt, attempts)

    for uid in range(maxuser):
        if len(user_to_task.get(uid, [])) == 0:
            continue
        user_to_task[uid] = list(
            map(lambda x: (x[0], get_score(x[1])), user_to_task.get(uid, [])))
    for tid in range(maxtask):
        if len(task_to_user.get(tid, [])) == 0:
            continue
        task_to_user[tid] = list(
            map(lambda x: (x[0], get_score(x[1])), task_to_user.get(tid, [])))

    for _ in range(20):  # twenty iterations
        # Ability pass
        total_ability = 0.
        for uid in range(maxuser):
            abilities[uid] = 0
            for tid, score in user_to_task.get(uid, []):
                abilities[uid] += difficulties[tid] * score
            total_ability += abilities[uid]
        for uid in range(maxuser):
            abilities[uid] /= total_ability / len(user_to_task)
            if abilities[uid] < 0.01:
                abilities[uid] = 0.01

        # Difficulty pass
        for tid in range(maxtask):
            if len(task_to_user.get(tid, [])) == 0:
                continue
            sum_score_over_ability = 0
            for uid, score in task_to_user.get(tid, []):
                sum_score_over_ability += score / abilities[uid]
            if sum_score_over_ability == 0:
                difficulties[tid] = 10.0
            else:
                difficulties[tid] = attempts_sqrt[tid] / sum_score_over_ability
            if difficulties[tid] > 10.0:
                difficulties[tid] = 10.0
            if difficulties[tid] < 0.1:
                difficulties[tid] = 0.1

    return [(tid, difficulties[tid]) for tid in task_to_user.keys()]


def main():
    parser = argparse.ArgumentParser(
        description="Update the score of the users/participations")
    args, _ = parser.parse_known_args()

    with SessionGen() as session:
        scores = session.query(TaskScore).all()
        if len(scores) == 0:
            return 0
        try:
            scores = [(t.participation_id, t.task_id, t.score) for t in scores]
        except:
            # legacy non-multicontest version
            scores = [(t.user_id, t.task_id, t.score) for t in scores]
        user_to_task = dict()
        task_to_user = dict()
        for uid, tid, pt in scores:
            user_to_task[uid] = user_to_task.get(uid, []) + [(tid, pt)]
            task_to_user[tid] = task_to_user.get(tid, []) + [(uid, pt)]

        values = dict(compute_smart_score(user_to_task, task_to_user))

        scores = dict()
        for uid, problems in user_to_task.iteritems():
            score = 0
            for tid, pt in problems:
                score += values[tid] * pt

        st = session.query(SocialTask).all()
        for t in st:
            if t.id in values:
                t.score_multiplier = values[t.id]

        sv = session.query(ScoreClass).all()
        for v in sv:
            if v.id in scores:
                v.score = scores[v.id]

        session.commit()
