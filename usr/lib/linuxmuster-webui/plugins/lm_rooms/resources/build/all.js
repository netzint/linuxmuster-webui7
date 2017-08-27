(function() {
  angular.module('lm.rooms', ['core', 'lm.common']);

}).call(this);

(function() {
  var indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  angular.module('lm.rooms').config(function($routeProvider) {
    return $routeProvider.when('/view/lm/room-defaults', {
      controller: 'LMRoomDefaultsController',
      templateUrl: '/lm_rooms:resources/partial/index.html'
    });
  });

  angular.module('lm.rooms').controller('LMRoomDefaultsApplyModalController', function($scope, $http, $uibModalInstance, gettext, notify) {
    $scope.logVisible = false;
    $scope.isWorking = true;
    $scope.showLog = function() {
      return $scope.logVisible = true;
    };
    $http.get('/api/lm/room-defaults/apply').then(function() {
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

  angular.module('lm.rooms').controller('LMRoomDefaultsController', function($scope, $http, $uibModal, $q, gettext, notify, pageTitle, lmFileBackups) {
    pageTitle.set(gettext('Rooms'));
    $http.get('/api/lm/workstations').then(function(resp) {
      var i, j, knownRooms, len, len1, ref, ref1, ref2, w;
      $scope.rooms = [];
      knownRooms = [];
      $scope.newObjects = [];
      $scope.workstations = resp.data;
      ref = $scope.workstations;
      for (i = 0, len = ref.length; i < len; i++) {
        w = ref[i];
        if ((ref1 = w.room, indexOf.call(knownRooms, ref1) < 0) && w.room[0] !== '#' && w.room) {
          $scope.newObjects.push(w.room);
          $scope.rooms.push({
            name: w.room
          });
          knownRooms.push(w.room);
        }
      }
      ref2 = $scope.workstations;
      for (j = 0, len1 = ref2.length; j < len1; j++) {
        w = ref2[j];
        $scope.newObjects.push(w.hostname);
      }
      return $http.get('/api/lm/edv-rooms').then(function(resp) {
        var edvRooms, l, len2, ref3, ref4, results, room;
        edvRooms = resp.data;
        ref3 = $scope.rooms;
        results = [];
        for (l = 0, len2 = ref3.length; l < len2; l++) {
          room = ref3[l];
          results.push(room.edv = (ref4 = room.name, indexOf.call(edvRooms, ref4) >= 0));
        }
        return results;
      });
    });
    $http.get('/api/lm/room-defaults').then(function(resp) {
      return $scope.defaults = resp.data;
    });
    $scope.add = function(id) {
      var d;
      d = angular.copy($scope.defaults[0]);
      d.id = id;
      return $scope.defaults.push(d);
    };
    $scope.reset = function(d) {
      var i, k, len, ref, results;
      ref = ['internet', 'intranet', 'webfilter'];
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        k = ref[i];
        results.push(d[k] = $scope.defaults[0][k]);
      }
      return results;
    };
    $scope.remove = function(d) {
      return $scope.defaults.remove(d);
    };
    $scope.save = function() {
      var edvRooms, x;
      edvRooms = (function() {
        var i, len, ref, results;
        ref = $scope.rooms;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          x = ref[i];
          if (x.edv) {
            results.push(x.name);
          }
        }
        return results;
      })();
      return $q.all([$http.post('/api/lm/room-defaults', $scope.defaults), $http.post('/api/lm/edv-rooms', edvRooms)]).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.apply = function() {
      return $scope.save().then(function() {
        return $uibModal.open({
          templateUrl: '/lm_rooms:resources/partial/apply.modal.html',
          controller: 'LMRoomDefaultsApplyModalController',
          backdrop: 'static'
        });
      });
    };
    return $scope.backups = function() {
      return lmFileBackups.show('/etc/linuxmuster/room_defaults');
    };
  });

}).call(this);
