# -*- coding: utf-8 -*-

from cms.db import SessionGen, Task
from cmsocial.db.socialtask import SocialTask

def main():
    with SessionGen() as s:
        for task in s.query(Task).all():
            if not s.query(SocialTask).filter(SocialTask.id == task.id).first():
                if input("Task " + task.name + " doesn't have metadata. Create? [Y/n]") in ["y", "Y", ""]:
                    x = SocialTask()
                    x.id = task.id
                    s.add(x)
                    # FIXME: why doesn't this work?
                    # s.add(SocialTask(id=task.id))
        s.commit()
