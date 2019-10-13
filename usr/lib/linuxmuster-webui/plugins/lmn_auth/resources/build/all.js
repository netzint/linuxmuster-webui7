// Generated by CoffeeScript 2.4.1
(function() {
  angular.module('lm.auth', ['core']);

  angular.module('lm.auth').run(function(customization, $http, identity, gettextCatalog, config) {
    var lang;
    lang = config.data.language || 'en';
    return $http.get(`/resources/all.locale.js?lang=${lang}`).then(function(rq) {
      var expr;
      gettextCatalog.setStrings(lang, rq.data);
      expr = rq.data['Change password'];
      return customization.plugins.core.extraProfileMenuItems = [
        {
          url: '/view/lmn/change-password',
          name: expr,
          icon: 'key'
        }
      ];
    });
  });

}).call(this);

// Generated by CoffeeScript 2.4.1
(function() {
  var isStrongPwd, validCharPwd;

  angular.module('lm.auth').config(function($routeProvider) {
    return $routeProvider.when('/view/lmn/change-password', {
      controller: 'LMNPasswordChangeCtrl',
      templateUrl: '/lmn_auth:resources/partial/index.html'
    });
  });

  isStrongPwd = function(password) {
    var regExp, validPassword;
    regExp = /(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]|(?=.*\d)).{7,}/;
    validPassword = regExp.test(password);
    return validPassword;
  };

  validCharPwd = function(password) {
    var regExp, validPassword;
    regExp = /^[a-zA-Z0-9!@#§+\-$%&*{}()\]\[]+$/;
    validPassword = regExp.test(password);
    return validPassword;
  };

  angular.module('lm.auth').controller('LMNPasswordChangeCtrl', function($scope, $http, pageTitle, gettext, notify) {
    pageTitle.set(gettext('Change Password'));
    return $scope.change = function() {
      if (!$scope.newPassword || !$scope.password) {
        return;
      }
      if ($scope.newPassword !== $scope.newPassword2) {
        notify.error(gettext('Passwords do not match'));
        return;
      }
      if (!validCharPwd($scope.newPassword)) {
        notify.error(gettext("Password contains invalid characters"));
        return;
      }
      if (!isStrongPwd($scope.newPassword)) {
        notify.error(gettext("Password too weak"));
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

