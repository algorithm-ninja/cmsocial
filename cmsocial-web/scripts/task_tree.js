'use strict';

/* Tasks page */

angular.module('cmsocial').controller('TaskTree', function(
    $scope, $stateParams, $state, $http, notificationHub,
    userManager, l10n, API_PREFIX) {
        $http.post(API_PREFIX + 'task', {
            'tag' : 'tree', // can be null
            'first' : 0,
            'last' : 50,
            'username' : userManager.getUser().username,
            'token' : userManager.getUser().token,
            'action' : 'list'
        })
        .success(function(data, status, headers,
            config) { $scope.tasks = data['tasks']; })
        .error(function(data, status, headers, config) {
            notificationHub.serverError(status);
        });
    }
);
