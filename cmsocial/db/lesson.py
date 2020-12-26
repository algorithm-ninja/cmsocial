# -*- coding: utf-8 -*-

"""Lesson-related database interface for SQLAlchemy.

"""





from sqlalchemy.schema import Column, ForeignKey, CheckConstraint, \
    UniqueConstraint, ForeignKeyConstraint, Table
from sqlalchemy.types import Boolean, Integer, Float, String, Unicode, \
    Interval, Enum
from sqlalchemy.orm import backref, relationship
from sqlalchemy.ext.orderinglist import ordering_list

from cms.db import Contest, Task

from cmsocial.db.base import Base


class Lesson(Base):
    """Class to store a specific lesson.

    """
    __tablename__ = 'lessons'

    id = Column(Integer, primary_key=True, unique=True)

    title = Column(String)

    # Access level required
    access_level = Column(
        Integer,
        nullable=False,
        default=7
    )

    # "Contest" the lesson is part of
    contest_id = Column(
        Integer,
        ForeignKey(
            Contest.id,
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    contest = relationship(
        Contest,
        backref=backref(
            'lessons',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )


class LessonTask(Base):
    __tablename__ = 'lesson_tasks'

    __table_args__ = (
        UniqueConstraint('lesson_id', 'task_id'),
    )

    id = Column(Integer, primary_key=True, unique=True)

    # Position of the task in the lesson
    num = Column(Integer, nullable=False)

    # lesson we refer to
    lesson_id = Column(
        Integer,
        ForeignKey(
            Lesson.id,
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    lesson = relationship(
        Lesson,
        backref=backref(
            'tasks',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )

    # Task we refer to
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
            'lessons',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )
