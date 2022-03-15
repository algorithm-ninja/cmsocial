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
    $rootScope, $timeout, notificationHub, taskbarManager,
    l10n, contestManager, API_PREFIX) {

    delete $rootScope.task;

    $timeout(function() {
      $(".my-popover").popover(); // enable popovers
    });

    $scope.tag = {};
    $scope.isActiveTab = taskbarManager.isActiveTab;
    $scope.isLogged = contestManager.hasParticipation;
    $scope.taskName = $stateParams.taskName;

    $scope.tagClicked = function(tag) {
      $("#tags_detail").modal('hide');
      $('#tags_detail').on('hidden.bs.modal', function(e) {
        $state.go('tasklist.page', {
          'pageNum': 1,
          'tag': tag
        });
      });
    };

    $scope.tagAdd = function() {
      $http.post(API_PREFIX + 'tag', {
          'action': 'add',
          'tag': $scope.tag.newtag,
          'task': $rootScope.task.name,
        })
        .success(function(data, status, headers, config) {
          if (data.success === 0) {
            notificationHub.createAlert('danger', l10n.get(data['error']), 3);
          } else {
            $scope.loadTaskPromise = $scope.loadTask();
            notificationHub.createAlert('success', l10n.get('Task correctly tagged'), 2);
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
          })
          .success(function(data, status, headers, config) {
            if (data.success === 0) {
              notificationHub.createAlert('danger', l10n.get(data['error']), 3);
            } else {
              $scope.loadTaskPromise = $scope.loadTask();
              notificationHub.createAlert('success', l10n.get('Task correctly untagged'), 2);
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

    $scope.loadTask = function() {
      return $http.post(API_PREFIX + 'task', {
          'name': $stateParams.taskName,
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
    };

    $scope.loadTaskPromise = $scope.loadTask();
  })
  .controller('StatementCtrl', function($scope, $window, taskbarManager) {
    taskbarManager.setActiveTab(1);
  })
  .controller('AttachmentsCtrl', function($scope, $stateParams, $http,
    $window, taskbarManager, notificationHub, API_PREFIX) {
    taskbarManager.setActiveTab(2);
    $scope.bulkDownload = function() {
      $http.post(API_PREFIX + 'task', {
        'name': $stateParams.taskName,
        'action': 'bulk_download',
        'attachments': $scope.task.attachments
      })
      .success(function(data, status, headers, config) {
        $window.location.assign(API_PREFIX + 'files/' + data.digest +
                                '/' + $stateParams.taskName + ".zip");
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
  })
  .controller('StatsCtrl', function($scope, $stateParams, $http,
    notificationHub, taskbarManager, l10n, API_PREFIX) {
    taskbarManager.setActiveTab(3);
    $scope.getStats = function() {
      $http.post(API_PREFIX + 'task', {
          'name': $stateParams.taskName,
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
    };
    $scope.getStats();
  })
  .controller('SubmissionsCtrl', function($scope, $stateParams, $location,
    $http, $timeout, $rootScope, notificationHub,
    subsDatabase, taskbarManager, l10n, contestManager, API_PREFIX) {
    taskbarManager.setActiveTab(4);
    subsDatabase.load($stateParams.taskName);
    $scope.areThereSubs = function(name) {
      return $rootScope.submissions[name] !== undefined &&
        $rootScope.submissions[name].length > 0;
    };
    var aceModeMap = {
      "C11 / gcc": "c_cpp",
      "C++11 / g++": "c_cpp",
      "Pascal / fpc": "pascal",
      "Python 3 / CPython": "python"
    };
    var langExtMap = {
      "C11 / gcc": ".c",
      "C++11 / g++": ".cpp",
      "Pascal / fpc": ".pas",
      "Python 3 / CPython": ".py"
    };
    $scope.languages = [];
    contestManager.getContestPromise().then(function(response) {
        for (var lang in contestManager.getContest().languages) {
          $scope.languages.push(contestManager.getContest().languages[lang]);
        }

        var preferred_language_key = "preferred_language_" + contestManager.getContest().name;

        if (!localStorage.getItem(preferred_language_key) ||
          $scope.languages.indexOf(localStorage.getItem(preferred_language_key)) == -1) {
          localStorage.setItem(preferred_language_key, $scope.languages[0]);
        }

        $scope.language = localStorage.getItem(preferred_language_key);

        $scope.aceOption = {
          mode: aceModeMap[$scope.language],
          showPrintMargin: false,
          onLoad: function(_ace) {
            $scope.aceSession = _ace.getSession();
            $scope.languageChanged = function(newL) {
              $scope.language = newL;
              localStorage.setItem(preferred_language_key, newL);
              $scope.aceSession.setMode("ace/mode/" + aceModeMap[newL]);
            };
          },
          onChange: function(_ace) {
            $scope.aceModel = $scope.aceSession.getDocument().getValue();
            localStorage.setItem("source_code", $scope.aceModel);
          }
        };
    });

    if (localStorage.getItem("source_code") === null) {
      localStorage.setItem("source_code", l10n.get("Write your code here"));
    }
    $scope.aceModel = localStorage.getItem("source_code");

    $scope.loadAce = function() {
      if (!subsDatabase.submitCompleted) {
        return notificationHub.createAlert('warning', 'You have a pending submission', 2);
      }

      $scope.files = {};
      $scope.files[$rootScope.task.submission_format[0]] = {
        'filename': "ace" + langExtMap[$scope.language],
        'language': $scope.language,
        'data': btoa(unescape(encodeURIComponent($scope.aceSession.getDocument().getValue())))
          // HACK above: http://stackoverflow.com/a/26603875/747654
      };
      $scope.submitFiles();
    };

    $scope.resetAce = function() {
      localStorage.setItem("source_code", l10n.get("Write your code here"));
      $scope.aceSession.getDocument().setValue(localStorage.getItem("source_code"));
    };

    $scope.loadFile = function(event) {
      var reader = new FileReader();

      reader.onload = function(e) {
        $scope.aceSession.getDocument().setValue(e.target.result);
      };

      reader.readAsText(event.target.files[0]);
    };

    $scope.loadFiles = function(formid) {
      var input = $("#" + formid + " input");
      $scope.files = {};
      var reader = new FileReader();

      function readFile(i) {
        if (i == input.length) {
          $scope.submitFiles();
          return;
        }
        if (input[i].files.length < 1) {
          readFile(i + 1);
          return;
        }
        reader.filename = input[i].files[0].name;
        reader.inputname = input[i].name;
        reader.onloadend = function() {
          $scope.files[reader.inputname] = {
            'filename': reader.filename,
            'data': reader.result
          };
          readFile(i + 1);
        };
        reader.readAsDataURL(input[i].files[0]);
      }
      readFile(0);
    };

    $scope.submitCompleted = function() {
      return subsDatabase.submitCompleted;
    };

    $scope.submitFiles = function() {
      var data = {};
      data['files'] = $scope.files;
      data['action'] = 'new';
      data['task_name'] = $scope.taskName;
      delete $scope.files;

      subsDatabase.submitCompleted = false; // start loading

      $http.post(API_PREFIX + 'submission',
          data
        )
        .success(function(data, status, headers, config) {
          if (data['success']) {
            subsDatabase.addSub($scope.taskName, data);
            $("#submitform").each(function() {
              this.reset();
            });
          } else {
            notificationHub.createAlert('danger', l10n.get(data['error']), 2);
          }
          subsDatabase.submitCompleted = true; // stop loading
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
          subsDatabase.submitCompleted = true; // stop loading
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
        scope.loadTaskPromise.then(function() {
          var goodBrowser = !!$window.Worker;
          var hasBuiltInPdf = !("ActiveXObject" in window) && !/iPhone|iPod|Android|BlackBerry|Opera Mini|Phone|Mobile/i.test(navigator.userAgent);
          var statementLanguage = l10n.getLanguage();
          if (!(statementLanguage in scope.task.statements)) {
            if ('en' in scope.task.statements)
              statementLanguage = 'en';
            else if ('it' in scope.task.statements)
              statementLanguage = 'it';
            else
              statementLanguage = Object.keys(scope.task.statements)[0];
          }
          var pdfURL = location.pathname.replace(/[^\/]*$/, '') + API_PREFIX + 'files/' + scope.task.statements[statementLanguage] + '/testo.pdf';
          var downloadButton = '<a href="' + pdfURL + '" class="btn btn-success" style="margin-top:5px;">Download PDF</a>';
          if (goodBrowser && hasBuiltInPdf)
            element.replaceWith('<object data="' + pdfURL + '" type="application/pdf" class="' + attrs.class +
              '">' + l10n.get('Your browser is outdated or your PDF plugin is deactivated') + '<br>' + downloadButton + '</object>');
          else if (goodBrowser)
            element.replaceWith('<iframe seamless src="https://mozilla.github.io/pdf.js/web/viewer.html?file=' + location.origin + pdfURL +
              '" class="' + attrs.class + '"/>');
          else
            element.raplaceWith(downloadButton);
        });
      }
    };
  })
  .directive('customOnChange', function() {
    // XXX: This is needed until angular2, since the current angular assumes
    //      the File API to be unavailable (thanks, IE9)
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var onChangeHandler = scope.$eval(attrs.customOnChange);
        element.bind('change', onChangeHandler);

        // XXX: ugly hack, needed to have a 'change' event fire even if the same
        //      file is selected twice (e.g. you select, then click "reset",
        //      then select again)
        element.bind('click', function(e) {
          e.target.value = null;
        });
      }
    };
  });
