'use strict';

/* Contest management */

angular.module('cmsocial')
  .factory('contestManager', function($http, $window, notificationHub, API_PREFIX) {
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
      $http({
        url: API_PREFIX + "contest",
        method: "POST",
        data: {action: "get"}
      }).then(function(response) {
        contest = response.data;
        $window.document.title = contest.title;

        if (!analyticsCreated) {
          createAnalytics();
          analyticsCreated = true;
        }

        var Recaptcha = ReactRecaptcha;

        var recaptchaDiv = document.getElementById('recaptcha-div');

        if (recaptchaDiv) {
            ReactDOM.render(
              <Recaptcha
                sitekey={contest.recaptcha_public_key}
              />,
              recaptchaDiv
            );
        }

      }, function(response) {
        notificationHub.serverError(response.status);
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
        if (contest == null) return true;
        return contest.participates === true;
      },
      refreshContest: function() {
        getContestData();
      },
      participate: function() {
        $http.post(API_PREFIX + 'user', {
            'action': 'newparticipation',
          })
          .success(function(data, status, headers, config) {
            getContestData();
          }).error(function(data, status, headers, config) {
            notificationHub.serverError(status);
          });
      }
    };
  });
