'use strict';

/* Signin page */

angular.module('cmsocial')
  .factory('userbarManager', function() {
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
  .controller('UserbarCtrl', function($scope, $stateParams, $http,
    $rootScope, userManager, notificationHub, userbarManager) {
    $scope.isActiveTab = userbarManager.isActiveTab;
    $scope.isLogged = userManager.isLogged;
    $scope.myName = function() {
      return userManager.getUser().username;
    };
    $scope.isMe = function() {
      return $stateParams.userId === userManager.getUser().username;
    };
  })
  .factory('userManager', function($http, $timeout, $sce, $cookies, notificationHub, contestManager, l10n, API_PREFIX) {
    var user = {};
    var getIt = function() {
      return user;
    };
    var refreshUser = function() {
      $http.post(API_PREFIX + "user", {
          'action': 'me'
        })
        .success(function(data, status, headers, config) {
          if (data.success === 0) {
            notificationHub.createAlert('danger', l10n.get('Login error'), 3);

            // Remove cookie stuck
            $cookies.remove('token', {
              domain: contestManager.getContest().cookie_domain,
              path: '/'
            });
            $cookies.remove('token', {
              domain: 'training.olinfo.it',
              path: '/'
            });
          } else {
            user = data["user"];
            contestManager.refreshContest();
          }
        }).error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    var isUserLogged = function() {
      return $cookies.get('token') != null;
    };
    //var heartbeat_timeout = undefined;
    //var heartbeat = function() {
    //  heartbeat_timeout = $timeout(heartbeat, 60000);
    //  if (isUserLogged()) {
    //    $http.post(API_PREFIX + 'heartbeat', {})
    //      .success(function(data, status, headers, config) {
    //        if (data.success === 0) {
    //          notificationHub.createAlert('danger', l10n.get('Login error'), 3);
    //        }
    //      }).error(function(data, status, headers, config) {
    //        notificationHub.serverError(status);
    //      });
    //  }
    //};
    if (isUserLogged()) refreshUser();
    return {
      getUser: getIt,
      isLogged: function() {
        //if (heartbeat_timeout === undefined) heartbeat();
        return isUserLogged();
      },
      getGravatar: function(user, size) {
        return $sce.trustAsUrl('//gravatar.com/avatar/' + user.mail_hash + '?d=identicon&s=' + size);
      },
      refresh: refreshUser,
      signout: function() {
        $cookies.remove('token', {
          domain: contestManager.getContest().cookie_domain,
          path: '/'
        });
        $cookies.remove('token', {
          domain: 'training.olinfo.it',
          path: '/'
        });
        user = {};
      }
    };
  })
  .controller('ForgotAccountCtrl', function($scope, $http, $state, notificationHub,
    l10n, API_PREFIX) {
    $scope.user = {
      'recoverEmail': '',
      'recoverCode': ''
    };

    $scope.recover = function() {
      $("#loading-indicator").show();

      $http.post(API_PREFIX + 'user', {
        'action': 'recover',
        'email': $scope.user.recoverEmail,
        'code': $scope.user.recoverCode,
      }).then(function(ctx) {
        if (ctx.data.success === 1) {
          notificationHub.createAlert('success', l10n.get(ctx.data.message), 10);

          $("#code-div").slideDown('slow');
          $("#recover-button").text(l10n.get("Confirm code"));
          $("#recover-code").focus();
        } else {
          notificationHub.createAlert('danger', l10n.get(ctx.data.error), 2);
        }

        // type = 1 (password resetting) or 2 (code sending)
        if (ctx.data.type === 1 && ctx.data.success === 1) {
            $state.go('overview');
        }

        $("#loading-indicator").hide();
      }, function(ctx) {
        notificationHub.serverError(ctx.status);
        $("#loading-indicator").hide();
      });
    };
  })
  .controller('SignCtrl', function($scope, $http, $state, userManager,
    notificationHub, l10n, contestManager, API_PREFIX) {
    $scope.user = {
      'username': '',
      'password': ''
    };
    $scope.isLogged = userManager.isLogged;
    $scope.signin = function() {
      // temporary fix to get username & password
      $scope.user.username = $("#username").val();
      $scope.user.password = $("#password").val();
      $http.post(API_PREFIX + 'user', {
          'action': 'login',
          'username': $scope.user.username,
          'password': $scope.user.password,
          'keep_signed': $("#keep_signed").prop("checked")
        })
        .success(function(data, status, headers, config) {
          if (data.success == 1) {
            userManager.refresh();
            notificationHub.createAlert('success', l10n.get('Welcome back') +
              ', ' + $scope.user.username, 2);
            contestManager.refreshContest();
          } else if (data.success === 0) {
            notificationHub.createAlert('danger', l10n.get('Login error'), 3);
          }
        }).error(function(data, status, headers, config) {
          notificationHub.serverError(status);
          contestManager.refreshContest();
        });
    };
    $scope.signout = function() {
      userManager.signout();
      notificationHub.createAlert('success', l10n.get('Goodbye'), 1);
    };
  })
  .controller('SSOCtrl', function($scope, $http, notificationHub, $location, l10n, $state, contestManager, API_PREFIX) {
    $http.post(API_PREFIX + 'sso', {
        'payload': $location.$$search.sso,
        'sig': $location.$$search.sig
      })
      .success(function(data, status, headers, config) {
        if (data.success === 1) {
          contestManager.getContestPromise().then(function(response) {
            window.location.replace(contestManager.getContest().forum_url + '/session/sso_login?' + data.parameters);
          });
        } else {
          notificationHub.createAlert('danger', l10n.get('Sign on failed - please make sure to be logged in on the main website!'), 3);
          $state.go('overview');
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
  })
  .controller('UserpageCtrl', function($scope, $http, notificationHub,
    $stateParams, $state, $timeout, userbarManager, l10n, API_PREFIX) {
    userbarManager.setActiveTab(1);
    $timeout(function() {
      $('.my-tooltip').tooltip(); // enable tooltips
    });
    $http.post(API_PREFIX + 'user', {
        'action': 'get',
        'username': $stateParams.userId
      })
      .success(function(data, status, headers, config) {
        if (data.success === 1) {
          $scope.user = data;
        } else {
          notificationHub.createAlert('danger', l10n.get('User doesn\'t exist'), 3);
          $state.go('overview');
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
  })
  .controller('EdituserCtrl', function($scope, $state, $stateParams,
    $http, userbarManager, userManager, notificationHub, l10n, API_PREFIX) {
    if (userManager.getUser().username !== $stateParams.userId) {
      $state.go('overview');
    }
    userbarManager.setActiveTab(3);
    $scope.user = {
      password: '',
      password2: '',
      password3: '',
      email: '',
    };
    $scope.submit = function() {
      var data = {};
      data['action'] = 'update';
      data['email'] = $scope.user.email;

      if ($scope.user.password2.length > 0) {
        if ($scope.user.password3 !== $scope.user.password2)
          return notificationHub.createAlert('danger', l10n.get('Passwords don\'t match'), 2);
        if ($scope.user.password.length < 1)
          return notificationHub.createAlert('danger', l10n.get('You must specify your password'), 2);
        data['old_password'] = $scope.user.password;
        data['password'] = $scope.user.password2;
      }

      $http.post(API_PREFIX + 'user', data)
        .success(function(data, status, headers, config) {
          if (data.success == 1) {
            userManager.refresh();
            notificationHub.createAlert('success', l10n.get('Changes recorded'), 2);
            $state.go('^.profile');
          } else if (data.success == 0) {
            if (data.error === undefined)
              notificationHub.createAlert('warning', l10n.get('No changes recorded'), 3);
            else
              notificationHub.createAlert('danger', l10n.get(data.error), 3);
          }
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
  })
  .filter('levelClass', function() {
    return function(input) {
      switch (input) {
        case 0:
          return 'admin';
        case 1:
          return 'monica';
        case 2:
          return 'tutor';
        case 3:
          return 'teacher';
        case 4:
          return 'superuser';
        case 5:
          return 'user';
        case 6:
          return 'newbie';
        case 7:
          return 'guest';
        default:
          return 'unknown';
      }
    };
  });
