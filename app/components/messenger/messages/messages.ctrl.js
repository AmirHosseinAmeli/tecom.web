'use strict';

app.controller('messagesController', [
  '$scope', '$state', '$stateParams', '$window', '$timeout', 'Upload',
  'messagesService', 'channelsService',
  function ($scope, $state, $stateParams, $window, $timeout, Upload,
    messagesService, channelsService) {

    if (!$stateParams.slug) {
      channelsService.setCurrentChannelBySlug(null);
      return;
    }

    var self = this;

    $scope.messages = [];
    $scope.file = {};

    initialize();

    $scope.$on('channels:updated', function (event, data) {
      if (data === 'init') {
        initialize();
      }
    });

    $scope.$on('message', function (event, message) {
      if ($scope.channel.id == message.channelId) {
        $scope.messages.push(message);
        scrollBottom();
        if (self.isTabfocused) {
          messagesService.seenMessage($scope.channel.id, message.id,
            message.senderId);
        } else {
          self.lastUnSeenMessage = message;
        }
      }
    });

    $scope.sendMessage = function ($event) {
      $event.preventDefault();
      var messageBody = $scope.inputMessage.trim();
      if (!messageBody) return;
      var message = messagesService.sendAndGetMessage($scope.channel.id,
        messageBody);
      $scope.messages.push(message);
      scrollBottom();
      clearMessageInput();
      messagesService.endTyping($scope.channel.id);
      $timeout.cancel(self.isTypingTimeout);
    };

    $scope.startTyping = function () {
      if (self.isTypingTimeout) {
        $timeout.cancel(self.isTypingTimeout);
      }
      if (!self.isTyping) {
        self.isTyping = true;
        messagesService.startTyping($scope.channel.id);
      }
      self.isTypingTimeout = $timeout(function () {
        self.isTyping = false;
        messagesService.endTyping($scope.channel.id);
      }, 2000);
    };

    $scope.upload = function (file, errFiles) {
      if (file) {
        var message = messagesService.sendFileAndGetMessage($scope.channel.id,
          file, file.name);
        $scope.messages.push(message);
        scrollBottom();
      }
    };

    $scope.goLive = function (fileId) {
      messagesService.makeFileLive($scope.channel.id, fileId);
    };

    function initialize() {
      setCurrentChannel();
      if ($scope.channel) {
        bindMessages();
        self.isTabfocused = true;
      }
    }

    function setCurrentChannel() {
      var slug = $stateParams.slug.replace('@', '');
      channelsService.setCurrentChannelBySlug(slug);
      $scope.channel = channelsService.getCurrentChannel();
    }

    function bindMessages() {
      messagesService.getMessagesByChannelId($scope.channel.id)
        .then(function (messages) {
          $scope.messages = messages;
          scrollBottom();
          if ($scope.channel.hasUnread()) {
            messagesService.seenLastMessageByChannelId($scope.channel.id);
          }
        });
    }

    function seenLastUnSeenMessage() {
      if (self.lastUnSeenMessage) {
        messagesService.seenMessage($scope.channel.id,
          self.lastUnSeenMessage.id, self.lastUnSeenMessage.senderId);
        self.lastUnSeenMessage = null;
      }
    }

    function scrollBottom() {
      $timeout(function () {
        var holder = document.getElementById('messagesHolder');
        holder.scrollTop = holder.scrollHeight;
      }, 0, false);
    }

    function clearMessageInput() {
      $scope.inputMessage = '';
    }

    document.getElementById('inputPlaceHolder').focus();

    document.onkeydown = function (evt) {
      evt = evt || window.event;
      if (evt.keyCode == 27) {
        $state.go('messenger.home');
      }
    };

    angular.element($window)
      .bind('focus', function () {
        self.isTabfocused = true;
        seenLastUnSeenMessage();
      }).bind('blur', function () {
        self.isTabfocused = false;
      });

  }
]);