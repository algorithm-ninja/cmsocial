#!/usr/bin/env python2
# -*- coding: utf-8 -*-

CONFIG_PATH = "config/cmsocial.ini"

import os
import sys
import random

import subprocess

def has_cmd(command, on_error):
    print "Check if command", command, "exists...",
    with open(os.devnull, 'wb') as devnull:
        if subprocess.call(['which', command], stdout=devnull, stderr=devnull):
            print "\033[91m✗\033[0m"
            print on_error
            sys.exit(1)
        else:
            print "\033[92m✓\033[0m"

def yesno(msg="Are you sure?", default_yes=True):
    last_part = "[Y/n] " if default_yes else "[y/N] "
    answer = raw_input(msg + " " + last_part).lower()
    if answer in ["yes", "y"] or (default_yes and answer == ""):
        return True
    else:
        return False

def ask(msg="Enter your choice:", default=None):
    last_part = "" if default is None else "[" + default + "] "
    answer = raw_input(msg + " " + last_part)
    if answer == "" and default is not None:
        answer = default
    return answer


# Check that these commands exist
has_cmd("npm", "Install nodejs here: https://docs.npmjs.com/getting-started/installing-node")
has_cmd("grunt", "Install grunt here: http://gruntjs.com/installing-grunt")

# Check that the configuration exists
ok = True

if not os.path.exists(CONFIG_PATH):
    ok = False

    if yesno("File " + CONFIG_PATH + " is missing. Do you want to create it?"):
        secret = ask(
            msg=">> Choose a secret key:",
            default=''.join(random.choice('0123456789abcdef') for n in xrange(30))
        )

        api_prefix = ask(
            msg=">> The API prefix to use (usually \"/\" or \"/api/\"):",
            default="/api/"
        )

        forum_url = ask(
            msg=">> Discourse forum's URL:",
            default="http://forum.url"
        )

        forum_key = ask(
            msg=">> Discourse forum's API key:",
            default="you must generate this using the admin panel"
        )

        with open(CONFIG_PATH, "w") as f:
            f.write("[core]\n")
            f.write("# The secret must be an hexadecimal string\n")
            f.write("secret = " + secret + "\n")
            f.write("api_prefix = " + api_prefix + "\n")
            f.write("\n")
            f.write("[forum]\n")
            f.write("# The url of a functioning Discourse instance\n")
            f.write("forum_url = " + forum_url + "\n")
            f.write("forum_key = " + forum_key + "\n")

        ok = True

# If the configuration is there, proceed
if ok:
    print """    _            __        ____   ________  ________
   (_)___  _____/ /_____ _/ / /  / ____/  |/  / ___/
  / / __ \/ ___/ __/ __ `/ / /  / /   / /|_/ /\__ \\
 / / / / (__  ) /_/ /_/ / / /  / /___/ /  / /___/ /
/_/_/ /_/____/\__/\__,_/_/_/   \____/_/  /_//____/
"""

    os.system("git submodule update --init --recursive")
    os.chdir("cms")
    os.system("pip install -r requirements.txt")
    os.system("python setup.py install")
    os.chdir("..")

    print """ _       __     __            __        ________
| |     / /__  / /_     _____/ /___  __/ __/ __/
| | /| / / _ \/ __ \   / ___/ __/ / / / /_/ /_
| |/ |/ /  __/ /_/ /  (__  ) /_/ /_/ / __/ __/
|__/|__/\___/_.___/  /____/\__/\__,_/_/ /_/
"""

    os.chdir("cmsocial")
    os.system("npm install")
    os.system("bower install")
    os.chdir("..")

    print """   ________  ________            _       __   __
  / ____/  |/  / ___/____  _____(_)___ _/ /  / /
 / /   / /|_/ /\__ \/ __ \/ ___/ / __ `/ /  / /
/ /___/ /  / /___/ / /_/ / /__/ / /_/ / /  /_/
\____/_/  /_//____/\____/\___/_/\__,_/_/  (_)
"""

    os.system("pip install -r requirements.txt")
    os.system("python setup.py install")
