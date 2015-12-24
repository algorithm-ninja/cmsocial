# -*- coding: utf-8 -*-

# FIXME: The following is here just to avoid a circular dependency in socialuser.py
from cmsocial.db.socialtask import TaskTag
from cmsocial.db.socialuser import SocialUser
from sqlalchemy.orm import relationship
SocialUser.tasktags = relationship("TaskTag")
