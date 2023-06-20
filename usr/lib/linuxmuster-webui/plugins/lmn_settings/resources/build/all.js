// Generated by CoffeeScript 2.5.1
(function() {
  angular.module('lmn.settings', ['core', 'lmn.common']);

}).call(this);

// Generated by CoffeeScript 2.5.1
(function() {
  angular.module('lmn.settings').config(function($routeProvider) {
    return $routeProvider.when('/view/lmn/schoolsettings', {
      controller: 'LMSettingsController',
      templateUrl: '/lmn_settings:resources/partial/index.html'
    });
  });

  angular.module('lmn.settings').controller('LMSettingsController', function($scope, $location, $http, $uibModal, messagebox, gettext, notify, pageTitle, core, lmFileBackups, validation, customFields) {
    pageTitle.set(gettext('Settings'));
    $scope.trans = {
      remove: gettext('Remove')
    };
    $scope.activetab = 0;
    $scope.custom_fields_role_selector = 'students';
    $scope.logLevels = [
      {
        name: gettext('Minimal'),
        value: 0
      },
      {
        name: gettext('Average'),
        value: 1
      },
      {
        name: gettext('Maximal'),
        value: 2
      }
    ];
    $scope.unit = 'MiB';
    $scope.encodings = ['auto', 'ASCII', 'ISO_8859-1', 'ISO_8859-15', 'WIN-1252', 'UTF8'];
    $http.get('/api/lmn/schoolsettings').then(function(resp) {
      var encoding, file, i, len, ref, school, userfile;
      school = 'default-school';
      encoding = {};
      ref = ['userfile.students.csv', 'userfile.extrastudents.csv', 'userfile.teachers.csv', 'userfile.extrastudents.csv'];
      //TODO: Remove comments
      //for file in ['userfile.students.csv', 'userfile.teachers.csv', 'userfile.extrastudents.csv', 'classfile.extraclasses.csv', ]
      for (i = 0, len = ref.length; i < len; i++) {
        file = ref[i];
        userfile = file.substring(file.indexOf('.') + 1);
        if (resp.data[file]['ENCODING'] === 'auto') {
          console.log('is auto');
          $http.post('/api/lmn/schoolsettings/determine-encoding', {
            path: '/etc/linuxmuster/sophomorix/' + school + '/' + userfile,
            file: file
          }).then(function(response) {
            encoding[response['config']['data']['file']] = response.data;
            return console.log(encoding);
          });
        }
      }
      //console.log(encoding)
      $scope.encoding = encoding;
      return $scope.settings = resp.data;
    });
    $http.get('/api/lmn/schoolsettings/latex-templates').then(function(resp) {
      $scope.templates_individual = resp.data[0];
      $scope.templates_multiple = resp.data[1];
      return customFields.load_config().then(function(resp) {
        var i, j, len, len1, ref, ref1, results, template;
        $scope.custom = resp.custom;
        $scope.customMulti = resp.customMulti;
        $scope.customDisplay = resp.customDisplay;
        $scope.proxyAddresses = resp.proxyAddresses;
        $scope.templates = {
          'multiple': '',
          'individual': ''
        };
        $scope.passwordTemplates = resp.passwordTemplates;
        ref = $scope.templates_individual;
        for (i = 0, len = ref.length; i < len; i++) {
          template = ref[i];
          if (template.path === $scope.passwordTemplates.individual) {
            $scope.templates.individual = template;
            break;
          }
        }
        ref1 = $scope.templates_multiple;
        results = [];
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          template = ref1[j];
          if (template.path === $scope.passwordTemplates.multiple) {
            $scope.templates.multiple = template;
            break;
          } else {
            results.push(void 0);
          }
        }
        return results;
      });
    });
    $http.get('/api/lmn/holidays').then(function(resp) {
      return $scope.holidays = resp.data;
    });
    $scope.filterscriptNotEmpty = function() {
      var i, len, ref, results, role;
      ref = ['students', 'teachers', 'extrastudents'];
      // A filterscript option should not be empty but "---"
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        role = ref[i];
        if ($scope.settings['userfile.' + role + '.csv']['FILTERSCRIPT'] === "") {
          results.push($scope.settings['userfile.' + role + '.csv']['FILTERSCRIPT'] = "---");
        } else {
          results.push(void 0);
        }
      }
      return results;
    };
    $scope.customDisplayOptions = customFields.customDisplayOptions;
    // $http.get('/api/lmn/schoolsettings/school-share').then (resp) ->
    //     $scope.schoolShareEnabled = resp.data

    // $scope.setSchoolShare = (enabled) ->
    //     $scope.schoolShareEnabled = enabled
    //     $http.post('/api/lmn/schoolsettings/school-share', enabled)
    $scope.addHoliday = function() {
      return $scope.holidays.push({
        'name': '',
        'start': '',
        'end': ''
      });
    };
    $scope.removeHoliday = function(holiday) {
      return messagebox.show({
        text: gettext('Are you sure you want to delete permanently these holidays ?'),
        positive: gettext('Delete'),
        negative: gettext('Cancel')
      }).then(function() {
        return $scope.holidays.remove(holiday);
      });
    };
    $scope.save = function() {
      var validPrintserver;
      validPrintserver = validation.isValidDomain($scope.settings.school.PRINTSERVER);
      if (validPrintserver !== true) {
        notify.error(validPrintserver);
        return;
      }
      return $http.post('/api/lmn/schoolsettings', $scope.settings).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveAndCheck = function() {
      var validPrintserver;
      validPrintserver = validation.isValidDomain($scope.settings.school.PRINTSERVER);
      if (validPrintserver !== true) {
        notify.error(validPrintserver);
        return;
      }
      return $http.post('/api/lmn/schoolsettings', $scope.settings).then(function() {
        $uibModal.open({
          templateUrl: '/lmn_users:resources/partial/check.modal.html',
          controller: 'LMUsersCheckModalController',
          backdrop: 'static'
        });
        return notify.success(gettext('Saved'));
      });
    };
    $scope.saveApplyQuota = function() {
      $http.post('/api/lmn/schoolsettings', $scope.settings).then(function() {
        return notify.success(gettext('Saved'));
      });
      return $uibModal.open({
        templateUrl: '/lmn_quotas:resources/partial/apply.modal.html',
        controller: 'LMQuotasApplyModalController',
        backdrop: 'static'
      });
    };
    $scope.saveApplyHolidays = function() {
      if (document.getElementsByClassName("has-error").length > 0) {
        notify.error(gettext("Please first correct the mal formated fields."));
        return;
      }
      return $http.post('/api/lmn/holidays', $scope.holidays).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
    $scope.validateDate = function(date) {
      if (validation.isValidDate(date) !== true) {
        return 'has-error';
      }
    };
    $scope.backups = function() {
      var school;
      school = "default-school";
      return lmFileBackups.show('/etc/linuxmuster/sophomorix/' + school + '/school.conf');
    };
    return $scope.saveCustom = function() {
      var config;
      config = {
        'custom': $scope.custom,
        'customMulti': $scope.customMulti,
        'customDisplay': $scope.customDisplay,
        'proxyAddresses': $scope.proxyAddresses,
        'passwordTemplates': {
          'multiple': $scope.templates.multiple.path,
          'individual': $scope.templates.individual.path
        }
      };
      return customFields.save(config).then(function() {
        return notify.success(gettext('Saved'));
      });
    };
  });

}).call(this);

