/* Contest Management System
 * Copyright © 2013 Luca Wehrstedt <luca.wehrstedt@gmail.com>
 * Copyright © 2013 William Di Luigi <williamdiluigi@gmail.com>
 * Copyright © 2014 Luca Chiodini <luca@chiodini.org>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

/* Signin page */

angular.module('cmsocial.forum', ['cmsocial.pagination'])
  .controller('ForumsCtrl', function ($scope, $http, userManager,
        notificationHub, navbarManager, l10n) {
    navbarManager.setActiveTab(2);
    $http.post('forum', {
      'action':   'list',
      'username': userManager.getUser().username,
      'token':    userManager.getUser().token
    })
    .success(function(data, status, headers, config) {
      $scope.forums = data.forums;
    })
    .error(function(data, status, headers, config) {
      notificationHub.serverError(status);
    });
    $scope.lastPage = function(posts) {
      // FIXME: se si modifica 'pagination.perPage' in TopicCtrl si deve modificare anche qui!
      return Math.ceil(posts / 10);
    };
  })
  .controller('ForumSkel', function ($scope, userManager, navbarManager) {
    navbarManager.setActiveTab(0);
    $scope.user = {
      isLogged: userManager.isLogged,
      toolbar:  userManager.getForumToolbar(userManager.getUser())
    };
    $scope.breadcrumb = {};
    $scope.pagination = {perPage: 15};
    $scope.lastPage = function(posts) {
      // FIXME: se si modifica 'pagination.perPage' in TopicCtrl si deve modificare anche qui!
      return Math.ceil(posts / 10);
    };
    $scope.post = {};
  })
  .controller('ForumCtrl', function($scope, $http, $stateParams, $state,
      userManager, navbarManager, notificationHub, l10n) {
    // FIXME: avendo aggiunto la pagination, dobbiamo aggiustare questa funzionalità
    //~ $scope.onlyUnans = function() {
      //~ $location.search('na', 1);
    //~ };
    //~ $scope.showAll = function() {
      //~ $location.search('na', null);
    //~ };
    $scope.newText = $scope.newTitle = '';
    $scope.isSticky = false;
    $scope.pagination.current = +$stateParams.pageNum;
    $scope.getTopics = function(onlyUnanswered) {
      onlyUnanswered = (typeof onlyUnanswered !== 'undefined') ? onlyUnanswered : false;
      //~ onlyUnanswered = ($location.search('na') === 1);
      //~ if (onlyUnanswered) {
        //~ $("#showNoAns").hide();
        //~ $("#showAll").show();
      //~ } else {
        //~ $("#showAll").hide();
        //~ $("#showNoAns").show();
      //~ }
      $http.post('topic', {
        'action':   'list',
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token,
        'forum':    $stateParams.forumId,
        'first':    $scope.pagination.perPage * ($scope.pagination.current-1),
        'last':     $scope.pagination.perPage * $scope.pagination.current,
        'noAnswer': onlyUnanswered
      })
      .success(function(data, status, headers, config) {
        $scope.topics = data.topics;
        $scope.numTopics = data.num;
        $scope.pagination.total = Math.ceil(data.num / $scope.pagination.perPage);
        $scope.unansweredTopics = data.numUnanswered;
        $scope.breadcrumb.forumTitle = data.title;
        $scope.breadcrumb.forumDesc = data.description;
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.newTopic = function() {
      $http.post('topic', {
        'action':   'new',
        'title':    $scope.newTitle,
        'sticky':   $scope.isSticky,
        'text':     $scope.newText,
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token,
        'forum':    $stateParams.forumId
      })
      .success(function(data, status, headers, config) {
        if (data.success == 1) {
          notificationHub.createAlert('info', l10n.get('Topic created'), 1);
          $scope.getTopics();
        } else {
          notificationHub.createAlert('danger', data.error, 2);
        }
        //~ $state.go(); // TODO: redirect al topic creato?
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.getTopics();
  })
  .controller('TopicCtrl', function($scope, $http, $stateParams, $state,
      $location, userManager, notificationHub, l10n) {
    $scope.user.isMine = function(usr) {
      return userManager.isLogged() && usr == userManager.getUser().username;
    };
    $scope.user.isMod = function() {
      return userManager.isLogged() && userManager.getUser().access_level < 3;
    };
    $scope.pagination.perPage = 10;
    $scope.pagination.current = +$stateParams.pageNum;
    $scope.getPosts = function() {
      $http.post('post', {
        'action':   'list',
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token,
        'topic':    $stateParams.topicId,
        'first':    $scope.pagination.perPage * ($scope.pagination.current-1),
        'last':     $scope.pagination.perPage * $scope.pagination.current,
      })
      .success(function(data, status, headers, config) {
        $scope.posts = data.posts;
        $scope.numPosts = data.num;
        $scope.pagination.total = Math.ceil(data.num / $scope.pagination.perPage);
        $scope.breadcrumb.title = data.title;
        $scope.breadcrumb.forumId = data.forumId;
        $scope.breadcrumb.forumTitle = data.forumTitle;
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    }
    $scope.doQuote = function(text, user) {
      $("#new_post textarea").val($scope.post.newText = '<blockquote>' + text + '<p><small>' + user + '</small></p></blockquote><br>');
    };
    $scope.doEdit = function(text, id) {
      $("#edit_post textarea").val($scope.post.newText = text);
      $scope.post.target = id;
    };
    $scope.post.doNew = function() {
      $("#new_post textarea").val($scope.post.newText = '');
    };
    $scope.post.createNew = function() {
      $http.post('post', {
        'action':   'new',
        'text':     $scope.post.newText,
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token,
        'topic':    $stateParams.topicId
      })
      .success(function(data, status, headers, config) {
        if (data.success == 1) {
          notificationHub.createAlert('info', l10n.get('Reply sent'), 1);
          $scope.getPosts();
          // TODO: redirect al post creato?
        } else {
          notificationHub.createAlert('danger', data.error, 2);
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.post.edit = function() {
      $http.post('post', {
        'action':   'edit',
        'id':       $scope.post.target,
        'text':     $scope.post.newText,
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token
      })
      .success(function(data, status, headers, config) {
        if (data.success == 1) {
          notificationHub.createAlert('info', l10n.get('Edit saved'), 1);
          $scope.getPosts();
        } else {
          notificationHub.createAlert('danger', data.error, 2);
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.deletePost = function(id) {
      if (!confirm(l10n.get('Are you sure you want to delete this post?')))
        return;
      $http.post('post', {
        'action':   'delete',
        'id':       id,
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token
      })
      .success(function(data, status, headers, config) {
        if (data.success) {
          notificationHub.createAlert('info', l10n.get('Delete completed'), 1);
          if (data.success == 1)
            $scope.getPosts();
          else
            $state.go('forum', {'forumId': $scope.forumId, 'pageNum': 1});
        } else {
          notificationHub.createAlert('danger', data.error, 2);
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.getPosts();
  })
  .filter('getIcon', function() {
    return function(input) {
      if (input === 'closed')
        return 'lock';
      return 'angle-right';
    };
  })
  .filter('monthYearFmt', function() {
    return function(input) {
      var d = new Date(1000 * (+input));
      return ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago',
              'Set', 'Ott', 'Nov', 'Dic'][d.getMonth()] + ' ' + d.getFullYear();
    };
  });
