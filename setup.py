# -*- coding: utf-8 -*-

"""Build and installation routines for CMSocial.

"""

from __future__ import absolute_import
from __future__ import print_function
# setuptools doesn't seem to like this:
# from __future__ import unicode_literals

import os

from setuptools import setup, find_packages

setup(
    name="cmsocial",
    version="0.1.0",
    author="algorithm-ninja",
    author_email="algorithm@ninja",
    url="https://github.com/algorithm-ninja/cmsocial",
    download_url="https://github.com/algorithm-ninja/cmsocial/archive/master.tar.gz",
    description="A web application that builds a social coding platform upon CMS",
    packages=find_packages(),
    entry_points={
        "console_scripts": [
            "cmsocialServer=cmsocial.server.pws:main",
            "cmsocialInitDB=cmsocial.db:init_db",
            "cmsocialSyncTasks=cmsocial.scripts.synctasks:main",
            "cmsocialSyncUsers=cmsocial.scripts.syncusers:main"
        ]
    },
    keywords="ioi programming contest grader management system",
    license="Affero General Public License v3",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Natural Language :: English",
        "Operating System :: POSIX :: Linux",
        "Programming Language :: Python :: 2",
        "License :: OSI Approved :: "
        "GNU Affero General Public License v3",
    ]
)
