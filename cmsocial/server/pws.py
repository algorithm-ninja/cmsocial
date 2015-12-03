# -*- coding: utf-8 -*-

import os
import io
import re
import hmac
import json
import urllib
import logging
import hashlib
import tempfile
import mimetypes
import traceback
import pkg_resources

from base64 import b64decode, b64encode
from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy import desc
from sqlalchemy.sql import or_, and_

from cms import config, ServiceCoord, SOURCE_EXT_TO_LANGUAGE_MAP
from cms.io import Service
from cms.db.filecacher import FileCacher
from cms.db import SessionGen, User, Submission, File, Task

from cmsocial.db.test import Test, TestScore
from cmsocial.db.socialtask import SocialTask, TaskScore, Tag, TaskTag
from cmsocial.db.socialuser import SocialUser
from cmsocial.db.location import Institute, Region, Province, City

from cmscommon.datetime import make_timestamp, make_datetime
from cmscommon.archive import Archive

from werkzeug.wrappers import Response, Request
from werkzeug.wsgi import SharedDataMiddleware, wrap_file, responder
from werkzeug.routing import Map, Rule
from werkzeug.exceptions import HTTPException, NotFound, BadRequest, \
    InternalServerError

import gevent
import gevent.local
import gevent.wsgi

logger = logging.getLogger(__name__)
local = gevent.local.local()


class WSGIHandler(gevent.wsgi.WSGIHandler):
    def format_request(self):
        if self.time_finish:
            delta = '%.6f' % (self.time_finish - self.time_start)
        else:
            delta = '-'
        client_address = self.environ['REMOTE_ADDR']
        return '%s %s %s %s' % (
            client_address or '-',
            (getattr(self, 'status', None) or '000').split()[0],
            delta,
            getattr(self, 'requestline', ''))

    def log_request(self):
        logger.info(self.format_request())

    def get_environ(self):
        env = gevent.wsgi.WSGIHandler.get_environ(self)
        # Proxy support
        if config.is_proxy_used:
            if 'HTTP_X_FORWARDED_FOR' in env:
                env['REMOTE_ADDR'] = \
                    env['HTTP_X_FORWARDED_FOR'].split(',')[0].strip()
            elif 'HTTP_X_REAL_IP' in env:
                env['REMOTE_ADDR'] = env['HTTP_X_REAL_IP']
        return env


class Server(gevent.wsgi.WSGIServer):
    handler_class = WSGIHandler


