/* Contest Management System
 * Copyright © 2013 Luca Wehrstedt <luca.wehrstedt@gmail.com>
 * Copyright © 2013 Luca Versari <veluca93@gmail.com>
 * Copyright © 2013 William Di Luigi <williamdiluigi@gmail.com>
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

/* Ranking page */

angular.module('cmsocial')
  .controller('RankingSkel', function($scope) {
    $scope.pagination = {
      perPage: 20
    };
  })
  .controller('RankingCtrl', function($scope, $stateParams, $state,
    $http, notificationHub, l10n, API_PREFIX) {
    $scope.pagination.current = +$stateParams.pageNum;
    $scope.getUsers = function() {
      var data = {
        'first': $scope.pagination.perPage * ($scope.pagination.current - 1),
        'last': $scope.pagination.perPage * $scope.pagination.current,
        'action': 'list'
      };
      $http.post(API_PREFIX + 'user',
          data
        )
        .success(function(data, status, headers, config) {
          $scope.users = data['users'];
          $scope.pagination.total = Math.ceil(data['num'] / $scope.pagination.perPage);
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.getUsers();
  });
