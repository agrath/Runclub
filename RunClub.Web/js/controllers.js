﻿/*
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

app.controller('calendarController', function ($scope, RouteService, CalendarService, $routeParams, $location) {
    $scope.id = $routeParams.id;
    $scope.loading = true;
    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
        CalendarService.getCalendar().then(function (data) {
            $scope.allEvents = data;
            
            _.each($scope.allEvents, function (item) {
                item.route = _.find($scope.routes, function (route) { return route.id == item.id; });
                item.moment = moment(item.timestamp);
                item.day = item.moment.format('DD');
                item.month = item.moment.format('MMM');
                item.year = item.moment.format('YYYY');
                item.time = item.moment.format('HH:mm a');
            })
            var now = moment();
            var events = _.partition($scope.allEvents, function (event) {
                return event.moment.isBefore(now);
            });
            $scope.upcomingEvents = _.sortBy(events[1], function (event) { return event.moment.unix(); });
            $scope.pastEvents = _.sortBy(events[0], function (event) { return -event.moment.unix(); });
            
            $scope.loading = false;
        });
    })

    $scope.list = function () {
        $location.path('routes/all'); // path not hash
    };

});