class APIHandler(object):
    def __init__(self, parent):
        self.router = Map([
            Rule('/', methods=['GET', 'POST'], endpoint='root'),
            Rule('/files/<digest>', methods=['GET', 'POST'],
                 endpoint='dbfile'),
            Rule('/files/<digest>/<name>', methods=['GET', 'POST'],
                 endpoint='dbfile'),
            Rule('/<target>', methods=['POST'], endpoint='jsondata')
        ], encoding_errors='strict')
        self.file_cacher = parent.file_cacher
        self.evaluation_service = parent.evaluation_service
        self.EMAIL_REG = re.compile(r'[^@]+@[^@]+\.[^@]+')
        self.USERNAME_REG = re.compile(r'^[A-Za-z0-9_\.]+$')
        self.file_root = pkg_resources.resource_filename('cmsocial', 'web')

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
        except HTTPException:
            return NotFound()

        try:
            if endpoint == 'root':
                return self.file_handler(environ, 'index.html')
            elif endpoint == 'dbfile':
                return self.dbfile_handler(environ, args)
        except HTTPException as e:
            return e

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
            try:
                username = data['username']
                token = data['token']
                local.user = self.get_user(username, token)
            except (BadRequest, KeyError):
                local.user = None
            if local.user is None:
                local.access_level = 7  # Access level of unlogged user
            else:
                local.access_level = local.user.access_level

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

        response = Response()
        response.mimetype = 'application/json'
        response.status_code = 200
        if ans is None:
            response.data = json.dumps(local.resp)
        else:
            response.data = json.dumps({'success': 0, 'error': ans})
        return response

    # Useful methods
    def sliced_query(self, query):
        res = query.slice(local.data['first'], local.data['last']).all()
        num = query.count()
        return (res, num)

    def get_user(self, username, token):
        try:
            return local.session.query(User)\
                .filter(User.username == username)\
                .filter(User.password == token).first()
        except UnicodeDecodeError:
            return None

    def check_user(self, username):
        if len(username) < 4:
            return 'Username is too short'
        elif not self.USERNAME_REG.match(username):
            return 'Username is invalid'
        else:
            user = local.session.query(User)\
                .filter(User.username == username).first()
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

    def hashpw(self, pw):
        return self.hash(pw + config.secret_key)

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
        info['access_level'] = user.access_level
        info['join_date'] = make_timestamp(user.registration_time)
        info['mail_hash'] = self.hash(user.email, 'md5')
        #info['post_count'] = len(user.posts)
        info['score'] = user.score
        info['institute'] = self.get_institute_info(user.institute_id)
        info['first_name'] = user.first_name
        info['last_name'] = user.last_name
        info['tasks_solved'] = -1
        return info

    # Handlers that do not require JSON data
    def file_handler(self, environ, filename):
        path = os.path.join(
            self.file_root,
            filename)

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
        return response

    def dbfile_handler(self, environ, args):
        try:
            fobj = self.file_cacher.get_file(args['digest'])
        except KeyError:
            raise NotFound()

        response = Response()
        response.status_code = 200

        response.mimetype = 'application/octet-stream'
        if 'filename' in args:
            response.headers.add_header(
                b'Content-Disposition', b'attachment',
                filename=args['filename'])
            mimetype = mimetypes.guess_type(args['filename'])[0]
            if mimetype is not None:
                response.mimetype = mimetype

        response.response = wrap_file(environ, fobj)
        response.direct_passthrough = True
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
            local.resp['regions'] = [{'id': r.id, 'name': r.name}
                                     for r in out]
        elif local.data['action'] == 'listprovinces':
            out = local.session.query(Province)\
                .filter(Province.region_id == local.data['id']).all()
            local.resp['provinces'] = [{'id': r.id, 'name': r.name}
                                       for r in out]
        elif local.data['action'] == 'listcities':
            out = local.session.query(City)\
                .filter(City.province_id == local.data['id']).all()
            local.resp['cities'] = [{'id': r.id, 'name': r.name}
                                    for r in out]
        elif local.data['action'] == 'listinstitutes':
            out = local.session.query(Institute)\
                .filter(Institute.city_id == local.data['id']).all()
            local.resp['institutes'] = [{'id': r.id, 'name': r.name}
                                        for r in out]

    def sso_handler(self):
        if local.user is None:
            return 'Unauthorized'
        payload = local.data['payload']
        sig = local.data['sig']
        computed_sig = hmac.new(
            config.secret_key.encode(),
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
            config.secret_key.encode(),
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
                email = local.data['email']
                firstname = local.data['firstname']
                lastname = local.data['lastname']
                institute = int(local.data['institute'])
            except KeyError:
                logger.warning('Missing parameters')
                return 'Bad request'

            token = self.hashpw(password)

            err = self.check_user(username)
            if err is not None:
                return err
            err = self.check_email(email)
            if err is not None:
                return err

            user = User(
                first_name=firstname,
                last_name=lastname,
                username=username,
                password=token,
                email=email,
                access_level=6,
                registration_time=make_datetime()
            )
            user.institute_id = institute
            try:
                local.session.add(user)
                local.session.commit()
            except IntegrityError:
                return 'signup.user_exists'
        elif local.data['action'] == 'login':
            try:
                username = local.data['username']
                password = local.data['password']
            except KeyError:
                logger.warning('Missing parameter')
                return 'Bad request'

            token = self.hashpw(password)

            user = self.get_user(username, token)
            if user is None:
                return 'login.error'
            else:
                local.resp['token'] = token
                local.resp['user'] = self.get_user_info(user)
        elif local.data['action'] == 'get':
            user = local.session.query(User)\
                .filter(User.username == local.data['username']).first()
            if user is None:
                return 'Not found'
            local.resp = self.get_user_info(user)
            # Append scores of tried tasks
            local.resp['scores'] = []
            for ts in user.taskscores:
                taskinfo = dict()
                taskinfo['name'] = ts.task.name
                taskinfo['score'] = ts.score
                taskinfo['title'] = ts.task.title
                local.resp['scores'].append(taskinfo)
        elif local.data['action'] == 'list':
            # FIXME: we had the following filter before, not sure why
            # .filter(User.hidden == False)
            query = local.session.query(User)\
                .add_columns(User.username)\
                .add_columns(User.first_name)\
                .add_columns(User.last_name)\
                .add_columns(User.email)\
                .add_columns(SocialUser.access_level)\
                .add_columns(SocialUser.score)\
                .add_columns(SocialUser.registration_time)\
                .add_columns(SocialUser.institute_id)\
                .join(SocialUser)\
                .order_by(desc(SocialUser.score))\
                .order_by(desc(SocialUser.id))
            if 'institute' in local.data:
                query = query\
                    .filter(SocialUser.institute_id == local.data['institute'])
            users, local.resp['num'] = self.sliced_query(query)
            local.resp['users'] = map(self.get_user_info, users)
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
                old_token = self.hashpw(local.data['old_password'])
                if local.user.password != old_token:
                    return 'Wrong password'
                if len(local.data['password']) < 5:
                    return 'Password\'s too short'
                new_token = self.hashpw(local.data['password'])
                local.user.password = new_token
                local.resp['token'] = new_token
            local.session.commit()
        else:
            return 'Bad request'

    def heartbeat_handler(self):
        if local.user is None:
            return 'Unauthorized'

    def task_handler(self):
        if local.data['action'] == 'list':
            query = local.session.query(Task)\
                .join(SocialTask)\
                .filter(SocialTask.access_level >= local.access_level)
                # FIXME: what default order do we use?
                #.order_by(desc(SocialTask.id))

            if 'tag' in local.data and local.data['tag'] is not None:
                tags = local.data['tag'].split(',')[:5]  # Ignore requests with more that 5 tags
                conditions = [Tag.name == tname for tname in tags]
                targets = local.session.query(Tag).filter(or_(*conditions)).all()
                local.resp['tags'] = []
                for tag in targets:
                    local.resp['tags'].append(tag.name)
                    query = query.filter(SocialTask.tasktags.any(tag=tag))

            if 'search' in local.data and local.data['search'] is not None:
                sq = '%%%s%%' % local.data['search']
                query = query.filter(or_(Task.title.ilike(sq),
                                         Task.name.ilike(sq)))

            tasks, local.resp['num'] = self.sliced_query(query)
            local.resp['tasks'] = []

            for t in tasks:
                task = dict()
                task['id'] = t.id
                task['name'] = t.name
                task['title'] = t.title

                if local.user is not None:
                    taskscore = local.session.query(TaskScore)\
                        .filter(TaskScore.task_id == t.id)\
                        .filter(TaskScore.user_id == local.user.id).first()

                    if taskscore is not None:
                        task['score'] = taskscore.score

                local.resp['tasks'].append(task)

        elif local.data['action'] == 'get':
            t = local.session.query(Task)\
                .join(SocialTask)\
                .filter(Task.name == local.data['name'])\
                .filter(SocialTask.access_level >= local.access_level).first()
            if t is None:
                return 'Not found'
            local.resp['id'] = t.id
            local.resp['name'] = t.name
            local.resp['title'] = t.title
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
            for tasktag in t.tasktags:
                if not tasktag.tag.hidden:
                    local.resp['tags'].append({
                        'name': tasktag.tag.name,
                        'can_delete': local.user is tasktag.user and not tasktag.approved
                    })

        elif local.data['action'] == 'stats':
            t = local.session.query(Task)\
                .filter(Task.name == local.data['name'])\
                .filter(Task.access_level >= local.access_level).first()
            if t is None:
                return 'Not found'
            local.resp['nsubs'] = t.nsubs
            local.resp['nusers'] = t.nusers
            local.resp['nsubscorrect'] = t.nsubscorrect
            local.resp['nuserscorrect'] = t.nuserscorrect
            best = local.session.query(TaskScore)\
                .filter(TaskScore.task == t)\
                .filter(TaskScore.score == 100)\
                .order_by(TaskScore.time)\
                .slice(0, 10).all()
            local.resp['best'] = [{'username': b.user.username,
                                   'time': b.time} for b in best]
        else:
            return 'Bad request'

    def tag_handler(self):
        if local.data['action'] == 'list':
            tags = local.session.query(Tag)\
                .order_by(Tag.id)\
                .filter(Tag.hidden == False).all()
            local.resp['tags'] = [t.name for t in tags]
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
                return 'tags.tag_exists'
        elif local.data['action'] == 'delete':
            if local.access_level >= 4:
                return 'Unauthorized'
            tag = local.session.query(Tag)\
                .filter(Tag.name == local.data['tag']).first()
            if tag is None:
                return 'tags.tag_doesnt_exist'
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
                    local.session.add(TaskTag(task=task, tag=tag, user=local.user))
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
                if tag.hidden or tasktag.approved or local.user is not tasktag.user:
                    return 'Unauthorized'
            elif tasktag is None:
                return 'Task does not have tag'

            local.session.delete(tasktag)
            local.session.commit()
        else:
            return 'Bad request'

    def test_handler(self):
        if local.data['action'] == 'list':
            tests = local.session.query(Test)\
                .filter(Test.access_level >= local.access_level)\
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
                        .filter(TestScore.user_id == local.user.id).first()
                    if testscore is not None:
                        test['score'] = testscore.score
                local.resp['tests'].append(test)
        elif local.data['action'] == 'get':
            test = local.session.query(Test)\
                .filter(Test.name == local.data['test_name'])\
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
            test = local.session.query(Test)\
                .filter(Test.name == local.data['test_name'])\
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
                                an = float(ans[a])
                                cor = float(correct[a])
                            else:
                                an = ans[a].lower()
                                cor = correct[a].lower()
                            if an != cor:
                                local.resp[i] = [q.wrong_score, 'wrong']
                    if local.resp.get(i, None) is None:
                        local.resp[i] = [q.score, 'correct']
            if local.user is not None:
                score = sum([local.resp[i][0] for i in
                             xrange(len(test.questions))])
                testscore = local.session.query(TestScore)\
                    .filter(TestScore.test_id == test.id)\
                    .filter(TestScore.user_id == local.user.id).first()
                if testscore is None:
                    testscore = TestScore(score=score)
                    testscore.user = local.user
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
                .filter(Task.name == local.data['task_name']).first()
            if task is None:
                return 'Not found'
            if local.user is None:
                return 'Unauthorized'
            subs = local.session.query(Submission)\
                .filter(Submission.user_id == local.user.id)\
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
                        fi['name'] = name.replace('%l', s.language)
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
            if local.user is None or s.user_id != local.user.id:
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
            for i in ['compilation_outcome', 'evaluation_outcome',
                      'compilation_stdout', 'compilation_stderr',
                      'compilation_time', 'compilation_memory']:
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
                .filter(Submission.user_id == local.user.id)\
                .order_by(desc(Submission.timestamp)).first()
            if lastsub is not None and \
               make_datetime() - lastsub.timestamp < timedelta(seconds=20):
                return 'Too frequent submissions!'

            try:
                task = local.session.query(Task)\
                    .filter(Task.name == local.data['task_name'])\
                    .filter(Task.access_level >= local.access_level).first()
            except KeyError:
                return 'Not found'

            def decode_file(f):
                f['data'] = f['data'].split(',')[-1]
                f['body'] = b64decode(f['data'])
                del f['data']
                return f

            if len(local.data['files']) == 1 and \
               'submission' in local.data['files']:
                archive_data = decode_file(local.data['files']['submission'])
                del local.data['files']['submission']

                # Create the archive.
                archive = Archive.from_raw_data(archive_data["body"])

                if archive is None:
                    return 'Invalid archive!'

                # Extract the archive.
                unpacked_dir = archive.unpack()
                for name in archive.namelist():
                    filename = os.path.basename(name)
                    body = open(os.path.join(unpacked_dir, filename), "r").read()
                    self.request.files[filename] = [{
                        'filename': filename,
                        'body': body
                    }]

                files_sent = dict([(i['filename'], i)
                                   for i in archive_contents])

                archive.cleanup()
            else:
                files_sent = \
                    dict([(k, decode_file(v))
                          for k, v in local.data['files'].iteritems()])

            # TODO: implement partial submissions (?)

            # Detect language
            files = []
            sub_lang = None
            for sfe in task.submission_format:
                f = files_sent.get(sfe.filename)
                if f is None:
                    return 'Some files are missing!'
                if len(f['body']) > config.max_submission_length:
                    return 'The files you sent are too big!'
                f['name'] = sfe.filename
                files.append(f)
                if sfe.filename.endswith('.%l'):
                    language = None
                    for ext, l in SOURCE_EXT_TO_LANGUAGE_MAP.iteritems():
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
                                    sub_lang,
                                    user=local.user,
                                    task=task)
            for f in files:
                digest = self.file_cacher.put_file_content(
                    f['body'],
                    'Submission file %s sent by %s at %d.' % (
                        f['name'], local.user.username,
                        make_timestamp(timestamp)))
                local.session.add(File(f['name'],
                                       digest,
                                       submission=submission))
            local.session.add(submission)
            local.session.commit()

            # Notify ES
            self.evaluation_service.new_submission(
                submission_id=submission.id
            )

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

    def forum_handler(self):
        if local.data['action'] == 'list':
            forums = local.session.query(Forum)\
                .filter(Forum.access_level >= local.access_level)\
                .order_by(Forum.id).all()
            local.resp['forums'] = []
            for f in forums:
                forum = dict()
                forum['id'] = f.id
                forum['description'] = f.description
                forum['title'] = f.title
                forum['topics'] = f.ntopic
                forum['posts'] = f.npost
                if len(f.topics) > 0:
                    forum['lastpost'] = {
                        'username':     f.topics[0].last_writer.username,
                        'timestamp':    make_timestamp(f.topics[0].timestamp),
                        'topic_title':  f.topics[0].title,
                        'topic_id':     f.topics[0].id,
                        'num':          f.topics[0].npost
                    }
                local.resp['forums'].append(forum)
        elif local.data['action'] == 'new':
            return "Not anymore"
            if local.access_level > 1:
                return 'Unauthorized'
            if local.data['title'] is None or \
               len(local.data['title']) < 4:
                return "Title is too short"
            if local.data['description'] is None or \
               len(local.data['description']) < 4:
                return "Description is too short"
            forum = Forum(title=local.data['title'],
                          description=local.data['description'],
                          access_level=7,
                          ntopic=0,
                          npost=0)
            local.session.add(forum)
            local.session.commit()
        else:
            return 'Bad request'

    def topic_handler(self):
        if local.data['action'] == 'list':
            forum = local.session.query(Forum)\
                .filter(Forum.access_level >= local.access_level)\
                .filter(Forum.id == local.data['forum']).first()
            if forum is None:
                return 'Not found'
            noAnswer = 'noAnswer' in local.data and local.data['noAnswer']
            local.resp['title'] = forum.title
            local.resp['description'] = forum.description
            query = local.session.query(Topic)\
                .filter(Topic.forum_id == forum.id)\
                .order_by(desc(Topic.sticky), desc(Topic.timestamp))
            topics, local.resp['num'] = self.sliced_query(query)
            local.resp['numUnsolved'] = local.session.query(Topic)\
                .filter(Topic.forum_id == forum.id)\
                .filter(Topic.solved == False).count()
            local.resp['topics'] = []
            for t in topics:
                if noAnswer and t.solved is True:
                    continue
                topic = dict()
                topic['id'] = t.id
                topic['status'] = t.status
                topic['title'] = t.title
                topic['timestamp'] = make_timestamp(t.creation_timestamp)
                topic['posts'] = t.npost
                topic['views'] = t.nview
                topic['author_username'] = t.author.username
                topic['sticky'] = t.sticky
                topic['solved'] = t.solved
                topic['lastpost'] = {
                    'username':  t.last_writer.username,
                    'timestamp': make_timestamp(t.timestamp)
                }
                local.resp['topics'].append(topic)
        elif local.data['action'] == 'new':
            return "Not anymore"
            if local.user is None:
                return 'Unauthorized'
            forum = local.session.query(Forum)\
                .filter(Forum.access_level >= local.access_level)\
                .filter(Forum.id == local.data['forum']).first()
            if forum is None:
                return 'Not found'
            if local.data['title'] is None or len(local.data['title']) < 4:
                return "forum.title_short"
            if local.data['text'] is None or len(local.data['text']) < 4:
                return "post.text_short"
            if local.data['sticky'] is None or \
                (local.data['sticky'] != False and local.data['sticky'] != True):
                raise KeyError
            topic = Topic(status='open',
                          title=local.data['title'],
                          timestamp=make_datetime(),
                          creation_timestamp=make_datetime(),
                          solved=False)
            topic.forum = forum
            topic.last_writer = local.user
            topic.author = local.user
            topic.npost = 1
            topic.sticky = local.data['sticky']
            post = Post(text=local.data['text'],
                        timestamp=make_datetime())
            post.author = local.user
            post.topic = topic
            post.forum = forum
            local.session.add(topic)
            local.session.add(post)
            forum.ntopic = len(forum.topics)
            forum.npost = local.session.query(Post)\
                .filter(Post.forum_id == forum.id).count()
            local.session.commit()
        else:
            raise KeyError

    def post_handler(self):
        if local.data['action'] == 'list':
            topic = local.session.query(Topic)\
                .filter(Topic.id == local.data['topic']).first()
            if topic is None or topic.forum.access_level < local.access_level:
                return 'Not found'
            topic.nview += 1
            local.session.commit()
            query = local.session.query(Post)\
                .filter(Post.topic_id == topic.id)\
                .order_by(Post.timestamp)
            posts, local.resp['num'] = self.sliced_query(query)
            local.resp['title'] = topic.title
            local.resp['forumId'] = topic.forum.id
            local.resp['forumTitle'] = topic.forum.title
            local.resp['posts'] = []
            for p in posts:
                post = dict()
                post['id'] = p.id
                post['text'] = p.text
                post['timestamp'] = make_timestamp(p.timestamp)
                post['author'] = self.get_user_info(p.author)
                local.resp['posts'].append(post)
        elif local.data['action'] == 'new':
            return "Not anymore"
            if local.user is None:
                return 'Unauthorized'
            topic = local.session.query(Topic)\
                .filter(Topic.id == local.data['topic']).first()
            if topic is None or topic.forum.access_level < local.access_level:
                return 'Not found'
            if local.data['text'] is None or len(local.data['text']) < 4:
                return "Text is too short"
            post = Post(text=local.data['text'],
                        timestamp=make_datetime())
            post.author = local.user
            post.topic = topic
            post.forum = topic.forum
            topic.timestamp = post.timestamp
            topic.last_writer = local.user
            local.session.add(post)
            topic.forum.npost = local.session.query(Post)\
                .filter(Post.forum_id == topic.forum.id).count()
            topic.npost = local.session.query(Post)\
                .filter(Post.topic_id == topic.id).count()
            local.session.commit()
        elif local.data['action'] == 'delete':
            return "Not anymore"
            if local.user is None:
                return 'Unauthorized'
            post = local.session.query(Post)\
                .filter(Post.id == local.data['id']).first()
            if post is None:
                return 'Not found'
            if post.author != local.user and local.user.access_level > 2:
                return 'Unauthorized'
            forum = post.topic.forum
            if post.topic.posts[0] == post:
                local.session.delete(post.topic)
                local.resp['success'] = 2
            else:
                local.session.delete(post)
                post.topic.npost = local.session.query(Post)\
                    .filter(Post.topic_id == post.topic.id).count()
            forum.npost = local.session.query(Post)\
                .filter(Post.forum_id == forum.id).count()
            forum.ntopic = local.session.query(Topic)\
                .filter(Topic.forum_id == forum.id).count()
            local.session.commit()
        elif local.data['action'] == 'edit':
            return "Not anymore"
            if local.user is None:
                return 'Unauthorized'
            post = local.session.query(Post)\
                .filter(Post.id == local.data['id']).first()
            if post is None:
                return 'Not found'
            if post.author != local.user and local.user.access_level > 2:
                return 'Unauthorized'
            if local.data['text'] is None or len(local.data['text']) < 4:
                return 'Text is too short'
            post.text = local.data['text']
            local.session.commit()
        else:
            return 'Bad request'

    def talk_handler(self):
        if local.data['action'] == 'list':
            query = local.session.query(Talk)\
                .filter(or_(
                    Talk.sender_id == local.user.id,
                    Talk.receiver_id == local.user.id))\
                .filter(Talk.pms.any())\
                .order_by(desc(Talk.timestamp))
            talks, local.resp['num'] = self.sliced_query(query)
            local.resp['talks'] = list()
            for t in talks:
                talk = dict()
                talk['sender'] = self.get_user_info(t.sender)
                talk['receiver'] = self.get_user_info(t.receiver)
                talk['id'] = t.id
                talk['timestamp'] = make_timestamp(t.timestamp)
                talk['read'] = t.read
                if len(t.pms) > 0:
                    talk['last_pm_sender'] = t.pms[0].sender.username
                    txt = t.pms[0].text
                    if len(txt) > 100:
                        txt = txt[:97] + '...'
                    talk['last_pm_text'] = txt
                local.resp['talks'].append(talk)
        elif local.data['action'] == 'get':
            if local.user is None:
                return 'Unauthorized'
            other = local.session.query(User)\
                .filter(User.username == local.data['other']).first()
            talk = local.session.query(Talk)\
                .filter(or_(
                    and_(
                        Talk.sender_id == local.user.id,
                        Talk.receiver_id == other.id),
                    and_(
                        Talk.sender_id == other.id,
                        Talk.receiver_id == local.user.id))).first()
            if talk is None:
                talk = Talk(timestamp=make_datetime())
                talk.sender = local.user
                talk.receiver = other
                local.session.add(talk)
                local.session.commit()
            local.resp['id'] = talk.id
        else:
            return 'Bad request'

    def pm_handler(self):
        if local.data['action'] == 'list':
            query = local.session.query(PrivateMessage)\
                .filter(PrivateMessage.talk_id == local.data['id'])\
                .order_by(desc(PrivateMessage.timestamp))
            pms, local.resp['num'] = self.sliced_query(query)
            talk = local.session.query(Talk)\
                .filter(Talk.id == local.data['id']).first()
            if talk is None:
                return 'Invalid talk'
            if local.user not in (talk.sender, talk.receiver):
                return 'Unauthorized'
            if local.data['first'] == 0 and len(talk.pms) and \
               local.user != talk.pms[0].sender:
                talk.read = True
                local.session.commit()
            local.resp['sender'] = talk.sender.username
            local.resp['receiver'] = talk.receiver.username
            local.resp['pms'] = list()
            for p in reversed(pms):
                pm = dict()
                pm['timestamp'] = make_timestamp(p.timestamp)
                pm['sender'] = self.get_user_info(p.sender)
                pm['text'] = p.text
                local.resp['pms'].append(pm)
        elif local.data['action'] == 'new':
            return "Not anymore"
            if local.user is None:
                return 'Unauthorized'
            talk = local.session.query(Talk)\
                .filter(Talk.id == local.data['id']).first()
            if talk is None:
                return 'Not found'
            if 'text' not in local.data or len(local.data['text']) < 1:
                return 'You must enter some text'
            pm = PrivateMessage(text=local.data['text'],
                                timestamp=make_datetime())
            pm.sender_id = local.user.id
            pm.talk = talk
            if talk.sender_id != pm.sender_id:
                talk.sender, talk.receiver = talk.receiver, talk.sender
            talk.timestamp = pm.timestamp
            talk.read = False
            local.session.add(pm)
            local.session.commit()
        else:
            return 'Bad request'


class PracticeWebServer(Service):
    '''Service that runs the web server for practice.

    '''
    def __init__(self, shard):
        Service.__init__(self, shard=shard)

        self.address = config.contest_listen_address[shard]
        self.port = config.contest_listen_port[shard]
        self.file_cacher = FileCacher(self)
        self.evaluation_service = self.connect_to(
            ServiceCoord('EvaluationService', 0))

        handler = APIHandler(self)

        self.wsgi_app = SharedDataMiddleware(handler, {
            '/': handler.file_root
        })

    def run(self):
        server = Server((self.address, self.port), self.wsgi_app)
        gevent.spawn(server.serve_forever)
        Service.run(self)


def main():
    PracticeWebServer(0).run()
