// Generated by CoffeeScript 2.4.1
(function() {
  angular.module('lmn.groupmembership', ['core', 'lm.common']);

}).call(this);

// Generated by CoffeeScript 2.4.1
(function() {
  var isValidName,
    indexOf = [].indexOf;

  isValidName = function(name) {
    var regExp, validName;
    regExp = /^[a-z0-9]*$/;
    validName = regExp.test(name);
    return validName;
  };

  angular.module('lmn.groupmembership').config(function($routeProvider) {
    return $routeProvider.when('/view/lmn/groupmembership', {
      controller: 'LMNGroupMembershipController',
      templateUrl: '/lmn_groupmembership:resources/partial/index.html'
    });
  });

  angular.module('lmn.groupmembership').controller('LMNGroupDetailsController', function($scope, $route, $uibModal, $uibModalInstance, $http, gettext, notify, messagebox, pageTitle, groupType, groupName) {
    $scope.editGroupMembers = function(groupName, groupDetails, admins, members) {
      return $uibModal.open({
        templateUrl: '/lmn_groupmembership:resources/partial/editMembers.modal.html',
        controller: 'LMNGroupEditController',
        size: 'lg',
        resolve: {
          groupName: function() {
            return groupName;
          },
          groupDetails: function() {
            return groupDetails;
          },
          admins: function() {
            return admins;
          },
          members: function() {
            return members;
          }
        }
      }).result.then(function(result) {
        if (result.response === 'refresh') {
          return $scope.getGroupDetails([groupType, groupName]);
        }
      });
    };
    $scope.showAdminDetails = true;
    $scope.showMemberDetails = true;
    $scope.changeState = false;
    $scope.hidetext = gettext("Hide");
    $scope.showtext = gettext("Show");
    $scope.changeJoin = function(group, type) {
      var option;
      $scope.changeState = true;
      option = $scope.joinable ? '--join' : '--nojoin';
      return $http.post('/api/lmn/changeGroup', {
        option: option,
        group: group,
        type: type
      }).then(function(resp) {
        if (resp['data'][0] === 'ERROR') {
          notify.error(resp['data'][1]);
        }
        if (resp['data'][0] === 'LOG') {
          notify.success(gettext(resp['data'][1]));
        }
        return $scope.changeState = false;
      });
    };
    $scope.changeHide = function(group, type) {
      var option;
      $scope.changeState = true;
      option = $scope.hidden ? '--hide' : '--nohide';
      return $http.post('/api/lmn/changeGroup', {
        option: option,
        group: group,
        type: type
      }).then(function(resp) {
        if (resp['data'][0] === 'ERROR') {
          notify.error(resp['data'][1]);
        }
        if (resp['data'][0] === 'LOG') {
          notify.success(gettext(resp['data'][1]));
        }
        return $scope.changeState = false;
      });
    };
    $scope.killProject = function(project) {
      return messagebox.show({
        text: `Do you really want to delete '${project}'? This can't be undone!`,
        positive: 'Delete',
        negative: 'Cancel'
      }).then(function() {
        var msg;
        msg = messagebox.show({
          progress: true
        });
        return $http.post('/api/lmn/groupmembership', {
          action: 'kill-project',
          username: $scope.identity.user,
          project: project,
          profil: $scope.identity.profile
        }).then(function(resp) {
          if (resp['data'][0] === 'ERROR') {
            notify.error(resp['data'][1]);
          }
          if (resp['data'][0] === 'LOG') {
            notify.success(gettext(resp['data'][1]));
            return $uibModalInstance.close({
              response: 'refresh'
            });
          }
        }).finally(function() {
          return msg.close();
        });
      });
    };
    $scope.nevertext = gettext('Never');
    $scope.formatDate = function(date) {
      var day, hour, min, month, sec, year;
      if (date === "19700101000000.0Z") {
        return $scope.nevertext;
      } else if (date === void 0) {
        return "undefined";
      } else {
        // Sophomorix date format is yyyyMMddhhmmss.0Z
        year = date.slice(0, 4);
        month = +date.slice(4, 6) - 1; // Month start at 0
        day = date.slice(6, 8);
        hour = date.slice(8, 10);
        min = date.slice(10, 12);
        sec = date.slice(12, 14);
        return new Date(year, month, day, hour, min, sec);
      }
    };
    $scope.getGroupDetails = function(group) {
      groupType = group[0];
      groupName = group[1];
      return $http.post('/api/lmn/groupmembership/details', {
        action: 'get-specified',
        groupType: groupType,
        groupName: groupName
      }).then(function(resp) {
        var admin, i, len, member, name, ref, ref1;
        $scope.groupName = groupName;
        $scope.groupDetails = resp.data['GROUP'][groupName];
        $scope.adminList = resp.data['GROUP'][groupName]['sophomorixAdmins'];
        $scope.groupmemberlist = resp.data['GROUP'][groupName]['sophomorixMemberGroups'];
        $scope.groupadminlist = resp.data['GROUP'][groupName]['sophomorixAdminGroups'];
        $scope.members = [];
        ref = resp.data['MEMBERS'][groupName];
        for (name in ref) {
          member = ref[name];
          if (member.sn !== "null") { // group member 
            $scope.members.push({
              'sn': member.sn,
              'givenName': member.givenName,
              'login': member.sAMAccountName,
              'sophomorixAdminClass': member.sophomorixAdminClass
            });
          }
        }
        $scope.admins = [];
        ref1 = $scope.adminList;
        for (i = 0, len = ref1.length; i < len; i++) {
          admin = ref1[i];
          member = resp.data['MEMBERS'][groupName][admin];
          $scope.admins.push({
            'sn': member.sn,
            'givenName': member.givenName,
            'sophomorixAdminClass': member.sophomorixAdminClass
          });
        }
        $scope.joinable = resp.data['GROUP'][groupName]['sophomorixJoinable'] === 'TRUE';
        $scope.hidden = resp.data['GROUP'][groupName]['sophomorixHidden'] === 'TRUE';
        
        // Admin or admin of the project can edit members of a project
        // Only admins can change hide and join option for a class
        if ($scope.identity.isAdmin) {
          return $scope.editMembersButton = true;
        } else if ((groupType === "project") && ($scope.adminList.indexOf($scope.identity.user) !== -1 || $scope.groupadminlist.indexOf($scope.identity.profile.sophomorixAdminClass) !== -1)) {
          return $scope.editMembersButton = true;
        } else {
          return $scope.editMembersButton = false;
        }
      });
    };
    $scope.groupType = groupType;
    $scope.getGroupDetails([groupType, groupName]);
    return $scope.close = function() {
      return $uibModalInstance.dismiss();
    };
  });

  angular.module('lmn.groupmembership').controller('LMNGroupEditController', function($scope, $route, $uibModal, $uibModalInstance, $http, gettext, notify, messagebox, pageTitle, groupName, groupDetails, admins, members) {
    var groupDN;
    $scope.sorts = [
      {
        name: gettext('Given name'),
        id: 'givenName',
        fx: function(x) {
          return x.givenName;
        }
      },
      {
        name: gettext('Name'),
        id: 'sn',
        fx: function(x) {
          return x.sn;
        }
      }
    ];
    //{
    //name: gettext('Membership')
    //id: 'membership'
    //fx: (x) -> x.membership
    //}
    //{
    //    name: gettext('Class')
    //    fx: (x) -> x.sophomorixAdminClass
    //}
    $scope.sort = $scope.sorts[1];
    $scope.groupName = groupName;
    $scope.admins = admins;
    $scope.members = members;
    $scope.sortReverse = false;
    groupDN = groupDetails['DN'];
    $scope.filter_placeholder = gettext('Search for lastname, firstname or class');
    $scope.addgroupmembertext = gettext('Add/remove as member group');
    $scope.addgroupadmintext = gettext('Add/remove as admin group');
    $scope.admingroups = groupDetails['sophomorixAdminGroups'];
    $scope.membergroups = groupDetails['sophomorixMemberGroups'];
    $scope.expandAll = function() {
      var cl, i, len, ref, results;
      ref = $scope.classes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cl = ref[i];
        results.push(cl['isVisible'] = 1);
      }
      return results;
    };
    $scope.closeAll = function() {
      var cl, i, len, ref, results;
      ref = $scope.classes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cl = ref[i];
        results.push(cl['isVisible'] = 0);
      }
      return results;
    };
    $scope.checkInverse = function(sort, currentSort) {
      if (sort === currentSort) {
        return $scope.sortReverse = !$scope.sortReverse;
      } else {
        return $scope.sortReverse = false;
      }
    };
    $scope.updateAdminList = function(teacher) {
      var idx;
      idx = $scope.admins.indexOf(teacher.sAMAccountName);
      if (idx >= 0) {
        return $scope.admins.splice(idx, 1);
      } else {
        return $scope.admins.push(teacher.sAMAccountName);
      }
    };
    $scope.updateGroupAdminList = function(cl) {
      var admin, i, idx, len, newadmins, ref;
      idx = $scope.admingroups.indexOf(cl);
      if (idx >= 0) {
        return $scope.admingroups.splice(idx, 1);
      } else {
        $scope.admingroups.push(cl);
        // If group teachers, remove each teacher from adminlist
        if (cl === 'teachers') {
          newadmins = [];
          ref = $scope.admins;
          for (i = 0, len = ref.length; i < len; i++) {
            admin = ref[i];
            if (!(admin in $scope.teachersDict)) {
              newadmins.push(admin);
            }
          }
          return $scope.admins = newadmins;
        }
      }
    };
    $scope.updateGroupMemberList = function(cl) {
      var details, idx, ref, ref1, results, studentLogin, teacherLogin;
      idx = $scope.membergroups.indexOf(cl);
      if (idx >= 0) {
        return $scope.membergroups.splice(idx, 1);
      } else {
        $scope.membergroups.push(cl);
        ref = $scope.studentsDict;
        for (studentLogin in ref) {
          details = ref[studentLogin];
          if (details['sophomorixAdminClass'] === cl) {
            details['membership'] = false;
          }
        }
        if (cl === 'teachers') {
          ref1 = $scope.teachersDict;
          results = [];
          for (teacherLogin in ref1) {
            details = ref1[teacherLogin];
            results.push(details['membership'] = false);
          }
          return results;
        }
      }
    };
    $scope.setMembers = function(students, teachers) {
      var membersDict, msg;
      msg = messagebox.show({
        progress: true
      });
      membersDict = Object.assign(students, teachers);
      return $http.post('/api/lmn/groupmembership/details', {
        action: 'set-members',
        username: $scope.identity.user,
        members: membersDict,
        groupName: groupName,
        admins: $scope.admins,
        membergroups: $scope.membergroups,
        admingroups: $scope.admingroups
      }).then(function(resp) {
        if (resp['data'][0] === 'ERROR') {
          notify.error(resp['data'][1]);
        }
        if (resp['data'][0] === 'LOG') {
          notify.success(gettext(resp['data'][1]));
          return $uibModalInstance.close({
            response: 'refresh'
          });
        }
      //$scope.resetClass()
      }).finally(function() {
        return msg.close();
      });
    };
    $http.post('/api/lmn/groupmembership/details', {
      action: 'get-students',
      dn: groupDN
    }).then(function(resp) {
      $scope.students = resp.data[0];
      $scope.classes = resp.data[1];
      return $scope.studentsDict = resp.data[2];
    });
    //# TODO : add other project members ?
    $http.post('/api/lm/sophomorixUsers/teachers', {
      action: 'get-list'
    }).then(function(resp) {
      var i, len, ref, results, teacher;
      $scope.teachers = resp.data;
      $scope.teachersDict = {};
      ref = $scope.teachers;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        teacher = ref[i];
        teacher['membership'] = indexOf.call(teacher['memberOf'], groupDN) >= 0;
        results.push($scope.teachersDict[teacher['sAMAccountName']] = teacher);
      }
      return results;
    });
    $scope.close = function() {
      return $uibModalInstance.dismiss();
    };
    $scope.search = function(item) {
      if ($scope.query) {
        $scope.expandAll();
        return (item.sophomorixAdminClass.indexOf($scope.query) !== -1) || (item.sn.indexOf($scope.query) !== -1) || (item.givenName.indexOf($scope.query) !== -1);
      } else {
        return true;
      }
    };
    $scope.isMemberOn = false;
    $scope.toggleMember = function() {
      $scope.isMemberOn = !$scope.isMemberOn;
      if ($scope.isMemberOn) {
        return $scope.expandAll();
      } else {
        return $scope.closeAll();
      }
    };
    return $scope.isMember = function(item) {
      if ($scope.isMemberOn) {
        if ($scope.membergroups.indexOf(item.sophomorixAdminClass) >= 0) {
          return true;
        }
        if (item.sAMAccountName in $scope.teachersDict) {
          return $scope.teachersDict[item.sAMAccountName].membership;
        } else {
          return $scope.studentsDict[item.sAMAccountName].membership;
        }
      }
      return true;
    };
  });

  angular.module('lmn.groupmembership').controller('LMNGroupMembershipController', function($scope, $http, $uibModal, gettext, notify, pageTitle, messagebox) {
    pageTitle.set(gettext('Enrolle'));
    $scope.types = {
      schoolclass: {
        typename: gettext('Schoolclass'),
        name: gettext('Groupname'),
        checkbox: true,
        type: 'schoolclass'
      },
      printergroup: {
        typename: gettext('Printer'),
        checkbox: true,
        type: 'printergroup'
      },
      project: {
        typename: gettext('Projects'),
        checkbox: true,
        type: 'project'
      }
    };
    $scope.sorts = [
      {
        name: gettext('Groupname'),
        fx: function(x) {
          return x.groupname;
        }
      },
      {
        name: gettext('Membership'),
        fx: function(x) {
          return x.membership;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.sortReverse = false;
    $scope.paging = {
      page: 1,
      pageSize: 20
    };
    $scope.isActive = function(group) {
      if (group.type === 'printergroup') {
        if ($scope.types.printergroup.checkbox === true) {
          return true;
        }
      }
      if (group.type === 'schoolclass') {
        if ($scope.types.schoolclass.checkbox === true) {
          return true;
        }
      }
      if (group.type === 'project') {
        if ($scope.types.schoolclass.checkbox === true) {
          return true;
        }
      }
      return false;
    };
    $scope.checkInverse = function(sort, currentSort) {
      if (sort === currentSort) {
        return $scope.sortReverse = !$scope.sortReverse;
      } else {
        return $scope.sortReverse = false;
      }
    };
    $scope.resetClass = function() {
      var group, i, len, ref, result;
      // reset html class back (remove changed) so its not highlighted anymore
      result = document.getElementsByClassName("changed");
      while (result.length) {
        result[0].className = result[0].className.replace(/(?:^|\s)changed(?!\S)/g, '');
      }
      ref = $scope.groups;
      // reset $scope.group attribute back not not changed so an additional enroll will not set these groups again
      for (i = 0, len = ref.length; i < len; i++) {
        group = ref[i];
        group['changed'] = false;
      }
    };
    $scope.groupChanged = function(item) {
      var group, i, len, ref, results;
      ref = $scope.groups;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        group = ref[i];
        if (group['groupname'] === item) {
          results.push(group['changed'] = !group['changed']);
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    $scope.filterGroupType = function(val) {
      return function(dict) {
        return dict['type'] === val;
      };
    };
    $scope.getGroups = function(username) {
      return $http.post('/api/lmn/groupmembership', {
        action: 'list-groups',
        username: username,
        profil: $scope.identity.profile
      }).then(function(resp) {
        $scope.groups = resp.data[0];
        $scope.identity.isAdmin = resp.data[1];
        $scope.classes = $scope.groups.filter($scope.filterGroupType('schoolclass'));
        $scope.projects = $scope.groups.filter($scope.filterGroupType('project'));
        //# Printers yet DEPRECATED ?
        return $scope.printers = $scope.groups.filter($scope.filterGroupType('printergroup'));
      });
    };
    $scope.setGroups = function(groups) {
      return $http.post('/api/lmn/groupmembership', {
        action: 'set-groups',
        username: $scope.identity.user,
        groups: groups,
        profil: $scope.identity.profile
      }).then(function(resp) {
        if (resp['data'][0] === 'ERROR') {
          notify.error(resp['data'][1]);
        }
        if (resp['data'][0] === 'LOG') {
          notify.success(gettext(resp['data'][1]));
          $scope.resetClass();
        }
        if (resp.data === 0) {
          return notify.success(gettext("Nothing changed"));
        }
      });
    };
    $scope.createProject = function() {
      return messagebox.prompt(gettext('Project Name'), '').then(function(msg) {
        if (!msg.value) {
          return;
        }
        if (!isValidName(msg.value)) {
          notify.error(gettext('Not a valid name! Only lowercase alphanumeric characters are allowed!'));
          return;
        }
        return $http.post('/api/lmn/groupmembership', {
          action: 'create-project',
          username: $scope.identity.user,
          project: msg.value,
          profil: $scope.identity.profile
        }).then(function(resp) {
          notify.success(gettext('Project Created'));
          return $scope.getGroups($scope.identity.user);
        });
      });
    };
    $scope.showGroupDetails = function(index, groupType, groupName) {
      return $uibModal.open({
        templateUrl: '/lmn_groupmembership:resources/partial/groupDetails.modal.html',
        controller: 'LMNGroupDetailsController',
        size: 'lg',
        resolve: {
          groupType: function() {
            return groupType;
          },
          groupName: function() {
            return groupName;
          }
        }
      }).result.then(function(result) {
        if (result.response === 'refresh') {
          return $scope.getGroups($scope.identity.user);
        }
      });
    };
    $scope.projectIsJoinable = function(project) {
      return project['joinable'] === 'TRUE' || project.admin || $scope.identity.isAdmin || $scope.identity.profile.memberOf.indexOf(project['DN']) > -1;
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
      // $scope.identity.user = 'hulk'
      $scope.getGroups($scope.identity.user);
    });
  });

}).call(this);

