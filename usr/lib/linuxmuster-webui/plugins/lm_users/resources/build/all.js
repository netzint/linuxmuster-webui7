(function() {
  angular.module('lm.users', ['core', 'lm.common']);

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/students', {
      controller: 'LMUsersStudentsController',
      templateUrl: '/lm_users:resources/partial/students.html'
    });
  });

  angular.module('lm.users').controller('LMUsersStudentsController', function($scope, $http, $location, $route, $uibModal, gettext, notify, lmEncodingMap, messagebox, pageTitle, lmFileEditor, lmFileBackups) {
    pageTitle.set(gettext('Students'));
    $scope.sorts = [
      {
        name: gettext('Class'),
        fx: function(x) {
          return x["class"];
        }
      }, {
        name: gettext('First name'),
        fx: function(x) {
          return x.first_name;
        }
      }, {
        name: gettext('Last name'),
        fx: function(x) {
          return x.last_name;
        }
      }, {
        name: gettext('Birthday'),
        fx: function(x) {
          return x.birthday;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.paging = {
      page: 1,
      pageSize: 100
    };
    $scope.add = function() {
      $scope.paging.page = Math.floor(($scope.students.length - 1) / $scope.paging.pageSize) + 1;
      $scope.filter = '';
      return $scope.students.push({
        first_name: 'New',
        _isNew: true
      });
    };
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.encoding = lmEncodingMap[resp.data.encoding_students] || 'ISO8859-1';
      return $http.get("/api/lm/users/students?encoding=" + $scope.encoding).then(function(resp) {
        return $scope.students = resp.data;
      });
    });
    $scope.remove = function(student) {
      return $scope.students.remove(student);
    };
    $scope.editCSV = function() {
      return lmFileEditor.show('/etc/sophomorix/user/schueler.txt', $scope.encoding).then(function() {
        return $route.reload();
      });
    };
    $scope.save = function() {
      return $http.post("/api/lm/users/students?encoding=" + $scope.encoding, $scope.students).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveAndCheck = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_users:resources/partial/check.modal.html',
          controller: 'LMUsersCheckModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/sophomorix/user/schueler.txt', $scope.encoding);
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/teachers', {
      controller: 'LMUsersTeachersController',
      templateUrl: '/lm_users:resources/partial/teachers.html'
    });
  });

  angular.module('lm.users').controller('LMUsersTeachersController', function($scope, $http, $location, $route, $uibModal, gettext, lmEncodingMap, notify, messagebox, pageTitle, lmFileEditor, lmFileBackups) {
    pageTitle.set(gettext('Teachers'));
    $scope.sorts = [
      {
        name: gettext('Login'),
        fx: function(x) {
          return x.login;
        }
      }, {
        name: gettext('First name'),
        fx: function(x) {
          return x.first_name;
        }
      }, {
        name: gettext('Last name'),
        fx: function(x) {
          return x.last_name;
        }
      }, {
        name: gettext('Birthday'),
        fx: function(x) {
          return x.birthday;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.paging = {
      page: 1,
      pageSize: 100
    };
    $scope.fields = {
      last_name: {
        visible: true,
        name: gettext('Last Name')
      },
      first_name: {
        visible: true,
        name: gettext('First Name')
      },
      birthday: {
        visible: true,
        name: gettext('Birthday')
      },
      password: {
        visible: false,
        name: gettext('Desired Password')
      },
      login: {
        visible: true,
        name: gettext('Login')
      }
    };
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.encoding = lmEncodingMap[resp.data.encoding_teachers] || 'ISO8859-1';
      return $http.get("/api/lm/users/teachers?encoding=" + $scope.encoding).then(function(resp) {
        return $scope.teachers = resp.data;
      });
    });
    $scope.add = function() {
      $scope.paging.page = Math.floor(($scope.teachers.length - 1) / $scope.paging.pageSize) + 1;
      return $scope.teachers.push({
        "class": 'Lehrer',
        _isNew: true
      });
    };
    $scope.remove = function(teacher) {
      return $scope.teachers.remove(teacher);
    };
    $scope.editCSV = function() {
      return lmFileEditor.show('/etc/sophomorix/user/lehrer.txt', $scope.encoding).then(function() {
        return $route.reload();
      });
    };
    $scope.save = function() {
      var i, len, ref, teacher;
      ref = $scope.teachers;
      for (i = 0, len = ref.length; i < len; i++) {
        teacher = ref[i];
        if (teacher.isNew) {
          delete teacher['isNew'];
        }
      }
      return $http.post("/api/lm/users/teachers?encoding=" + $scope.encoding, $scope.teachers).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveAndCheck = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_users:resources/partial/check.modal.html',
          controller: 'LMUsersCheckModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/sophomorix/user/lehrer.txt', $scope.encoding);
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/extra-students', {
      controller: 'LMUsersExtraStudentsController',
      templateUrl: '/lm_users:resources/partial/extra-students.html'
    });
  });

  angular.module('lm.users').controller('LMUsersExtraStudentsController', function($scope, $http, $uibModal, $route, gettext, notify, pageTitle, lmEncodingMap, lmFileEditor, lmFileBackups) {
    pageTitle.set(gettext('Extra Students'));
    $scope.sorts = [
      {
        name: gettext('Class'),
        fx: function(x) {
          return x["class"];
        }
      }, {
        name: gettext('First name'),
        fx: function(x) {
          return x.first_name;
        }
      }, {
        name: gettext('Last name'),
        fx: function(x) {
          return x.last_name;
        }
      }, {
        name: gettext('Birthday'),
        fx: function(x) {
          return x.birthday;
        }
      }, {
        name: gettext('Login'),
        fx: function(x) {
          return x.login;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.paging = {
      page: 1,
      pageSize: 100
    };
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.encoding = lmEncodingMap[resp.data.encoding_students_extra] || 'ISO8859-1';
      return $http.get("/api/lm/users/extra-students?encoding=" + $scope.encoding).then(function(resp) {
        return $scope.students = resp.data;
      });
    });
    $scope.add = function() {
      $scope.paging.page = Math.floor(($scope.students.length - 1) / $scope.paging.pageSize) + 1;
      return $scope.students.push({
        _isNew: true
      });
    };
    $scope.remove = function(student) {
      return $scope.students.remove(student);
    };
    $scope.editCSV = function() {
      return lmFileEditor.show('/etc/sophomorix/user/extraschueler.txt', $scope.encoding).then(function() {
        return $route.reload();
      });
    };
    $scope.save = function() {
      return $http.post("/api/lm/users/extra-students?encoding=" + $scope.encoding, $scope.students).then(function() {
        return notify.success('Saved');
      });
    };
    $scope.saveAndCheck = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_users:resources/partial/check.modal.html',
          controller: 'LMUsersCheckModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/sophomorix/user/extraschueler.txt', $scope.encoding);
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/extra-courses', {
      controller: 'LMUsersExtraCoursesController',
      templateUrl: '/lm_users:resources/partial/extra-courses.html'
    });
  });

  angular.module('lm.users').controller('LMUsersExtraCoursesController', function($scope, $http, $uibModal, $route, notify, gettext, pageTitle, lmEncodingMap, lmFileEditor, lmFileBackups) {
    pageTitle.set(gettext('Extra Courses'));
    $scope.sorts = [
      {
        name: gettext('Course'),
        fx: function(x) {
          return x.course;
        }
      }, {
        name: gettext('Base name'),
        fx: function(x) {
          return x.base_name;
        }
      }, {
        name: gettext('Birthday'),
        fx: function(x) {
          return x.birthday;
        }
      }, {
        name: gettext('Count'),
        fx: function(x) {
          return x.count;
        }
      }, {
        name: gettext('GECOS'),
        fx: function(x) {
          return x.gecos;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.paging = {
      page: 1,
      pageSize: 100
    };
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.encoding = lmEncodingMap[resp.data.encoding_courses_extra] || 'ISO8859-1';
      return $http.get("/api/lm/users/extra-courses?encoding=" + $scope.encoding).then(function(resp) {
        return $scope.courses = resp.data;
      });
    });
    $scope.add = function() {
      $scope.paging.page = Math.floor(($scope.courses.length - 1) / $scope.paging.pageSize) + 1;
      return $scope.courses.push({
        _isNew: true
      });
    };
    $scope.remove = function(course) {
      return $scope.courses.remove(course);
    };
    $scope.editCSV = function() {
      return lmFileEditor.show('/etc/sophomorix/user/extrakurse.txt', $scope.encoding).then(function() {
        return $route.reload();
      });
    };
    $scope.save = function() {
      return $http.post("/api/lm/users/extra-courses?encoding=" + $scope.encoding, $scope.courses).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveAndCheck = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_users:resources/partial/check.modal.html',
          controller: 'LMUsersCheckModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/sophomorix/user/extrakurse.txt', $scope.encoding);
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/teacher-passwords', {
      controller: 'LMUsersTeacherPasswordsController',
      templateUrl: '/lm_users:resources/partial/teacher-passwords.html'
    });
  });

  angular.module('lm.users').controller('LMUsersTeacherPasswordsController', function($scope, $http, $location, $route, $uibModal, gettext, notify, messagebox, pageTitle, lmFileEditor, lmEncodingMap) {
    pageTitle.set(gettext('Teacher Passwords'));
    $http.get('/api/lm/settings').then(function(resp) {
      $scope.encoding = lmEncodingMap[resp.data.encoding_teachers] || 'ISO8859-1';
      return $http.get("/api/lm/users/teachers?encoding=" + $scope.encoding).then(function(resp) {
        return $scope.teachers = resp.data;
      });
    });
    $scope.showInitialPassword = function(teachers) {
      var x;
      return $http.post('/api/lm/users/password', {
        users: (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = teachers.length; i < len; i++) {
            x = teachers[i];
            results.push(x.login);
          }
          return results;
        })(),
        action: 'get'
      }).then(function(resp) {
        return messagebox.show({
          title: gettext('Initial password'),
          text: resp.data,
          positive: 'OK'
        });
      });
    };
    $scope.setInitialPassword = function(teachers) {
      var x;
      return $http.post('/api/lm/users/password', {
        users: (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = teachers.length; i < len; i++) {
            x = teachers[i];
            results.push(x.login);
          }
          return results;
        })(),
        action: 'set-initial'
      }).then(function(resp) {
        return notify.success(gettext('Initial password set'));
      });
    };
    $scope.setRandomPassword = function(teachers) {
      var x;
      return $http.post('/api/lm/users/password', {
        users: (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = teachers.length; i < len; i++) {
            x = teachers[i];
            results.push(x.login);
          }
          return results;
        })(),
        action: 'set-random'
      }).then(function(resp) {
        var text, x;
        text = ((function() {
          var i, len, ref, results;
          ref = resp.data;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            x = ref[i];
            results.push(x.user + ": " + x.password);
          }
          return results;
        })()).join(',\n');
        return messagebox.show({
          title: gettext('New password'),
          text: text,
          positive: 'OK'
        });
      });
    };
    $scope.setCustomPassword = function(teachers) {
      return messagebox.prompt(gettext('New password')).then(function(msg) {
        var x;
        if (!msg.value) {
          return;
        }
        return $http.post('/api/lm/users/password', {
          users: (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = teachers.length; i < len; i++) {
              x = teachers[i];
              results.push(x.login);
            }
            return results;
          })(),
          action: 'set',
          password: msg.value
        }).then(function(resp) {
          return notify.success(gettext('New password set'));
        });
      });
    };
    $scope.haveSelection = function() {
      var i, len, ref, x;
      if ($scope.teachers) {
        ref = $scope.teachers;
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          if (x.selected) {
            return true;
          }
        }
      }
      return false;
    };
    $scope.batchSetInitialPassword = function() {
      var x;
      return $scope.setInitialPassword((function() {
        var i, len, ref, results;
        ref = $scope.teachers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          if (x.selected) {
            results.push(x);
          }
        }
        return results;
      })());
    };
    $scope.batchSetRandomPassword = function() {
      var x;
      return $scope.setRandomPassword((function() {
        var i, len, ref, results;
        ref = $scope.teachers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          if (x.selected) {
            results.push(x);
          }
        }
        return results;
      })());
    };
    $scope.batchSetCustomPassword = function() {
      var x;
      return $scope.setCustomPassword((function() {
        var i, len, ref, results;
        ref = $scope.teachers;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          if (x.selected) {
            results.push(x);
          }
        }
        return results;
      })());
    };
    return $scope.selectAll = function() {
      var i, len, ref, results, teacher;
      ref = $scope.teachers;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        teacher = ref[i];
        results.push(teacher.selected = true);
      }
      return results;
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/users/print-passwords', {
      controller: 'LMUsersPrintPasswordsController',
      templateUrl: '/lm_users:resources/partial/print-passwords.html'
    });
  });

  angular.module('lm.users').controller('LMUsersPrintPasswordsOptionsModalController', function($scope, $uibModalInstance, $http, messagebox, gettext, recentIndex, recents) {
    $scope.options = {
      format: 'pdf',
      one_per_page: false,
      recent: recentIndex
    };
    $scope.title = recentIndex !== null ? gettext("Recently added") + (": " + recents[recentIndex]) : gettext('All users');
    $scope.print = function() {
      var msg;
      msg = messagebox.show({
        progress: true
      });
      return $http.post('/api/lm/users/print', $scope.options).then(function(resp) {
        location.href = "/api/lm/users/print-download/" + (recentIndex !== null ? 'add' : 'all') + "." + ($scope.options.format === 'pdf' ? 'pdf' : 'csv');
        return $uibModalInstance.close();
      })["finally"](function() {
        return msg.close();
      });
    };
    return $scope.cancel = function() {
      return $uibModalInstance.dismiss();
    };
  });

  angular.module('lm.users').controller('LMUsersPrintPasswordsController', function($scope, $http, $location, $route, $uibModal, gettext, notify, messagebox, pageTitle, lmFileEditor) {
    pageTitle.set(gettext('Print Passwords'));
    $http.get('/api/lm/users/print').then(function(resp) {
      return $scope.recents = resp.data;
    });
    return $scope.select = function(recentIndex) {
      return $uibModal.open({
        templateUrl: '/lm_users:resources/partial/print-passwords.options.modal.html',
        controller: 'LMUsersPrintPasswordsOptionsModalController',
        resolve: {
          recentIndex: function() {
            return recentIndex;
          },
          recents: function() {
            return $scope.recents;
          }
        }
      });
    };
  });

}).call(this);

