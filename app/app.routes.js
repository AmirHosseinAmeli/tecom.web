'use strict';


app.config(['$locationProvider', function ($locationProvider) {
  $locationProvider.html5Mode(true);
}]);

app.config(function ($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise('/messenger/');
  $stateProvider
    .state('messenger', {
      abstract: true,
      url: '/messenger',
      views: {
        '': {
          templateUrl: 'app/components/messenger/messenger.view.html'
        },
        'channels@messenger': {
          templateUrl: 'app/components/messenger/channels/channels.view.html'
        }
      }
    })
    .state('messenger.home', {
      url: '/',
      template: '<div ng-controller="messagesController" class="msg-landing"><img src="static/img/tecom-bw.png" class="img-responsive" /><h1>لطفا یک گروه را انتخاب کنید.</h1></div>'
    })
    .state('messenger.messages', {
      url: '/:slug',
      views: {
        '': {
          templateUrl: 'app/components/messenger/messages/messages.view.html'
        },
        'header@messenger.messages': {
          templateUrl: 'app/components/messenger/header/header.view.html'
        },
        'files@messenger.messages': {
          templateUrl: 'app/components/files/files.view.html'
        }
      },
      params: {
        slug: null
      }
    });
});
