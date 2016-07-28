# -*- coding: utf-8 -*-

# FIXME: The following is here just to avoid a circular dependency in socialuser.py
# and to make database creation work.
from cmsocial.db.socialtask import TaskTag, SocialTask
from cmsocial.db.socialuser import SocialUser, SocialParticipation
from cmsocial.db.lesson import Lesson, LessonTask
from cmsocial.db.test import Test, TestQuestion, QuestionFile, TestScore
from cmsocial.db.location import Region, Province, City, Institute
from sqlalchemy.orm import relationship
SocialUser.tasktags = relationship("TaskTag")
