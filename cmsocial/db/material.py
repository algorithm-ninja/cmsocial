# -*- coding: utf-8 -*-

"""Material-related database interface for SQLAlchemy.

"""





from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode
from sqlalchemy.orm import backref, relationship

from cms.db import Contest

from cmsocial.db.base import Base


class Material(Base):
    """Class to store material for the users.

    """
    __tablename__ = 'materials'

    id = Column(Integer, primary_key=True, unique=True)

    title = Column(Unicode)

    # Access level required
    access_level = Column(
        Integer,
        nullable=False,
        default=7
    )

    # "Contest" the material is part of
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
            'materials',
            cascade="all, delete-orphan",
            passive_deletes=True
        )
    )

    # Text (in Markdown) of that material
    text = Column(Unicode, nullable=False, default='')
