#!/usr/bin/env python3
# -*- coding: utf-8 -*-

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
    include_package_data=True,
    entry_points={
        "console_scripts": [
            "cmsPracticeWebServer=cmsocial.server.pws:main",
            "cmsocialSyncTasks=cmsocial.scripts.synctasks:main",
            "cmsocialSyncUsers=cmsocial.scripts.syncusers:main",
            "cmsocialDuplicateContest=cmsocial.scripts.duplicate_contest:main",
            "cmsocialUpdateScore=cmsocial.scripts.update_score:main"
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
