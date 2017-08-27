(function() {
  angular.module('lm.quotas', ['core', 'lm.common']);

}).call(this);

(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module('lm.quotas').config(function($routeProvider) {
    $routeProvider.when('/view/lm/quotas', {
      controller: 'LMQuotasController',
      templateUrl: '/lm_quotas:resources/partial/index.html'
    });
    return $routeProvider.when('/view/lm/quotas-disabled', {
      templateUrl: '/lm_quotas:resources/partial/disabled.html'
    });
  });

  angular.module('lm.quotas').controller('LMQuotasApplyModalController', function($scope, $http, $uibModalInstance, gettext, notify) {
    $scope.logVisible = false;
    $scope.isWorking = true;
    $scope.showLog = function() {
      return $scope.logVisible = true;
    };
    $http.get('/api/lm/quotas/apply').then(function() {
      $scope.isWorking = false;
      return notify.success(gettext('Update complete'));
    })["catch"](function(resp) {
      notify.error(gettext('Update failed'), resp.data.message);
      $scope.isWorking = false;
      return $scope.showLog();
    });
    return $scope.close = function() {
      return $uibModalInstance.close();
    };
  });

  angular.module('lm.quotas').controller('LMQuotasController', function($scope, $http, $uibModal, $location, $q, gettext, lmEncodingMap, notify, pageTitle, lmFileBackups) {
    pageTitle.set(gettext('Quotas'));
    $scope._ = {
      addNewSpecial: null
    };
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.teachersEncoding = lmEncodingMap[resp.data.encoding_teachers] || 'ISO8859-1';
      return $http.get("/api/lm/users/teachers?encoding=" + $scope.teachersEncoding).then(function(resp) {
        var i, len, q, ref, results, teacher;
        $scope.teachers = resp.data;
        ref = $scope.teachers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          teacher = ref[i];
          q = teacher.quota.split('+');
          teacher.quota = {
            home: parseInt(q[0]),
            "var": parseInt(q[1])
          };
          results.push(teacher.mailquota = parseInt(teacher.mailquota));
        }
        return results;
      });
    });
    $http.get('/api/lm/settings').then(function(resp) {
      if (!resp.data.use_quota) {
        return $location.path('/view/lm/quotas-disabled');
      }
    });
    $http.get('/api/lm/quotas').then(function(resp) {
      $scope.quotas = resp.data;
      return $scope.standardQuota = $scope.quotas['standard-lehrer'];
    });
    $http.get('/api/lm/class-quotas').then(function(resp) {
      $scope.classes = resp.data;
      return $scope.originalClasses = angular.copy($scope.classes);
    });
    $http.get('/api/lm/project-quotas').then(function(resp) {
      $scope.projects = resp.data;
      return $scope.originalProjects = angular.copy($scope.projects);
    });
    $scope.specialQuotas = [
      {
        login: 'www-data',
        name: gettext('Webspace')
      }, {
        login: 'administrator',
        name: gettext('Main admin')
      }, {
        login: 'pgmadmin',
        name: gettext('Program admin')
      }, {
        login: 'wwwadmin',
        name: gettext('Web admin')
      }
    ];
    $scope.defaultQuotas = [
      {
        login: 'standard-workstations',
        name: gettext('Workstation default')
      }, {
        login: 'standard-schueler',
        name: gettext('Student default')
      }, {
        login: 'standard-lehrer',
        name: gettext('Teacher default')
      }
    ];
    $scope.$watch('_.addNewSpecial', function() {
      if ($scope._.addNewSpecial) {
        $scope.quotas[$scope._.addNewSpecial] = angular.copy($scope.standardQuota);
        return $scope._.addNewSpecial = null;
      }
    });
    $scope.findUsers = function(q) {
      return $http.get("/api/lm/ldap-search?q=" + q).then(function(resp) {
        return resp.data;
      });
    };
    $scope.isSpecialQuota = function(login) {
      var x;
      return indexOf.call((function() {
        var i, len, ref, results;
        ref = $scope.specialQuotas;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          results.push(x.login);
        }
        return results;
      })(), login) >= 0;
    };
    $scope.isDefaultQuota = function(login) {
      var x;
      return indexOf.call((function() {
        var i, len, ref, results;
        ref = $scope.defaultQuotas;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          results.push(x.login);
        }
        return results;
      })(), login) >= 0;
    };
    $scope.studentNameCache = {};
    $scope.getStudentName = function(login) {
      if (!angular.isDefined($scope.studentNameCache[login])) {
        $scope.studentNameCache[login] = '...';
        $http.get("/api/lm/ldap-search?q=" + login).then(function(resp) {
          if (resp.data.length > 0) {
            return $scope.studentNameCache[login] = resp.data[0][1].cn[0];
          } else {
            return $scope.studentNameCache[login] = login;
          }
        });
      }
      return $scope.studentNameCache[login];
    };
    $scope.remove = function(login) {
      return delete $scope.quotas[login];
    };
    $scope.save = function() {
      var base, base1, base2, base3, classesToChange, cls, i, index, j, k, len, len1, len2, project, projectsToChange, qs, ref, ref1, teacher, teachers;
      teachers = angular.copy($scope.teachers);
      for (i = 0, len = teachers.length; i < len; i++) {
        teacher = teachers[i];
        if (!teacher.quota.home && !teacher.quota["var"]) {
          teacher.quota = '';
        } else {
          teacher.quota = (teacher.quota.home || $scope.standardQuota.home) + "+" + (teacher.quota["var"] || $scope.standardQuota["var"]);
        }
        teacher.mailquota = "" + (teacher.mailquota || '');
      }
      classesToChange = [];
      ref = $scope.classes;
      for (index = j = 0, len1 = ref.length; j < len1; index = ++j) {
        cls = ref[index];
        if (!angular.equals(cls, $scope.originalClasses[index])) {
          if ((base = cls.quota).home == null) {
            base.home = $scope.standardQuota.home;
          }
          if ((base1 = cls.quota)["var"] == null) {
            base1["var"] = $scope.standardQuota["var"];
          }
          classesToChange.push(cls);
        }
      }
      projectsToChange = [];
      ref1 = $scope.projects;
      for (index = k = 0, len2 = ref1.length; k < len2; index = ++k) {
        project = ref1[index];
        if (!angular.equals(project, $scope.originalProjects[index])) {
          if ((base2 = project.quota).home == null) {
            base2.home = $scope.standardQuota.home;
          }
          if ((base3 = project.quota)["var"] == null) {
            base3["var"] = $scope.standardQuota["var"];
          }
          projectsToChange.push(project);
        }
      }
      qs = [];
      qs.push($http.post("/api/lm/users/teachers?encoding=" + $scope.teachersEncoding, teachers));
      qs.push($http.post('/api/lm/quotas', $scope.quotas));
      if (classesToChange.length > 0) {
        qs.push($http.post("/api/lm/class-quotas", classesToChange).then(function() {}));
      }
      if (projectsToChange.length > 0) {
        qs.push($http.post("/api/lm/project-quotas", projectsToChange).then(function() {}));
      }
      return $q.all(qs).then(function() {
        $scope.originalClasses = angular.copy($scope.classes);
        $scope.originalProjects = angular.copy($scope.projects);
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveApply = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_quotas:resources/partial/apply.modal.html',
          controller: 'LMQuotasApplyModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/sophomorix/user/quota.txt');
    };
  });

}).call(this);
