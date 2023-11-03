angular.module('lmn.session_new').controller 'LMNSessionController', ($scope, $http, $location, $route, $uibModal, $window, $q, $interval, gettext, notify, messagebox, pageTitle, lmFileEditor, lmEncodingMap, filesystem, validation, identity, $rootScope, wait, userPassword, lmnSession, smbclient) ->

    $scope.stateChanged = false
    $scope.sessionChanged = false
    $scope.addParticipant = ''
    $scope.addSchoolClass = ''
    $scope.examMode = false
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
        'file': "far fa-file",
    }

    $window.onbeforeunload = (event) ->
        if !$scope.sessionChanged
            return
        # Confirm before page reload
        return "Eventually not refreshing"

    $scope.$on("$destroy", () ->
        # Avoid confirmation on others controllers
        $scope.stopRefreshFiles()
        $scope.stopRefreshParticipants()
        $window.onbeforeunload = undefined
    )

    $scope.$on("$locationChangeStart", (event) ->
        # TODO : handle logout if session is changed
        if $scope.sessionChanged
            if !confirm(gettext('Do you really want to quit this session ? You can restart it later if you want.'))
                event.preventDefault()
                return
        $window.onbeforeunload = undefined
    )

    $scope.translation ={
        addStudent: gettext('Add Student')
        addClass: gettext('Add Class')
    }

    $scope.sorts = [
        {
            name: gettext('Lastname')
            fx: (x) -> x.sn + ' ' + x.givenName
        }
        {
            name: gettext('Login name')
            fx: (x) -> x.sAMAccountName
        }
        {
            name: gettext('Firstname')
            fx: (x) -> x.givenName
        }
        {
            name: gettext('Email')
            fx: (x) -> x.mail
        }
    ]

    $scope.sort = $scope.sorts[0]

    $scope.fields = {
        sAMAccountName:
            visible: true
            name: gettext('Userdata')
        transfer:
            visible: true
            name: gettext('Transfer')
        examMode:
            visible: true
            name: gettext('')
        workingDirectory:
            visible: true
            name: gettext('Working directory')
        sophomorixRole:
            visible: false
            name: gettext('sophomorixRole')
        wifi:
            visible: true
            icon:"fa fa-wifi"
            title: gettext('Wifi-Access')
            checkboxAll: true
            checkboxStatus: false
        internet:
            visible: true
            icon:"fa fa-globe"
            title: gettext('Internet-Access')
            checkboxAll: true
            checkboxStatus: false
        intranet:
            visible: false
            icon:"fa fa-server"
            title: gettext('Intranet Access')
            checkboxAll: true
        webfilter:
            visible: false
            icon:"fa fa-filter"
            title: gettext('Webfilter')
            checkboxAll: true
            checkboxStatus: false
        printing:
            visible: true
            icon:"fa fa-print"
            title: gettext('Printing')
            checkboxAll: true
            checkboxStatus: false
    }

    $scope.backToSessionList = () ->
        $location.path('/view/lmn/sessionsList')

    $scope.session = lmnSession.current
    $scope.extExamUsers = lmnSession.extExamUsers
    $scope.examUsers = lmnSession.examUsers
    lmnSession.createWorkingDirectory($scope.session.members).then () ->
        $scope.missing_schoolclasses = lmnSession.user_missing_membership.map((user) -> user.sophomorixAdminClass).join(',')

    $scope.refreshUsers = () ->
       lmnSession.refreshUsers().then () ->
            $scope.extExamUsers = lmnSession.extExamUsers
            $scope.examUsers = lmnSession.examUsers

    if $scope.session.type == 'schoolclass'
        title = " > " + gettext("Schoolclass") + " #{$scope.session.name}"
    else if $scope.session.type == 'room'
        title = " > " + gettext("Room") + " #{$scope.session.name}"
    else
        title = " > " + gettext("Group") + " #{$scope.session.name}"

    pageTitle.set(gettext('Session') + title )

    # Nothing defined, going back to session list
    if $scope.session.sid == ''
        $scope.backToSessionList()

    $scope.isStudent = (user) ->
        return ['student', 'examuser'].indexOf(user.sophomorixRole) > -1

    # Fix missing membership for share

    $scope.fixMembership = (group) ->
        $http.post('/api/lmn/groupmembership/membership', {
            action: 'addadmins',
            entity: $scope.identity.user,
            groupname: $scope.missing_schoolclasses,
            type: 'class'
        }).then (resp) ->
            if resp['data'][0] == 'ERROR'
                notify.error (resp['data'][1])
            if resp['data'][0] == 'LOG'
                notify.success gettext(resp['data'][1])
                $rootScope.identity = identity
                $scope.refresh_krbcc()

    $scope.refresh_krbcc = () ->
        smbclient.refresh_krbcc().then () ->
            for user in lmnSession.user_missing_membership
                position = $scope.session.members.indexOf(user)
                $scope.session.members[position].files = []
                lmnSession._createWorkingDirectory(user)
            identity.init().then () ->
                console.log("Identity renewed !")
                $scope.missing_schoolclasses = []

    # Refresh room users

    $scope.updateParticipants = () ->
        $http.get('/api/lmn/session/userInRoom').then (resp) ->
            if resp.data.usersList.length != 0
                $http.post("/api/lmn/session/userinfo", {users:resp.data.usersList}).then (rp) ->
                    $scope.session.members = rp.data

    $scope.stopRefreshParticipants = () ->
        if $scope.refresh_participants != undefined
            $interval.cancel($scope.refresh_participants)
        $scope.autorefresh_participants = false

    $scope.startRefreshParticipants = () ->
        $scope.updateParticipants()
        $scope.refresh_participants = $interval($scope.updateParticipants, 5000, 0)
        $scope.autorefresh_participants = true

    if $scope.session.type == 'room'
        $scope.startRefreshParticipants()

    # List working directory files

    $scope.get_file_icon = (filetype) ->
        return $scope.file_icon[filetype]

    $scope._updateFileList = (participant) ->
        if participant.files != 'ERROR' and participant.files != 'ERROR-teacher'
            path = "#{participant.homeDirectory}\\transfer\\#{$scope.identity.user}\\_collect"
            smbclient.list(path).then((data) -> participant.files = data.items)

    $scope.updateFileList = () ->
        for participant in $scope.session.members
            $scope._updateFileList(participant)

    $scope.stopRefreshFiles = () ->
        if $scope.refresh_files != undefined
            $interval.cancel($scope.refresh_files)
        $scope.autorefresh_files = false

    $scope.startRefreshFiles = () ->
        $scope.updateFileList()
        $scope.refresh_files = $interval($scope.updateFileList, 5000, 0)
        $scope.autorefresh_files = true

    # Management groups

    $scope.setManagementGroup = (group, participant) ->
        $scope.stateChanged = true
        if participant[group] == true
            group = "no#{group}"
        user = [participant.sAMAccountName]
        $http.post('/api/lmn/managementgroup', {group:group, users:user}).then (resp) ->
            notify.success("Group #{group} changed for #{user[0]}")
            $scope.stateChanged = false

    $scope.setManagementGroupAll = (group) ->
        $scope.stateChanged = true
        usersList = []
        new_value = !$scope.fields[group].checkboxStatus

        for participant in $scope.session.members
            # Only change management group for student, and not others teachers
            if participant.sophomorixRole == 'student'
                participant[group] = new_value
                usersList.push(participant.sAMAccountName)

        if new_value == false
            group = "no#{group}"

        $http.post('/api/lmn/managementgroup', {group:group, users:usersList}).then (resp) ->
            notify.success("Group #{group} changed for #{usersList.join()}")
            $scope.stateChanged = false

    # Manage session

    $scope.renameSession = () ->
        lmnSession.rename($scope.session.sid, $scope.session.name).then (resp) ->
            $scope.session.name = resp

    $scope.killSession = () ->
        lmnSession.kill($scope.session.sid, $scope.session.name).then () ->
            $scope.backToSessionList()

    $scope.saveAsSession = () ->
        lmnSession.new($scope.session.members).then () ->
            $scope.sessionChanged = false
            # TODO : would be better to get the session id and simply set the current session
            # instead of going back to the sessions list
            # But for this sophomorix needs to return the session id when creating a new one
            $scope.backToSessionList()

    $scope.findUsers = (q) ->
        return $http.get("/api/lmn/session/user-search/#{q}").then (resp) ->
            return resp.data

    $scope.findSchoolClasses = (q) ->
        return $http.get("/api/lmn/session/schoolClass-search/#{q}").then (resp) ->
            return resp.data

    $scope.$watch 'addParticipant', () ->
        if $scope.addParticipant
            $http.post('/api/lmn/session/userinfo', {'users':[$scope.addParticipant.sAMAccountName]}).then (resp) ->
                new_participant = resp.data[0]
                $scope.addParticipant = ''
                if !$scope.session.generated
                    # Real session: must be added in LDAP
                    $http.post('/api/lmn/session/participants', {'users':[new_participant.sAMAccountName], 'session': $scope.session.sid})
                else
                    $scope.sessionChanged = true
                $scope.session.members.push(new_participant)
                $scope.refreshUsers()

    $scope.$watch 'addSchoolClass', () ->
        if $scope.addSchoolClass
            members = $scope.addSchoolClass.sophomorixMembers
            $http.post('/api/lmn/session/userinfo', {'users':members}).then (resp) ->
                new_participants = resp.data
                $scope.addSchoolClass = ''
                if !$scope.session.generated
                    # Real session: must be added in LDAP
                    $http.post('/api/lmn/session/participants', {'users':members, 'session': $scope.session.sid})
                else
                    $scope.sessionChanged = true
                $scope.session.members = $scope.session.members.concat(new_participants)
                $scope.refreshUsers()

    $scope.removeParticipant = (participant) ->
        deleteIndex = $scope.session.members.indexOf(participant)
        if deleteIndex != -1
            if $scope.session.generated
                # Not a real session, just removing from participants list displayed
                $scope.session.members.splice(deleteIndex, 1)
                $scope.sessionChanged = true
            else
                $http.patch('/api/lmn/session/participants', {'users':[participant.sAMAccountName], 'session': $scope.session.sid}).then () ->
                    $scope.session.members.splice(deleteIndex, 1)

    # Exam mode

    $scope.startExam = () ->
        # End exam for a whole group
        $scope.stateChanged = true
        $http.patch("/api/lmn/session/exam/start", {session: $scope.session}).then (resp) ->
            $scope.examMode = true
            $scope.stateChanged = false
            lmnSession.getExamUsers()
            $scope.stopRefreshFiles()

    $scope.stopExam = () ->
        # End exam for a whole group
        $scope.stateChanged = true
        messagebox.show({
            text: gettext('Do you really want to end the current exam?'),
            positive: gettext('End exam mode'),
            negative: gettext('Cancel')
        }).then () ->
            $http.patch("/api/lmn/session/exam/stop", {session: $scope.session}).then (resp) ->
                $scope.refreshUsers()
                $scope.examMode = false
                $scope.stateChanged = false
            $scope.stopRefreshFiles()

    $scope._stopUserExam = (user) ->
        # End exam for a specific user: backend promise without messagebox
        uniqSession = {
            'members': [user],
            'name': "#{user.sophomorixAdminClass}_#{user.sAMAccountName}_ENDED_FROM_#{identity.user}",
            'type': '',
        }
        return $http.patch("/api/lmn/session/exam/stop", {session: uniqSession})

    $scope.stopUserExam = (user) ->
        # End exam for a specific user
        exam_teacher = user.sophomorixExamMode[0]
        exam_student = user.displayName
        messagebox.show({
            text: gettext('Do you really want to remove ' + exam_student + ' from the exam of ' + exam_teacher + '?'),
            positive: gettext('End exam mode'),
            negative: gettext('Cancel')
        }).then () ->
            $scope._stopUserExam(user).then () ->
                $scope.refreshUsers()
                notify.success(gettext('Exam mode stopped for user ') + exam_student)

    $scope.stopRunningExams = () ->
        # End all running extern exams (run by other teachers)
        messagebox.show({
            text: gettext('Do you really want to end all running exams?'),
            positive: gettext('End exam mode'),
            negative: gettext('Cancel')
        }).then () ->
            promises = []
            for user in $scope.extExamUsers
                promises.push($scope._stopUserExam(user))
            for user in $scope.examUsers
                promises.push($scope._stopUserExam(user))
            $q.all(promises).then () ->
                $scope.refreshUsers()
                notify.success(gettext('Exam mode stopped for all users.'))

    $scope._checkExamUser = (username) ->
        if username.endsWith('-exam')
            messagebox.show(title: gettext('User in exam'), text: gettext('This user seems to be in exam. End exam mode before changing password!'), positive: 'OK')
            return true
        return false

    # Passwords

    $scope.showFirstPassword = (username) ->
        $scope.blurred = true
        # if user is exam user show InitialPassword of real user
        username = username.replace('-exam', '')
        userPassword.showFirstPassword(username).then((resp) ->
            $scope.blurred = false
        )
    $scope.resetFirstPassword = (username) ->
        if not $scope._checkExamUser(username)
            userPassword.resetFirstPassword(username)

    $scope.setRandomFirstPassword = (username) ->
        if not $scope._checkExamUser(username)
            userPassword.setRandomFirstPassword(username)

    $scope.setCustomPassword = (user, pwtype) ->
        if not $scope._checkExamUser(user.sAMAccountName)
            userPassword.setCustomPassword(user, pwtype)

    $scope.share = (participants) ->
        # participants is an array containing one or all participants
        path = "#{identity.profile.homeDirectory}\\transfer"
        $uibModal.open(
           templateUrl: '/lmn_session_new:resources/partial/selectFile.modal.html'
           controller: 'LMNSessionFileSelectModalController'
           scope: $scope
           resolve:
              action: () -> 'share'
              path: () -> path
        ).result.then (result) ->
           if result.response is 'accept'
               wait.modal(gettext('Sharing files...'), 'progressbar')
               $http.post('/api/lmn/session/trans', {command: command, senders: senders, receivers: receivers, files: result.files, session: sessioncomment}).then (resp) ->
                   $rootScope.$emit('updateWaiting', 'done')

    $scope.collectAll = (command) ->
        smbclient.createDirectory('')
        for user in $scope.session.members
            path = "#{user.homeDirectory}\\transfer\\#{$scope.identity.user}\\_collect"
            if command = 'move'
                smbclient.move('', '')
            else if command = 'copy'
                smbclient.copy('', '')

    $scope.collectUser = (command, participant) ->
        # participant is only one user
        # command is copy or move
        path = "#{participant.homeDirectory}\\transfer\\#{$scope.identity.user}\\_collect"
        $uibModal.open(
           templateUrl: '/lmn_session_new:resources/partial/selectFile.modal.html'
           controller: 'LMNSessionFileSelectModalController'
           scope: $scope
           resolve:
              action: () -> command
              path: () -> path
        ).result.then (result) ->
            if result.response is 'accept'
                #return
                wait.modal(gettext('Collecting files...'), 'progressbar')
                if command is 'copy'
                    $http.post('/api/lmn/session/trans', {command: command, senders: senders, receivers: receivers, files: result.files, session: sessioncomment}).then (resp) ->
                        $rootScope.$emit('updateWaiting', 'done')
                        validateResult(resp)
                if command is 'move'
                    $http.post('/api/lmn/session/trans', {command: command, senders: senders, receivers: receivers, files: result.files, session: sessioncomment}).then (resp) ->
                        $rootScope.$emit('updateWaiting', 'done')
                        validateResult(resp)

