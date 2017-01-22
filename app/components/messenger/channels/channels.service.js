'use strict';

app.service('channelsService',
  ['$rootScope', '$http', '$q', '$log', 'socket', 'Channel', 'User', 'arrayUtil',
  function ($rootScope, $http, $q, $log, socket, Channel, User, arrayUtil) {

    var self = this;

    self.channels = [];

    /**
     * @todo Call `MessagesService` method for each channel.
     */
    socket.on('init', function (results) {
      results.forEach(function (result) {
        var channel = createAndPushChannel(result);
        $rootScope.$emit('channel:new', channel);
      });
      $rootScope.$broadcast('channels:updated', 'init');
    });

    socket.on('channel:new', function (result) {
      createAndPushChannel(result.channel);
      $rootScope.$broadcast('channels:updated');
    });

    socket.on('channel:edit', function (result) {
      var channel = findChannelById(result.channel.id);
      channel.setValues(result.channel.name, result.channel.slug,
        result.channel.description, result.channel.type, result.channel.id,
        result.channel.membersCount);
      $rootScope.$broadcast('channels:updated');
    });

    socket.on('channel:members:add', function (result) {
      createAndPushChannel(result);
      $rootScope.$broadcast('channels:updated');
    });

    socket.on('channel:members:remove', function (result) {
      if (result.channel.type === Channel.TYPE.PRIVATE) {
        var channel = findChannelById(result.id);
        channel.setIsRemoved();
        $rootScope.$broadcast('channels:updated');
      }
    });

    function createAndPushChannel(data) {
      var channel = new Channel(data.name, data.slug,
        data.description, data.type, data.id, data.membersCount);
      channel.memberId = data.memberId;
      if (channel.isDirect() && channel.isDirectExist()) {
        channel.changeNameAndSlugFromId();
        var fakeDirect = findChannelBySlug(channel.slug);
        if (fakeDirect) {
          fakeDirect = channel;
          return channel;
        }
      }
      self.channels.push(channel);
      return channel;
    }

    function findChannelById(id) {
      return self.channels.find(function (channel) {
        return channel.id === id;
      });
    }

    function findChannelBySlug(slug) {
      return self.channels.find(function (channel) {
        return channel.slug === slug;
      });
    }

    function setCurrentChannelBySlug(slug) {
      if (!slug) {
        self.currentChannel = null;
      } else {
        var channel = findChannelBySlug(slug);
        if (channel) {
          self.currentChannel = channel;
          $rootScope.$broadcast('channel:changed');
        }
      }
    }

    function getCurrentChannel() {
      return self.currentChannel;
    }

    function createChannel(channel) {
      var deferred = $q.defer();
      socket.emit('channel:create', channel, function (status, message) {
        if (status) {
          deferred.resolve();
        } else {
          deferred.reject(message);
          $log.error('Create channel failed.', message);
        }
      });
      return deferred.promise;
    }

    function editChannel(channel) {
      socket.emit('channel:edit:details', channel);
    }

    function addMembersToChannel(memberIds, channelId) {
      var data = {
        memberIds: memberIds,
        channelId: channelId
      };
      socket.emit('channel:members:add', data);
    }

    function removeMembersFromChannel(data) {
      socket.emit('channel:members:remove', data);
    }

    function createNewDirect(memberId) {
      var data = {
        memberId: memberId
      };
      socket.emit('channel:direct:create', data);
    }

    function updateChannelNotification(channelId, type, notifCount) {
      var channel = findChannelById(channelId);
      switch (type) {
        case 'empty':
          channel.notifCount = 0;
          break;
        case 'inc':
          channel.notifCount++;
          break;
        case 'num':
          channel.notifCount = notifCount;
          break;
      }
      $rootScope.$broadcast('channels:updated');
    }

    function updateChannelLastDatetime(channelId, datetime) {
      var channel = findChannelById(channelId);
      channel.setLastDatetime(datetime);
      $rootScope.$broadcast('channels:updated');
    }

    function updateChannelLastSeen(channelId, lastSeenMessageId) {
      var channel = findChannelById(channelId);
      channel.setLastSeen(lastSeenMessageId);
      $rootScope.$broadcast('channels:updated');
    }

    function addIsTypingMemberByChannelId(channelId, memberId) {
      var channel = findChannelById(channelId);
      channel.addIsTypingMemberId(memberId);
      $rootScope.$broadcast('channels:updated');
    }

    function removeIsTypingMemberByChannelId(channelId, memberId) {
      var channel = findChannelById(channelId);
      channel.removeIsTypingMemberId(memberId);
      $rootScope.$broadcast('channels:updated');
    }

    /**
     * @todo Put this method in correct module.
     */
    function getTeamMembers(teamId) {
      var deferred = $q.defer();
      $http({
        method: 'GET',
        url: '/api/v1/teams/' + teamId + '/members/'
      }).success(function (data) {
        var members = data;
        arrayUtil.removeElementByKeyValue(members, 'id', User.id);
        deferred.resolve(members);
      }).error(function (err) {
        $log.info('Error Getting team members.', err);
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function getChannelMembers(channelId) {
      var deferred = $q.defer();
      $http({
        method: 'GET',
        url: '/api/v1/messenger/channels/' + channelId + '/details/'
      }).success(function (data) {
        deferred.resolve(data);
      }).error(function (err) {
        $log.info('Error Getting channel members.', err);
        deferred.reject(err);
      });
      return deferred.promise;
    }

    function isPublicOrPrivate(value) {
      return value.isPublic() || value.isPrivate();
    }

    function isDirect(value) {
      return value.isDirect();
    }

    function getChannels() {
      return self.channels;
    }

    function getPublicsAndPrivates() {
      return self.channels.filter(isPublicOrPrivate);
    }

    function getDirects() {
      return self.channels.filter(isDirect);
    }

    return {
      getPublicsAndPrivates: getPublicsAndPrivates,
      getDirects: getDirects,
      findChannelById: findChannelById,
      findChannelBySlug: findChannelBySlug,
      setCurrentChannelBySlug: setCurrentChannelBySlug,
      getCurrentChannel: getCurrentChannel,
      createChannel: createChannel,
      editChannel: editChannel,
      addMembersToChannel: addMembersToChannel,
      removeMembersFromChannel: removeMembersFromChannel,
      createNewDirect: createNewDirect,
      updateChannelNotification: updateChannelNotification,
      updateChannelLastDatetime: updateChannelLastDatetime,
      updateChannelLastSeen: updateChannelLastSeen,
      addIsTypingMemberByChannelId: addIsTypingMemberByChannelId,
      removeIsTypingMemberByChannelId: removeIsTypingMemberByChannelId,
      getTeamMembers: getTeamMembers,
      getChannelMembers: getChannelMembers
    };
  }
]);
