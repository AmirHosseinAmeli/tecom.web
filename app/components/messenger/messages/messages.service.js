'use strict';

app.service('messagesService',
  ['$rootScope', '$log', '$q', 'socket', 'channelsService', 'Message', 'db', 'User',
  function ($rootScope, $log, $q, socket, channelsService, Message, db, User) {

    var self = this;

    //////////////////////////////////////////////////////////////////////////
    /////////////////////////// HANDLE SOCKET ////////////////////////////////
    //////////////////////////////////////////////////////////////////////////

    socket.on('message:send', function (data) {
      var message = new Message(data.body, data.type, data.senderId,
        data.channelId, data.id, data.datetime, data.additionalData);
      message.save();
      $rootScope.$broadcast('message', message);
      channelsService.updateChannelLastDatetime(message.channelId,
        message.datetime);
    });

    socket.on('message:type:start', function (data) {
      channelsService.addIsTypingMemberByChannelId(data.channelId,
        data.memberId);
      $rootScope.$broadcast('channels:updated');
    });

    socket.on('message:type:end', function (data) {
      channelsService.removeIsTypingMemberByChannelId(data.channelId,
        data.memberId);
      $rootScope.$broadcast('channels:updated');
    });

    socket.on('message:seen', function (data) {
      channelsService.updateChannelLastSeen(data.channelId, data.messageId);
    });

    //////////////////////////////////////////////////////////////////////////
    ///////////////////// HANDLE ROOTSCOPE CHANGES ///////////////////////////
    //////////////////////////////////////////////////////////////////////////

    $rootScope.$on('channel:new', function (event, channel) {
      var promise = getAndSaveNewMessagesByChannelFromServer(channel);
      channelsService.addMessagesPromise(promise);
    });


    //////////////////////////////////////////////////////////////////////////
    ///////////////////// MESSAGES SERVICE FUNCTIONS /////////////////////////
    //////////////////////////////////////////////////////////////////////////

    function getAndSaveNewMessagesByChannelFromServer(channel) {
      var deferred = $q.defer();
      var messagePromises = [];
      var messages = [];
      var dataToBeSend = {
        channelId: channel.id
      };
      messagePromises.push(new Promise(function (resolve) {
        getLastMessageByChannelIdFromDb(channel.id)
          .then(function (lastMessage) {
            if (lastMessage) {
              dataToBeSend.lastSavedMessageId = lastMessage.id;
            }
            socket.emit('message:get', dataToBeSend, function (res) {
              channelsService.updateChannelNotification(channel.id, 'num',
                res.notifCount);
              if (res.lastDatetime) {
                channelsService.updateChannelLastDatetime(channel.id,
                  new Date(res.lastDatetime));
              }
              if (res.channelLastSeen) {
                channelsService.updateChannelLastSeen(channel.id,
                  res.channelLastSeen);
              }
              res.messages.forEach(function (msg) {
                var message = new Message(msg.body, msg.type, msg.senderId,
                  msg.channelId, msg.id, msg.datetime, msg.additionalData);
                messages.push(message.getDbWellFormed());
              });
              resolve();
            });
          });
      }));
      Promise.all(messagePromises).then(function () {
        bulkSaveMessage(messages).then(function () {
          deferred.resolve();
        });
      });
      return deferred.promise;
    }

    function bulkSaveMessage(messages) {
      var deferred = $q.defer();
      db.getDb().then(function (database) {
        database.bulkDocs(messages)
          .then(function () {
            deferred.resolve();
          })
          .catch(function (err) {
            deferred.reject();
            $log.error('Bulk saving messages failed.', err);
          });
      });
      return deferred.promise;
    }

    function getMessagesByChannelId(channelId) {
      var deferred = $q.defer();
      getMessagesByChannelIdFromDb(channelId)
        .then(function (res) {
          var messages = [];
          res.docs.forEach(function (doc) {
            var message = new Message(doc.body, doc.type, doc.senderId,
              doc.channelId, doc._id, doc.datetime, doc.additionalData);
            messages.push(message);
          });
          deferred.resolve(messages);
        });
      return deferred.promise;
    }

    /**
     * @todo Create a static variable for limit count.
     */
    function getMessagesByChannelIdFromDb(channelId) {
      var deferred = $q.defer();
      db.getDb().then(function (database) {
        database.find({
          selector: {
            id: {
              $gt: null
            },
            channelId: {
              $eq: channelId
            }
          },
          sort: [{
            id: 'desc'
          }],
          limit: 50
        }).then(function (docs) {
          deferred.resolve(docs);
        });
      });
      return deferred.promise;
    }

    function getLastMessageByChannelIdFromDb(channelId) {
      var deferred = $q.defer();
      db.getDb().then(function (database) {
        database.find({
          selector: {
            id: {
              $gt: null
            },
            channelId: {
              $eq: channelId
            }
          },
          sort: [{
            id: 'desc'
          }],
          limit: 1
        }).then(function (result) {
          if (result.docs.length === 0) {
            deferred.resolve(null);
          } else {
            deferred.resolve(result.docs[0]);
          }
        }).catch(function (err) {
          $log.error('Getting last message from db failed.', err);
          deferred.reject();
        });
      });
      return deferred.promise;
    }

    function sendAndGetMessage(channelId, messageBody, type, file, fileName) {
      var additionalData = null;
      if (file) {
        additionalData = {
          name: fileName,
          file: file
        };
      }
      var message = new Message(messageBody, type || Message.TYPE.TEXT, User.id,
        channelId, null, null, additionalData, true);
      socket.emit('message:send', message.getServerWellFormed(),
        function (data) {
          message.isPending = false;
          message.setIdAndDatetimeAndAdditionalData(data.id, data.datetime,
            data.additionalData);
          message.save();
          channelsService.updateChannelLastDatetime(message.channelId,
            message.datetime);
        });
      return message;
    }

    function seenMessage(channelId, messageId, senderId) {
      var data = {
        channelId: channelId,
        messageId: messageId,
        senderId: senderId
      };
      socket.emit('message:seen', data);
      channelsService.updateChannelNotification(channelId, 'empty');
    }

    function seenLastMessageByChannelId(channelId) {
      getLastMessageByChannelIdFromDb(channelId)
        .then(function (lastMessage) {
          if (lastMessage) {
            seenMessage(channelId, lastMessage.id, lastMessage.senderId);
          }
        });
    }

    function startTyping(channelId) {
      var data = {
        channelId: channelId
      };
      socket.emit('message:type:start', data);
    }

    function endTyping(channelId) {
      var data = {
        channelId: channelId
      };
      socket.emit('message:type:end', data);
    }

    //////////////////////////////////////////////////////////////////////////
    ////////////////////////////// PUBLIC API ////////////////////////////////
    //////////////////////////////////////////////////////////////////////////

    return {
      getMessagesByChannelId: getMessagesByChannelId,
      sendAndGetMessage: sendAndGetMessage,
      seenMessage: seenMessage,
      seenLastMessageByChannelId: seenLastMessageByChannelId,
      startTyping: startTyping,
      endTyping: endTyping
    };
  }
]);
