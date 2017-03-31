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
    'ui.ace',
    'angular-md5',
  ])
  .constant('API_PREFIX', 'api/')
  .config(function($locationProvider, $stateProvider, $urlRouterProvider) {
    $locationProvider.html5Mode(false); //.hashPrefix('!')
    // FIXME: ui-router ignores hashPrefix for href attributes, so we don't use it (for now)

    $urlRouterProvider
      .when('/tasks/', '/tasks/1')
      .when('/task/{taskName}', '/task/{taskName}/statement')
      .when('/user/{userId}', '/user/{userId}/profile')
      .when('/ranking/', '/ranking/1')
      .when('/tecniques', '/techniques')
      .otherwise('/overview');

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
      .state('forgot-account', {
        url: '/forgot-account',
        templateUrl: 'views/forgot-account.html',
        controller: 'ForgotAccountCtrl'
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
      .state('material', {
        url: '/material',
        templateUrl: 'views/material.html',
        controller: 'MaterialCtrl'
      })
      .state('lessons', {
        url: '/lessons',
        templateUrl: 'views/lessons.html',
        controller: 'LessonsCtrl'
      })
      .state('test', {
        url: '/test/{testName}',
        templateUrl: 'views/testpage.html',
        controller: 'TestpageCtrl'
      })
      .state('techniques', {
        url: '/tags/techniques',
        controller: 'TechniquesPage',
        template: `<div class="container">
  <legend>Tasks by technique</legend>
  <div class="tag-group">
    <span class="tag-group-item" ng-repeat="tag in tags" style="padding: 5px;">
      <a ui-sref="tasklist.page({tag: tag, pageNum: 1})" class="label btn-info">
        <i class="fa fa-tag"></i>
        {{tag}}
      </a>
    </span>
  </div>
</div>`
      })
      .state('events', {
        url: '/tags/events',
        controller: 'EventsPage',
        template: `<div class="container">
  <div class="col-sm-5">
    <legend>IOI</legend>
    <div class="well">
      <div ng-repeat="year in ioi" style="margin-bottom: 10px">
        <em>Anno IOI: {{year}}</em>
        <div class="tag-group">
          <span class="tag-group-item" style="padding: 5px;" ng-if="year != 2010">
            <a ui-sref="tasklist.page({tag: 'ioi' + year + ',territoriali', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> selezioni territoriali
            </a>
          </span>
          <span class="tag-group-item" style="padding: 5px;" ng-if="year == 2010">
            <a class="label btn-warning" title="non svolte">
              <i class="fa fa-tag"></i> selezioni territoriali
            </a>
          </span>
          <span class="tag-group-item" style="padding: 5px;" ng-if="year != 2009">
            <a ui-sref="tasklist.page({tag: 'ioi' + year + ',nazionali', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> selezioni nazionali
            </a>
          </span>
          <span class="tag-group-item" style="padding: 5px;" ng-if="year == 2009">
            <a class="label btn-warning" title="non svolte">
              <i class="fa fa-tag"></i> selezioni nazionali
            </a>
          </span>
          <span class="tag-group-item" style="padding: 5px;">
            <a ui-sref="tasklist.page({tag: 'ioi' + year + ',ioi', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> ioi
            </a>
          </span>
        </div>
      </div>
    </div>
  </div>
  <div class="col-sm-5">
    <legend>Altre gare</legend>
    <div class="well">
      <div style="margin-bottom: 10px">
        <em>OIS: Olimpiadi di Informatica a Squadre</em>
        <div class="tag-group">
          <span class="tag-group-item" style="padding: 5px;">
            <a ui-sref="tasklist.page({tag: 'ois', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> ois
            </a>
          </span>
        </div>
      </div>
      <div style="margin-bottom: 10px">
        <em>GATOR: Gara di Allenamento Tor Vergata</em>
        <div class="tag-group">
          <span class="tag-group-item" style="padding: 5px;">
            <a ui-sref="tasklist.page({tag: 'gator', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> gator
            </a>
          </span>
        </div>
      </div>
      <div style="margin-bottom: 10px">
        <em>ABC: Algoritmi Bergamo Contest</em>
        <div class="tag-group">
          <span class="tag-group-item" style="padding: 5px;">
            <a ui-sref="tasklist.page({tag: 'abc', pageNum: 1})" class="label btn-info">
              <i class="fa fa-tag"></i> abc
            </a>
          </span>
        </div>
      </div>
    </div>
  </div>
</div>`
      })

  })
  .controller('HomepageCtrl', function($scope, userManager, contestManager) {
    $scope.me = userManager;
    $scope.cm = contestManager;
  })
  .filter('repext', function() {
    return function(input) {
      return input.replace(/.%l$/, ".(cpp|c|pas)");
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
      if (input > 1024 * 1024)
        return (input / (1024 * 1024)).toFixed(1) + " MiB";
      else if (input > 1024)
        return (input / 1024).toFixed(0) + " KiB";
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
      return ('0' + d.getDate()).substr(-2) + "/" + ('0' + (d.getMonth() + 1)).substr(-2) +
        "/" + d.getFullYear() + ", " + ('0' + d.getHours()).substr(-2) + ":" +
        ('0' + d.getMinutes()).substr(-2);
    };
  });
