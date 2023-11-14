// Generated by CoffeeScript 2.5.1
(function() {
  angular.module('lmn.session_new', ['core', 'lmn.common']);

}).call(this);

'use strict';

angular.module('lmn.session_new').config(function ($routeProvider) {
    $routeProvider.when('/view/lmn/sessionsList', {
        templateUrl: '/lmn_session_new:resources/partial/sessionsList.html',
        controller: 'LMNSessionsListController'
    });

    $routeProvider.when('/view/lmn/session', {
        templateUrl: '/lmn_session_new:resources/partial/session.html',
        controller: 'LMNSessionController'
    });
});


'use strict';

angular.module('lmn.session_new').service('lmnSession', function ($http, $uibModal, $q, $location, $window, messagebox, validation, notify, gettext, identity) {
    var _this = this;

    this.sessions = [];
    this.user_missing_membership = [];

    this.load = function () {
        var promiseList = [];
        promiseList.push($http.get('/api/lmn/session/schoolclasses').then(function (resp) {
            _this.schoolclasses = resp.data;
        }));

        promiseList.push($http.get('/api/lmn/session/projects').then(function (resp) {
            _this.projects = resp.data;
        }));

        promiseList.push($http.get('/api/lmn/session/sessions').then(function (resp) {
            _this.sessions = resp.data;
        }));

        return $q.all(promiseList).then(function () {
            return [_this.schoolclasses, _this.projects, _this.sessions];
        });
    };

    this.filterExamUsers = function () {
        _this.extExamUsers = _this.current.members.filter(function (user) {
            return !['---', identity.user].includes(user.sophomorixExamMode[0]);
        });
        _this.examUsers = _this.current.members.filter(function (user) {
            return [identity.user].includes(user.sophomorixExamMode[0]);
        });
    };

    this._createWorkingDirectory = function (user) {
        return $http.post('/api/lmn/smbclient/createSessionWorkingDirectory', { 'user': user.cn }).catch(function (err) {
            // notify.error(err.data.message);
            if (user.sophomorixAdminClass == 'teachers') {
                user.files = 'ERROR-teacher';
            } else {
                user.files = 'ERROR';
                _this.user_missing_membership.push(user);
            }
        });
    };

    this.createWorkingDirectory = function (users) {
        _this.user_missing_membership = [];
        var promises = [];
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = users[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                user = _step.value;

                promises.push(_this._createWorkingDirectory(user));
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return $q.all(promises);
    };

    this.start = function (session) {
        _this.current = session;
        $http.post('/api/lmn/session/userinfo', { 'users': _this.current.members }).then(function (resp) {
            _this.current.members = resp.data;
            _this.current.generated = false;
            _this.current.type = 'group';
            _this.filterExamUsers();
            $location.path('/view/lmn/session');
        });
    };

    this.reset = function () {
        _this.current = {
            'sid': '',
            'name': '',
            'generated': false,
            'members': [],
            'type': ''
        };
    };

    this.reset();

    this.startGenerated = function (groupname, members, session_type) {
        generatedSession = {
            'sid': Date.now(),
            'name': groupname,
            'members': members,
            'generated': true,
            'type': session_type // May be room or schoolclass or project
        };
        _this.current = generatedSession;
        _this.filterExamUsers();
        $location.path('/view/lmn/session');
    };

    this.getExamUsers = function () {
        users = _this.current.members.map(function (user) {
            return user.cn;
        });
        $http.post('/api/lmn/session/exam/userinfo', { 'users': users }).then(function (resp) {
            _this.current.members = resp.data;
            _this.createWorkingDirectory(_this.current.members);
            _this.filterExamUsers();
            $location.path('/view/lmn/session');
        });
    };

    this.refreshUsers = function () {
        users = _this.current.members.map(function (user) {
            return user.cn;
        });
        return $http.post('/api/lmn/session/userinfo', { 'users': users }).then(function (resp) {
            _this.current.members = resp.data;
            _this.filterExamUsers();
            $location.path('/view/lmn/session');
        });
    };

    this.new = function () {
        var members = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        return messagebox.prompt(gettext('Session Name'), '').then(function (msg) {
            if (!msg.value) {
                return;
            }

            testChar = validation.isValidLinboConf(msg.value);
            if (testChar != true) {
                notify.error(gettext(testChar));
                return;
            }

            return $http.put('/api/lmn/session/sessions/' + msg.value, { members: members }).then(function (resp) {
                notify.success(gettext('Session Created'));
            });
        });
    };

    this.rename = function (sessionID, comment) {
        if (!sessionID) {
            messagebox.show({ title: gettext('No Session selected'), text: gettext('You have to select a session first.'), positive: 'OK' });
            return;
        }

        return messagebox.prompt(gettext('Session Name'), comment).then(function (msg) {
            if (!msg.value) {
                return;
            }

            testChar = validation.isValidLinboConf(msg.value);
            if (testChar != true) {
                notify.error(gettext(testChar));
                return;
            }
            return $http.post('/api/lmn/session/sessions', { action: 'rename-session', session: sessionID, comment: msg.value }).then(function (resp) {
                notify.success(gettext('Session renamed'));
                return msg.value;
            });
        });
    };

    this.kill = function (sessionID, comment) {
        if (!sessionID) {
            messagebox.show({ title: gettext('No session selected'), text: gettext('You have to select a session first.'), positive: 'OK' });
            return;
        }

        return messagebox.show({ text: gettext('Delete Session: ' + comment + ' ?'), positive: gettext('Delete'), negative: gettext('Cancel') }).then(function () {
            return $http.delete('/api/lmn/session/sessions/' + sessionID).then(function (resp) {
                notify.success(gettext(resp.data));
            });
        });
    };

    return this;
});


// Generated by CoffeeScript 2.5.1
(function() {
  angular.module('lmn.session_new').controller('LMNSessionController', function($scope, $http, $location, $route, $uibModal, $window, $q, $interval, gettext, notify, messagebox, pageTitle, lmFileEditor, lmEncodingMap, filesystem, validation, identity, $rootScope, wait, userPassword, lmnSession, smbclient) {
    var title;
    $scope.stateChanged = false;
    $scope.sessionChanged = false;
    $scope.addParticipant = '';
    $scope.addSchoolClass = '';
    $scope.examMode = false;
    $scope.file_icon = {
      'powerpoint': "far fa-file-powerpoint",
      'text': "far fa-file-alt",
      'code': "far fa-file-code",
      'word': "far fa-file-word",
      'pdf': "far fa-file-pdf",
      'excel': "far fa-file-excel",
      'audio': "far fa-file-audio",
      'archive': "far fa-file-archive",
      'video': "far fa-file-video",
      'image': "far fa-file-image",
      'file': "far fa-file"
    };
    $scope.management = {
      'wifi': false,
      'internet': false,
      'printing': false
    };
    $window.onbeforeunload = function(event) {
      if (!$scope.sessionChanged) {
        return;
      }
      // Confirm before page reload
      return "Eventually not refreshing";
    };
    $scope.$on("$destroy", function() {
      // Avoid confirmation on others controllers
      $scope.stopRefreshFiles();
      $scope.stopRefreshParticipants();
      return $window.onbeforeunload = void 0;
    });
    $scope.$on("$locationChangeStart", function(event) {
      // TODO : handle logout if session is changed
      if ($scope.sessionChanged) {
        if (!confirm(gettext('Do you really want to quit this session ? You can restart it later if you want.'))) {
          event.preventDefault();
          return;
        }
      }
      return $window.onbeforeunload = void 0;
    });
    $scope.translation = {
      addStudent: gettext('Add Student'),
      addClass: gettext('Add Class')
    };
    $scope.sorts = [
      {
        name: gettext('Lastname'),
        fx: function(x) {
          return x.sn + ' ' + x.givenName;
        }
      },
      {
        name: gettext('Login name'),
        fx: function(x) {
          return x.sAMAccountName;
        }
      },
      {
        name: gettext('Firstname'),
        fx: function(x) {
          return x.givenName;
        }
      },
      {
        name: gettext('Email'),
        fx: function(x) {
          return x.mail;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.backToSessionList = function() {
      return $location.path('/view/lmn/sessionsList');
    };
    $scope.session = lmnSession.current;
    $scope.extExamUsers = lmnSession.extExamUsers;
    $scope.examUsers = lmnSession.examUsers;
    lmnSession.createWorkingDirectory($scope.session.members).then(function() {
      $scope.missing_schoolclasses = lmnSession.user_missing_membership.map(function(user) {
        return user.sophomorixAdminClass;
      });
      return $scope.missing_schoolclasses = [...new Set($scope.missing_schoolclasses)].join(',');
    });
    $scope.refreshUsers = function() {
      return lmnSession.refreshUsers().then(function() {
        $scope.extExamUsers = lmnSession.extExamUsers;
        return $scope.examUsers = lmnSession.examUsers;
      });
    };
    if ($scope.session.type === 'schoolclass') {
      title = " > " + gettext("Schoolclass") + ` ${$scope.session.name}`;
    } else if ($scope.session.type === 'room') {
      title = " > " + gettext("Room") + ` ${$scope.session.name}`;
    } else {
      title = " > " + gettext("Group") + ` ${$scope.session.name}`;
    }
    pageTitle.set(gettext('Session') + title);
    // Nothing defined, going back to session list
    if ($scope.session.sid === '') {
      $scope.backToSessionList();
    }
    $scope.isStudent = function(user) {
      return ['student', 'examuser'].indexOf(user.sophomorixRole) > -1;
    };
    // Fix missing membership for share
    $scope.fixMembership = function(group) {
      return $http.post('/api/lmn/groupmembership/membership', {
        action: 'addadmins',
        entity: $scope.identity.user,
        groupname: $scope.missing_schoolclasses,
        type: 'class'
      }).then(function(resp) {
        if (resp['data'][0] === 'ERROR') {
          notify.error(resp['data'][1]);
        }
        if (resp['data'][0] === 'LOG') {
          notify.success(gettext(resp['data'][1]));
          $rootScope.identity = identity;
          return $scope.refresh_krbcc();
        }
      });
    };
    $scope.refresh_krbcc = function() {
      return smbclient.refresh_krbcc().then(function() {
        var i, len, position, ref, user;
        ref = lmnSession.user_missing_membership;
        for (i = 0, len = ref.length; i < len; i++) {
          user = ref[i];
          position = $scope.session.members.indexOf(user);
          $scope.session.members[position].files = [];
          lmnSession._createWorkingDirectory(user);
        }
        return identity.init().then(function() {
          console.log("Identity renewed !");
          return $scope.missing_schoolclasses = [];
        });
      });
    };
    // Refresh room users
    $scope.updateParticipants = function() {
      return $http.get('/api/lmn/session/userInRoom').then(function(resp) {
        if (resp.data.usersList.length !== 0) {
          return $http.post("/api/lmn/session/userinfo", {
            users: resp.data.usersList
          }).then(function(rp) {
            return $scope.session.members = rp.data;
          });
        }
      });
    };
    $scope.stopRefreshParticipants = function() {
      if ($scope.refresh_participants !== void 0) {
        $interval.cancel($scope.refresh_participants);
      }
      return $scope.autorefresh_participants = false;
    };
    $scope.startRefreshParticipants = function() {
      $scope.updateParticipants();
      $scope.refresh_participants = $interval($scope.updateParticipants, 5000, 0);
      return $scope.autorefresh_participants = true;
    };
    if ($scope.session.type === 'room') {
      $scope.startRefreshParticipants();
    }
    // List working directory files
    $scope.get_file_icon = function(filetype) {
      return $scope.file_icon[filetype];
    };
    $scope._updateFileList = function(participant) {
      var path;
      if (participant.files !== 'ERROR' && participant.files !== 'ERROR-teacher') {
        path = `${participant.homeDirectory}\\transfer\\${$scope.identity.user}\\_collect`;
        return smbclient.list(path).then(function(data) {
          return participant.files = data.items;
        });
      }
    };
    $scope.updateFileList = function() {
      var i, len, participant, ref, results;
      ref = $scope.session.members;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        participant = ref[i];
        results.push($scope._updateFileList(participant));
      }
      return results;
    };
    $scope.stopRefreshFiles = function() {
      if ($scope.refresh_files !== void 0) {
        $interval.cancel($scope.refresh_files);
      }
      return $scope.autorefresh_files = false;
    };
    $scope.startRefreshFiles = function() {
      $scope.updateFileList();
      $scope.refresh_files = $interval($scope.updateFileList, 5000, 0);
      return $scope.autorefresh_files = true;
    };
    // Management groups
    $scope.setManagementGroup = function(group, participant) {
      var user;
      $scope.stateChanged = true;
      if (participant[group] === true) {
        group = `no${group}`;
      }
      user = [participant.sAMAccountName];
      return $http.post('/api/lmn/managementgroup', {
        group: group,
        users: user
      }).then(function(resp) {
        notify.success(`Group ${group} changed for ${user[0]}`);
        return $scope.stateChanged = false;
      });
    };
    $scope.setManagementGroupAll = function(group) {
      var i, len, participant, ref, usersList;
      $scope.stateChanged = true;
      usersList = [];
      $scope.management[group] = !$scope.management[group];
      ref = $scope.session.members;
      for (i = 0, len = ref.length; i < len; i++) {
        participant = ref[i];
        // Only change management group for student, and not others teachers
        if (participant.sophomorixRole === 'student') {
          participant[group] = $scope.management[group];
          usersList.push(participant.sAMAccountName);
        }
      }
      if ($scope.management[group] === false) {
        group = `no${group}`;
      }
      return $http.post('/api/lmn/managementgroup', {
        group: group,
        users: usersList
      }).then(function(resp) {
        notify.success(`Group ${group} changed for ${usersList.join()}`);
        return $scope.stateChanged = false;
      });
    };
    // Manage session
    $scope.renameSession = function() {
      return lmnSession.rename($scope.session.sid, $scope.session.name).then(function(resp) {
        return $scope.session.name = resp;
      });
    };
    $scope.killSession = function() {
      return lmnSession.kill($scope.session.sid, $scope.session.name).then(function() {
        return $scope.backToSessionList();
      });
    };
    $scope.saveAsSession = function() {
      return lmnSession.new($scope.session.members).then(function() {
        $scope.sessionChanged = false;
        // TODO : would be better to get the session id and simply set the current session
        // instead of going back to the sessions list
        // But for this sophomorix needs to return the session id when creating a new one
        return $scope.backToSessionList();
      });
    };
    $scope.findUsers = function(q) {
      return $http.get(`/api/lmn/session/user-search/${q}`).then(function(resp) {
        return resp.data;
      });
    };
    $scope.findSchoolClasses = function(q) {
      return $http.get(`/api/lmn/session/schoolClass-search/${q}`).then(function(resp) {
        return resp.data;
      });
    };
    $scope.$watch('addParticipant', function() {
      if ($scope.addParticipant) {
        return $http.post('/api/lmn/session/userinfo', {
          'users': [$scope.addParticipant.sAMAccountName]
        }).then(function(resp) {
          var new_participant;
          new_participant = resp.data[0];
          $scope.addParticipant = '';
          if (!$scope.session.generated) {
            // Real session: must be added in LDAP
            $http.post('/api/lmn/session/participants', {
              'users': [new_participant.sAMAccountName],
              'session': $scope.session.sid
            });
          } else {
            $scope.sessionChanged = true;
          }
          $scope.session.members.push(new_participant);
          return $scope.refreshUsers();
        });
      }
    });
    $scope.$watch('addSchoolClass', function() {
      var members;
      if ($scope.addSchoolClass) {
        members = $scope.addSchoolClass.sophomorixMembers;
        return $http.post('/api/lmn/session/userinfo', {
          'users': members
        }).then(function(resp) {
          var new_participants;
          new_participants = resp.data;
          $scope.addSchoolClass = '';
          if (!$scope.session.generated) {
            // Real session: must be added in LDAP
            $http.post('/api/lmn/session/participants', {
              'users': members,
              'session': $scope.session.sid
            });
          } else {
            $scope.sessionChanged = true;
          }
          $scope.session.members = $scope.session.members.concat(new_participants);
          return $scope.refreshUsers();
        });
      }
    });
    $scope.removeParticipant = function(participant) {
      var deleteIndex;
      deleteIndex = $scope.session.members.indexOf(participant);
      if (deleteIndex !== -1) {
        if ($scope.session.generated) {
          // Not a real session, just removing from participants list displayed
          $scope.session.members.splice(deleteIndex, 1);
          return $scope.sessionChanged = true;
        } else {
          return $http.patch('/api/lmn/session/participants', {
            'users': [participant.sAMAccountName],
            'session': $scope.session.sid
          }).then(function() {
            return $scope.session.members.splice(deleteIndex, 1);
          });
        }
      }
    };
    // Exam mode
    $scope.startExam = function() {
      // End exam for a whole group
      $scope.stateChanged = true;
      return $http.patch("/api/lmn/session/exam/start", {
        session: $scope.session
      }).then(function(resp) {
        $scope.examMode = true;
        $scope.stateChanged = false;
        lmnSession.getExamUsers();
        return $scope.stopRefreshFiles();
      });
    };
    $scope.stopExam = function() {
      // End exam for a whole group
      $scope.stateChanged = true;
      return messagebox.show({
        text: gettext('Do you really want to end the current exam?'),
        positive: gettext('End exam mode'),
        negative: gettext('Cancel')
      }).then(function() {
        $http.patch("/api/lmn/session/exam/stop", {
          session: $scope.session
        }).then(function(resp) {
          $scope.refreshUsers();
          $scope.examMode = false;
          return $scope.stateChanged = false;
        });
        return $scope.stopRefreshFiles();
      });
    };
    $scope._stopUserExam = function(user) {
      var uniqSession;
      // End exam for a specific user: backend promise without messagebox
      uniqSession = {
        'members': [user],
        'name': `${user.sophomorixAdminClass}_${user.sAMAccountName}_ENDED_FROM_${identity.user}`,
        'type': ''
      };
      return $http.patch("/api/lmn/session/exam/stop", {
        session: uniqSession
      });
    };
    $scope.stopUserExam = function(user) {
      var exam_student, exam_teacher;
      // End exam for a specific user
      exam_teacher = user.sophomorixExamMode[0];
      exam_student = user.displayName;
      return messagebox.show({
        text: gettext('Do you really want to remove ' + exam_student + ' from the exam of ' + exam_teacher + '?'),
        positive: gettext('End exam mode'),
        negative: gettext('Cancel')
      }).then(function() {
        return $scope._stopUserExam(user).then(function() {
          $scope.refreshUsers();
          return notify.success(gettext('Exam mode stopped for user ') + exam_student);
        });
      });
    };
    $scope.stopRunningExams = function() {
      // End all running extern exams (run by other teachers)
      return messagebox.show({
        text: gettext('Do you really want to end all running exams?'),
        positive: gettext('End exam mode'),
        negative: gettext('Cancel')
      }).then(function() {
        var i, j, len, len1, promises, ref, ref1, user;
        promises = [];
        ref = $scope.extExamUsers;
        for (i = 0, len = ref.length; i < len; i++) {
          user = ref[i];
          promises.push($scope._stopUserExam(user));
        }
        ref1 = $scope.examUsers;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          user = ref1[j];
          promises.push($scope._stopUserExam(user));
        }
        return $q.all(promises).then(function() {
          $scope.refreshUsers();
          return notify.success(gettext('Exam mode stopped for all users.'));
        });
      });
    };
    $scope._checkExamUser = function(username) {
      if (username.endsWith('-exam')) {
        messagebox.show({
          title: gettext('User in exam'),
          text: gettext('This user seems to be in exam. End exam mode before changing password!'),
          positive: 'OK'
        });
        return true;
      }
      return false;
    };
    // Passwords
    $scope.showFirstPassword = function(username) {
      $scope.blurred = true;
      // if user is exam user show InitialPassword of real user
      username = username.replace('-exam', '');
      return userPassword.showFirstPassword(username).then(function(resp) {
        return $scope.blurred = false;
      });
    };
    $scope.resetFirstPassword = function(username) {
      if (!$scope._checkExamUser(username)) {
        return userPassword.resetFirstPassword(username);
      }
    };
    $scope.setRandomFirstPassword = function(username) {
      if (!$scope._checkExamUser(username)) {
        return userPassword.setRandomFirstPassword(username);
      }
    };
    $scope.setCustomPassword = function(user, pwtype) {
      if (!$scope._checkExamUser(user.sAMAccountName)) {
        return userPassword.setCustomPassword(user, pwtype);
      }
    };
    $scope.choose_items = function(path, command) {
      return $uibModal.open({
        templateUrl: '/lmn_session_new:resources/partial/selectFile.modal.html',
        controller: 'LMNSessionFileSelectModalController',
        scope: $scope,
        resolve: {
          action: function() {
            return command;
          },
          path: function() {
            return path;
          }
        }
      }).result;
    };
    $scope._share = function(participant, items) {
      var i, item, len, notify_success, promises, share_path;
      share_path = `${participant.homeDirectory}\\transfer\\${identity.profile.sAMAccountName}`;
      promises = [];
      for (i = 0, len = items.length; i < len; i++) {
        item = items[i];
        promises.push(smbclient.copy(item.path, share_path + '/' + item.name, notify_success = false));
      }
      return $q.all(promises).then(function() {
        return notify.success(gettext("Files shared!"));
      });
    };
    $scope.shareUser = function(participant) {
      var choose_path;
      // participants is an array containing one or all participants
      choose_path = `${identity.profile.homeDirectory}\\transfer`;
      return $scope.choose_items(choose_path, 'share').then(function(result) {
        if (result.response === 'accept') {
          return $scope._share(participant, result.items);
        }
      });
    };
    $scope.shareAll = function() {
      var choose_path;
      choose_path = `${identity.profile.homeDirectory}\\transfer`;
      return $scope.choose_items(choose_path, 'share').then(function(result) {
        var i, len, participant, ref, results;
        if (result.response === 'accept') {
          ref = $scope.session.members;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            participant = ref[i];
            results.push($scope._share(participant, result.items));
          }
          return results;
        }
      });
    };
    $scope._leading_zero = function(int) {
      if (`${int}`.length === 1) {
        return `0${int}`;
      }
      return int;
    };
    $scope.now = function() {
      var date, day, hours, minutes, month, seconds, year;
      // Formating date for collect directory
      date = new Date();
      year = date.getFullYear();
      month = $scope._leading_zero(date.getMonth() + 1);
      day = $scope._leading_zero(date.getDate());
      hours = $scope._leading_zero(date.getHours());
      minutes = $scope._leading_zero(date.getMinutes());
      seconds = $scope._leading_zero(date.getSeconds());
      return `${year}${month}${day}-${hours}${minutes}${seconds}`;
    };
    $scope._collect = function(command, items, collect_path) {
      var i, item, j, len, len1, notify_success, promises;
      promises = [];
      if (command === 'copy') {
        for (i = 0, len = items.length; i < len; i++) {
          item = items[i];
          promises.push(smbclient.copy(item.path, collect_path + '/' + item.name, notify_success = false));
        }
      }
      if (command === 'move') {
        for (j = 0, len1 = items.length; j < len1; j++) {
          item = items[j];
          promises.push(smbclient.move(item.path, collect_path + '/' + item.name, notify_success = false));
        }
      }
      return $q.all(promises);
    };
    $scope.collectAll = function(command) {
      var collect_path, dst, i, items, len, now, participant, promises, ref, transfer_directory;
      // command is copy or move
      promises = [];
      now = $scope.now();
      transfer_directory = `${$scope.session.type}_${$scope.session.name}_${now}`;
      collect_path = `${identity.profile.homeDirectory}\\transfer\\${transfer_directory}`;
      smbclient.createDirectory(collect_path);
      promises = [];
      ref = $scope.session.members;
      for (i = 0, len = ref.length; i < len; i++) {
        participant = ref[i];
        dst = `${collect_path}\\${participant.sAMAccountName}`;
        items = [
          {
            "path": `${participant.homeDirectory}\\transfer\\${$scope.identity.user}\\_collect`,
            "name": ""
          }
        ];
        promises.push($scope._collect(command, items, dst));
      }
      return $q.all(promises).then(function() {
        // _collect directory was moved, so recreating empty working diretories for all
        lmnSession.createWorkingDirectory($scope.session.members).then(function() {
          return $scope.missing_schoolclasses = lmnSession.user_missing_membership.map(function(user) {
            return user.sophomorixAdminClass;
          }).join(',');
        });
        return notify.success(gettext("Files collected!"));
      });
    };
    return $scope.collectUser = function(command, participant) {
      var choose_path, collect_path, now, transfer_directory;
      // participant is only one user
      // command is copy or move
      now = $scope.now();
      transfer_directory = `${$scope.session.type}_${$scope.session.name}_${now}`;
      collect_path = `${identity.profile.homeDirectory}\\transfer\\${transfer_directory}\\${participant.sAMAccountName}`;
      smbclient.createDirectory(collect_path);
      choose_path = `${participant.homeDirectory}\\transfer\\${$scope.identity.user}\\_collect`;
      return $scope.choose_items(choose_path, command).then(function(result) {
        if (result.response === 'accept') {
          return $scope._collect(command, result.items, collect_path).then(function() {
            return notify.success(gettext("Files collected!"));
          });
        }
      });
    };
  });

  angular.module('lmn.session_new').controller('LMNSessionFileSelectModalController', function($scope, $uibModalInstance, gettext, notify, $http, action, path, messagebox, smbclient) {
    $scope.action = action; // copy, move or share
    $scope.init_path = path;
    $scope.current_path = path;
    $scope.parent_path = [];
    $scope.toggleAllStatus = false;
    $scope.count_selected = 0;
    $scope.uploadProgress = [];
    $scope.load_path = function(path) {
      return smbclient.list(path).then(function(data) {
        $scope.items = data.items;
        $scope.parent_path.push($scope.current_path);
        return $scope.current_path = path;
      });
    };
    $scope.toggleAll = function() {
      var i, item, len, ref, results;
      ref = $scope.items;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        results.push(item.selected = !item.selected);
      }
      return results;
    };
    $scope.refreshSelected = function() {
      return $scope.count_selected = $scope.items.filter(function(item) {
        return item.selected === true;
      }).length;
    };
    $scope.back = function() {
      path = $scope.parent_path.at(-1);
      return smbclient.list(path).then(function(data) {
        $scope.items = data.items;
        $scope.current_path = path;
        return $scope.parent_path.pop();
      });
    };
    $scope.load_path($scope.init_path);
    $scope.save = function() {
      var i, item, itemsToTrans, len, ref;
      itemsToTrans = [];
      ref = $scope.items;
      for (i = 0, len = ref.length; i < len; i++) {
        item = ref[i];
        if (item['selected']) {
          itemsToTrans.push(item);
        }
      }
      if (itemsToTrans.length === 0) {
        notify.info(gettext('Please select at least one file!'));
        return;
      }
      return $uibModalInstance.close({
        response: 'accept',
        items: itemsToTrans
      });
    };
    $scope.close = function() {
      return $uibModalInstance.dismiss();
    };
    $scope.create_dir = function(path) {
      return messagebox.prompt(gettext('Directory name :'), '').then(function(msg) {
        var new_path;
        new_path = $scope.current_path + '/' + msg.value;
        return smbclient.createDirectory(new_path).then(function(data) {
          notify.success(new_path + gettext(' created '));
          return $scope.load_path($scope.current_path);
        }).catch(function(resp) {
          return notify.error(gettext('Error during creating: '), resp.data.message);
        });
      });
    };
    $scope.delete_file = function(path) {
      return messagebox.show({
        text: gettext('Are you sure you want to delete permanently the file ' + path + '?'),
        positive: gettext('Delete'),
        negative: gettext('Cancel')
      }).then(function() {
        return smbclient.delete_file(path).then(function(data) {
          notify.success(path + gettext(' deleted !'));
          return $scope.load_path($scope.current_path);
        }).catch(function(resp) {
          return notify.error(gettext('Error during deleting : '), resp.data.message);
        });
      });
    };
    $scope.delete_dir = function(path) {
      return messagebox.show({
        text: gettext('Are you sure you want to delete permanently the directory ' + path + '?'),
        positive: gettext('Delete'),
        negative: gettext('Cancel')
      }).then(function() {
        return smbclient.delete_dir(path).then(function(data) {
          notify.success(path + gettext(' deleted !'));
          return $scope.load_path($scope.current_path);
        }).catch(function(resp) {
          return notify.error(gettext('Error during deleting : '), resp.data.message);
        });
      });
    };
    $scope.rename = function(item) {
      var old_path;
      old_path = item.path;
      return messagebox.prompt(gettext('New name :'), item.name).then(function(msg) {
        var new_path;
        new_path = $scope.current_path + '/' + msg.value;
        return smbclient.move(old_path, new_path).then(function(data) {
          notify.success(old_path + gettext(' renamed to ') + new_path);
          return $scope.load_path($scope.current_path);
        }).catch(function(resp) {
          return notify.error(gettext('Error during renaming: '), resp.data.message);
        });
      });
    };
    $scope.areUploadsFinished = function() {
      var globalProgress, i, len, numUploads, p, ref;
      numUploads = $scope.uploadProgress.length;
      if (numUploads === 0) {
        return true;
      }
      globalProgress = 0;
      ref = $scope.uploadProgress;
      for (i = 0, len = ref.length; i < len; i++) {
        p = ref[i];
        globalProgress += p.progress;
      }
      return numUploads * 100 === globalProgress;
    };
    return $scope.sambaSharesUploadBegin = function($flow) {
      var file, i, len, ref;
      $scope.uploadProgress = [];
      $scope.uploadFiles = [];
      ref = $flow.files;
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        $scope.uploadFiles.push(file.name);
      }
      $scope.files_list = $scope.uploadFiles.join(', ');
      return smbclient.startFlowUpload($flow, $scope.current_path).then(function(resp) {
        notify.success(gettext('Uploaded ') + $scope.files_list);
        return $scope.load_path($scope.current_path);
      }, null, function(progress) {
        return $scope.uploadProgress = progress.sort(function(a, b) {
          return a.name > b.name;
        });
      });
    };
  });

}).call(this);

