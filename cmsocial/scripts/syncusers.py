# -*- coding: utf-8 -*-

from cms.db import SessionGen, User
from cmsocial.db.socialuser import SocialUser

def main():
    with SessionGen() as s:
        for user in s.query(User).all():
            if not s.query(SocialUser).filter(SocialUser.id == user.id).first():
                if raw_input("User " + user.first_name + " " + user.last_name + " doesn't have metadata. Create? [Y/n]") in ["y", "Y", ""]:
                    x = SocialUser()
                    x.id = user.id
                    s.add(x)
                    # FIXME: why doesn't this work?
                    # s.add(SocialUser(id=user.id))
        s.commit()
