/*
Get a latitude and longitude for an address here: https://www.gps-coordinates.net/
Convert a strava activity to a GPX with this bookmarklet: https://mapstogpx.com/strava/
Generate a randomized id here: https://passwordsgenerator.net/ (8 character, alpha)
Name the gpx file $id.gpx and copy the template json blob into the array, fill out the details
*/


app.controller('routeListController', function ($scope, RouteService, $location) {
    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
    })
});
app.controller('showRouteController', function ($scope, RouteService, $routeParams, $location) {
    $scope.id = $routeParams.id;

    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
        $scope.route = _.find($scope.routes, function (r) { return r.id === $scope.id; });

        $scope.route.gpx().then(function (gpx) {
            $scope.route.gpxLoaded = true;
            //console.log('gpx', gpx)
        });
    })

    $scope.list = function () {
        $location.path('routes/all'); // path not hash
    };
    
});

app.controller('calendarController', function ($scope, RouteService, $routeParams, $location) {
    $scope.id = $routeParams.id;

    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
    })

    $scope.list = function () {
        $location.path('routes/all'); // path not hash
    };

});
