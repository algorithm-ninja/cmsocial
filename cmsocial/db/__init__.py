# -*- coding: utf-8 -*-

def init_db():
    from cms.db import Base
    from .socialtask import SocialTask
    from .socialuser import SocialUser
    from .test import Test

    # Issue CREATE queries
    Base.metadata.create_all()


# FIXME: The following is here just to avoid a circular dependency in socialuser.py
from cmsocial.db.socialtask import TaskTag
from cmsocial.db.socialuser import SocialUser
from sqlalchemy.orm import relationship
SocialUser.tasktags = relationship("TaskTag")
