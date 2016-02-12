'use strict';

/**
 * @ngdoc overview
 * @name cmsocial
 * @description
 * # cmsocial
 *
 * Main module of the application.
 */
angular
  .module('cmsocial', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.router',
    'ui.ace'
  ])
  .constant('API_PREFIX', '[[api_prefix]]')
  .config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false)//.hashPrefix('!')
    // FIXME: ui-router ignores hashPrefix for href attributes, so we don't use it (for now)

    $urlRouterProvider
      .when('/tasks/', '/tasks/1')
      .when('/task/{taskName}', '/task/{taskName}/statement')
      .when('/user/{userId}', '/user/{userId}/profile')
      .when('/ranking/', '/ranking/1')
      .otherwise('/overview')

    $stateProvider
      .state('overview', {
        url: '/overview',
        templateUrl: 'views/homepage.html',
        controller: 'HomepageCtrl'
      })
      .state('sso', {
         url: '/sso',
         controller: 'SSOCtrl'
      })
      .state('tags', {
        url: '/tags',
        templateUrl: 'views/tags.html',
        controller: 'TagsPage'
      })
      .state('tasklist', {
        templateUrl: 'views/tasklist.html',
        controller: 'TasklistSkel'
      })
      .state('tasklist.page', {
        url: '/tasks/{pageNum}?tag&q',
        templateUrl: 'views/tasks.html',
        controller: 'TasklistPage'
      })
      .state('task', {
        url: '/task/{taskName}',
        templateUrl: 'views/task.html',
        controller: 'TaskbarCtrl'
      })
      .state('task.statement', {
        url: '/statement',
        templateUrl: 'views/task.statement.html',
        controller: 'StatementCtrl'
      })
      .state('task.submissions', {
        url: '/submissions',
        templateUrl: 'views/task.submissions.html',
        controller: 'SubmissionsCtrl'
      })
      .state('task.attachments', {
        url: '/attachments',
        templateUrl: 'views/task.attachments.html',
        controller: 'AttachmentsCtrl'
      })
      .state('task.stats', {
        url: '/stats',
        templateUrl: 'views/task.stats.html',
        controller: 'StatsCtrl'
      })
      .state('ranking', {
        templateUrl: 'views/ranking.html',
        controller: 'RankingSkel'
      })
      .state('ranking.page', {
        url: '/ranking/{pageNum}',
        templateUrl: 'views/ranking.page.html',
        controller: 'RankingCtrl'
      })
      .state('user', {
        url: '/user/{userId}',
        templateUrl: 'views/user.html',
        controller: 'UserbarCtrl'
      })
      .state('user.edit', {
        url: '/edit',
        templateUrl: 'views/user.edit.html',
        controller: 'EdituserCtrl'
      })
      .state('user.profile', {
        url: '/profile',
        templateUrl: 'views/user.profile.html',
        controller: 'UserpageCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'views/signup.html',
        controller: 'SignupCtrl'
      })
      .state('resources', {
        url: '/resources',
        templateUrl: 'views/resources.html',
        controller: 'ResourcesCtrl'
      })
      .state('taskdesc', {
        url: '/taskdesc',
        templateUrl: 'views/taskdesc.html'
      })
      .state('help', {
        url: '/help/{taskName}',
        templateUrl: 'views/help.html',
        controller: 'HelpCtrl'
      })
      .state('tests', {
        url: '/tests',
        templateUrl: 'views/tests.html',
        controller: 'TestsCtrl'
      })
      .state('test', {
        url: '/test/{testName}',
        templateUrl: 'views/testpage.html',
        controller: 'TestpageCtrl'
      })
      .state('video_pas', {
        url: '/resources/pascal',
        templateUrl: 'views/resources.videos.html',
        controller: 'VideoPas'
      })
      .state('video_cpp', {
        url: '/resources/cpp',
        templateUrl: 'views/resources.videos.html',
        controller: 'VideoCpp'
      })
      .state('video_dos', {
        url: '/resources/dos',
        templateUrl: 'views/resources.videos.html',
        controller: 'VideoDos'
      })
      .state('video_alg', {
        url: '/resources/algoritmi',
        templateUrl: 'views/resources.videos.html',
        controller: 'VideoAlg'
      })
      .state('video_sel', {
        url: '/resources/scolastiche',
        templateUrl: 'views/resources.videos.html',
        controller: 'VideoSel'
      })
  })
  .controller('HomepageCtrl', function($scope, navbarManager, userManager) {
    $scope.me = userManager;
    navbarManager.setActiveTab(0);
  })
  .filter('repext', function() {
    return function(input) {
      return input.replace(/.%l$/, ".(cpp|c|pas)")
    };
  })
  .filter('outcomeToClass', function() {
    return function(input) {
      if (input == "Correct")
        return "correct";
      if (input == "Not correct")
        return "wrong";
      return "partial";
    };
  })
  .filter('timeFmt', function() {
    return function(input) {
      if (input == undefined)
        return "N/A";
      return input.toFixed(3) + "s";
    };
  })
  .filter('memoryFmt', function() {
    return function(input) {
      if (input == undefined)
        return "N/A";
      if (input>1024*1024)
        return (input/(1024*1024)).toFixed(1) + " MiB";
      else if (input>1024)
        return (input/1024).toFixed(0) + " KiB";
      return input + " B";
    };
  })
  .filter('dateFmt', function() {
    return function(input) {
      var d = new Date(1000 * (+input));
      if (d.toDateString() == new Date(Date.now()).toDateString())
        return "oggi, " + ('0' + d.getHours()).substr(-2) + ":" + ('0' + d.getMinutes()).substr(-2);
      d.setDate(d.getDate() + 1);
      if (d.toDateString() == new Date(Date.now()).toDateString())
        return "ieri, " + ('0' + d.getHours()).substr(-2) + ":" + ('0' + d.getMinutes()).substr(-2);
      d.setDate(d.getDate() - 1);
      return ('0' + d.getDate()).substr(-2) + "/" + ('0' + (d.getMonth()+1)).substr(-2)
             + "/" + d.getFullYear() + ", " + ('0' + d.getHours()).substr(-2) + ":"
             + ('0' + d.getMinutes()).substr(-2);
    };
  });
