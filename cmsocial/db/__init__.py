# -*- coding: utf-8 -*-

def init_db():
    from cms.db import Base
    from .socialtask import SocialTask
    from .socialuser import SocialUser

    # Issue CREATE queries
    Base.metadata.create_all()
