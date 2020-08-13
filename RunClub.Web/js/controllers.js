/*
Get a latitude and longitude for an address here: https://www.gps-coordinates.net/
Convert a strava activity to a GPX with this bookmarklet: https://mapstogpx.com/strava/
Generate a randomized id here: https://passwordsgenerator.net/ (8 character, alpha)
Name the gpx file $id.gpx and copy the template json blob into the array, fill out the details
Look up ameneties here: http://overpass-turbo.eu/ with
    [out:json][timeout:25];
    (
    node[~"(amenity|tourism)"~"(toilets|drinking_water|viewpoint)"]({{bbox}});
    );
    out body;
    >;
    out skel qt;
and drag a bounding box, export with export button then use AmenetiesGeoJson2DbJson.aspx to convert that format to our ameneties data

*/

app.controller('routeListController', function ($scope, RouteService, $location) {
    RouteService.getRoutes().then(function (data) {
        $scope.routes = _.sortBy(data, function (item) {
            return item.name;
        });
    })
});
app.controller('showRouteController', function ($scope, $rootScope, RouteService, $routeParams, $location, $timeout) {
    $scope.id = $routeParams.id;

    var url = '/app/route/' + $scope.id;

    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
        var route = _.find($scope.routes, function (r) { return r.id === $scope.id; });
        $scope.route = route;

        $scope.route.gpx().then(function (gpx) {
            $scope.route.gpxLoaded = true;
            //console.log('gpx', gpx)
        });
    })

    $scope.list = function () {
        $location.path('/routes/all'); // path not hash
    };
    $rootScope.$on('mapLoaded', function (e, data) {
        $scope.loaded = true;
        $scope.fitBounds = data.fitBounds;
    });
    $scope.generateImage = function () {
        //apply map-render class to canvas
        var element = angular.element(".map-container");
        angular.element('.col-lg-6, .col-lg-12').addClass('map-render-container');
        angular.element('.si-float-wrapper').addClass('map-render-info');
        element.addClass('map-render');
        $scope.fitBounds();

        //wait for event
        var mapTilesLoadedListener = $rootScope.$on('mapTilesLoaded', function () {
            $scope.fitBounds();
            $timeout(function () {
                var element = angular.element(".map-container").get(0); //html2canvas needs the native node
                //capture map as canvas
                html2canvas(element, {
                    useCORS: true,
                    allowTaint: false,
                    x: 0,
                    y: 0,
                    onclone: function (clone) {
                        //hack the google indicator out
                        jQuery(clone).find('a[target=_blank]:not(.gm-style-cc)').parent().remove();
                    },
                    removeContainer: true,
                    windowWidth: 2400,
                    windowHeight: 2400,
                    ignoreElements: function (element) {
                        var $element = jQuery(element);
                        //|| $element.attr('target') == '_blank'
                        return $element.hasClass('gmnoprint') || $element.hasClass('si-close-button') || $element.hasClass('gm-style-cc');
                    }
                }).then(canvas => {
                    //render completed
                    document.body.appendChild(canvas)

                    //reset styling
                    var element = angular.element(".map-container");
                    element.removeClass('map-render');
                    angular.element('.col-lg-6, .col-lg-12').removeClass('map-render-container');
                    //rescale map
                    $scope.fitBounds();
                    //export as image
                    canvas.toBlobHD(function (blob) {
                        saveAs(blob, $scope.id + '.png');

                        jQuery(canvas).remove();
                    });


                });
                //unregister event listener
                mapTilesLoadedListener();
            }, 250);
        })

        //html2canvas(document.getElementById("map"), {
        //    useCORS: true,
        //    onrendered: function (canvas) {
        //        var img = canvas.toDataURL("image/png");
        //        img = img.replace('data:image/png;base64,', '');
        //        var finalImageSrc = 'data:image/png;base64,' + img;
        //        jQuery('<a/>').attr('src', finalImageSrc).attr('download',route.Name+'.png').trigger('click');
        //    }
        //});
    };

});

app.controller('calendarController', function ($scope, RouteService, CalendarService, $routeParams, $location) {
    $scope.id = $routeParams.id;
    $scope.loading = true;
    RouteService.getRoutes().then(function (data) {
        $scope.routes = data;
        CalendarService.getCalendar().then(function (data) {
            $scope.allEvents = data.events;
            $scope.covidAlert = data.covidAlert;
            _.each($scope.allEvents, function (item) {
                item.route = _.find($scope.routes, function (route) { return route.id === item.id; });
                item.moment = moment(item.timestamp);
                item.day = item.moment.format('DD');
                item.month = item.moment.format('MMM');
                item.year = item.moment.format('YYYY');
                item.time = item.moment.format('HH:mm a');
                item.view = function () {
                    $location.path('routes/' + item.route.id); // path not hash
                };
            })
            var now = moment();
            var events = _.partition($scope.allEvents, function (event) {
                return event.moment.isBefore(now);
            });
            $scope.upcomingEvents = _.sortBy(events[1], function (event) { return event.moment.unix(); });
            if ($scope.covidAlert && $scope.covidAlert.enabled && !$scope.covidAlert.showUpcomingEvents) {
                $scope.upcomingEvents = [];
            }
            $scope.pastEvents = _.sortBy(events[0], function (event) { return -event.moment.unix(); });

            $scope.loading = false;
        });
    })

    $scope.list = function () {
        $location.path('routes/all'); // path not hash
    };


});

app.controller('paceCalculatorController', function ($scope) {

});
