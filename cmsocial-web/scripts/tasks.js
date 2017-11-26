'use strict';

/* Tasks page */

angular.module('cmsocial')
  .service('subsDatabase', function($http, $rootScope, $timeout,
    notificationHub, l10n, API_PREFIX) {
    $rootScope.submissions = {};

    var self = {};

    self.submitCompleted = true;

    var updInterval = {};
    var updAttempts = {};
    var timeout;

    self.load = function(name) {
      $http.post(API_PREFIX + 'submission', {
          'action': 'list',
          'task_name': name
        })
        .success(function(data, status, headers, config) {
          $rootScope.submissions[name] = [];
          for (var i = data['submissions'].length; i > 0; i--)
            self.addSub(name, data['submissions'][i - 1]);
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
      $timeout.cancel(timeout);
      updSubs();
    };

    function intervalFromAttempts(i) {
      if (i < 10 || i == undefined)
        return 1;
      if (i < 30)
        return 2;
      if (i < 50)
        return 3;
      if (i < 100)
        return 5;
      if (i < 300)
        return 10;
      if (i < 500)
        return 60;
      return i / 4;
    }

    self.extendSub = function(sub) {
      sub.cl = 'empty';
      var date = new Date(sub.timestamp * 1000);
      sub.time = date.toLocaleString();
      if (sub.compilation_outcome == null) {
        sub.status = 'Compilazione in corso...';
        updInterval[sub.id] = intervalFromAttempts(updAttempts[sub.id]);
      } else if (sub.compilation_outcome == 'fail') {
        sub.cl = 'wrong';
        sub.status = 'Compilazione fallita';
      } else if (sub.evaluation_outcome == null) {
        sub.status = 'Valutazione in corso...';
        updInterval[sub.id] = intervalFromAttempts(updAttempts[sub.id]);
      } else if (sub.evaluation_outcome == 'fail') { // ???
        sub.cl = 'wrong';
        sub.status = 'Valutazione fallita';
      } else if (sub.score == null) {
        sub.status = 'Assegnazione del punteggio';
        updInterval[sub.id] = intervalFromAttempts(updAttempts[sub.id]);
      } else {
        var score = sub.score;
        if (100 - score < 0.01)
          sub.cl = 'correct';
        else if (score < 0.01)
          sub.cl = 'wrong';
        else
          sub.cl = 'partial';
        sub.status = score + ' / 100';
      }
      return sub;
    };

    self.addSub = function(name, sub) {
      $rootScope.submissions[name].unshift(self.extendSub(sub));
    };

    self.replaceSub = function(id, sub) {
      for (name in $rootScope.submissions)
        for (var i = 0; i < $rootScope.submissions[name].length; i++)
          if ($rootScope.submissions[name][i]["id"] == id) {
            $rootScope.submissions[name][i] = self.extendSub(sub);
            return;
          }
    };

    self.subDetails = function(id) {
      $http.post(API_PREFIX + 'submission', {
          "action": "details",
          "id": id
        })
        .success(function(data, status, headers, config) {
          self.replaceSub(id, data);
          $rootScope.curSub = id;
          $rootScope.actualCurSub = data;
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };

    function updSubs() {
      timeout = $timeout(function() {
        for (var i in updInterval) {
          updInterval[i]--;
          if (updInterval[i] == 0) {
            if (updAttempts[i] == undefined)
              updAttempts[i] = -1;
            updAttempts[i]++;
            delete updInterval[i];
            $http.post(API_PREFIX + 'submission', {
                'action': 'details',
                'id': i
              })
              .success(function(data, status, headers, config) {
                self.replaceSub(data["id"], data);
                if (data["score_details"] !== null) {
                  self.submitCompleted = true;
                }
              })
              .error(function(data, status, headers, config) {
                notificationHub.serverError(status);
              });
          }
        }
        updSubs();
      }, 1000);
    }

    return self;
  })
  .controller('TasklistSkel', function($scope, $state, $stateParams) {
    $scope.search = {};
    $scope.pagination = {
      perPage: 15
    };
    $scope.reloadTasks = function() {
      var new_q = $scope.search.q;
      // != instead of !== because we want to also check for undefined
      if (new_q != null && new_q.length < 1) {
        new_q = null;
      }
      $state.go('^.page', {
        'pageNum': 1,
        'tag': $scope.search.tag,
        'q': new_q
      });
    };
  })
  .controller('TasklistPage', function($scope, $stateParams, $state, $http,
    notificationHub, l10n, API_PREFIX) {
    $scope.pagination.current = +$stateParams.pageNum;
    $scope.search.q = $stateParams.q;
    $scope.search.tag_string = "";
    if ($scope.search.tag != null) {
      $scope.search.tags = $scope.search.tag.split(",");
    }
    $scope.getTasks = function() {
      $http.post(API_PREFIX + 'task', {
          'search': $stateParams.q, // can be null
          'tag': $stateParams.tag, // can be null
          'first': $scope.pagination.perPage * ($scope.pagination.current - 1),
          'last': $scope.pagination.perPage * $scope.pagination.current,
          'action': 'list'
        })
        .success(function(data, status, headers, config) {
          $scope.tasks = data['tasks'];
          $scope.search.tag_string = (data['tags'] || []).join(' + ');
          $scope.pagination.total = Math.ceil(data['num'] / $scope.pagination.perPage);
          if (data['num'] === 0) {
            $scope.pagination.total = 1;
          }
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.getTasks();
  })
  .controller('TagsPage', function($scope, $http, notificationHub, API_PREFIX) {
    $scope.getTags = function() {
      $http.post(API_PREFIX + 'tag', {
          'action': 'list'
        })
        .success(function(data, status, headers, config) {
          $scope.tags = data['tags'];
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.getTags();
  })
  .controller('HelpCtrl', function($scope, $stateParams, $http,
    notificationHub, API_PREFIX) {
    $scope.data = {
      testcase: '000',
      task: $stateParams.taskName,
      loading: false,
      done: false
    };
    $http.post(API_PREFIX + 'help', {
        'task': $scope.data.task,
        'action': 'check'
      })
      .success(function(data, status, headers, config) {
        $scope.testcases = data['testcases'];
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    $scope.askHelp = function() {
      $scope.data.loading = true;
      $http.post(API_PREFIX + 'help', {
          'task': $scope.data.task,
          'testcase': $scope.data.testcase,
          'action': 'get'
        })
        .success(function(data, status, headers, config) {
          if (data.success == 1) {
            var input = document.getElementById("input-download");
            input.href = API_PREFIX + "files/" + data['input'] + "/input.txt";
            input.onclick = function() {
              input.className = "btn btn-primary";
            };
            var output = document.getElementById("output-download");
            output.href = API_PREFIX + "files/" + data['output'] + "/output.txt";
            output.onclick = function() {
              output.className = "btn btn-primary";
            };
            $scope.data.done = true;
          } else {
            notificationHub.createAlert("warning", data.error, 5);
          }
          $scope.data.loading = false;
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
  })
  .controller('TechniquesPage', function($scope, $http, notificationHub, API_PREFIX) {
    $scope.tags = [];
    $http.post(API_PREFIX + 'tag', {
      'action': 'list',
      'filter': 'techniques'
    })
    .success(function(data, status, headers, config) {
      var tags = data['tags'];
      for (var idx in tags) {
        $scope.tags.push(tags[idx]);
      }
    })
    .error(function(data, status, headers, config) {
      notificationHub.serverError(status);
    });
  })
  .controller('EventsPage', function($scope, $http, notificationHub) {
    $scope.ioi = [];
    for (var i=2017; i>=2004; i--) {
      $scope.ioi.push(i);
    }
  })
