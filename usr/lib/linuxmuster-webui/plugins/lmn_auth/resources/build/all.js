// Generated by CoffeeScript 2.4.1
(function() {
  angular.module('lm.auth', ['core']);

  angular.module('lm.auth').run(function(customization, identity) {
    return customization.plugins.core.extraProfileMenuItems = [
      {
        url: '/view/lmn/change-password',
        name: 'Change password',
        icon: 'key'
      }
    ];
  });

}).call(this);

// Generated by CoffeeScript 2.4.1
(function() {
  angular.module('lm.auth').config(function($routeProvider) {
    return $routeProvider.when('/view/lmn/change-password', {
      controller: 'LMNPasswordChangeCtrl',
      templateUrl: '/lmn_auth:resources/partial/index.html'
    });
  });

  angular.module('lm.auth').controller('LMNPasswordChangeCtrl', function($scope, $http, pageTitle, gettext, notify, validation) {
    pageTitle.set(gettext('Change Password'));
    return $scope.change = function() {
      var strong, valid;
      if (!$scope.newPassword || !$scope.password) {
        return;
      }
      if ($scope.newPassword !== $scope.newPassword2) {
        notify.error(gettext('Passwords do not match'));
        return;
      }
      strong = validation.isStrongPwd($scope.userpw);
      valid = validation.validCharPwd($scope.userpw);
      if (strong !== true) {
        notify.error(gettext(strong));
        return;
      } else if (valid !== true) {
        notify.error(gettext(valid));
        return;
      }
      return $http.post('/api/lmn/change-password', {
        password: $scope.password,
        new_password: $scope.newPassword
      }).then(function() {
        notify.success(gettext('Password changed'));
        return window.location.replace('landingpage');
      }).catch(function(e) {
        return notify.error(gettext('Password change failed'));
      });
    };
  });

}).call(this);

