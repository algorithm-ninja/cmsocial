'use strict';

/* Lesson page */

angular.module('cmsocial')
  .controller('LessonsCtrl', function($scope, $state,
    $http, notificationHub, userManager, l10n, API_PREFIX) {
    $scope.userManager = userManager;
    $scope.getLessons = function() {
      var data = {
        'action': 'list'
      };
      $http.post(API_PREFIX + 'lessons',
          data
        )
        .success(function(data, status, headers, config) {
          $scope.lessons = data['lessons'];
          for (var i = 0; i < $scope.lessons.length; i++) {
            $scope.lessons[i]["visible"] = false;
            $scope.lessons[i]["total_score"] = $scope.lessons[i].tasks.length * 100;
            $scope.lessons[i]["score"] = null;
            for (var j = 0; j < $scope.lessons[i].tasks.length; j++) {
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
        'action': 'alter',
        'id': lesson.id,
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
    $scope.deleteLesson = function(lesson) {
      $http.post(API_PREFIX + 'lessons', {
          'action': 'delete',
          'id': lesson.id
        })
        .success(function(data, status, headers, config) {
          notificationHub.createAlert('success', 'Deletion successful', 2);
          $scope.getLessons();
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.lessonLog = "";
    $scope.submitCompleted = true;
    $scope.loadFiles = function() {
      var input = $("#zipfile");
      $scope.files = {};
      var reader = new FileReader();
      reader.filename = input[0].files[0].name;
      reader.inputname = input[0].name;
      reader.onloadend = function() {
        $scope.files[reader.inputname] = {
          'filename': reader.filename,
          'data': reader.result
        };
        $scope.submitFiles();
      };
      reader.readAsDataURL(input[0].files[0]);
    };
    $scope.submitFiles = function() {
      var data = {};
      data['files'] = $scope.files;
      data['action'] = 'new';
      delete $scope.files;

      $scope.submitCompleted = false; // start loading
      $http.post(API_PREFIX + 'lessons', data)
        .success(function(data, status, headers, config) {
          if (data['success']) {
            $("#zipform").each(function() {
              this.reset();
            });
            $scope.getLessons();
          } else {
            notificationHub.createAlert('danger', l10n.get(data['error']), 2);
          }
          $scope.lessonLog = data['log'];
          $scope.submitCompleted = true; // stop loading
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
  });
