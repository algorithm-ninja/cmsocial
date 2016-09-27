'use strict';

/* Lesson page */

angular.module('cmsocial')
  .controller('LessonsCtrl', function($scope, $state, navbarManager,
      $http, userManager, notificationHub, l10n, API_PREFIX) {
    navbarManager.setActiveTab(2);
    $scope.userManager = userManager;
    $scope.getLessons = function() {
      var data = {
        'username': userManager.getUser().username,
        'token':    userManager.getUser().token,
        'action':   'list'
      };
      $http.post(API_PREFIX + 'lessons',
        data
      )
      .success(function(data, status, headers, config) {
        $scope.lessons = data['lessons'];
        for (var i=0; i<$scope.lessons.length; i++) {
            $scope.lessons[i]["visible"] = false;
            $scope.lessons[i]["total_score"] = $scope.lessons[i].tasks.length*100;
            $scope.lessons[i]["score"] = null;
            for (var j=0; j<$scope.lessons[i].tasks.length; j++) {
                if ($scope.lessons[i].tasks[j].score == null) continue;
                if ($scope.lessons[i]["score"] == null)
                    $scope.lessons[i]["score"] = $scope.lessons[i].tasks[j].score;
                else
                    $scope.lessons[i]["score"] += $scope.lessons[i].tasks[j].score;
            }
        }
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    $scope.getLessons();
    $scope.togglePublic = function(lesson) {
      var data = {
        'username':     userManager.getUser().username,
        'token':        userManager.getUser().token,
        'action':       'alter',
        'id':           lesson.id,
        'access_level': lesson.access_level
      };
      $http.post(API_PREFIX + 'lessons', data)
      .success(function(data, status, headers, config) {
        notificationHub.createAlert('success', "Change successful", 2);
        $scope.getLessons();
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
  });
