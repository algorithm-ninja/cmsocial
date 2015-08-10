'use strict';

angular.module('cmsocial')
  .directive('foot', function() {
    return {
      restrict: 'E',
      templateUrl: 'views/footer.html',
    }
  })
