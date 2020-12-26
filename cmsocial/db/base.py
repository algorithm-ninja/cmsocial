#-*- coding: utf8 -*-

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
from sqlalchemy import Column, DateTime, Integer

from cms.db import Base as CMSBase

class Base(CMSBase):
    __abstract__ = True
    _created = Column(DateTime, default=func.now())
    _updated = Column(DateTime, default=func.now(), onupdate=func.now())
    #TODO: maybe add the id field here and remove it elsewhere?

    def fieldnames(self, *args):
        all_fields = [str(c).split('.')[-1] for c in self.__table__.columns]
        real_fields = [c for c in all_fields if not c.startswith('_')]

        return real_fields
