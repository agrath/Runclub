app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/home', {
                templateUrl: '/templates/home.html',
                controller: 'homeController'
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
            otherwise({
                redirectTo: '/home'
            });

        $locationProvider.html5Mode(true);

    }]);