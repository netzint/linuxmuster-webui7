// Generated by CoffeeScript 2.3.1
(function() {
  angular.module('lm.devices', ['core', 'lm.common']);

}).call(this);

// Generated by CoffeeScript 2.3.1
(function() {
  angular.module('lm.devices').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/devices', {
      controller: 'LMDevicesController',
      templateUrl: '/lmn_devices:resources/partial/index.html'
    });
  });

  angular.module('lm.devices').controller('LMDevicesApplyModalController', function($scope, $http, $uibModalInstance, gettext, notify) {
    $scope.logVisible = true;
    $scope.isWorking = true;
    $scope.showLog = function() {
      return $scope.logVisible = !$scope.logVisible;
    };
    $http.get('/api/lm/devices/import').then(function(resp) {
      $scope.isWorking = false;
      return notify.success(gettext('Import complete'));
    }).catch(function(resp) {
      notify.error(gettext('Import failed'), resp.data.message);
      $scope.isWorking = false;
      return $scope.showLog();
    });
    return $scope.close = function() {
      return $uibModalInstance.close();
    };
  });

  angular.module('lm.devices').controller('LMDevicesController', function($scope, $http, $uibModal, $route, gettext, notify, pageTitle, lmFileEditor, lmFileBackups) {
    pageTitle.set(gettext('Devices'));
    $scope.first_save = false;
    $scope.validateField = function(name, val, isnew) {
      var valid;
      if (name) {
        valid = $scope["isValid" + name](val) && val;
      } else {
        valid = val;
      }
      if (valid) {
        return "";
      }
      if (isnew && !$scope.first_save) {
        return "has-error-new";
      } else {
        return "has-error";
      }
    };
    $scope.findval = function(attr, val) {
      return function(dict) {
        return dict[attr] === val;
      };
    };
    $scope.isValidMac = function(mac) {
      var regExp, validMac;
      regExp = /^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/;
      validMac = regExp.test(mac) && ($scope.devices.filter($scope.findval('mac', mac)).length < 2);
      return validMac;
    };
    $scope.isValidIP = function(ip) {
      var regExp, validIP;
      regExp = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/; //# TODO all IPs allowed, and 010.1.1.1
      validIP = regExp.test(ip) && ($scope.devices.filter($scope.findval('ip', ip)).length < 2);
      return validIP;
    };
    $scope.isValidHost = function(hostname) {
      var regExp, validHostname;
      regExp = /^[a-zA-Z0-9\-]+$/;
      validHostname = regExp.test(hostname) && ($scope.devices.filter($scope.findval('hostname', hostname)).length < 2);
      return validHostname;
    };
    $scope.isValidRoom = function(room) {
      return $scope.isValidHost(room);
    };
    $scope.isValidRole = function(role) {
      var validRole;
      validRole = ['switch', 'addc', 'wlan', 'staffcomputer', 'mobile', 'printer', 'classroom-teachercomputer', 'server', 'iponly', 'faculty-teachercomputer', 'voip', 'byod', 'classroom-studentcomputer', 'thinclient', 'router'];
      return validRole.indexOf(role) !== -1;
    };
    $scope.sorts = [
      {
        name: gettext('Room'),
        fx: function(x) {
          return x.room;
        }
      },
      {
        name: gettext('Group'),
        fx: function(x) {
          return x.group;
        }
      },
      {
        name: gettext('Hostname'),
        fx: function(x) {
          return x.hostname;
        }
      },
      {
        name: gettext('MAC'),
        fx: function(x) {
          return x.mac;
        }
      },
      {
        name: gettext('IP'),
        fx: function(x) {
          return x.ip;
        }
      }
    ];
    $scope.sort = $scope.sorts[0];
    $scope.paging = {
      page: 1,
      pageSize: 100
    };
    $scope.stripComments = function(value) {
      return !value.room || value.room[0] !== '#';
    };
    $scope.add = function() {
      if ($scope.devices.length > 0) {
        $scope.paging.page = Math.floor(($scope.devices.length - 1) / $scope.paging.pageSize) + 1;
      }
      $scope.filter = '';
      return $scope.devices.push({
        _isNew: true,
        room: '',
        hostname: '',
        group: '',
        mac: '',
        ip: '',
        sophomorixRole: 'classroom-studentcomputer',
        pxeFlag: '1'
      });
    };
    $scope.duplicate = function(device) {
      return $scope.devices.push({
        _isNew: true,
        room: device.room,
        hostname: device.hostname,
        group: device.group,
        mac: device.mac,
        ip: device.ip,
        officeKey: device.officeKey,
        windowsKey: device.windowsKey,
        dhcpOptions: device.dhcpOptions,
        sophomorixRole: device.sophomorixRole,
        lmnReserved10: device.lmnReserved10,
        pxeFlag: device.pxeFlag,
        lmnReserved12: device.lmnReserved12,
        lmnReserved13: device.lmnReserved13,
        lmnReserved14: device.lmnReserved14,
        sophomorixComment: device.sophomorixComment
      });
    };
    $scope.fields = {
      room: {
        visible: true,
        name: gettext('Room')
      },
      hostname: {
        visible: true,
        name: gettext('Hostname')
      },
      group: {
        visible: true,
        name: gettext('Group')
      },
      mac: {
        visible: true,
        name: gettext('MAC')
      },
      ip: {
        visible: true,
        name: gettext('IP')
      },
      officeKey: {
        visible: false,
        name: gettext('Office Key')
      },
      windowsKey: {
        visible: false,
        name: gettext('Windows Key')
      },
      dhcpOptions: {
        visible: false,
        name: gettext('DHCP-Options')
      },
      sophomorixRole: {
        visible: true,
        name: gettext('Sophomorix-Role')
      },
      lmnReserved10: {
        visible: false,
        name: gettext('LMN-Reserved 10')
      },
      pxeFlag: {
        visible: true,
        name: gettext('PXE')
      },
      lmnReserved12: {
        visible: false,
        name: gettext('LMN-Reserved 12')
      },
      lmnReserved13: {
        visible: false,
        name: gettext('LMN-Reserved 13')
      },
      lmnReserved14: {
        visible: false,
        name: gettext('LMN-Reserved 14')
      },
      sophomorixComment: {
        visible: false,
        name: gettext('Sophomorix-Comment')
      }
    };
    $http.get('/api/lm/devices').then(function(resp) {
      return $scope.devices = resp.data;
    });
    $scope.remove = function(device) {
      return $scope.devices.remove(device);
    };
    $scope.numErrors = function() {
      return document.getElementsByClassName("has-error").length + document.getElementsByClassName("has-error-new").length > 0;
    };
    $scope.save = function() {
      if ($scope.numErrors()) {
        $scope.first_save = true;
        angular.element(document.getElementsByClassName("has-error-new")).addClass('has-error');
        notify.error('Required data missing');
        return;
      }
      return $http.post('/api/lm/devices', $scope.devices).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveAndImport = function() {
      if ($scope.numErrors()) {
        angular.element(document.getElementsByClassName("has-error-new")).addClass('has-error');
        notify.error('Required data missing');
        return;
      }
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lmn_devices:resources/partial/apply.modal.html',
          controller: 'LMDevicesApplyModalController',
          size: 'lg',
          backdrop: 'static'
        });
      });
    };
    $scope.path = '/etc/linuxmuster/sophomorix/default-school/devices.csv';
    $scope.editCSV = function() {
      return lmFileEditor.show($scope.path).then(function() {
        return $route.reload();
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show($scope.path);
    };
  });

}).call(this);

