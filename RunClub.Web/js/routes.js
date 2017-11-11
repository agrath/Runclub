app.config(['$routeProvider',
    function ($routeProvider) {
        $routeProvider.
            when('/routes/all', {
                templateUrl: 'templates/all-routes.html',
                controller: 'routeListController'
            }).
            when('/routes/:id', {
                templateUrl: 'templates/route.html',
                controller: 'showRouteController'
            }).
            otherwise({
                redirectTo: '/routes/all'
            });
    }]);