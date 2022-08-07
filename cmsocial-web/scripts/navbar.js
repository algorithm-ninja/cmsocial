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

var _l10n;
var langlist = [{
  'code': 'en',
  'name': 'English'
}, {
  'code': 'it',
  'name': 'Italiano'
}];

angular.module('cmsocial')
  .directive('navbar', function() {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'COMMIT_ID_HERE/views/navbar.html',
      replace: true,
      transclude: true,
      controller: 'NavbarCtrl'
    };
  })
  .controller('NavbarCtrl', function($scope, $location, $state, userManager,
        contestManager, l10n) {
    $('.signin-form input').click(function(e) {
      e.stopPropagation();
    });
    $scope.me = userManager;
    $scope.cm = contestManager;
    $scope.participate = contestManager.participate;
    $scope.rt = function(entry) {
        if (entry.href != null) return entry.href;
        return $state.href(entry.sref, entry.params)
    };

    _l10n = l10n;

    setTimeout(function() {
      const languageSelectorElement = document.getElementById("langsel");
      if (languageSelectorElement) {
        ReactDOM.render(
          <LanguageSelector/>,
          languageSelectorElement
        );

        // ugly hack because of react limitation
        let x = document.getElementsByTagName("something");
        for (let y of Array.from(x)) {
            while (y.childNodes.length > 0) {
                y.parentNode.appendChild(y.childNodes[0]);
            }
        }
      }
    }, 1);
  });


class LanguageSelector extends React.Component {
    setLang(lang) {
        _l10n.setLanguage(lang);
        window.location.reload();
    }

    render() {
        let x = [], kk = 0;
        for (let lang of langlist) {
            // FIXME: put flag icon besides {lang.name}

            x.push(
              <li key={kk} className={lang.code == _l10n.getLanguage() ? 'active' : ''}>
                <a onClick={this.setLang.bind(this, lang.code)}>
                  {lang.name}
                </a>
              </li>
            );

            kk += 1;
        }

        return (
            <something>
                {x}
            </something>
        );
    }
}
