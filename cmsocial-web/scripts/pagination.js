/* Contest Management System
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
  .directive('pagination', function() {
    return {
      restrict: 'E',
      scope: {
        currentPage: '=',
        totalPages: '=',
        onSelectPage: '&'
      },
      templateUrl: 'COMMIT_ID_HERE/views/pagination.html',
      replace: true,
      link: function(scope, elem, attrs) {
        scope.selectPage = function(newPage) {
          scope.onSelectPage({'page': newPage});
        };
        var makePage = function(text, number, active, disabled) {
          return {
            'text':     text,
            'number':   (number === undefined) ? 0 : number,
            'active':   (active === undefined) ? false : active,
            'disabled': (disabled === undefined) ? false : disabled
          };
        };
        var updatePages = function() {
          if (scope.totalPages === undefined || scope.totalPages === 0)
            return;
          scope.pages = [];
          // Check for the "«" button
          if (scope.totalPages > 5 && scope.currentPage > 3)
            scope.pages.push(makePage('«', 1));
          // The "<" button
          scope.pages.push(makePage('‹', scope.currentPage - 1, false, (scope.currentPage == 1)));
          // Less than 5 pages
          if (scope.totalPages < 5)
            for (var i=1; i<=scope.totalPages; i++)
              scope.pages.push(makePage(i, +i, (i == scope.currentPage)));
          else
          // Show first 5 pages only
          if (scope.currentPage <= 3)
            for (var i=1; i<=5; i++)
              scope.pages.push(makePage(i, +i, (i == scope.currentPage)));
          else
          // Show last 5 pages only
          if (scope.currentPage >= scope.totalPages - 2)
            for (var i=scope.totalPages-4; i<=scope.totalPages; i++)
              scope.pages.push(makePage(i, +i, (i == scope.currentPage)));
          else
          // Show a 5-page-window
            for (var i=-2; i<=2; i++)
              scope.pages.push(makePage(i + scope.currentPage, i + scope.currentPage, (i == 0)));
          // The ">" button
          scope.pages.push(makePage('›', scope.currentPage + 1, false, (scope.currentPage == scope.totalPages)));
          // Check for the "»" button
          if (scope.totalPages > 5 && scope.currentPage < scope.totalPages - 2)
            scope.pages.push(makePage('»', scope.totalPages));
        };
        scope.$watch('totalPages', function() {
          updatePages();
        });
        scope.$watch('currentPage', function() {
          updatePages();
        });
      }
    };
  });
