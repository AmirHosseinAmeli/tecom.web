'use strict';

app.controller('channelsController', [
  '$rootScope', '$scope', '$window', '$state', '$uibModal',
  'channelsService', 'webNotification', 'textUtil', '$log', 'CurrentMember',
  function ($rootScope, $scope, $window, $state, $uibModal, channelsService,
    webNotification, textUtil, $log, CurrentMember) {

    $scope.channels = {};
    $scope.channels.publicsAndPrivates = [];
    $scope.channels.directs = [];
    $scope.$on('channels:updated', function () {
      updateChannels();
      updateFavicon();
    });

    $scope.$on('channel:changed', function () {
      $scope.channels.current = channelsService.getCurrentChannel();
      validateUrlChannel();
    });

    $scope.$on('message', function (event, message) {
      var channel = channelsService.findChannelById(message.channelId);
      if (!$rootScope.isTabFocused) {
        incrementChannelNotification(message.channelId);
        handleNotification(channel);
      } else {
        if (!$scope.channels.current) {
          incrementChannelNotification(message.channelId);
        } else {
          var belongsToCurrentChannel =
            message.channelId === $scope.channels.current.id;
          if (!belongsToCurrentChannel && !message.isFromMe()) {
            incrementChannelNotification(message.channelId);
          }
        }
      }
    });

    function handleNotification(channel) {
      if (channel.hideNotifFunction) {
        channel.hideNotifFunction();
        channel.hideNotifFunction = null;
      }
      if (channel.isCurrentMemberPublicChannelMember() && !CurrentMember.member
        .dontDisturbMode)
        sendBrowserNotification(channel);
    }

    function sendBrowserNotification(channel) {
      webNotification.showNotification(channel.name, {
        body: 'شما ' + channel.getLocaleNotifCount() +
          ' پیام خوانده نشده دارید.',
        icon: 'favicon.png',
        onClick: function onNotificationClicked() {
          channel.hideNotifFunction();
          channel.hideNotifFunction = null;
          $window.focus();
          $state.go('messenger.messages', {
            slug: channel.getUrlifiedSlug()
          });
        },
      }, function onShow(error, hide) {
        if (error) {
          $log.error('Unable to show notification: ' + error.message);
        } else {
          channel.hideNotifFunction = hide;
          setTimeout(function hideNotifFunctionication() {
            channel.hideNotifFunction = null;
            hide();
          }, 5000);
        }
      });
    }

    $scope.openCreateChannelModal = function (name) {
      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'app/components/messenger/channels/channel-create.view.htm?v=1.0.0',
        controller: 'createChannelController'
      });
      modalInstance.result.then(function () {}, function () {});
    };

    function validateUrlChannel() {
      if (!$scope.channels.current) {
        $state.go('messenger.home');
      }
    }

    function updateChannels() {
      $scope.channels.publicsAndPrivates =
        channelsService.getPublicsAndPrivates();
      $scope.channels.directs = channelsService.getDirects();
    }

    function updateFavicon() {
      $rootScope.hasUnread = channelsService.anyChannelHasUnread();
    }

    function incrementChannelNotification(channelId) {
      channelsService.updateChannelNotification(channelId, 'inc');
    }

  }
]);
