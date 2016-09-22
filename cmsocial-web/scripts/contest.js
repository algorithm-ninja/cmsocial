'use strict';

/* Contest management */

angular.module('cmsocial')
  .factory('contestManager', function($http, $window, notificationHub, userManager, API_PREFIX) {
    var contest = null;
    var getContestData = function() {
      $http.post(API_PREFIX + "contest", {
        "username": userManager.getUser().username,
        "token": userManager.getUser().token,
        "action": "get"
      })
      .success(function(data, status, headers, config) {
        contest = data;
        $window.document.title = contest.title;
      }).error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    };
    getContestData();
    return {
      getContest: function() {
          return contest;
      },
      hasContest: function() {
          return contest != null;
      },
      hasParticipation: function() {
          return contest != null && contest.participates === true;
      },
      refreshContest: function() {
          getContestData()
      },
      participate: function() {
        $http.post(API_PREFIX + 'user', {
          'action':   'newparticipation',
          'username': userManager.getUser().username,
          'token':    userManager.getUser().token
        })
        .success(function(data, status, headers, config) {
          getContestData();
        }).error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
      }
    };
  })
