'use strict';

app.service('channelsService', ['$http', '$q', '$log', 'socket',
  function ($http, $q, $log, socket) {

    var self = this;
    self.deferredInit = $q.defer();
    self.deferredNewChannel = $q.defer();
    //self.deferredEditedChannel = $q.defer();

    socket.on('init', function (data) {
      $log.info('Socket opened and connection established successfuly.');
      self.deferredInit.resolve(data);
    });

    socket.on('channel:new', function (data) {
      self.deferredNewChannel.resolve(data);
    });

    var listenToEdit = function(){
      socket.on('channel:edit', function (data) {
        self.deferredEditedChannel.resolve(data);
      });
    };

    return {
      getChannels: function () {
        return self.deferredInit.promise;
      },
      sendNewChannel: function (data, callback) {
        socket.emit('channel:create', data, callback);
      },
      getNewChannel: function () {
        return self.deferredNewChannel.promise;
      },
      getTeamMembers: function (teamId) {
        self.defferedTeamMembers = $q.defer();
        $http({
          method: 'GET',
          url: '/api/v1/teams/' + teamId + '/members/'
        }).success(function (data, status, headers, config) {
          self.defferedTeamMembers.resolve(data);
        }).error(function (data, status, headers, config) {
          self.defferedTeamMembers.reject(status);
        });
        return self.defferedTeamMembers.promise;
      },
      getChannelMembers: function (channelId) {
        self.defferedChannelMembers = $q.defer();
        $http({
          method: 'GET',
          url: '/api/v1/messenger/channels/' + channelId + '/details/'
        }).success(function (data, status, headers, config) {
          self.defferedChannelMembers.resolve(data);
        }).error(function (data, status, headers, config) {
          self.defferedChannelMembers.reject(status);
        });
        return self.defferedChannelMembers.promise;
      },
      sendDetailsEditedChannel: function (channel, callback) {
        $log.info('Emit channel edit.');
        socket.emit('channel:edit:details', channel, callback);
      },
      getEditedChannel: function () {
        var deferredEditedChannel = $q.defer();
        socket.on('channel:edit', function (data) {
          deferredEditedChannel.resolve(data);
        });
        return deferredEditedChannel.promise;
      }
    };
  }
]);
