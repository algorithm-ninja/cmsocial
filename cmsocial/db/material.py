# -*- coding: utf-8 -*-

"""Material-related database interface for SQLAlchemy.

"""

from __future__ import absolute_import
from __future__ import print_function
from __future__ import unicode_literals

from sqlalchemy.schema import Column, ForeignKey, CheckConstraint, \
    UniqueConstraint, ForeignKeyConstraint, Table
from sqlalchemy.types import Boolean, Integer, Float, String, Unicode, \
    Interval, Enum, Text, Serial
from sqlalchemy.orm import backref, relationship
from sqlalchemy.ext.orderinglist import ordering_list

from cms.db import Contest

from cmsocial.db.base import Base


class Material(Base):
    """Class to store material for the users.

    """
    __tablename__ = 'materials'

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

    # Text (in Markdown) of that material
    text = Column(Text, nullable=False, default='')

    # Position of the material in the list
    position = Column(Integer, Sequence('material_position_seq'))
