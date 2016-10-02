'use strict';

/* Contest management */

angular.module('cmsocial')
  .factory('contestManager', function($http, $window, notificationHub, userManager, API_PREFIX) {
    var contest = null;
    var createAnalytics = function() {
      ! function(A, n, g, u, l, a, r) {
        A.GoogleAnalyticsObject = l, A[l] = A[l] || function() {
            (A[l].q = A[l].q || []).push(arguments);
          }, A[l].l = +new Date, a = n.createElement(g),
          r = n.getElementsByTagName(g)[0], a.src = u, r.parentNode.insertBefore(a, r);
      }(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');

      ga('create', contest.analytics);
      ga('send', 'pageview');
    };
    var analyticsCreated = false;
    var getContestData = function() {
      $http.post(API_PREFIX + "contest", {
          "username": userManager.getUser().username,
          "token": userManager.getUser().token,
          "action": "get"
        })
        .success(function(data, status, headers, config) {
          contest = data;
          $window.document.title = contest.title;
          if (!analyticsCreated) {
            createAnalytics();
            analyticsCreated = true;
          }
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
        getContestData();
      },
      participate: function() {
        $http.post(API_PREFIX + 'user', {
            'action': 'newparticipation',
            'username': userManager.getUser().username,
            'token': userManager.getUser().token
          })
          .success(function(data, status, headers, config) {
            getContestData();
          }).error(function(data, status, headers, config) {
            notificationHub.serverError(status);
          });
      }
    };
  });
