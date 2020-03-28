/* Contest Management System
 * Copyright © 2017 Luca Versari <veluca93@gmail.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
'use strict';

angular.module('cmsocial')
  .controller('AdminCtrl', function($scope, $http, $state, $window,
    notificationHub, userManager, contestManager, API_PREFIX) {
    $scope.contest = {};
    contestManager.getContestPromise().then(function(response) {
      var cts = contestManager.getContest();
      var items = [
        'forum_url', 'mail_from', 'mail_username', 'mail_password', 'title',
        'mail_server', 'analytics', 'cookie_domain', 'description',
        'recaptcha_public_key', 'recaptcha_secret_key', 'top_left_name',
        'all_languages', 'languages'
      ];
      for (var i=0; i<items.length; i++) {
        $scope.contest[items[i]] = cts[items[i]];
      }
      if (cts['menu_on_db'] != null)
        $scope.contest['menu'] = JSON.stringify(cts['menu_on_db']);
      else $scope.contest['menu'] = '';
    });
    $scope.submit = function() {
      var data = {'action': 'alter'};
      for (var i in $scope.contest) {
        if ($scope.contest[i] == '')
          data[i] = null;
        else data[i] = $scope.contest[i];
      }
      if ($scope.contest.menu == '') data['menu'] = null;
      else data['menu'] = JSON.parse($scope.contest.menu);
      $http.post(API_PREFIX + 'contest', data)
        .success(function(data, status, headers, config) {
          $window.location.reload();
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.toggleLanguage = function toggleLanguage(language) {
      var idx = $scope.contest.languages.indexOf(language);
      if (idx > -1) {
        $scope.contest.languages.splice(idx, 1);
      } else {
        $scope.contest.languages.push(language);
      }
    };
  });