angular.module('lmn.session_new').controller 'LMNSessionFileSelectModalController', ($scope, $uibModalInstance, gettext, notify, $http, action, path, messagebox, smbclient) ->

    $scope.action = action
    $scope.path = path

    $scope.load_path = (path) ->
        smbclient.list(path).then (data) ->
            $scope.items = data.items

    $scope.load_path($scope.path)

    $scope.save = () ->
        filesToTrans =  []
        angular.forEach $scope.files['TREE'], (file, id) ->
            if file['checked'] is true
                filesToTrans.push(id)
        if filesToTrans.length == 0
            notify.info(gettext('Please select at least one file!'))
            return
        $uibModalInstance.close(response: 'accept', files: filesToTrans, bulkMode: bulkMode)

    $scope.close = () ->
        $uibModalInstance.dismiss()

    $scope.createDir = (path) ->
        $http.post('/api/lmn/create-dir', {filepath: path})

    $scope.removeFile = (file) ->
        role = $scope.identity.profile.sophomorixRole
        school = $scope.identity.profile.activeSchool
        path = $scope.identity.profile.homeDirectory+'\\transfer\\'+file
        messagebox.show({
            text: gettext('Are you sure you want to delete permanently the file ' + file + '?'),
            positive: gettext('Delete'),
            negative: gettext('Cancel')
        }).then () ->
            $http.post('/api/lmn/smbclient/unlink', {path: path}).then (resp) ->
                notify.success(gettext("File " + file + " removed"))
                delete $scope.files['TREE'][file]
                $scope.files['COUNT']['files'] = $scope.files['COUNT']['files'] - 1
                pos = $scope.filesList.indexOf(file)
                $scope.filesList.splice(pos, 1)

    $scope.removeDir = (file) ->
        role = $scope.identity.profile.sophomorixRole
        school = $scope.identity.profile.activeSchool
        path = '/srv/samba/schools/'+school+'/'+role+'/'+$scope.identity.user+'/transfer/'+file
        messagebox.show({
            text: gettext('Are you sure you want to delete permanently this directory and its content: ' + file + '?'),
            positive: gettext('Delete'),
            negative: gettext('Cancel')
        }).then () ->
            $http.post('/api/lmn/remove-dir', {filepath: path}).then (resp) ->
                notify.success(gettext("Directory " + file + " removed"))
                delete $scope.files['TREE'][file]
                $scope.files['COUNT']['files'] = $scope.files['COUNT']['files'] - 1
                pos = $scope.filesList.indexOf(file)
                $scope.filesList.splice(pos, 1)

