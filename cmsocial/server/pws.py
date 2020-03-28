# -*- coding: utf-8 -*-

import argparse
import ConfigParser
import hashlib
import hmac
import io
import json
import logging
import mimetypes
import os
import re
import smtplib
import socket
import tempfile
import traceback
import urllib
from base64 import b64decode, b64encode
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from shutil import copyfileobj, rmtree

import bcrypt
import gevent
import gevent.local
import gevent.wsgi
import pkg_resources
import requests
from gevent import monkey
from gevent.subprocess import check_output, CalledProcessError, STDOUT
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from sqlalchemy.sql import and_, or_
from werkzeug.exceptions import (BadRequest, HTTPException,
                                 InternalServerError, NotFound)
from werkzeug.routing import Map, Rule, RequestRedirect
from werkzeug.wrappers import Request, Response
from werkzeug.wsgi import SharedDataMiddleware, responder, wrap_file

import jwt
from cms import ServiceCoord
from cms.grading.languagemanager import (LANGUAGES, SOURCE_EXTS,
                                         filename_to_language, get_language)
from cms.db import (Contest, File, Participation, SessionGen, Submission, Task,
                    Testcase, User)
from cms.db.filecacher import FileCacher
from cms.io import Service
from cmscommon.archive import Archive
from cmscommon.datetime import make_datetime, make_timestamp
from cmsocial.db.lesson import Lesson
from cmsocial.db.material import Material
from cmsocial.db.location import City, Institute, Province, Region
from cmsocial.db.socialcontest import SocialContest
from cmsocial.db.socialtask import SocialTask, Tag, TaskScore, TaskTag
from cmsocial.db.socialuser import SocialParticipation, SocialUser
from cmsocial.db.test import Test, TestScore

monkey.patch_all()


logger = logging.getLogger(__name__)
local = gevent.local.local()

config = ConfigParser.SafeConfigParser()
config.read('/usr/local/etc/cmsocial.ini')


class WSGIHandler(gevent.wsgi.WSGIHandler):

    def format_request(self):
        if self.time_finish:
            delta = '%.6f' % (self.time_finish - self.time_start)
        else:
            delta = '-'
        client_address = self.environ['REMOTE_ADDR']
        return '%s %s %s %s' % (client_address or '-',
                                (getattr(self, 'status', None)
                                 or '000').split()[0], delta,
                                getattr(self, 'requestline', ''))

    def log_request(self):
        logger.info(self.format_request())

    def get_environ(self):
        env = gevent.wsgi.WSGIHandler.get_environ(self)
        return env


class Server(gevent.wsgi.WSGIServer):
    handler_class = WSGIHandler


