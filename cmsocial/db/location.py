#!/usr/bin/env python2
# -*- coding: utf-8 -*-

from sqlalchemy.schema import Column, ForeignKey
from sqlalchemy.types import Integer, Unicode
from sqlalchemy.orm import relationship, backref

from cms.db import Base


class Region(Base):
    __tablename__ = 'regions'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode)


class Province(Base):
    __tablename__ = 'provinces'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode)

    region_id = Column(
        Integer,
        ForeignKey(Region.id,
                   onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True)
    region = relationship(
        Region,
        backref=backref("provinces",
                        cascade="all, delete-orphan",
                        passive_deletes=True))


class City(Base):
    __tablename__ = 'cities'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode)

    province_id = Column(
        Integer,
        ForeignKey(Province.id,
                   onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True)
    province = relationship(
        Province,
        backref=backref("cities",
                        cascade="all, delete-orphan",
                        passive_deletes=True))


class Institute(Base):
    __tablename__ = 'institutes'

    id = Column(Integer, primary_key=True)
    name = Column(Unicode)

    city_id = Column(
        Integer,
        ForeignKey(City.id,
                   onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False,
        index=True)
    city = relationship(
        City,
        backref=backref("institutes",
                        cascade="all, delete-orphan",
                        passive_deletes=True))
