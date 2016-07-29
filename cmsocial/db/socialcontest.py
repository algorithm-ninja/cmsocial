# -*- coding: utf-8 -*-
from cmsocial.db.base import Base
from cms.db import Contest
from sqlalchemy.schema import Column, ForeignKey, CheckConstraint, \
    UniqueConstraint, ForeignKeyConstraint, Table
from sqlalchemy.types import Boolean, Integer, Float, String, Unicode, \
    Interval, Enum
from sqlalchemy.orm import backref, relationship

class SocialContest(Base):
    """Class to store custom fields of a contest.

    """
    __tablename__ = 'social_contests'

    # Contest.id == SocialContest.id
    id = Column(
        Integer,
        ForeignKey("contests.id",
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        primary_key=True,
        unique=True
    )

    Contest = relationship(
        Contest,
        backref=backref(
            "social_contest",
            uselist=False
        )
    )

    # Contest access level - minimum access level required to see the contest
    # in the list (if not participating to it) or to voluntarily participate.
    access_level = Column(
        Integer,
        nullable=False,
        default=7
    )

    # Home page template URL - API_PREFIX gets automatically replaced by JS.
    homepage = Column(Unicode, default=u"views/homepage.html")