// Generated by CoffeeScript 2.5.1
(function() {
  angular.module('lmn.session_new').controller('LMNSessionsListController', function($scope, $http, $location, $route, $uibModal, gettext, notify, messagebox, pageTitle, lmFileEditor, lmEncodingMap, filesystem, validation, $rootScope, wait, lmnSession) {
    pageTitle.set(gettext('Sessions list'));
    $scope.startSchoolclassSessionMouseover = gettext('Start this session with all student in this schoolclass');
    $scope.generateRoomSessionMouseover = gettext('Start session containing all users in this room');
    $scope.loading = true;
    $http.get('/api/lmn/session/userInRoom').then(function(resp) {
      $scope.room = resp.data;
      return $scope.loading = false;
    });
    $scope.renameSession = function(session, e) {
      e.stopPropagation();
      return lmnSession.rename(session.sid, session.name).then(function(resp) {
        return session.name = resp;
      });
    };
    $scope.killSession = function(session, e) {
      e.stopPropagation();
      return lmnSession.kill(session.sid, session.name).then(function() {
        var position;
        position = $scope.sessions.indexOf(session);
        return $scope.sessions.splice(position, 1);
      });
    };
    $scope.newSession = function() {
      return lmnSession.new().then(function() {
        return $scope.getSessions();
      });
    };
    $scope.getSessions = function() {
      return lmnSession.load().then(function(resp) {
        $scope.schoolclasses = resp[0];
        $scope.projects = resp[1];
        return $scope.sessions = resp[2];
      });
    };
    $scope.start = function(session) {
      lmnSession.reset();
      return lmnSession.start(session);
    };
    $scope.startGenerated = function(group) {
      lmnSession.reset();
      if (group === 'this_room') {
        return $http.post("/api/lmn/session/userinfo", {
          users: $scope.room.usersList
        }).then(function(resp) {
          return lmnSession.startGenerated($scope.room.name, resp.data, 'room');
        });
      } else {
        // get participants from specified class or project
        return $http.post("/api/lmn/session/userinfo", {
          users: group.members
        }).then(function(resp) {
          return lmnSession.startGenerated(group.name, resp.data, group.type);
        });
      }
    };
    return $scope.$watch('identity.user', function() {
      if ($scope.identity.user === void 0) {
        return;
      }
      if ($scope.identity.user === null) {
        return;
      }
      if ($scope.identity.user === 'root') {
        return;
      }
      return $scope.getSessions();
    });
  });

}).call(this);

