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

    # Whether a contest should be examined by PWS
    social_enabled = Column(Boolean, nullable=False, default=True)

    # The URL of the forum
    forum = Column(Unicode, nullable=True)

    # What to show in the top-left part of the navbar
    top_left_name = Column(Unicode, nullable=False)

    # The page title
    title = Column(Unicode, nullable=False)

    mail_server = Column(Unicode, nullable=True)
    mail_username = Column(Unicode, nullable=True)
    mail_password = Column(Unicode, nullable=True)
    mail_from = Column(Unicode, nullable=True)
    site_name = Column(Unicode, nullable=True)

    # Home page template URL - some file on the database, or None for the
    # default home page.
    homepage = Column(Unicode, nullable=True)