'use strict';

angular.module('lmn.settings').controller('LMglobalSettingsController', function ($scope, $http, $sce, $location, notify, pageTitle, identity, messagebox, config, core, locale, gettext) {
    pageTitle.set(gettext('Global Settings'));

    config.load();
    $scope.config = config;

    $scope.newClientCertificate = {
        c: 'NA',
        st: 'NA',
        o: '',
        cn: ''
    };

    $scope.activetab = 0;

    $scope.help_trusted_domains = gettext("If Ajenti is installed behind a proxy, oder reachable by a fqdn other than provided by the host,\n" + "you can then specify the other domains here, and by this way avoiding some resources loading problems.");

    $scope.help_trusted_proxies = gettext("If Ajenti is installed behind one or more proxies, specify the ip of these proxies here, in order to\n" + "get the real client ip address.");

    $scope.help_certificate = gettext("This certificate is the default certificate used to create client certificate and to provide https connection.\n" + "Using a Let's Encrypt certificate here will break the client certificate generator.\n" + "Using a self-generated certificate is fine here.");

    $scope.help_fqdn_certificate = gettext("If you have a special certificate for your domain, like a Let's Encrypt certificate, put it there.\n" + "If you are not sure, just use the same certificate as the one above.");

    $http.get('/api/lmn/subnets').then(function (resp) {
        return $scope.subnets = resp.data;
    });

    $scope.removeSubnet = function (subnet) {
        messagebox.show({
            text: gettext('Are you sure you want to delete permanently this subnet ?'),
            positive: gettext('Delete'),
            negative: gettext('Cancel')
        }).then(function () {
            return $scope.subnets.remove(subnet);
        });
    };

    $scope.addSubnet = function () {
        $scope.subnets.push({ 'routerIp': '', 'network': '', 'beginRange': '', 'endRange': '', 'setupFlag': '' });
    };

    $scope.saveApplySubnets = function () {
        $http.post('/api/lmn/subnets', $scope.subnets).then(function () {
            notify.success(gettext('Saved'));
        });
    };

    $scope.getSmtpConfig = function () {
        config.getSmtpConfig().then(function (smtpConfig) {
            return $scope.smtp_config = smtpConfig;
        });
    };

    $scope.add_trusted_proxy = function () {
        config.data.trusted_proxies.push("");
    };

    $scope.add_trusted_domain = function () {
        config.data.trusted_domains.push("");
    };

    $scope.delete_trusted_proxy = function (proxy) {
        messagebox.show({
            title: gettext('Remove ' + proxy),
            text: gettext('Do you really want to remove the proxy ' + proxy + ' from the list ?'),
            positive: gettext('Delete'),
            negative: gettext('Cancel')
        }).then(function () {
            pos = $scope.config.data.trusted_proxies.indexOf(proxy);
            $scope.config.data.trusted_proxies.splice(pos, 1);
            notify.success(gettext(proxy + ' removed'));
        });
    };

    $scope.delete_trusted_domain = function (domain) {
        messagebox.show({
            title: gettext('Remove ' + domain),
            text: gettext('Do you really want to remove the domain ' + domain + ' from the list ?'),
            positive: gettext('Delete'),
            negative: gettext('Cancel')
        }).then(function () {
            pos = $scope.config.data.trusted_domains.indexOf(domain);
            $scope.config.data.trusted_domains.splice(pos, 1);
            notify.success(gettext(domain + ' removed'));
        });
    };

    identity.promise.then(function () {
        // $scope.newClientCertificate.o = identity.machine.name;
        // passwd.list().then((data) => {
        //    $scope.availableUsers = data;
        //    $scope.$watch('newClientCertificate.user', () => $scope.newClientCertificate.cn = `${identity.user}@${identity.machine.hostname}`);
        //    $scope.newClientCertificate.user = 'root';
        // });
        $http.get('/api/core/languages').then(function (rq) {
            return $scope.languages = rq.data;
        });
    });

    $scope.$watch('config.data.language', function () {
        if (config.data) {
            locale.setLanguage(config.data.language);
        }
    });

    $scope.save = function () {
        config.save().then(function (data) {
            return notify.success(gettext('Global config saved'));
        }).catch(function () {
            return notify.error(gettext('Could not save global config'));
        });

        if ($scope.smtp_config) {
            config.setSmtpConfig($scope.smtp_config).then(function (data) {
                return notify.success(gettext('Smtp config saved'));
            }).catch(function () {
                return notify.error(gettext('Could not save smtp config'));
            });
        }
    };

    $scope.createNewServerCertificate = function () {
        return messagebox.show({
            title: gettext('Self-signed certificate'),
            text: gettext('Generating a new certificate will void all existing client authentication certificates!'),
            positive: gettext('Generate'),
            negative: gettext('Cancel')
        }).then(function () {
            config.data.ssl.client_auth.force = false;
            notify.info(gettext('Generating certificate'), gettext('Please wait'));
            return $http.get('/api/settings/generate-server-certificate').then(function (resp) {
                notify.success(gettext('Certificate successfully generated'));
                config.data.ssl.enable = true;
                config.data.ssl.certificate = resp.data.path;
                config.data.ssl.client_auth.certificates = [];
                $scope.save();
            }, function (err) {
                return notify.error(gettext('Certificate generation failed'), err.message);
            });
        });
    };

    $scope.restart = function () {
        return core.restart();
    };
});


'use strict';

angular.module('lmn.settings').config(function ($routeProvider) {
           return $routeProvider.when('/view/lmn/globalsettings', {
                      templateUrl: '/lmn_settings:resources/partial/globalSettings.html',
                      controller: 'LMglobalSettingsController'
           });
});


