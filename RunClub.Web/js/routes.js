
var resolveRoute = function ($route) {
    var url = $route.current.templateUrl;
    if (url !== null && angular.isDefined(url) && angular.isString(url)) {
        url += (url.indexOf("?") === -1 ? "?" : "&");
        url += "v=" + cacheBuster;
        $route.current.templateUrl = url;
    }
}
app.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/routes/all', {
                templateUrl: '/templates/all-routes.html',
                controller: 'routeListController',
                resolve: ['$route', resolveRoute]
            }).
            when('/routes/calendar', {
                templateUrl: '/templates/calendar.html',
                controller: 'calendarController',
                resolve: ['$route', resolveRoute]
            }).
            when('/routes/:id', {
                templateUrl: '/templates/route.html',
                controller: 'showRouteController',
                resolve: ['$route', resolveRoute]
            }).
            when('/pace-calculator', {
                templateUrl: '/templates/pace-calculator.html',
                controller: 'paceCalculatorController',
                resolve: ['$route', resolveRoute]
            }).
            otherwise({
                redirectTo: '/home'
            });

        $locationProvider.html5Mode(true);

    }]);