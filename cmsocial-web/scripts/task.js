'use strict';

/* Task page */

angular.module('cmsocial')
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
        l10n, API_PREFIX) {
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
      $http.post(API_PREFIX + 'tag', {
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
        $http.post(API_PREFIX + 'tag', {
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
      $http.post(API_PREFIX + 'tag', {
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
    $scope.loadTask = $http.post(API_PREFIX + 'task', {
        'name': $stateParams.taskName,
        'username': userManager.getUser().username,
        'token': userManager.getUser().token,
        'action': 'get'
      })
      .then(
        function(result) {
          $rootScope.task = result.data;
        },
        function(result) {
          notificationHub.serverError(result.status);
        }
      );
  })
  .controller('StatementCtrl', function($scope, $window, taskbarManager) {
    taskbarManager.setActiveTab(1);
  })
  .controller('AttachmentsCtrl', function(taskbarManager) {
    taskbarManager.setActiveTab(2);
  })
  .controller('StatsCtrl', function($scope, $stateParams, $http,
      notificationHub, userManager, taskbarManager, l10n, API_PREFIX) {
    taskbarManager.setActiveTab(3);
    $scope.getStats = function() {
      $http.post(API_PREFIX + 'task', {
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
      subsDatabase, taskbarManager, l10n, API_PREFIX) {
    taskbarManager.setActiveTab(4);
    subsDatabase.load($stateParams.taskName);
    $scope.areThereSubs = function(name) {
      return $rootScope.submissions[name] !== undefined
          && $rootScope.submissions[name].length > 0;
    };
    var aceModeMap = {"C": "c_cpp", "C++": "c_cpp", "Pascal": "pascal"}
    var langExtMap = {"C": ".c", "C++": ".cpp", "Pascal": ".pas"}
    $scope.languages = ["C", "C++", "Pascal"];
    $scope.language = $scope.languages[1];
    $scope.aceOption = {
      mode: aceModeMap[$scope.language],
      showPrintMargin: false,
      onLoad: function (_ace) {
        $scope.aceSession = _ace.getSession();
        $scope.languageChanged = function (newL) {
          $scope.language = newL;
          $scope.aceSession.setMode("ace/mode/" + aceModeMap[newL]);
        };
      },
      onChange: function (_ace) {
        $scope.aceModel = _ace.getSession().getDocument().getValue();
      }
    };
    $scope.aceModel = l10n.get("Write your code here");
    $scope.loadAce = function () {
      $scope.files = {}
      $scope.files[$rootScope.task.submission_format[0]] = {
        'filename': "ace" + langExtMap[$scope.language],
        'data': btoa($scope.aceSession.getDocument().getValue())
      }
      $scope.submitFiles();
    }
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
      $http.post(API_PREFIX + 'submission',
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
  })
  .directive('pdf', function($window, l10n, API_PREFIX) {
    return {
      restrict: 'E',
      link: function(scope, element, attrs) {
        scope.loadTask.then(function() {
          var goodBrowser = !!$window.Worker;
          var hasBuiltInPdf = !("ActiveXObject" in window) && !/iPhone|iPod|Android|BlackBerry|Opera Mini|Phone|Mobile/i.test(navigator.userAgent);
          var pdfURL = location.pathname.replace(/[^\/]*$/, '') + API_PREFIX + 'files/' + scope.task.statements.it + '/testo.pdf';
          var downloadButton = '<a href="' + pdfURL + '" class="btn btn-success" style="margin-top:5px;">Download PDF</a>';
          if (goodBrowser && hasBuiltInPdf)
            element.replaceWith('<object data="' + pdfURL + '" type="application/pdf" class="' + attrs.class +
              '">' + l10n.get('Your browser is outdated or your PDF plugin is deactivated') + '<br>' + downloadButton + '</object>');
          else if (goodBrowser)
            element.replaceWith('<iframe seamless src="pdfjs/web/viewer.html?file=' + pdfURL +
              '" class="' + attrs.class +'"/>');
          else
            element.raplaceWith(downloadButton);
        });
      }
    };
  });