(function() {
  angular.module('lm.users').controller('LMUsersCheckResultsModalController', function($scope, $uibModalInstance, $uibModal, data) {
    $scope.data = data;
    $scope._ = {
      doAdd: data.add.length > 0,
      doMove: data.move.length > 0,
      doKill: data.kill.length > 0
    };
    $scope.apply = function() {
      var msg;
      $uibModalInstance.close();
      msg = $uibModal.open({
        templateUrl: '/lm_users:resources/partial/apply.modal.html',
        controller: 'LMUsersApplyModalController',
        backdrop: 'static',
        resolve: {
          params: function() {
            return $scope._;
          }
        }
      });
      return $uibModalInstance.close();
    };
    return $scope.cancel = function() {
      return $uibModalInstance.dismiss();
    };
  });

  angular.module('lm.users').controller('LMUsersApplyModalController', function($scope, $uibModalInstance, $http, $route, gettext, notify, params) {
    $scope.close = function() {
      return $uibModalInstance.close();
    };
    $scope.isWorking = true;
    return $http.post('/api/lm/users/apply', params).then(function(resp) {
      $scope.isWorking = false;
      notify.success(gettext('Changes applied'));
      return $route.reload();
    })["catch"](function(resp) {
      $scope.isWorking = false;
      return notify.error(gettext('Failed'), resp.data.message);
    });
  });

  angular.module('lm.users').controller('LMUsersCheckModalController', function($scope, $http, notify, $uibModalInstance, $uibModal, gettext) {
    $scope.isWorking = true;
    $http.get('/api/lm/users/check').then(function(resp) {
      $scope.showCheckResults(resp.data);
      return $uibModalInstance.close();
    })["catch"](function(resp) {
      $scope.isWorking = false;
      $scope.error = true;
      return notify.error(gettext('Check failed'), resp.data.message);
    });
    $scope.showCheckResults = function(data) {
      return $uibModal.open({
        templateUrl: '/lm_users:resources/partial/result.modal.html',
        controller: 'LMUsersCheckResultsModalController',
        resolve: {
          data: function() {
            return data;
          }
        }
      });
    };
    return $scope.close = function() {
      return $uibModalInstance.close();
    };
  });

}).call(this);
