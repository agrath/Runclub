
/*
todo:
    -   meet here
    -   layer toggles (show km markers | show points of interest | show route | show meeting place )
    -   after run info
    -   calendar + meet time + link to meetup
    -   (v2) submit your run

*/

/*
Get a latitude and longitude for an address here: https://www.gps-coordinates.net/
Convert a strava activity to a GPX with this bookmarklet: https://mapstogpx.com/strava/
Generate a randomized id here: https://passwordsgenerator.net/ (8 character, alpha)
Name the gpx file $id.gpx and copy the template json blob into the array, fill out the details
*/

app.controller('routesController', function ($scope, $http, style) {

    $scope.markers = [];

    initializePolylineHelpers();

    //fetch route data from external json file
    $http.get('routes/db.json').then(function (res) {
        //store in scope
        console.log('route data loaded');
        $scope.data = res.data;
        _.each($scope.data, function (route) {
            var id = route.id;
            if (!route.enabled) return;
            route.displayGpxRoute = true;
            route.displayDistanceMarkers = true;

            //by convention, get the gpx file
            var url = 'routes/' + id + '.gpx';
            route.gpxFile = url;
            console.log('loading ' + url);

            $http(
                {
                    method: 'get',
                    url: url,
                    transformResponse: function (data) {
                        // string -> XML document object
                        return $.parseXML(data);
                    }
                }).then(function (transport) {
                    var data = transport.data;
                    //gpx file has been loaded from url
                    console.log('loaded ' + url, data);
                    route.gpx = data;
                    route.gpxLoaded = true;
                });

        });
    });

});




