function toArray(arr) {
    return Array.prototype.slice.call(arr);
}

Function.prototype.curry = function () {
    if (arguments.length < 1) {
        return this; //nothing to curry with - return function
    }
    var __method = this;
    var args = toArray(arguments);
    return function () {
        return __method.apply(this, args.concat(toArray(arguments)));
    }
}
/*
todo:
    -   meet here
    -   km markers
    -   elevation graph
    -   key indicators - water, toilets, lookout/photo, carpark
    -   download gpx
    -   terrain indicators
    -   diversion polylines
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

/*
        {
            "id": "abcABC",
            "name": "",
            "description": "Line1\r\nLine2",
            "meetingPoint": {
                "label": "",
                "latitude": -36.0,
                "longitude": 174.0
            },
            "mapDefaults": {
              "center": {
                "latitude": -36.848448,
                "longitude": 174.762191
              },
              "zoom": 12
            },
            "distanceOptions": [
                0,
                0,
            ]
        },
    */

var app = angular.module('routesApp', ['uiGmapgoogle-maps', 'ngSanitize']);
//configure google maps library (including api key)
app.config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyDeWHf1yBGiJgWoaQH_PEN2bnwZ2aCFSbE',
        v: '3.29', //defaults to latest 3.X anyhow
        libraries: 'geometry,visualization'
    });
})
app.filter('br', function () {
    return function (text) {
        return text.replace(/\r?\n/g, '<br/>');
    }
});

app.controller('routesController', function ($scope, $http, uiGmapGoogleMapApi) {
    $scope.map = {
        options: {
            fullscreenControl: true
        },
        events: {
            tilesloaded: function (map, route) {
                $scope.$apply(function () {
                    console.log('fetched map instance', map, route);
                    var id = jQuery(map.getDiv()).closest('.map-container').data('route-id');
                    var route = _.find($scope.data, function (item) { return item.id === id; });
                    console.log('route', route);

                    var url = 'routes/' + id + '.gpx';
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
                            console.log('loaded ' + url, data);
                            route.gpx = data;
                            console.log('gpx', data);
                            var parser = new GPXParser(data, map);
                            parser.setTrackColour("#20bc5c");     // Set the track line colour
                            parser.setTrackWidth(3);          // Set the track line width
                            parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
                            parser.centerAndZoom(data);
                            parser.addTrackpointsToMap();         // Add the trackpoints
                            parser.addRoutepointsToMap();         // Add the routepoints
                            parser.addWaypointsToMap();           // Add the waypoints
                            route.loading = false;
                        });

                });
            }
        }
    }
    // uiGmapGoogleMapApi is a promise.
    // The "then" callback function provides the google.maps object.
    uiGmapGoogleMapApi.then(function (maps) {
        console.log('google maps api ready');
        //uiGmapIsReady.promise(1).then(function (instances) {
        //    console.log('ui map ready');
        //    instances.forEach(function (inst) {
        //        var map = inst.map;
        //        var uuid = map.uiGmap_id;
        //        var mapInstanceNumber = inst.instance; // Starts at 1.
        //        console.log('map is loaded ' + mapInstanceNumber);
        //    });
        //});
        //console.log(maps);
        //fetch route data from external json file
        $http.get('routes/db.json')
            .then(function (res) {
                //store in scope
                console.log('route data loaded');
                $scope.data = res.data;
                for (var i = 0; i < $scope.data.length; i++) {
                    $scope.data[i].loading = true;
                }
            });
    });
});
/*
            var parser = new GPXParser(data, map);
            parser.setTrackColour("#ff0000");     // Set the track line colour
            parser.setTrackWidth(5);          // Set the track line width
            parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
            parser.centerAndZoom(data);
            parser.addTrackpointsToMap();         // Add the trackpoints
            parser.addRoutepointsToMap();         // Add the routepoints
            parser.addWaypointsToMap();           // Add the waypoints

*/