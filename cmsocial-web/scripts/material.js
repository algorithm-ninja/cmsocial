'use strict';

/* Materials page */

angular.module('cmsocial')
  .controller('MaterialCtrl', function($scope, $state,
      $http, notificationHub, userManager, l10n, API_PREFIX, $sce) {
    $scope.userManager = userManager;
    $scope.getMaterial = function() {
      var data = {
        'action': 'list'
      };
      $http.post(API_PREFIX + 'material',
          data
        )
        .success(function(data, status, headers, config) {
          var reader = new commonmark.Parser();
          var writer = new commonmark.HtmlRenderer();

          $scope.materials = [];
          for (let mat of data['materials']) {
              $scope.materials.push(mat);

              var parsed = reader.parse(mat.text); // parsed is a 'Node' tree
              // transform parsed if you like...
              var result = writer.render(parsed); // result is a String

              $scope.materials[$scope.materials.length - 1].html = $sce.trustAsHtml(result);
          }
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
    $scope.getMaterial();

    $scope.downloadMaterial = function(material) {
        var pom = document.createElement('a');
        pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(material.text));
        pom.setAttribute('download', material.title + '.md');

        if (document.createEvent) {
            var event = document.createEvent('MouseEvents');
            event.initEvent('click', true, true);
            pom.dispatchEvent(event);
        }
        else {
            pom.click();
        }
    };

    $scope.togglePublic = function(material) {
      var data = {
        'action': 'alter',
        'id': material.id,
        'access_level': material.access_level
      };
      $http.post(API_PREFIX + 'material', data)
        .success(function(data, status, headers, config) {
          notificationHub.createAlert('success', "Change successful", 2);
          $scope.getMaterial();
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };

    $scope.deleteMaterial = function(material) {
      if (!confirm("Are you sure?")) return;

      $http.post(API_PREFIX + 'material', {
          'action': 'delete',
          'id': material.id
        })
        .success(function(data, status, headers, config) {
          notificationHub.createAlert('success', 'Deletion successful', 2);
          $scope.getMaterial();
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };

    $scope.deleteMaterial = function(material) {
      if (!confirm("Are you sure?")) return;

      $http.post(API_PREFIX + 'material', {
          'action': 'delete',
          'id': material.id
        })
        .success(function(data, status, headers, config) {
          notificationHub.createAlert('success', 'Deletion successful', 2);
          $scope.getMaterial();
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };

    $scope.submitCompleted = true;
    $scope.loadFiles = function() {
      var input = $("#mdfile");
      $scope.files = {};
      var reader = new FileReader();
      reader.filename = input[0].files[0].name;
      reader.inputname = input[0].name;
      reader.onloadend = function() {
        $scope.files[reader.inputname] = {
          'filename': reader.filename,
          'data': reader.result
        };
        $scope.submitFiles();
      };
      reader.readAsDataURL(input[0].files[0]);
    };

    $scope.submitFiles = function() {
      var data = {};
      data['files'] = $scope.files;
      data['title'] = $("#mdtitle").val();
      data['action'] = 'new';
      delete $scope.files;

      $scope.submitCompleted = false; // start loading
      $http.post(API_PREFIX + 'material', data)
        .success(function(data, status, headers, config) {
          if (data['success']) {
            $("#mdform").each(function() {
              this.reset();
            });
            $scope.getMaterial();
          } else {
            notificationHub.createAlert('danger', l10n.get(data['error']), 2);
          }
          $scope.submitCompleted = true; // stop loading
        })
        .error(function(data, status, headers, config) {
          notificationHub.serverError(status);
        });
    };
  });
