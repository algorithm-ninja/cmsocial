'use strict';

/* Contest management */

angular.module('cmsocial')
  .factory('contestManager', function($http, $window, notificationHub, API_PREFIX) {
    var contest = null;
    var contestPromise;

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
    var computeMenu = function(access_level) {
        var menu = [];
        if (contest == null) return menu;
        for (let category of contest.menu) {
            var entries = [];
            for (let entry of category.entries) {
                if (entry["display"] == "admin") {
                    if (access_level == 0)
                        entries.push(entry);
                } else if (entry["display"] == "logged") {
                    if (access_level < 7)
                        entries.push(entry);
                } else if (entry["display"] == "unlogged") {
                    if (access_level == 7)
                        entries.push(entry);
                } else {
                    entries.push(entry);
                }
            }
            menu.push({
                "title": category["title"],
                "icon": category["icon"],
                "entries": entries
            });
        }
        return menu;
    };
    var menu = [];
    var getContestData = function() {
      contestPromise = $http({
        url: API_PREFIX + "contest",
        method: "POST",
        data: {action: "get"}
      }).then(function(response) {
        contest = response.data;
        menu = [];
        for (var i=0; i<8; i++) menu.push(computeMenu(i));
        $window.document.title = contest.title;

        if (!analyticsCreated) {
          createAnalytics();
          analyticsCreated = true;
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
      getMenu: function(access_level) {
        if (access_level == undefined) access_level = 7;
        return menu[access_level];
      },
      getContestPromise: function() {
        return contestPromise;
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
