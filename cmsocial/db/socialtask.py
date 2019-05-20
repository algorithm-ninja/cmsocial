# -*- coding: utf-8 -*-

"""Task-related database interface for SQLAlchemy.

"""

from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

from datetime import timedelta

from sqlalchemy.schema import Column, ForeignKey, CheckConstraint, \
    UniqueConstraint, ForeignKeyConstraint, Table
from sqlalchemy.types import Boolean, Integer, Float, String, Unicode, \
    Interval, Enum
from sqlalchemy.orm import backref, relationship
from sqlalchemy.ext.orderinglist import ordering_list

from cms.db import Task
from cms.db.smartmappedcollection import smart_mapped_collection
from cms import SCORE_MODE_MAX, SCORE_MODE_MAX_TOKENED_LAST

from cmsocial.db.base import Base
from cmsocial.db.socialuser import SocialUser


class SocialTask(Base):
    """Class to store stats and tags of a specific Task.

    """
    __tablename__ = 'social_tasks'

    id = Column(
        Integer,
        ForeignKey('tasks.id',
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        primary_key=True,
        unique=True
    )

    task = relationship(
        "Task",
        backref=backref(
            "social_task",
            uselist=False
        )
    )

    # Access level required
    access_level = Column(
        Integer,
        nullable=False,
        default=7
    )

    # Whether users can download full testcases
    help_available = Column(
        Boolean,
        nullable=False,
        default=False
    )

    # Stats
    nsubs = Column(
        Integer,
        nullable=False,
        default=0
    )

    nsubscorrect = Column(
        Integer,
        nullable=False,
        default=0
    )

    nusers = Column(
        Integer,
        nullable=False,
        default=0
    )

    nuserscorrect = Column(
        Integer,
        nullable=False,
        default=0
    )

    difficulty = Column(
        Integer,
        nullable=True
    )

    category = Column(
        String,
        nullable=True
    )

    # The list of tasktags which tag this task
    tasktags = relationship('TaskTag')


class TaskTag(Base):
    __tablename__ = 'task_tags'

    task_id = Column(
        Integer,
        ForeignKey('social_tasks.id'),
        primary_key=True
    )

    tag_id = Column(
        Integer,
        ForeignKey('tags.id'),
        primary_key=True
    )

    user_id = Column(
        Integer,
        ForeignKey('social_users.id')
    )

    approved = Column(
        Boolean,
        default=False
    )

    tag = relationship("Tag")
    task = relationship("SocialTask")
    user = relationship("SocialUser")


class Tag(Base):
    __tablename__ = 'tags'

    id = Column(
        Integer,
        primary_key=True,
        unique=True
    )

    name = Column(
        String,
        nullable=False,
        unique=True
    )

    hidden = Column(Boolean)

    description = Column(
        String,
        nullable=False
    )

    # List of tasktags which tag tasks by using this tag
    tasktags = relationship("TaskTag")


class TaskScore(Base):
    __tablename__ = 'taskscores'

    __table_args__ = (
        UniqueConstraint('user_id', 'task_id'),
    )

    id = Column(
        Integer,
        primary_key=True,
        unique=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            SocialUser.id,
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    user = relationship(
        SocialUser,
        backref=backref(
            'taskscores',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )

    task_id = Column(
        Integer,
        ForeignKey(
            Task.id,
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    task = relationship(
        Task,
        backref=backref(
            'taskscores',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )

    score = Column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )

    time = Column(
        Float,
        nullable=False,
        default=0
    )
