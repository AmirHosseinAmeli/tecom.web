'use strict';

app.controller('teamProfileController', [
  '$scope', '$log', 'User', 'profileService', '$uibModalInstance', '$timeout',
  'validationUtil', 'ArrayUtil', 'teamService', 'channelsService',
  function ($scope, $log, User, profileService, $uibModalInstance, $timeout,
            validationUtil, ArrayUtil, teamService, channelsService) {

    initialize();

    $scope.inviteMember = function () {
      initializeInviteMemberForm();
      $scope.inviteMode = true;
    };

    $scope.sendInvitation = function () {
      if (!$scope.invitedEmail)
        setInfoOrErrorMessage('error', 'لطفا ایمیل رو وارد کن.');
      else if (validationUtil.validateEmail($scope.invitedEmail)) {
        profileService.sendInvitationEmail($scope.invitedEmail)
          .then(function () {
            $scope.invitedEmail = '';
            setInfoOrErrorMessage('info', 'ایمیل دعوت به تیم با موفقیت ارسال شد.');
            $scope.inviteMode = false;
          }).catch(function (err) {
          $log.error('Invitation Error:', err);
          if (err.data && err.data[0] === 'Email already a member.')
            setInfoOrErrorMessage('error',
              'فرد مورد نظرت در حال حاضر عضو تیمه');
          else if (err.data && err.data[0] === 'Email already has an active invitaion.')
            setInfoOrErrorMessage('error', 'ایمیل فعال سازی ارسال شده است.');
            else
            setInfoOrErrorMessage('error', 'خطا در دعوت به تیم');
        });
      }
      else
        setInfoOrErrorMessage('error', 'ایمیل وارد شده معتبر نیست');
    };

    $scope.editTeamName = function () {
      $scope.editTeamNameActive = true;
    };

    $scope.saveTeamName = function () {
      $scope.editTeamNameActive = false;
    };

    $scope.closeModal = function () {
      $uibModalInstance.close();
    };

    $scope.removeTeamMember = function (member) {
      profileService.removeTeamMember(member).then(function () {
        teamService.deactiveTeamMember(member.id);
        $scope.teamMembers = User.getCurrent().team.getActiveMembers();
        channelsService.setDirectActiveState(member.username, false);
      }).catch(function (err) {
        $log.error('Error Removing Team Member:', err);
      });
    };

    $scope.changeMemberAdminState = function (member) {
      if (member.is_admin === false) {
        profileService.makeAdmin(member).then(function () {
          member.is_admin = true;
        }).catch(function (err) {
          $log.error('Error Making Member Admin:', err);
        });
      }
      else{
        profileService.disAdmin(member).then(function () {
          member.is_admin = false;
        }).catch(function (err) {
          $log.error('Error DisAdmining Member:', err);
        });
      }
    };

    $scope.getAdminButtonCSS = function(member){
      return member.is_admin ? 'is-admin' : '';
    };

    function setInfoOrErrorMessage(type, message) {
      switch (type) {
        case 'info':
          $scope.infoMessage = message;
          $scope.showInfoMessage = true;
          $timeout(function () {
            $scope.showInfoMessage = false;
            $scope.infoMessage = null;
          }, 4000);
          break;
        case 'error':
          $scope.showErrorMessage = true;
          $scope.errorMessage = message;
          $timeout(function () {
            $scope.showErrorMessage = false;
            $scope.errorMessage = null;
          }, 4000);
          break;
      }
    }

    $scope.isMe = function (member) {
      return member.id === User.getCurrent().memberId;
    };

    function initialize() {
      $scope.teamMembers = User.getCurrent().team.getActiveMembers();
      $scope.team = User.getCurrent().team;
      $scope.editTeamNameActive = false;
      $scope.inviteMode = false;
      $scope.forms = {};
    }

    function initializeInviteMemberForm() {
      $scope.invitedEmail = '';
      $scope.forms.inviteMember.$setPristine();
    }

  }]);
