/* Contest Management System
 * Copyright © 2013 Luca Wehrstedt <luca.wehrstedt@gmail.com>
 * Copyright © 2013 Luca Versari <veluca93@gmail.com>
 * Copyright © 2013 William Di Luigi <williamdiluigi@gmail.com>
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

/* Task page */

angular.module('cmsocial.task', [])
  .factory('taskbarManager', function() {
    var activeTab = 0;
    return {
      isActiveTab: function(tab) {
        return tab == activeTab;
      },
      setActiveTab: function(tab) {
        activeTab = tab;
      }
    };
  })
  .controller('TaskbarCtrl', function($scope, $stateParams, $http, $state,
        $rootScope, $timeout, userManager, notificationHub, taskbarManager,
        l10n) {
    delete $rootScope.task;
    $timeout(function() {
      $(".my-popover").popover(); // enable popovers
    });
    $scope.tag = {};
    $scope.isActiveTab = taskbarManager.isActiveTab;
    $scope.isLogged = userManager.isLogged;
    $scope.taskName = $stateParams.taskName;
    $scope.tagClicked = function(tag) {
      $("#tags_detail").modal('hide');
      $('#tags_detail').on('hidden.bs.modal', function(e) {
        $state.go('tasklist.page', {'pageNum': 1, 'tag': tag});
      });
    };
    $scope.tagAdd = function() {
      $http.post('tag', {
        'action': 'add',
        'tag': $scope.tag.newtag,
        'task': $rootScope.task.name,
        'username': userManager.getUser().username,
        'token': userManager.getUser().token
      })
      .success(function(data, status, headers, config) {
        if (data.success === 0) {
          notificationHub.createAlert('danger', data['error'], 3);
        } else {
          $scope.loadTask();
          notificationHub.createAlert('success', 'Task correctly tagged', 2);
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.tagDelete = function(tag) {
      if (confirm("Are you sure?")) {
        $http.post('tag', {
          'action': 'remove',
          'tag': tag,
          'task': $rootScope.task.name,
          'username': userManager.getUser().username,
          'token': userManager.getUser().token
        })
        .success(function(data, status, headers, config) {
          if (data.success === 0) {
            notificationHub.createAlert('danger', data['error'], 3);
          } else {
            $scope.loadTask();
            notificationHub.createAlert('success', 'Task correctly untagged', 2);
          }
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
      }
    };
    $scope.newTag = function() {
      $(".newtagstuff").show();
      $http.post('tag', {
        'action': 'list'
      })
      .success(function(data, status, headers, config) {
        $scope.tags = data['tags'];
        $("#tagloader").hide();
        $("#tagseparator").show();
        $("#tagchooser").removeAttr("disabled");
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.loadTask = function() {
      $http.post('task', {
        'name': $stateParams.taskName,
        'username': userManager.getUser().username,
        'token': userManager.getUser().token,
        'action': 'get'
      })
      .success(function(data, status, headers, config) {
        $rootScope.task = data;
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.loadTask();
  })
  .controller('StatementCtrl', function($scope, $window, taskbarManager) {
    taskbarManager.setActiveTab(1);
    $scope.goodBrowser = !!$window.Worker;
    $scope.getPDFURL = function(hash) {
      return 'assets/pdfjs/web/viewer.html?file=' + location.pathname.replace(/[^\/]*$/, '') + 'files/' + hash + '/testo.pdf';
    };
    $scope.getPDFURLforIE8 = function(hash) {
      return 'files/' + hash + '/testo.pdf';
    };
  })
  .controller('AttachmentsCtrl', function(taskbarManager) {
    taskbarManager.setActiveTab(2);
  })
  .controller('StatsCtrl', function($scope, $stateParams, $http,
      notificationHub, userManager, taskbarManager, l10n) {
    taskbarManager.setActiveTab(3);
    $scope.getStats = function() {
      $http.post('task', {
        'name': $stateParams.taskName,
        'username': userManager.getUser().username,
        'token': userManager.getUser().token,
        'action': 'stats'
      }).success(function(data, status, headers, config) {
        $scope.nsubs = data.nsubs;
        $scope.nusers = data.nusers;
        $scope.nsubscorrect = data.nsubscorrect;
        $scope.nuserscorrect = data.nuserscorrect;
        $scope.best = data.best;
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    }
    $scope.getStats();
  })
  .controller('SubmissionsCtrl', function($scope, $stateParams, $location,
      $http, $timeout, $rootScope, userManager, notificationHub,
      subsDatabase, taskbarManager, l10n) {
    taskbarManager.setActiveTab(4);
    subsDatabase.load($stateParams.taskName);
    $scope.areThereSubs = function(name) {
      return $rootScope.submissions[name] !== undefined
          && $rootScope.submissions[name].length > 0;
    };
    $scope.loadFiles = function(formid) {
      var input = $("#" + formid + " input");
      $scope.files = {};
      var reader = new FileReader();
      function readFile(i) {
        if (i==input.length) {
          $scope.submitFiles();
          return;
        }
        if (input[i].files.length < 1) {
          readFile(i+1);
          return;
        }
        reader.filename = input[i].files[0].name
        reader.inputname = input[i].name
        reader.onloadend = function(){
          $scope.files[reader.inputname] = {
            'filename': reader.filename,
            'data': reader.result
          };
          readFile(i+1);
        };
        reader.readAsDataURL(input[i].files[0]);
      }
      readFile(0);
    };
    $scope.submitFiles = function() {
      var data = {};
      data['username'] = userManager.getUser().username;
      data['token'] = userManager.getUser().token;
      data['files'] = $scope.files;
      data['action'] = 'new';
      data['task_name'] = $scope.taskName;
      delete $scope.files;
      $http.post('submission',
        data
      )
      .success(function(data, status, headers, config) {
        if (data['success']) {
          subsDatabase.addSub($scope.taskName, data);
          $("#submitform").each(function() {
            this.reset();
          });
        }
        else
          notificationHub.createAlert('danger', data['error'], 2);
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.showDetails = function(id) {
      subsDatabase.subDetails(id);
    };
  });