class APIHandler(object):

    def __init__(self, parent):
        self.router = Map([
            Rule('/api/<target>', methods=['POST'], endpoint='globaljsondata'),
            Rule('/static/<path:path>',
                 methods=['GET'], endpoint='globalstaticfile'),
            Rule('/<contest>/api/files/<digest>', methods=['GET', 'POST'],
                 endpoint='dbfile'),
            Rule('/<contest>/api/files/<digest>/<name>', methods=['GET', 'POST'],
                 endpoint='dbfile'),
            Rule('/<contest>/api/<target>',
                 methods=['POST'], endpoint='jsondata'),
            Rule('/<contest>/<path:path>',
                 methods=['GET'], endpoint='staticfile'),
            Rule('/<contest>/', methods=['GET'], endpoint='index'),
            Rule('/<contest>', redirect_to='/<contest>/'),
            Rule('/', methods=['GET'], endpoint='globalindex')
        ], encoding_errors='strict')
        self.file_cacher = parent.file_cacher
        self.evaluation_service = parent.evaluation_service
        self.EMAIL_REG = re.compile(r'[^@]+@[^@]+\.[^@]+')
        self.USERNAME_REG = re.compile(r'^[A-Za-z0-9_\.]+$')

    @responder
    def __call__(self, environ, start_response):
        try:
            return self.wsgi_app(environ, start_response)
        except:
            logger.error(traceback.format_exc())
            return InternalServerError()

    def wsgi_app(self, environ, start_response):
        route = self.router.bind_to_environ(environ)

        try:
            endpoint, args = route.match()
        except RequestRedirect as e:
            return e
        except HTTPException:
            return NotFound()

        try:
            if endpoint == 'dbfile':
                return self.dbfile_handler(environ, args)
        except HTTPException as e:
            return e

        # static_file_handler checks for a valid contest
        if endpoint == 'globalstaticfile':
            return self.static_file_handler(environ, args['path'])
        elif endpoint == 'staticfile':
            return self.static_file_handler(environ, args['path'], args['contest'])
        elif endpoint == 'index':
            return self.static_file_handler(environ, 'index.html', args['contest'])
        elif endpoint == 'globalindex':
            return self.static_file_handler(environ, 'index.html')

        request = Request(environ)
        if request.mimetype != 'application/json':
            logger.warning('Request not in JSON')
            data = dict()
        else:
            try:
                data = json.load(request.stream)
            except (ValueError, TypeError):
                logger.warning('JSON parse error')
                data = dict()
            if 'first' in data and 'last' in data:
                data['first'] = int(data['first'])
                data['last'] = int(data['last'])
                if data['first'] < 0 or data['first'] > data['last']:
                    return BadRequest()

        with SessionGen() as local.session:
            if 'contest' in args:
                local.contest = local.session.query(Contest)\
                    .join(SocialContest)\
                    .filter(Contest.name == args['contest'])\
                    .filter(SocialContest.social_enabled == True).first()
            else:
                local.contest = None
            try:
                local.jwt_payload = request.cookies.get("token")
                if local.jwt_payload is None:
                    auth_data = dict()
                else:
                    auth_data = jwt.decode(
                        local.jwt_payload, config.get('core', 'secret'))
                username = auth_data['username']

                local.participation = self.get_participation(
                    local.contest, username)
                if local.participation is None:
                    local.user = self.get_user(username)
                else:
                    local.user = local.participation.user
            except (BadRequest, KeyError, jwt.exceptions.InvalidTokenError):
                local.user = None
                local.participation = None
            if local.user is None:
                local.access_level = 7  # Access level of unlogged user
                local.global_access_level = 7  # Access level of unlogged user
            else:
                local.global_access_level = local.user.social_user.access_level
                if local.participation is None:
                    local.access_level = None
                else:
                    local.access_level = local.participation.social_participation.access_level
                if local.access_level is None:
                    local.access_level = local.global_access_level

            if local.contest is None:
                return NotFound()

            try:
                local.data = data
                local.resp = dict()
                ans = getattr(self, args['target'] + '_handler')()
                local.resp['success'] = 1
            except AttributeError:
                logger.error('Endpoint %s not implemented yet!' % endpoint)
                logger.error(traceback.format_exc())
                return NotFound()
            except KeyError:
                logger.error(traceback.format_exc())
                return BadRequest()

        if getattr(local, 'response', None) is None:
            response = Response()
        else:
            response = local.response
        response.mimetype = 'application/json'
        response.status_code = 200
        if ans is None:
            response.data = json.dumps(local.resp)
        else:
            if 'log' in local.resp:
                response.data = json.dumps(
                    {'success': 0, 'error': ans, 'log': local.resp['log']})
            else:
                response.data = json.dumps({'success': 0, 'error': ans})
        return response

    # Useful methods
    def decode_file(self, f):
        f['data'] = f['data'].split(',')[-1]
        f['body'] = b64decode(f['data'])
        del f['data']
        return f

    def sliced_query(self, query):
        res = query.slice(local.data['first'], local.data['last']).all()
        num = query.count()
        return (res, num)

    def validate_user(self, user, password):
        if self.validate(password, user.password):
            return True
        elif self.old_validate(password, user.password):
            try:
                with SessionGen() as session:
                    user2 = session.query(User).filter(
                        User.id == user.id).first()
                    user2.password = self.hashpw(password)
                    session.commit()
            except:
                traceback.print_exc()
            return True
        else:
            return False

    def get_participation(self, contest, username, password=None):
        try:
            participation = local.session.query(Participation)\
                .join(User)\
                .filter(Participation.contest_id == contest.id)\
                .filter(User.username == username).first()
            if participation is None:
                return None
            if password is None or \
               self.validate_user(participation.user, password):
                return participation
        except UnicodeDecodeError:
            return None

    def get_user(self, username, password=None):
        try:
            user = local.session.query(User)\
                .filter(User.username == username).first()
            if user is None:
                return None
            if password is None or self.validate_user(user, password):
                return user
        except UnicodeDecodeError:
            return None

    def build_token(self):
        mh = self.hash(local.user.email, 'md5')
        data = {
            'id': local.user.id,
            'username': local.user.username,
            'email': local.user.email,
            'firstName': local.user.first_name,
            'lastName': local.user.last_name,
            'picture': '//gravatar.com/avatar/%s?d=identicon' % mh
        }
        return jwt.encode(data, config.get('core', 'secret'), algorithm='HS256')

    def check_user(self, username):
        if len(username) < 4:
            return 'Username is too short'
        elif not self.USERNAME_REG.match(username):
            return 'Username is invalid'
        else:
            user = local.session.query(User)\
                .filter(User.username.ilike(username)).first()
            if user is not None:
                return 'This username is not available'

    def check_email(self, email):
        if not self.EMAIL_REG.match(email):
            return 'Invalid e-mail'
        else:
            user = local.session.query(User)\
                .filter(User.email == email).first()
            if user is not None:
                return 'E-mail already used'

    def hash(self, string, algo='sha256'):
        if string is None:
            string = ''
        sha = getattr(hashlib, algo)()
        sha.update(string)
        return sha.hexdigest()

    def old_hashpw(self, pw):
        # FIXME: maybe we should keep stats on how many times
        #        this function gets called over time
        return self.hash(pw + "8e045a51e4b102ea803c06f92841a1fb")

    def old_validate(self, pw, storedpw):
        return self.old_hashpw(pw) == storedpw

    def hashpw(self, pw):
        pw = pw.encode('utf-8')
        payload = bcrypt.hashpw(pw, bcrypt.gensalt())
        return "bcrypt:%s" % payload

    def validate(self, pw, storedpw):
        if not storedpw.startswith("bcrypt:"):
            return False
        payload = storedpw.split(":", 1)[1].encode("utf-8")
        pw = pw.encode("utf-8")
        return bcrypt.hashpw(pw, payload) == payload

    def gencode(self):
        from string import ascii_lowercase, ascii_uppercase, digits
        from random import choice

        return ''.join([choice(ascii_lowercase + ascii_uppercase + digits)
                        for i in range(20)])

    def send_mail(self, to, subject, body):
        # TODO: cache SMTP connections
        server = smtplib.SMTP(local.contest.social_contest.mail_server)
        server.ehlo()
        server.starttls()
        server.login(local.contest.social_contest.mail_username,
                     local.contest.social_contest.mail_password)

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = local.contest.social_contest.mail_from
        msg['To'] = to

        sent = False
        nretries = 0
        while sent is False:
            try:
                server.sendmail(local.contest.social_contest.mail_from,
                                [to], msg.as_string())
                sent = True
            except socket.timeout:
                traceback.print_exc()
                nretries += 1
                if nretries > 10:
                    break

        server.quit()
        return sent

    def get_institute_info(self, institute_id):
        info = dict()
        if institute_id is not None:
            institute = local.session.query(Institute)\
                .filter(Institute.id == institute_id).first()
            info['id'] = institute.id
            info['name'] = institute.name
            info['city'] = institute.city.name
            info['province'] = institute.city.province.name
            info['region'] = institute.city.province.region.name
        return info

    def get_user_info(self, user):
        info = dict()
        info['username'] = user.username
        info['global_access_level'] = user.social_user.access_level
        info['access_level'] = info['global_access_level']
        info['join_date'] = make_timestamp(user.social_user.registration_time)
        info['mail_hash'] = self.hash(user.email, 'md5')
        info['institute'] = self.get_institute_info(
            user.social_user.institute_id)
        info['first_name'] = user.first_name
        info['last_name'] = user.last_name
        info['tasks_solved'] = -1
        return info

    def get_participation_info(self, participation):
        info = self.get_user_info(participation.user)
        info['score'] = participation.social_participation.score
        if participation.social_participation.access_level is not None:
            info['access_level'] = participation.social_participation.access_level
        return info

    def update_from_data(self, obj, *args, **kwargs):
        for field in args:
            if field in local.data:
                setattr(obj, field, local.data[field])
        for field, data_field in kwargs.iteritems():
            if data_field in local.data:
                setattr(obj, field, local.data[data_field])

    def add_info(self, obj, dct, *args, **kwargs):
        for field in args:
            dct[field] = getattr(obj, field)
        for field, data_field in kwargs.iteritems():
            dct[data_field] = getattr(obj, field)

    # Handlers that do not require JSON data
    def dbfile_handler(self, environ, args):
        try:
            fobj = self.file_cacher.get_file(args['digest'])
        except KeyError:
            raise NotFound()

        response = Response()
        response.status_code = 200
        response.mimetype = 'application/octet-stream'

        if 'name' in args:
            if args["name"].endswith(".pdf"):
                # Add header to allow the official pdf.js to work
                response.headers.add_header(b'Access-Control-Allow-Origin',
                                            b'https://mozilla.github.io')
            else:
                # Don't do this on pdf files because it breaks the native pdf
                # reader
                response.headers.add_header(
                    b'Content-Disposition', b'attachment',
                    filename=args['name'])
            mimetype = mimetypes.guess_type(args['name'])[0]
            if mimetype is not None:
                response.mimetype = mimetype

        response.response = wrap_file(environ, fobj)
        response.direct_passthrough = True
        response.cache_control.max_age = 31536000
        response.cache_control.public = True
        return response

    def static_file_handler(self, environ, filename, contest_name=None):
        # TODO: implement files that do not depend on the contest
        if contest_name is None:
            return NotFound()

        with SessionGen() as session:
            social_contest = session.query(SocialContest)\
                .join(Contest)\
                .filter(SocialContest.social_enabled == True)\
                .filter(Contest.name == contest_name).first()
            if social_contest is None:
                return NotFound()
            if filename == 'views/homepage.html':
                if social_contest.homepage is not None:
                    return self.dbfile_handler(environ, {
                        'digest': social_contest.homepage,
                        'name': 'homepage.html'})
        path = os.path.join(
            pkg_resources.resource_filename('cmsocial-web-build', ''),
            filename)

        try:
            response = Response()
            response.status_code = 200
            response.mimetype = 'application/octet-stream'
            mimetype = mimetypes.guess_type(filename)[0]
            if mimetype is not None:
                response.mimetype = mimetype
            response.last_modified = \
                datetime.utcfromtimestamp(os.path.getmtime(path))\
                        .replace(microsecond=0)
            response.response = wrap_file(environ, io.open(path, 'rb'))
            response.direct_passthrough = True
        except OSError:
            response = Response()
            response.status_code = 404
            response.data = "404 Not Found"

        if filename == "index.html":
            # Disable cache, so that the user will notice if the
            # app.COMMIT_ID.js file has a new name

            response.headers['Last-Modified'] = datetime.now()
            response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '-1'

        return response

    # Handlers that require JSON data
    def check_handler(self):
        try:
            rtype = local.data['type']
            rvalue = local.data['value']
        except KeyError:
            logger.warning('Missing parameters')
            return 'Bad request'

        if rtype == 'username':
            err = self.check_user(rvalue)
        elif rtype == 'email':
            err = self.check_email(rvalue)
        else:
            logger.warning('Request type not understood')
            return 'Bad request'
        return err

    def location_handler(self):
        if local.data['action'] == 'get':
            institute = local.session.query(Institute)\
                .filter(Institute.id == local.data['id']).first()
            if institute is None:
                return 'Not found'
            local.resp = self.get_institute_info(institute)
        elif local.data['action'] == 'listregions':
            out = local.session.query(Region).all()
            local.resp['regions'] = [{'id': r.id, 'name': r.name} for r in out]
        elif local.data['action'] == 'listprovinces':
            out = local.session.query(Province)\
                .filter(Province.region_id == local.data['id']).all()
            local.resp['provinces'] = [{
                'id': r.id,
                'name': r.name
            } for r in out]
        elif local.data['action'] == 'listcities':
            out = local.session.query(City)\
                .filter(City.province_id == local.data['id']).all()
            local.resp['cities'] = [{'id': r.id, 'name': r.name} for r in out]
        elif local.data['action'] == 'listinstitutes':
            out = local.session.query(Institute)\
                .filter(Institute.city_id == local.data['id']).all()
            local.resp['institutes'] = [{
                'id': r.id,
                'name': r.name
            } for r in out]

    def sso_handler(self):
        if local.user is None:
            return 'Unauthorized'
        payload = local.data['payload']
        sig = local.data['sig']
        computed_sig = hmac.new(
            config.get("core", "secret").encode(),
            payload.encode(),
            hashlib.sha256).hexdigest()
        if computed_sig != sig:
            return 'Bad request'
        # Get nonce.
        payload_decoded = b64decode(payload).decode()
        d = dict(nonce.split("=") for nonce in payload_decoded.split('&'))
        # Prepare response.
        response_data = dict()
        response_data['nonce'] = d['nonce']
        response_data['external_id'] = local.user.username
        response_data['username'] = local.user.username
        response_data['email'] = local.user.email
        # Build final url.
        res_payload = urllib.urlencode(response_data)
        res_payload = b64encode(res_payload.encode())
        sig = hmac.new(
            config.get("core", "secret").encode(),
            res_payload,
            hashlib.sha256).hexdigest()
        local.resp['parameters'] = urllib.urlencode({
            'sso': res_payload,
            'sig': sig
        })

    def user_handler(self):
        if local.data['action'] == 'new':
            try:
                username = local.data['username']
                password = local.data['password']
                email = local.data['email'].lower()
                firstname = local.data['firstname']
                lastname = local.data['lastname']
                recaptcha_response = local.data['recaptcha_response'] if \
                    'recaptcha_response' in local.data else None
            except KeyError:
                logger.warning('Missing parameters')
                return 'Bad request'

            # Check captcha if we changed the secret key
            if local.contest.social_contest.is_captcha_enabled():
                r = requests.post(
                    "https://www.google.com/recaptcha/api/siteverify",
                    data={'secret': local.contest.social_contest.recaptcha_secret_key,
                          'response': recaptcha_response},  # , 'remoteip': ''},
                    verify=False)
                try:
                    assert r.json()["success"] is True
                except:
                    return "Anti-spam check failed"

            token = self.hashpw(password)

            err = self.check_user(username)
            if err is not None:
                return err
            err = self.check_email(email)
            if err is not None:
                return err

            if local.contest is not None and \
               local.contest.social_contest.access_level < local.global_access_level:
                return 'Unauthorized'

            user = User(
                first_name=firstname,
                last_name=lastname,
                username=username,
                password=token,
                email=email
            )
            social_user = SocialUser(
                access_level=6,
                registration_time=make_datetime()
            )
            social_user.user = user

            if 'institute' in local.data:
                social_user.institute_id = int(local.data['institute'])

            try:
                local.session.add(user)
                local.session.add(social_user)
                local.session.commit()
            except IntegrityError:
                return 'User already exists'

            if local.contest is not None:
                participation = Participation(
                    user=user,
                    contest=local.contest
                )
                social_participation = SocialParticipation()
                social_participation.participation = participation

                try:
                    local.session.add(participation)
                    local.session.add(social_participation)
                    local.session.commit()
                except IntegrityError:
                    return "Participation already exists"
            local.user = user
            local.response = Response()
            local.response.set_cookie(
                'token', value=self.build_token(),
                domain=local.contest.social_contest.cookie_domain)
        elif local.data['action'] == 'newparticipation':
            if local.user is None:
                return 'Unauthorized'
            if local.contest is None:
                return 'Bad request'
            if local.contest.social_contest.access_level < local.global_access_level:
                return 'Unauthorized'

            participation = Participation(
                user=local.user,
                contest=local.contest
            )
            social_participation = SocialParticipation()
            social_participation.participation = participation

            try:
                local.session.add(participation)
                local.session.add(social_participation)
                local.session.commit()
            except IntegrityError:
                return "Participation already exists"
        elif local.data['action'] == 'login':
            username = local.data.get('username', None)
            password = local.data.get('password', None)
            if username is None or password is None:
                logger.warning('Missing parameter')
                return 'Bad request'

            participation = self.get_participation(
                local.contest, username, password)
            if participation is None:
                local.user = self.get_user(username, password)
                if local.user is None:
                    return 'login.error'
            else:
                local.user = participation.user

            # When the user explicitly requests, make the cookie expire
            # after 30 days (instead of at the end of the browser's session).
            keep_signed = local.data.get('keep_signed', False)
            cookie_duration = 30 * 86400 if keep_signed else None
            local.response = Response()
            local.response.set_cookie(
                'token', value=self.build_token(),
                max_age = cookie_duration,
                domain=local.contest.social_contest.cookie_domain)
        elif local.data['action'] == 'me':
            if local.user is None:
                return 'Unauthorized'
            if local.participation is None:
                local.resp['user'] = self.get_user_info(local.user)
            else:
                local.resp['user'] = self.get_participation_info(
                    local.participation)
        elif local.data['action'] == 'get':
            participation = self.get_participation(
                local.contest, local.data['username'])
            if participation is None:
                return 'Not found'
            local.resp = self.get_participation_info(participation)
            # Append scores of tried tasks
            local.resp['scores'] = []
            for ts in participation.taskscores:
                taskinfo = dict()
                taskinfo['name'] = ts.task.name
                taskinfo['score'] = ts.score
                taskinfo['title'] = ts.task.title
                local.resp['scores'].append(taskinfo)
        elif local.data['action'] == 'list':
            if local.contest is None:
                return "Bad request"
            query = local.session.query(Participation)\
                .join(User)\
                .join(SocialParticipation)\
                .filter(Participation.contest_id == local.contest.id)\
                .order_by(desc(SocialParticipation.score))\
                .order_by(desc(User.id))
            if 'institute' in local.data:
                query = query\
                    .filter(SocialUser.institute_id == local.data['institute'])
            participations, local.resp['num'] = self.sliced_query(query)
            local.resp['users'] = map(
                self.get_participation_info, participations)
        elif local.data['action'] == 'update':
            if local.user is None:
                return 'Unauthorized'
            if 'institute' in local.data and \
                    local.data['institute'] is not None:
                local.user.institute_id = int(local.data['institute'])
            if 'email' in local.data and \
                    local.data['email'] != '' and \
                    local.user.email != local.data['email']:
                err = self.check_email(local.data['email'])
                if err is not None:
                    return err
                local.user.email = local.data['email']
            if 'old_password' in local.data and \
                    local.data['old_password'] != '':
                if not self.validate_user(local.user, local.data['old_password']):
                    return 'Wrong password'
                if len(local.data['password']) < 5:
                    return 'Password\'s too short'
                new_token = self.hashpw(local.data['password'])
                local.user.password = new_token
                local.resp['token'] = new_token
            local.session.commit()
        elif local.data['action'] == 'recover':
            user = local.session.query(User)\
                .filter(User.email == local.data['email'])\
                .first()

            if user is None:
                return 'No such user'

            if len(local.data['code']) > 0:
                local.resp['type'] = 1

                if local.data['code'] == user.social_user.recover_code:
                    user.social_user.recover_code = None

                    # Generate new password an mail it
                    tmp_password = self.gencode()
                    user.password = self.hashpw(tmp_password)
                    local.session.commit()

                    if self.send_mail(user.email, "Password reset",
                                      "New password: %s" % tmp_password):
                        del tmp_password

                        local.resp['message'] = \
                            'Your new password was mailed to you'
                    else:
                        return 'Internal Server Error'
                else:
                    return 'Wrong code'
            else:
                local.resp['type'] = 2

                # Check if enough time has passed
                if datetime.utcnow() - user.social_user.last_recover < timedelta(days=1):
                    local.resp['message'] = 'You should already have received an email, if not, try tomorrow'
                else:
                    # Generate new code and mail it
                    user.social_user.recover_code = self.gencode()
                    user.social_user.lastLesson_recover = datetime.utcnow()
                    local.session.commit()

                    if self.send_mail(user.email, "Code for password reset",
                                      """Username: %s
Recovery code: %s""" % (user.username, user.social_user.recover_code)):
                        local.resp['message'] = 'A code was sent, check your inbox'
                    else:
                        return 'Internal Server Error'
        else:
            return 'Bad request'

    def heartbeat_handler(self):
        local.response = Response()
        if local.user is None:
            local.response.set_cookie(
                'token', expires=datetime.utcnow(), domain=local.contest.social_contest.cookie_domain)
            return 'Unauthorized'
        else:
            new_token = self.build_token()
            if new_token != local.jwt_payload:
                local.response.set_cookie(
                    'token', value=new_token,
                    domain=local.contest.social_contest.cookie_domain)

    def contest_handler(self):
        if local.data['action'] == 'list':
            local.resp['contests'] = []
            query = local.session.query(Contest)\
                .join(SocialContest)\
                .filter(SocialContest.access_level >=
                        local.global_access_level)\
                .filter(SocialContest.social_enabled == True)\
                .order_by(Contest.description)
            for c in query:
                contest = dict()
                contest['name'] = c.name
                contest['description'] = c.description
                local.resp['contests'].append(contest)
        elif local.data['action'] == 'alter':
            if local.contest is None:
                return 'Bad Request'
            if local.access_level != 0:
                return 'Unauthorized'
            self.update_from_data(local.contest, 'description', 'languages')
            self.update_from_data(
                local.contest.social_contest, 'top_left_name', 'title',
                'recaptcha_public_key', 'recaptcha_secret_key', 'mail_server',
                'mail_username', 'mail_password', 'mail_from', 'analytics',
                'cookie_domain', 'homepage', forum='forum_url')
            if 'menu' in local.data:
                if local.data['menu'] is not None:
                    local.contest.social_contest.menu = \
                        json.dumps(local.data['menu'])
                else:
                    local.contest.social_contest.menu = None
            local.session.commit()
        elif local.data['action'] == 'get':
            if local.contest is None:
                return 'Bad Request'
            self.add_info(local.contest, local.resp, 'name', 'description',
                          'languages')
            local.resp['participates'] = local.participation is not None
            self.add_info(local.contest.social_contest, local.resp,
                          'top_left_name', 'title', 'analytics',
                          'cookie_domain', forum='forum_url')
            local.resp['mail_enabled'] = local.contest.social_contest\
                .is_mail_enabled()
            local.resp['captcha_enabled'] = local.contest.social_contest\
                .is_captcha_enabled()
            if local.contest.social_contest.is_captcha_enabled():
                local.resp['recaptcha_public_key'] = local.contest\
                    .social_contest.recaptcha_public_key
            if local.access_level == 0:
                self.add_info(local.contest.social_contest, local.resp,
                              'recaptcha_public_key', 'recaptcha_secret_key',
                              'mail_server', 'mail_username', 'mail_password',
                              'mail_from', menu='menu_on_db')
                local.resp['all_languages'] = map(lambda x: x.name, LANGUAGES)
                if local.resp['menu_on_db'] is not None:
                    local.resp['menu_on_db'] = \
                        json.loads(local.resp['menu_on_db'])
            menu = local.contest.social_contest.menu
            if menu is not None:
                menu = json.loads(menu)
            else:
                def display(var):
                    return 'always' if len(var) > 0 else 'admin'
                task_menu = [{
                        "title": "All tasks",
                        "icon": "fa-list-ol",
                        "sref": "tasklist.page",
                        "params": {"pageNum": 1, "tag": None, "q": None}
                    }, {
                        "title": "Tasks by technique",
                        "icon": "fa-rocket",
                        "sref": "techniques"
                    }, {
                        "title": "Tasks by event",
                        "icon": "fa-trophy",
                        "sref": "events"
                    }, {
                        "title": "Lessons",
                        "icon": "fa-pencil",
                        "sref": "lessons",
                        "display": display(local.contest.lessons)
                    }, {
                        "title": "Material",
                        "icon": "fa-pencil",
                        "sref": "material",
                        "display": display(local.contest.materials)
                    }, {
                        "title": "Quizzes",
                        "icon": "fa-pencil",
                        "sref": "tests",
                        "display": display(local.contest.tests)
                    }]
                menu = [{
                    "title": "Task & quiz archive",
                    "icon":  "fa-archive",
                    "entries": task_menu
                }, {
                    "title": "Ranking",
                    "icon": "fa-trophy",
                    "entries": [{
                        "title": "Ranking",
                        "icon": "fa-trophy",
                        "sref": "ranking.page",
                        "params": {"pageNum": 1}
                    }]
                }]
                if local.contest.social_contest.forum is not None:
                    menu.append({
                        "title": "Forum",
                        "icon": "fa-trophy",
                        "entries": [{
                            "title": "Forum",
                            "icon": "fa-comments",
                            "href": local.contest.social_contest.forum
                        }]})
                menu.append({
                    "title": "Sign up",
                    "icon": "fa-pencil",
                    "entries": [{
                        "title": "Sign up",
                        "icon": "fa-pencil",
                        "sref": "signup",
                        "display": "unlogged"
                    }]})
            local.resp["menu"] = menu
        else:
            return 'Bad Request'

    def lessons_handler(self):
        if local.data['action'] == 'list':
            query = local.session.query(Lesson)\
                .filter(Lesson.contest_id == local.contest.id)\
                .filter(Lesson.access_level >= local.access_level)\
                .order_by(desc(Lesson.id))
            local.resp['lessons'] = []
            for l in query:
                data = dict()
                data['id'] = l.id
                data['title'] = l.title
                data['access_level'] = l.access_level
                data['tasks'] = []
                for t in l.tasks:
                    task = dict()
                    task['num'] = t.num
                    task['name'] = t.task.name
                    task['title'] = t.task.title
                    if local.participation is not None:
                        taskscore = local.session.query(TaskScore)\
                            .filter(TaskScore.task_id == t.task.id)\
                            .filter(TaskScore.participation_id ==
                                    local.participation.id).first()
                        if taskscore is not None:
                            task['score'] = taskscore.score
                    data['tasks'].append(task)
                data['tasks'].sort(key=lambda x: x['num'])
                local.resp['lessons'].append(data)
        elif local.data['action'] == 'alter':
            if local.access_level != 0:
                return 'Unauthorized'
            try:
                lesson = local.session.query(Lesson)\
                    .filter(Lesson.contest_id == local.contest.id)\
                    .filter(Lesson.id == local.data['id']).first()
                lesson.access_level = local.data['access_level']
                for lt in lesson.tasks:
                    lt.task.social_task.access_level = lesson.access_level
                    local.session.add(lt.task)
                local.session.commit()
            except KeyError, ValueError:
                return 'Bad Request'
        elif local.data['action'] == 'delete':
            if local.access_level != 0:
                return 'Unauthorized'
            try:
                lesson = local.session.query(Lesson)\
                    .filter(Lesson.contest_id == local.contest.id)\
                    .filter(Lesson.id == local.data['id']).first()
                deleted_tasks = []
                for lt in lesson.tasks:
                    deleted_tasks.append(lt.task.num)
                    local.session.delete(lt.task.social_task)
                    local.session.delete(lt.task)
                    local.session.delete(lt)
                local.session.delete(lesson)
                local.session.flush()
                for tn in sorted(deleted_tasks, reverse=True):
                    for t in local.session.query(Task)\
                        .filter(Task.contest_id == local.contest.id)\
                        .filter(Task.num > tn).all():
                        t.num -= 1
                local.session.commit()
            except KeyError, ValueError:
                return 'Bad Request'
        elif local.data['action'] == 'new':
            if local.access_level != 0:
                return 'Unauthorized'
            archive_data = self.decode_file(local.data['files']['submission'])
            with tempfile.NamedTemporaryFile() as temp:
                temp.write(archive_data['body'])
                temp.flush()
                status = 0
                script_file = os.path.join(
                    pkg_resources.resource_filename('cmsocial', 'scripts'),
                    'import_lessons_from_zip.sh')
                try:
                    local.resp['log'] = check_output([
                        script_file,
                        str(local.contest.id),
                        temp.name], stderr=STDOUT)
                except CalledProcessError as e:
                    status = e.returncode
                    local.resp['log'] = e.output
            if status != 0:
                return 'Error %s in script' % status
        else:
            return 'Bad Request'

    def material_handler(self):
        if local.data['action'] == 'list':
            query = local.session.query(Material)\
                .filter(Material.contest_id == local.contest.id)\
                .filter(Material.access_level >= local.access_level)\
                .order_by(Material.id.desc())
            local.resp['materials'] = [{
                    'id': m.id,
                    'title': m.title,
                    'access_level': m.access_level,
                    'text': m.text
                } for m in query]
        elif local.data['action'] == 'alter':
            if local.access_level != 0:
                return 'Unauthorized'
            try:
                material = local.session.query(Material)\
                    .filter(Material.contest_id == local.contest.id)\
                    .filter(Material.id == local.data['id']).first()
                self.update_from_data(material, 'text', 'title', 'access_level')
                local.session.commit()
            except KeyError, ValueError:
                return 'Bad Request'
        # elif local.data['action'] == 'swap':
        #     if local.access_level != 0:
        #         return 'Unauthorized'
        #     try:
        #         material1 = local.session.query(Material)\
        #             .filter(Material.contest_id == local.contest.id)\
        #             .filter(Material.id == local.data['id1']).first()
        #         material2 = local.session.query(Material)\
        #             .filter(Material.contest_id == local.contest.id)\
        #             .filter(Material.id == local.data['id2']).first()
        #         material1.position, material2.position = material2.position, material1.position
        #         local.session.commit()
        #     except KeyError, ValueError:
        #         return 'Bad Request'
        elif local.data['action'] == 'delete':
            if local.access_level != 0:
                return 'Unauthorized'
            try:
                material = local.session.query(Material)\
                    .filter(Material.contest_id == local.contest.id)\
                    .filter(Material.id == local.data['id']).first()
                local.session.delete(material)
                local.session.commit()
            except KeyError, ValueError:
                return 'Bad Request'
        elif local.data['action'] == 'new':
            if local.access_level != 0:
                return 'Unauthorized'

            archive_data = self.decode_file(local.data['files']['mdfile'])

            try:
                material = Material()
                material.contest = local.contest
                material.access_level = 0
                material.text = archive_data['body']
                material.title = local.data['title']

                local.session.add(material)
                local.session.commit()
            except ValueError:
                return 'Bad Request'
        else:
            return 'Bad Request'

    def task_handler(self):
        if local.data['action'] == 'list':
            if local.contest is None:
                return 'Bad request'
            query = local.session.query(Task)\
                .join(SocialTask)\
                .filter(Task.contest_id == local.contest.id)\
                .filter(SocialTask.access_level >= local.access_level)\
                .order_by(desc(SocialTask.id))

            if 'tag' in local.data and local.data['tag'] is not None:
                # Ignore requests with more that 5 tags
                tags = local.data['tag'].split(',')[:5]
                conditions = [Tag.name == tname for tname in tags]
                targets = local.session.query(
                    Tag).filter(or_(*conditions)).all()
                local.resp['tags'] = []
                for tag in targets:
                    local.resp['tags'].append(tag.name)
                    query = query.filter(SocialTask.tasktags.any(tag=tag))

            if 'search' in local.data and local.data['search'] is not None:
                sq = '%%%s%%' % local.data['search']
                query = query.filter(
                    or_(Task.title.ilike(sq), Task.name.ilike(sq)))

            tasks, local.resp['num'] = self.sliced_query(query)
            local.resp['tasks'] = []

            for t in tasks:
                task = dict()
                task['id'] = t.id
                task['name'] = t.name
                task['title'] = t.title
                task['difficulty'] = t.social_task.difficulty
                task['category'] = t.social_task.category

                if local.participation is not None:
                    taskscore = local.session.query(TaskScore)\
                        .filter(TaskScore.task_id == t.id)\
                        .filter(TaskScore.participation_id ==
                                local.participation.id).first()

                    if taskscore is not None:
                        task['score'] = taskscore.score

                local.resp['tasks'].append(task)

            # Add information about assessment test!
            if False and local.user is not None:
                answer = local.session.query(TestScore)\
                    .filter(TestScore.user_id == local.user.id)\
                    .filter(TestScore.test_id == 10)\
                    .first()

                local.resp["assessment"] = (answer is not None
                                            and answer.score >= 10)
            else:
                # Let's not bother unlogged users
                local.resp["assessment"] = True

        elif local.data['action'] == 'get':
            t = local.session.query(Task)\
                .join(SocialTask)\
                .filter(Task.contest_id == local.contest.id)\
                .filter(Task.name == local.data['name'])\
                .filter(SocialTask.access_level >= local.access_level).first()
            if t is None:
                return 'Not found'
            local.resp['id'] = t.id
            local.resp['name'] = t.name
            local.resp['title'] = t.title
            local.resp['help_available'] = t.social_task.help_available
            local.resp['statements'] =\
                dict([(l, s.digest) for l, s in t.statements.iteritems()])
            local.resp['submission_format'] =\
                [sfe.filename for sfe in t.submission_format]
            for i in ['time_limit', 'memory_limit', 'task_type']:
                local.resp[i] = getattr(t.active_dataset, i)
            att = []
            for (name, obj) in t.attachments.iteritems():
                att.append((name, obj.digest))
            local.resp['attachments'] = att
            local.resp['tags'] = []
            for tasktag in t.social_task.tasktags:
                if not tasktag.tag.hidden:
                    tag = {'name': tasktag.tag.name}
                    if local.user is None:
                        tag['can_delete'] = False
                    else:
                        tag['can_delete'] = \
                                (local.user.social_user is tasktag.user and
                                 not tasktag.approved) or \
                            local.user.social_user.access_level == 0
                    local.resp['tags'].append(tag)
        elif local.data['action'] == 'stats':
            t = local.session.query(Task)\
                .join(SocialTask)\
                .filter(Task.name == local.data['name'])\
                .filter(SocialTask.access_level >= local.access_level).first()
            if t is None:
                return 'Not found'
            local.resp['nsubs'] = t.social_task.nsubs
            local.resp['nusers'] = t.social_task.nusers
            local.resp['nsubscorrect'] = t.social_task.nsubscorrect
            local.resp['nuserscorrect'] = t.social_task.nuserscorrect
            best = local.session.query(TaskScore)\
                .filter(TaskScore.task == t.social_task)\
                .filter(TaskScore.score == 100)\
                .order_by(TaskScore.time)\
                .slice(0, 10).all()
            local.resp['best'] = [{'username': b.participation.user.username,
                                   'time': b.time} for b in best]
        elif local.data['action'] == 'bulk_download':
            tmp_path = tempfile.mkdtemp()

            for f in local.data['attachments']:
                # Retrieve each attachment by its digest and store it with
                # its name.
                self.file_cacher.get_file_to_path(
                    f[1],
                    os.path.join(tmp_path, f[0]))

            # Create a zip archive named after task name.
            archive_name = next(tempfile._get_candidate_names()) + '.zip'
            archive_path = os.path.join(tmp_path, archive_name)
            Archive.create_from_dir(tmp_path, archive_path)

            # Store the archive in FileCacher and return its digest.
            digest = self.file_cacher.put_file_from_path(archive_path)
            local.resp['digest'] = digest

            # Cleanup
            try:
                rmtree(tmp_path)
            except:
                pass
        else:
            return 'Bad request'

    def tag_handler(self):
        if local.data['action'] == 'list':
            tags = local.session.query(Tag)\
                .order_by(Tag.id)\
                .filter(Tag.hidden == False)

            if local.data.get('filter') == 'techniques':
                tags = tags.filter(Tag.is_technique == True)

            if local.data.get('filter') == 'events':
                tags = tags.filter(Tag.is_event == True)

            local.resp['tags'] = [t.name for t in tags.all()]
        elif local.data['action'] == 'create':
            if local.access_level >= 4:
                return 'Unauthorized'
            try:
                if len(local.data['description']) < 5:
                    return 'Description is too short'
                else:
                    tag = Tag(name=local.data['tag'],
                              description=local.data['description'],
                              hidden=False)
                    local.session.add(tag)
                    local.session.commit()
            except IntegrityError:
                return 'Tag already exists'
        elif local.data['action'] == 'delete':
            if local.access_level >= 4:
                return 'Unauthorized'
            tag = local.session.query(Tag)\
                .filter(Tag.name == local.data['tag']).first()
            if tag is None:
                return 'Tag does not exist'
            elif tag.hidden is True and local.access_level > 0:
                return 'Unauthorized'
            else:
                local.session.delete(tag)
                local.session.commit()
        elif local.data['action'] == 'add':
            if local.access_level > 5:
                return 'Unauthorized'
            tag = local.session.query(Tag)\
                .filter(Tag.name == local.data['tag']).first()
            task = local.session.query(Task)\
                .filter(Task.name == local.data['task']).first()
            if tag is None:
                return 'Tag does not exist'
            elif tag.hidden is True and local.access_level > 0:
                return 'Unauthorized'
            elif task is None:
                return 'Task does not exist'
            else:
                try:
                    local.session.add(
                        TaskTag(task=task.social_task, tag=tag,
                                user=local.user.social_user))
                    local.session.commit()
                except IntegrityError:
                    return 'The task already has this tag'

        elif local.data['action'] == 'remove':
            if local.access_level > 5:
                return 'Unauthorized'
            tag = local.session.query(Tag)\
                .filter(Tag.name == local.data['tag']).first()
            task = local.session.query(Task)\
                .filter(Task.name == local.data['task']).first()
            tasktag = local.session.query(TaskTag)\
                .filter(TaskTag.tag == tag)\
                .filter(TaskTag.task == task).first()
            if local.access_level > 0:
                if tag.hidden or tasktag.approved or \
                   local.user.social_user is not tasktag.user:
                    return 'Unauthorized'
            elif tasktag is None:
                return 'Task does not have tag'

            local.session.delete(tasktag)
            local.session.commit()
        else:
            return 'Bad request'

    def help_handler(self):
        if local.participation is None:
            return 'Unauthorized'

        task = local.session.query(Task)\
            .filter(Task.name == local.data['task'])\
            .filter(Task.contest_id == local.contest.id)\
            .first()

        if task is None:
            return "Bad request"

        if local.data['action'] == 'check':
            testcases = local.session.query(Testcase)\
                .filter(Testcase.dataset == task.active_dataset)\
                .all()

            local.resp['testcases'] = [
                {'codename': t.codename} for t in testcases]

        elif local.data['action'] == 'get':
            # Make sure that this task allows requests
            if not task.social_task.help_available:
                return 'Questo task non accetta richieste di testcase.'

            socpart = local.participation.social_participation
            # Make sure that the user is allowed to request
            # TODO: de-hardcode this.
            if datetime.utcnow() - socpart.last_help_time < timedelta(hours=1):
                return "Hai già fatto una richiesta nell'ultima ora."

            testcase = local.session.query(Testcase)\
                .filter(Testcase.dataset == task.active_dataset)\
                .filter(Testcase.codename == local.data['testcase'])\
                .first()

            if testcase is None:
                return "Bad request"

            # Log this so we can kind of "keep track" of the requests...
            logger.info("User \"%s\" requested testcase %s for task \"%s\"." % (
                local.user.username, local.data['testcase'], local.data['task']
            ))
            socpart.last_help_time = datetime.utcnow()
            socpart.help_count += 1
            local.session.commit()

            # Return hashes
            local.resp["input"] = testcase.input
            local.resp["output"] = testcase.output

    def test_handler(self):
        if local.data['action'] == 'list':
            tests = local.session.query(Test)\
                .filter(Test.access_level >= local.access_level)\
                .filter(Test.contest_id >= local.contest.id)\
                .order_by(Test.id).all()
            local.resp['tests'] = []
            for t in tests:
                test = {
                    'name': t.name,
                    'description': t.description,
                    'max_score': t.max_score
                }
                if local.user is not None:
                    testscore = local.session.query(TestScore)\
                        .filter(TestScore.test_id == t.id)\
                        .filter(TestScore.participation_id ==
                                local.participation.id).first()
                    if testscore is not None:
                        test['score'] = testscore.score
                local.resp['tests'].append(test)
        elif local.data['action'] == 'get':
            test = local.session.query(Test)\
                .filter(Test.name == local.data['test_name'])\
                .filter(Test.contest_id >= local.contest.id)\
                .filter(Test.access_level >= local.access_level).first()
            if test is None:
                return 'Not found'
            local.resp['name'] = test.name
            local.resp['description'] = test.description
            local.resp['questions'] = []
            for i in test.questions:
                q = dict()
                q['type'] = i.type
                q['text'] = i.text
                q['max_score'] = i.score
                ansdata = json.loads(i.answers)
                if i.type == 'choice':
                    q['choices'] = [t[0] for t in ansdata]
                else:
                    q['answers'] = [[t[0], len(t[1])] for t in ansdata]
                local.resp['questions'].append(q)
        elif local.data['action'] == 'answer':
            if local.participation is None:
                return "Not authorized"
            test = local.session.query(Test)\
                .filter(Test.name == local.data['test_name'])\
                .filter(Test.contest_id >= local.contest.id)\
                .filter(Test.access_level >= local.access_level).first()
            if test is None:
                return 'Not found'
            data = local.data['answers']
            for i in xrange(len(test.questions)):
                q = test.questions[i]
                ansdata = json.loads(q.answers)
                if q.type == 'choice':
                    local.resp[i] = [q.wrong_score, 'wrong']
                    try:
                        if data[i] is None:
                            local.resp[i] = [0, 'empty']
                        elif ansdata[int(data[i])][1]:
                            local.resp[i] = [q.score, 'correct']
                    except IndexError:
                        pass
                    continue
                elif q.type == 'notempty':
                    local.resp[i] = [q.score, 'correct']
                    for d in data[i].values():
                        if not isinstance(
                                d, list) or len(d) != 1 or d[0] is None or len(
                                    d[0]) < 1:
                            local.resp[i] = [0, 'empty']
                    continue
                else:
                    for key, correct in ansdata:
                        ans = data[i].get(key, None)
                        if len(ans) != len(correct):
                            local.resp[i] = [q.wrong_score, 'wrong']
                        for a in xrange(len(ans)):
                            if ans[a] is None:
                                local.resp[i] = [0, 'empty']
                                break
                            if q.type == 'number':
                                try:
                                    an = float(ans[a])
                                    cor = float(correct[a])
                                except:
                                    # Hack to make the answer wrong if the user
                                    # triggers a TypeError
                                    an = 1
                                    cor = 2
                            else:
                                an = ans[a].lower()
                                cor = correct[a].lower()
                            if an != cor:
                                local.resp[i] = [q.wrong_score, 'wrong']
                    if local.resp.get(i, None) is None:
                        local.resp[i] = [q.score, 'correct']
            score = sum([local.resp[i][0] for i in
                         xrange(len(test.questions))])
            testscore = local.session.query(TestScore)\
                .filter(TestScore.test_id == test.id)\
                .filter(TestScore.participation_id == local.participation.id).first()
            if testscore is None:
                testscore = TestScore(score=score)
                testscore.participation = local.participation
                testscore.test = test
                local.session.add(testscore)
            else:
                if score > testscore.score:
                    testscore.score = score
            local.session.commit()
        else:
            return 'Bad request'

    def submission_handler(self):
        if local.data['action'] == 'list':
            task = local.session.query(Task)\
                .filter(Task.contest_id == local.contest.id)\
                .filter(Task.name == local.data['task_name']).first()
            if task is None:
                return 'Not found'
            if local.user is None:
                return 'Unauthorized'
            subs = local.session.query(Submission)\
                .filter(Submission.participation_id == local.participation.id)\
                .filter(Submission.task_id == task.id)\
                .order_by(desc(Submission.timestamp)).all()
            submissions = []
            for s in subs:
                submission = dict()
                submission['id'] = s.id
                submission['task_id'] = s.task_id
                submission['timestamp'] = make_timestamp(s.timestamp)
                submission['files'] = []
                for name, f in s.files.iteritems():
                    fi = dict()
                    if s.language is None:
                        fi['name'] = name
                    else:
                        ext = get_language(s.language).source_extension[1:]
                        fi['name'] = name.replace('%l', ext)
                    fi['digest'] = f.digest
                    submission['files'].append(fi)
                result = s.get_result()
                for i in ['compilation_outcome', 'evaluation_outcome']:
                    submission[i] = getattr(result, i, None)
                if result is not None and result.score is not None:
                    submission['score'] = round(result.score, 2)
                submissions.append(submission)
            local.resp['submissions'] = submissions
        elif local.data['action'] == 'details':
            s = local.session.query(Submission)\
                .filter(Submission.id == local.data['id']).first()
            if s is None:
                return 'Not found'
            if local.user is None or s.participation_id != local.participation.id:
                return 'Unauthorized'
            submission = dict()
            submission['id'] = s.id
            submission['task_id'] = s.task_id
            submission['timestamp'] = make_timestamp(s.timestamp)
            submission['language'] = s.language
            submission['files'] = []
            for name, f in s.files.iteritems():
                fi = dict()
                if s.language is None:
                    fi['name'] = name
                else:
                    fi['name'] = name.replace('%l', s.language)
                fi['digest'] = f.digest
                submission['files'].append(fi)
            result = s.get_result()
            for i in [
                    'compilation_outcome', 'evaluation_outcome',
                    'compilation_stdout', 'compilation_stderr',
                    'compilation_time', 'compilation_memory'
            ]:
                submission[i] = getattr(result, i, None)
            if result is not None and result.score is not None:
                submission['score'] = round(result.score, 2)
            if result is not None and result.score_details is not None:
                tmp = json.loads(result.score_details)
                if len(tmp) > 0 and 'text' in tmp[0]:
                    subt = dict()
                    subt['testcases'] = tmp
                    subt['score'] = submission['score']
                    subt['max_score'] = 100
                    submission['score_details'] = [subt]
                else:
                    submission['score_details'] = tmp
                for subtask in submission['score_details']:
                    for testcase in subtask['testcases']:
                        data = json.loads(testcase['text'])
                        testcase['text'] = data[0] % tuple(data[1:])
            else:
                submission['score_details'] = None
            local.resp = submission
        elif local.data['action'] == 'new':
            if local.user is None:
                return 'Unauthorized'
            lastsub = local.session.query(Submission)\
                .filter(Submission.participation_id == local.participation.id)\
                .order_by(desc(Submission.timestamp)).first()
            if lastsub is not None and \
               make_datetime() - lastsub.timestamp < timedelta(seconds=20):
                return 'Too frequent submissions!'

            try:
                task = local.session.query(Task)\
                    .join(SocialTask)\
                    .filter(Task.contest_id == local.contest.id)\
                    .filter(Task.name == local.data['task_name'])\
                    .filter(SocialTask.access_level >= local.access_level).first()
            except KeyError:
                return 'Not found'

            if len(local.data['files']) == 1 and \
               'submission' in local.data['files']:
                archive_data = self.decode_file(local.data['files']['submission'])
                del local.data['files']['submission']

                # Create the archive.
                archive = Archive.from_raw_data(archive_data["body"])

                if archive is None:
                    return 'Invalid archive!'

                # Extract the archive.
                unpacked_dir = archive.unpack()
                for name in archive.namelist():
                    filename = os.path.basename(name)
                    body = open(os.path.join(
                        unpacked_dir, filename), "r").read()
                    local.data['files'][filename] = {
                        'filename': filename,
                        'body': body
                    }

                files_sent = local.data['files']

                archive.cleanup()
            else:
                files_sent = \
                    dict([(k, self.decode_file(v))
                          for k, v in local.data['files'].iteritems()])

            # TODO: implement partial submissions (?)

            # Detect language
            files = []
            sub_lang = None
            for sfe in task.submission_format:
                f = files_sent.get(sfe.filename)
                if f is None:
                    return 'Some files are missing!'
                if len(f['body']) > config.get("core", "max_submission_length"):
                    return 'The files you sent are too big!'
                f['name'] = sfe.filename
                files.append(f)
                if sfe.filename.endswith('.%l'):
                    language = None
                    for ext in SOURCE_EXTS:
                        l = filename_to_language(ext)
                        if f['filename'].endswith(ext):
                            language = l
                    if language is None:
                        return 'The language of the files you sent is not ' + \
                               'recognized!'
                    elif sub_lang is not None and sub_lang != language:
                        return 'The files you sent are in different languages!'
                    else:
                        sub_lang = language

            # Add the submission
            timestamp = make_datetime()
            submission = Submission(timestamp,
                                    sub_lang.name,
                                    participation=local.participation,
                                    task=task)
            for f in files:
                digest = self.file_cacher.put_file_content(
                    f['body'], 'Submission file %s sent by %s at %d.' %
                    (f['name'], local.user.username,
                     make_timestamp(timestamp)))
                local.session.add(
                    File(f['name'], digest, submission=submission))
            local.session.add(submission)
            local.session.commit()

            # Notify ES
            self.evaluation_service.new_submission(submission_id=submission.id)

            # Answer with submission data
            local.resp['id'] = submission.id
            local.resp['task_id'] = submission.task_id
            local.resp['timestamp'] = make_timestamp(submission.timestamp)
            local.resp['compilation_outcome'] = None
            local.resp['evaluation_outcome'] = None
            local.resp['score'] = None
            local.resp['files'] = []
            for name, f in submission.files.iteritems():
                fi = dict()
                if submission.language is None:
                    fi['name'] = name
                else:
                    fi['name'] = name.replace('%l', submission.language)
                fi['digest'] = f.digest
                local.resp['files'].append(fi)
        else:
            return 'Bad request'


class PracticeWebServer(Service):
    '''Service that runs the web server for practice.

    '''

    def __init__(self, args):
        Service.__init__(self, shard=args.shard)

        self.address = config.get("core", "listen_address")
        self.port = int(config.get("core", "listen_port")) + args.shard
        self.file_cacher = FileCacher(self)
        self.evaluation_service = self.connect_to(
            ServiceCoord('EvaluationService', 0))

        self.wsgi_app = APIHandler(self)

    def run(self):
        server = Server((self.address, self.port), self.wsgi_app)
        gevent.spawn(server.serve_forever)
        Service.run(self)


def main():
    parser = argparse.ArgumentParser(
        description="PracticeWebServer",
        formatter_class=argparse.RawDescriptionHelpFormatter)

    parser.add_argument("-s", "--shard", action="store", type=int, default=0,
                        help="Shard number (default: 0)")

    args, unknown = parser.parse_known_args()

    PracticeWebServer(args).run()
