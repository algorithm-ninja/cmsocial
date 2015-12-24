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
        all_fields = map(lambda c: str(c).split('.')[-1], self.__table__.columns)
        real_fields = filter(lambda c: not c.startswith('_'), all_fields)

        return real_fields
