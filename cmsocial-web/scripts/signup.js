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

/* Signup page */

angular.module('cmsocial')
  .controller('SignupCtrl', function($scope, $http, $state, md5,
    notificationHub, navbarManager, contestManager, API_PREFIX) {
    navbarManager.setActiveTab(5);
    $scope.cm = contestManager;

    $(".avatar")
      .load(function() {
        $(".avatar-loader").hide();
      })
      .error(function() {
        console.log("Errore nel caricamento dell'immagine");
      });
    $("#email1").blur(function() {
      var newSrc = 'http://gravatar.com/avatar/' + md5.createHash(this.value).toString() + '?d=identicon&s=200';
      var avatar = $(".avatar");
      if (avatar.attr('src') != newSrc) {
        $(".avatar-loader").show();
        avatar.attr('src', newSrc);
      }
    });
    $scope.isBad = {
      'username': true,
      'email': true,
      'password': true,
      'password2': true,
      'email2': true,
      'region': true,
      'province': true,
      'city': true,
    };
    $scope.user = {
      'username': '',
      'email': '',
      'email2': '',
      'password': '',
      'password2': '',
      'recaptcha_response': '',
    };
    $scope.errorMsg = {
      'password': 'Password\'s too short',
      'password2': 'Passwords don\'t match',
      'email2': 'E-mails don\'t match',
      'region': 'You must specify a region',
      'province': 'You must specify a province',
      'city': 'You must specify a city',
    };
    $http.post(API_PREFIX + 'location', {
        'action': 'listregions'
      }).success(function(data, status, headers, config) {
        $scope.regions = data.regions;
      })
      .error(function(data, status, headers, config) {
        notificationHub.serverError(status);
      });
    $scope.submit = function() {
      $scope.checkUsername();
      $scope.checkEmail();
      $scope.checkPassword();
      if ($scope.isBad['username']) {
        $scope.signupform.username.$dirty = true;
        $("#username1").focus();
        return;
      } else if ($scope.isBad['password']) {
        $scope.signupform.password.$dirty = true;
        $("#password1").focus();
        return;
      } else if ($scope.isBad['password2']) {
        $scope.signupform.password2.$dirty = true;
        $("#password2").focus();
        return;
      } else if ($scope.isBad['email']) {
        $scope.signupform.email.$dirty = true;
        $("#email1").focus();
        return;
      } else if ($scope.isBad['email2']) {
        $scope.signupform.email2.$dirty = true;
        $("#email2").focus();
        return;
      }
      var data = $scope.user;
      data['action'] = 'new';
      $http.post(API_PREFIX + 'user', data)
        .success(function(data, status, headers, config) {
          if (data.success === 1) {
            notificationHub.createAlert('success', 'Complimenti, ' +
              'la registrazione è andata a buon fine, adesso puoi accedere con le credenziali ' +
              'del tuo nuovo account usando il modulo in alto a destra. Una volta entrato ' +
              'nel sistema avrai la possibilità di sottoporre le soluzioni ai task presenti ' +
              'in questa pagina. Buon allenamento.', 10);
            $state.go('overview');
          } else {
            notificationHub.createAlert('danger', data.error, 3);
          }
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.askServer = function(type, value) {
      $http.post(API_PREFIX + 'check', {
          'type': type,
          'value': value
        })
        .success(function(data, status, headers, config) {
          $scope.isBad[type] = (data.success == 0);
          $scope.errorMsg[type] = data.error;
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.checkUsername = function() {
      $scope.askServer('username', $scope.user.username);
    };
    $scope.checkEmail = function() {
      $scope.askServer('email', $scope.user.email);
    };
    $scope.checkPassword = function() {
      $scope.isBad['password'] = ($scope.user.password.length < 5);
    };
    $scope.matchPassword = function() {
      $scope.isBad['password2'] = ($scope.user.password !== $scope.user.password2);
    };
    $scope.matchEmail = function() {
      $scope.isBad['email2'] = ($scope.user.email !== $scope.user.email2);
    };
  });
