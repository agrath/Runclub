﻿app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/home', {
                templateUrl: '/templates/home.html',
                controller: 'homeController'
            }).
            when('/faq', {
                templateUrl: '/templates/faq.html',
                controller: 'faqController'
            }).
            when('/routes/all', {
                templateUrl: '/templates/all-routes.html',
                controller: 'routeListController'
            }).
            when('/routes/calendar', {
                templateUrl: '/templates/calendar.html',
                controller: 'calendarController'
            }).
            when('/routes/:id', {
                templateUrl: '/templates/route.html',
                controller: 'showRouteController'
            }).
            when('/become-a-member', {
                templateUrl: '/templates/become-a-member.html',
                controller: 'becomeAMemberController'
            }).
            otherwise({
                redirectTo: '/home'
            });

        $locationProvider.html5Mode(true);

    }]);