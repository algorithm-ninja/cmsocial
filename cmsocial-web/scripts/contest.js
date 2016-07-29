'use strict';

/* Contest management */

angular.module('cmsocial')
  .factory('contestManager', function($http, $window, notificationHub, userManager, BASE_URL, API_PREFIX) {
    var contest = null;
    var getContestData = function() {
      var contestName = $window.location.pathname;
      if (contestName.substr(0, BASE_URL.length) === BASE_URL)
        contestName = contestName.substr(BASE_URL.length);
      while (contestName[0] === '/')
        contestName = contestName.substr(1);
      contestName = contestName.split('/')[0];
      if (contestName === "") {
        contest = null;
        return;
      }
      $http.post(API_PREFIX + "contest", {
        "username": userManager.getUser().username,
        "token": userManager.getUser().token,
        "contest": contestName,
        "action": "get"
      })
      .success(function(data, status, headers, config) {
        contest = data;
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
          'token':    userManager.getUser().token,
          'contest':  contest.name
        })
        .success(function(data, status, headers, config) {
          getContestData();
        }).error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
      }
    };
  })
