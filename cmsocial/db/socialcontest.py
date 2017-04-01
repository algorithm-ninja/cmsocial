# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from sqlalchemy.orm import backref, relationship
from sqlalchemy.schema import (CheckConstraint, Column, ForeignKey,
                               ForeignKeyConstraint, Table, UniqueConstraint)
from sqlalchemy.types import (Boolean, Enum, Float, Integer, Interval, String,
                              Unicode)

from cms.db import Contest
from cmsocial.db.base import Base

RECAPTCHA_DEFAULT_PUBLIC = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI'
RECAPTCHA_DEFAULT_SECRET = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe'


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

    # Mail configuration
    mail_server = Column(Unicode, nullable=True)
    mail_username = Column(Unicode, nullable=True)
    mail_password = Column(Unicode, nullable=True)
    mail_from = Column(Unicode, nullable=True)

    # Captcha configuration
    recaptcha_public_key = Column(
        Unicode, default=RECAPTCHA_DEFAULT_PUBLIC)
    recaptcha_secret_key = Column(
        Unicode, default=RECAPTCHA_DEFAULT_SECRET)

    # Analytics configuration
    analytics = Column(Unicode, nullable=True)

    # Domain for authentication cookies - may be null (meaning default domain)
    cookie_domain = Column(Unicode, nullable=True)

    # Home page template URL - some file on the database, or None for the
    # default home page.
    homepage = Column(Unicode, nullable=True)

    # Menu - null means we want to use the default menu, otherwise a JSON
    # describing the menu: an array of categories, which are objects with
    # three fields: "title", "icon" (the name of the fa-icon), and "entries".
    # "entries" is an array of objects with fields "title", "icon", exactly
    # either "sref"+"params" (internal link) or "href" (external link), and
    # (optionally) "display", which may have values 'always', 'logged',
    # 'unlogged' and 'admin'
    menu = Column(Unicode, nullable=True)

    def is_mail_enabled(self):
        return self.mail_server is not None and \
            self.mail_username is not None and \
            self.mail_password is not None and \
            self.mail_from is not None

    def is_captcha_enabled(self):
        return self.recaptcha_secret_key is not None and \
            self.recaptcha_public_key is not None
