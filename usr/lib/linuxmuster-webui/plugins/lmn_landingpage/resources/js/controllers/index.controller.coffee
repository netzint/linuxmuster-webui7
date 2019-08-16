angular.module('lmn.landingpage').config ($routeProvider) ->
    $routeProvider.when '/view/lmn/landingpage',
        controller: 'LMNLandingController'
        templateUrl: '/lmn_landingpage:resources/partial/index.html'

angular.module('lmn.landingpage').controller 'LMNLandingController', ($scope, $http, $uibModal, $location, gettext, notify, pageTitle, messagebox) ->
    pageTitle.set(gettext('Home'))

    $scope.getQuota = $http.post('/api/lmn/quota/').then (resp) ->
        $scope.user = resp.data
        $scope.quotas = []
        console.log ($scope.identity)
        # skip if user is root
        if ($scope.identity.user == 'root')
            return



        for share, values of $scope.user['QUOTA_USAGE_BY_SHARE']
            # default-school and linuxmuster-global both needed ?
            # cloudquota and mailquota not in QUOTA_USAGE_BY_SHARE ?
            used = values['USED_MiB']
            total = values['HARD_LIMIT_MiB']
            if (typeof total == 'string')
                $scope.quotas.push({'share':share, 'total':gettext(total), 'used':used, 'usage':0})
            else
                $scope.quotas.push({'share':share, 'total':total + " MiB", 'used':used, 'usage':Math.floor((100 * used) / total)})

            $scope.groups = []
            console.log ($scope.user)
            for dn in $scope.user['memberOf']
                cn       = dn.split(',')[0].split('=')[1]
                category = dn.split(',')[1].split('=')[1]
                if (category != "Management")
                    # User don't need to see management groups
                    # User only see explicit lmn groups, no custom groups

                    # Determine classes by group dn
                    if (category == cn)
                        $scope.groups.push({'cn':cn, 'category':gettext('Class')})
                    if (category == "Teachers")
                        $scope.groups.push({'cn':cn, 'category':gettext('Teachers')})
                    if (category == "printer-groups")
                        $scope.groups.push({'cn':cn, 'category':gettext('Printer')})
                    if (category == "Projects")
                        $scope.groups.push({'cn':cn, 'category':gettext('Project')})

    $scope.changePassword = () ->
        $location.path('/view/lmn/change-password');
