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
    $scope.myName = function(){
      return userManager.getUser().username;
    }
    $scope.isMe = function() {
      return $stateParams.userId === userManager.getUser().username;
    };
  })
  .factory('userManager', function($http, $timeout, $sce, notificationHub, l10n, API_PREFIX) {
    var getIt = function() {
      return JSON.parse(localStorage.getItem('user')) || {};
    };
    var heartbeat_timeout = undefined;
    var heartbeat = function() {
      heartbeat_timeout = $timeout(heartbeat, 60000);
      if(getIt().hasOwnProperty("token")) {
        $http.post(API_PREFIX + 'heartbeat', {
            'username': getIt().username,
            'token':    getIt().token
          })
          .success(function(data, status, headers, config) {
            if (data.success === 0) {
              localStorage.removeItem('user');
              notificationHub.createAlert('danger', l10n.get('Sign in error'), 3);
            } else {
              var user = getIt();
              localStorage.setItem('user', JSON.stringify(user));
            }
          }).error(function(data, status, headers, config) {
            notificationHub.serverError(status);
          });
      }
    };
    return {
      getUser: getIt,
      isLogged: function() {
        if(heartbeat_timeout === undefined) heartbeat();
        return getIt().hasOwnProperty("token");
      },
      getGravatar: function(user, size) {
        return $sce.trustAsUrl('http://gravatar.com/avatar/' + user.mail_hash + '?d=identicon&s=' + size);
      },
      signin: function(user) {
        localStorage.setItem('user', JSON.stringify(user));
      },
      signout: function() {
        localStorage.removeItem('user');
      }
    };
  })
  .controller('SignCtrl', function($scope, $http, $state, userManager,
        notificationHub, l10n, API_PREFIX) {
    $scope.user = {'username': '', 'password': ''};
    $scope.isLogged = userManager.isLogged;
    $scope.signin = function() {
      // temporary fix to get username & password
      $scope.user.username = $("#username").val();
      $scope.user.password = $("#password").val();
      $http.post(API_PREFIX + 'user', {
          'action':   'login',
          'username': $scope.user.username,
          'password': $scope.user.password,
        })
        .success(function(data, status, headers, config) {
          if (data.success == 1) {
            console.log(JSON.stringify(data));
            userManager.signin({
              'username': data.user.username,
              'token': data.token,
              'access_level': data.user.access_level,
              'mail_hash': data.user.mail_hash
            });
            notificationHub.createAlert('success', l10n.get('Welcome back') +
                ', ' + userManager.getUser().username, 2);
          } else if (data.success === 0) {
            notificationHub.createAlert('danger', l10n.get('Sign in error'), 3);
          }
        }).error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.signout = function() {
      userManager.signout();
      notificationHub.createAlert('success', l10n.get('Goodbye'), 1);
    };
  })
  .controller('SSOCtrl', function($scope, $http, notificationHub, $location,
      userManager, l10n, $state, API_PREFIX) {
    $http.post(API_PREFIX + 'sso', {
      'username': userManager.getUser().username,
      'token': userManager.getUser().token,
      'payload': $location.$$search.sso,
      'sig': $location.$$search.sig
    })
    .success(function(data, status, headers, config) {
      if (data.success === 1) {
        // TODO Change this to something configurable
        window.location.replace('http://cms.di.unipi.it:8000/session/sso_login?' + data.parameters);
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
      'action':   'get',
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
      password:  '',
      password2: '',
      password3: '',
      email:     '',
    };
    $scope.submit = function() {
      var data = {};
      data['action'] = 'update';
      data['username'] = userManager.getUser().username;
      data['token'] = userManager.getUser().token;
      if ($scope.user.password2.length > 0) {
        if ($scope.user.password3 !== $scope.user.password2)
          return notificationHub.createAlert('danger', l10n.get('Passwords don\'t match'), 2);
        if ($scope.user.password.length < 1)
          return notificationHub.createAlert('danger', l10n.get('You must specify your password'), 2);
        data['old_password'] = $scope.user.password;
        data['password'] = $scope.user.password2;
      }
      data['email'] = $scope.user.email;
      $http.post(API_PREFIX + 'user', data)
        .success(function(data, status, headers, config) {
          if (data.success == 1) {
            if (data.hasOwnProperty('token'))
              localStorage.setItem('token', data['token']);
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
