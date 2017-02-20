# -*- coding: utf-8 -*-

import argparse
import sys
from cms.db import SessionGen, Task, Contest, Participation, User, engine, Dataset, Testcase
from cmsocial.db import SocialTask, SocialContest, SocialParticipation, SocialUser, Lesson, \
        LessonTask
from sqlalchemy.orm.session import make_transient
from sqlalchemy import or_, Sequence

verbose = False

def apply_edit_list(obj, edit_list):
    for edit in edit_list:
        setattr(obj, edit[0], edit[1](obj))

def apply_filter(query, cls, filter_fun, filter_list):
    query = filter_fun(query)
    for col, values in filter_list.iteritems():
        query = query.filter(getattr(cls, col).in_(values))
    return query

cls_count = dict()

def recursive_clone(session, cls, tree, flt, edit, backedit):
    cls_count[cls] = cls_count.get(cls, 0) + 1
    indegree = 0
    for k, v in tree.iteritems():
        for info in v:
            if info[0] == cls:
                indegree += 1
    if cls_count[cls] < indegree:
        return []
    objects = session.query(cls)
    flt_info = flt.get(cls, (lambda x: x, dict()))
    objects = apply_filter(objects, cls, flt_info[0], flt_info[1])
    objects = objects.all()

    if verbose:
        print "Cloning %d %s" % (len(objects), cls.__name__)

    backeditable_cols = []
    for k, v in backedit.iteritems():
        for bked in v:
            if bked[0] == cls:
                backeditable_cols.append(bked[1])

    old_values_tmp = dict((bc, dict()) for bc in backeditable_cols)

    idmap = dict()

    for obj in objects:
        session.expunge(obj)
        make_transient(obj)
        old_id = obj.id
        apply_edit_list(obj, edit.get(cls, []))
        if obj.id == old_id:
            obj.id = None
        for bc in backeditable_cols:
            old_values_tmp[bc][old_id] = getattr(obj, bc)
            setattr(obj, bc, None)
        session.add(obj)
        session.flush()
        idmap[old_id] = obj.id

    old_values = dict((bc, dict()) for bc in backeditable_cols)
    for bc in backeditable_cols:
        for oid in old_values_tmp[bc]:
            old_values[bc][idmap[oid]] = old_values_tmp[bc][oid]

    backeditlist = []

    for child in tree.get(cls, []):
        ccls = child[0]
        cflt_info = flt.get(ccls, (lambda x: x, dict()))
        cflt_info[1][child[1]] = idmap.keys()
        flt[ccls] = cflt_info
        cedit = edit.get(ccls, [])
        cedit.append((child[1], lambda x: idmap.get(getattr(x, child[1]))))
        edit[ccls] = cedit
        backeditlist += recursive_clone(session, ccls, tree, flt, edit, backedit)

    extra_edits = []
    id_to_val = dict()
    for edl in backeditlist:
        if edl[0] == cls:
            oldv = old_values.get(edl[1])
            extra_edits.append((edl[1], lambda x: edl[2][oldv[x.id]]))

    if len(extra_edits) > 0:
        for obj in objects:
            apply_edit_list(obj, extra_edits)
            session.add(obj)
        session.flush()

    bked = backedit.get(cls, [])
    for clscol in bked:
        backeditlist.append((clscol[0], clscol[1], idmap))

    return backeditlist


def main():
    parser = argparse.ArgumentParser(description="Clone a contest")
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("-r", "--for-real", action="store_true")
    parser.add_argument("old_contest")
    parser.add_argument("new_contest")

    args, _ = parser.parse_known_args()

    old_contest = args.old_contest
    new_contest = args.new_contest

    global verbose
    verbose = args.verbose
    dryrun = not args.for_real

    clone_tree = {
        Contest: [
            (SocialContest, "id"),
            (Participation, "contest_id"),
            (Task, "contest_id"),
            (Lesson, "contest_id")],
        Participation: [(SocialParticipation, "id")],
        Task: [(Dataset, "task_id"), (LessonTask, "task_id")],
        Dataset: [(Testcase, "dataset_id")],
        Lesson: [(LessonTask, "lesson_id")]
    }
    clone_filter = {
        Contest: (lambda x: x, {"name": [old_contest]}),
        Participation: (lambda x:
            x.join(SocialParticipation).join(User).join(SocialUser)\
                .filter(or_(SocialParticipation.access_level == 0, SocialUser.access_level == 0)),
            dict())
    }
    clone_edit = {
        Contest: [("name", lambda x: new_contest)],
        Task: [("name", lambda x: x.name + "_dup")],
        SocialTask: [("access_level", lambda x: 0)],
        Lesson: [("access_level", lambda x: 0)],
        SocialUser: [("score", lambda x: 0)]
    }
    clone_backedit = {Dataset: [(Task, "active_dataset_id")]}
    with SessionGen() as session:
        with session.no_autoflush:
            recursive_clone(session, Contest, clone_tree, clone_filter, clone_edit, clone_backedit)
            if dryrun:
                print "Dry run requested, rolling back changes."
                session.rollback()
            else:
                print "Everything OK, committing..."
                session.commit()
