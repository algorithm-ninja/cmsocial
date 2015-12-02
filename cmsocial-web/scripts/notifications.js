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
  .factory('notificationHub', function($timeout, l10n) {

    // Alert creation routine
    var createIt = function(type, msg, secs) {

      // Create alert model and hide it
      var alert = $('<div class="alert alert-' + type + ' hyphenate' +
          ' alert-dismissable"><button type="button" class="close" ' +
          'data-dismiss="alert" aria-hidden="true">&times;</button>' +
          msg + '</div>').hide();

      // Put it in the right place and open it
      $(".notifications").prepend(alert);
      alert.slideDown('fast');

      // Wait for the user to read it and then destroy it
      $timeout(function() {
        alert.animate({'right': '-260px'}, function() {
          $(this).remove();
        });
      }, Math.round(1000 * secs));

    };

    return {
      createAlert: createIt,
      serverError: function(status) {

        // Create a standard error for server querying failure
        var error = '<b>ERROR ' + status + '</b><br />';
        error += l10n.get('Make sure your internet connection is ' +
            'working and, if this error occurs again, contact an ' +
            'administrator.');
        createIt('danger', error, 10);

      }
    };
  });
