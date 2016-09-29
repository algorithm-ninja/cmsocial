/* Contest Management System
 * Copyright © 2013 Luca Wehrstedt <luca.wehrstedt@gmail.com>
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

angular.module('cmsocial')
  .directive('navbar', function() {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'views/navbar.html',
      replace: true,
      transclude: true,
      controller: 'NavbarCtrl'
    };
  })
  .factory('navbarManager', function() {
    var activeTab = 0;
    return {
      isActiveTab: function(tab) {
        return tab == activeTab;
      },
      setActiveTab: function(tab) {
        activeTab = tab;
      }
    };
  })
  .controller('NavbarCtrl', function($scope, $location, userManager,
    navbarManager, contestManager, l10n) {
    $('.signin-form input').click(function(e) {
      e.stopPropagation();
    });
    $scope.me = userManager;
    $scope.cm = contestManager;
    $scope.participate = contestManager.participate;
    $scope.isActiveTab = navbarManager.isActiveTab;
    $scope.vars = {};
    $scope.vars.language = l10n.getLanguage();
    $scope.setLanguage = function() {
      l10n.setLanguage($scope.vars.language);
      console.log(l10n.getLanguage());
    };
    $scope.languages = [{
      'code': 'en',
      'name': 'English'
    }, {
      'code': 'it',
      'name': 'Italiano'
    }];
  });
