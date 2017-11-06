/*
todo:
    -   meet here
    -   download gpx
    -   diversion polylines
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
            ],
            "terrain": [
              {
                "type": "trail",
                "label": "Trail",
                "percent": 10
              },
              {
                "type": "urban",
                "label": "Urban",
                "percent": 90
              }
            ],
        },
    */

var app = angular.module('routesApp', ['uiGmapgoogle-maps', 'ngSanitize', 'chart.js']);

//configure google maps library (including api key)
app.config(function (uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyDeWHf1yBGiJgWoaQH_PEN2bnwZ2aCFSbE',
        v: '3.29', //defaults to latest 3.X anyhow
        libraries: 'geometry,visualization'
    });
})

//this filter transforms newlines into brs
app.filter('br', function () {
    return function (text) {
        if (!text) return text;
        return text.replace(/\r?\n/g, '<br/>');
    }
});

app.controller('routesController', function ($scope, $http, uiGmapGoogleMapApi) {
    var lineGreen = '#20bc5c';

    $scope.markers = [];
    $scope.map = {
        options: {
            fullscreenControl: true
        },
        events: {
            tilesloaded: function (map) {
                //this soup needs some refactoring love
                $scope.$apply(function () {
                    //the tilesLoaded event is invoked multiple times so we only do this the first time
                    //we only use tilesLoaded because the angular maps control doesn't provide an onload callback that i can find
                    if (map.gpxLoaded) return;
                    map.gpxLoaded = true;
                    console.log('fetched map instance', map, route);

                    //using the div for the map, and jquery, walk up to the container to get the route id which is placed by binding
                    var id = jQuery(map.getDiv()).closest('.map-container').data('route-id');
                    //find the original route object in the scope (so we can update it)
                    var route = _.find($scope.data, function (item) { return item.id === id; });
                    console.log('route', route);

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
                            //console.log('gpx', data);

                            //invoke the parser with a reference to the map
                            var parser = new GPXParser(data, map);
                            parser.setTrackColour(lineGreen);     // Set the track line colour
                            parser.setTrackWidth(3);          // Set the track line width
                            parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
                            parser.centerAndZoom(data);
                            var polylines = parser.addTrackpointsToMap();         // Add the trackpoints
                            parser.addRoutepointsToMap();         // Add the routepoints
                            parser.addWaypointsToMap();           // Add the waypoints

                            //grab the elevation data
                            var elevationData = parser.extractElevationData();

                            //the gpx parser library exposes nested arrays as the gpx may contain multiple tracks
                            var polyline = _.flatten(polylines)[0];

                            var markers = [];
                            //compute the polyline length
                            var lengthInMeters = google.maps.geometry.spherical.computeLength(polyline.getPath());
                            console.log('route length is ', lengthInMeters);

                            //this is the map marker icon as svg
                            //we template it so we can update the text element
                            var template = [
                                '<?xml version="1.0"?>',
                                '<svg xmlns="http://www.w3.org/2000/svg" width="94" height="128">',
                                '<path d="M46.977 126.643c-.283-.687-6.163-6.437-10.374-11.662C11.656 81.86-16.157 51.084 16.32 13.684 30.7-.21 48.433-1.003 66.663 5.473c51.33 29.702 14.166 78.155-10.236 110.008l-9.45 11.163zm15.44-50.77c34.237-24.486 7.768-71.634-29.848-55.96C21.584 25.77 16.134 35.96 15.943 47.98 15.42 59.675 21.63 69.453 31.47 75.44c7.056 3.842 10.157 4.535 18.146 4.06 5.178-.31 8.16-1.155 12.8-3.628zM37.164 87.562a44.99 43.92 0 1 1 1.12.22" fill="green" fill-opacity=".988"/>',
                                '<path d="M44.277 69.13a26.01 20.99 0 1 1 .648.103" opacity=".34" fill="none"/><path d="M32.537 114.28a16.656 11.75 0 1 1 .416.06" fill="none"/>',
                                '    <path d="M40.106 81.38a33.426 34.453 0 1 1 .833.173" fill="#009400"/>',
                                '<path d="M42.017 69.425a22.106 22.59 0 1 1 .55.112" fill="#fff"/>',
                                '<text x="45" y="58" text-anchor="middle" font-family="Open Sans Bold" font-weight="600" font-size="30px" fill="#000000">{{km}}</text>',
                                '</svg>'
                            ].join('\n');

                            for (var i = 1000; i < lengthInMeters; i += 1000) {
                                var km = i / 1000;
                                //inject the km marker into the template
                                var svg = template.replace('{{km}}', km);
                                //pass the injected svg as a data-uri svg
                                var icon = new google.maps.MarkerImage('data:image/svg+xml;charset=UTF-8;base64,' + btoa(svg), null, null, null, new google.maps.Size(28, 32));
                                var point = polyline.GetPointAtDistance(i);
                                if (point) {
                                    markers.push({
                                        id: km,
                                        latitude: point.lat(),
                                        longitude: point.lng(),
                                        title: km + 'km',
                                        icon: icon,
                                        options: {
                                            zIndex: km
                                        }
                                    });
                                }
                            }
                            //add places of interest markers to the markers collection
                            var placesOfInterest = route.placesOfInterest;
                            if (placesOfInterest) {
                                for (var i = 0; i < placesOfInterest.length; i++) {
                                    var place = placesOfInterest[i];
                                    var icon = new google.maps.MarkerImage('/images/map-icons/' + place.type + '.png', null, null, null, new google.maps.Size(32, 32));
                                    markers.push({
                                        id: 'place' + i,
                                        latitude: place.latitude,
                                        longitude: place.longitude,
                                        icon: icon,
                                        options: {
                                            zIndex: place.zIndex ? (place.zIndex + 100) : 100
                                        }
                                    });
                                }
                            }
                            route.markers = markers;

                            //elevation chart
                            Chart.defaults.global.colors = [lineGreen];
                            route.chart = {
                                options: {
                                    scales: {
                                        xAxes: [
                                            {
                                                id: 'x-axis-0',
                                                type: 'category',
                                                display: true,
                                                ticks: {
                                                    maxTicksLimit: Math.ceil(lengthInMeters / 1000)
                                                }
                                            }
                                        ]
                                    }
                                },
                                data: [],
                                labels: []
                            };
                            
                            var last = new google.maps.LatLng(elevationData[0].latitude, elevationData[0].longitude);
                            var distance = 0, distanceSteppedMax = 0, elevation = 0;
                            var lastElevation = elevationData[0].elevation;
                            var step = function (number, increment, offset) {
                                return Math.ceil((number - offset) / increment) * increment + offset;
                            }
                            for (var i = 1; i < elevationData.length; i++) {
                                var point = elevationData[i];
                                var current = new google.maps.LatLng(point.latitude, point.longitude);
                                var metersSinceLastPoint = google.maps.geometry.spherical.computeDistanceBetween(last, current);
                                last = current;
                                distance += metersSinceLastPoint;
                                var elevationDelta = point.elevation - lastElevation;
                                lastElevation = point.elevation;
                                elevation += elevationDelta;
                                if (elevation < 0) elevation = 0;
                                var distanceStepped = step(distance, 100, 0);
                                if (distanceStepped % 100 == 0 && distanceStepped > distanceSteppedMax) {
                                    distanceSteppedMax = distanceStepped;
                                    route.chart.data.push(Math.round(elevation));
                                    route.chart.labels.push(Math.ceil(distanceStepped / 1000) - 1 + ' km');
                                }
                            }

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
        initializePolylineHelpers();
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

Chart.pluginService.register({
    afterUpdate: function (chart) {
        var xScale = chart.scales['x-axis-0'];
        if (xScale.options.ticks.maxTicksLimit) {
            // store the original maxTicksLimit
            xScale.options.ticks._maxTicksLimit = xScale.options.ticks.maxTicksLimit;
            // let chart.js draw the first and last label
            xScale.options.ticks.maxTicksLimit = (xScale.ticks.length % xScale.options.ticks._maxTicksLimit === 0) ? 1 : 2;

            var originalXScaleDraw = xScale.draw
            xScale.draw = function () {
                originalXScaleDraw.apply(this, arguments);

                var xScale = chart.scales['x-axis-0'];
                if (xScale.options.ticks.maxTicksLimit) {
                    var helpers = Chart.helpers;

                    var tickFontColor = helpers.getValueOrDefault(xScale.options.ticks.fontColor, Chart.defaults.global.defaultFontColor);
                    var tickFontSize = helpers.getValueOrDefault(xScale.options.ticks.fontSize, Chart.defaults.global.defaultFontSize);
                    var tickFontStyle = helpers.getValueOrDefault(xScale.options.ticks.fontStyle, Chart.defaults.global.defaultFontStyle);
                    var tickFontFamily = helpers.getValueOrDefault(xScale.options.ticks.fontFamily, Chart.defaults.global.defaultFontFamily);
                    var tickLabelFont = helpers.fontString(tickFontSize, tickFontStyle, tickFontFamily);
                    var tl = xScale.options.gridLines.tickMarkLength;

                    var isRotated = xScale.labelRotation !== 0;
                    var yTickStart = xScale.top;
                    var yTickEnd = xScale.top + tl;
                    var chartArea = chart.chartArea;

                    // use the saved ticks
                    var maxTicks = xScale.options.ticks._maxTicksLimit - 1;
                    var ticksPerVisibleTick = xScale.ticks.length / maxTicks;

                    // chart.js uses an integral skipRatio - this causes all the fractional ticks to be accounted for between the last 2 labels
                    // we use a fractional skipRatio
                    var ticksCovered = 0;
                    helpers.each(xScale.ticks, function (label, index) {
                        if (index < ticksCovered)
                            return;

                        ticksCovered += ticksPerVisibleTick;

                        // chart.js has already drawn these 2
                        if (index === 0 || index === (xScale.ticks.length - 1))
                            return;

                        // copy of chart.js code
                        var xLineValue = this.getPixelForTick(index);
                        var xLabelValue = this.getPixelForTick(index, this.options.gridLines.offsetGridLines);

                        if (this.options.gridLines.display) {
                            this.ctx.lineWidth = this.options.gridLines.lineWidth;
                            this.ctx.strokeStyle = this.options.gridLines.color;

                            xLineValue += helpers.aliasPixel(this.ctx.lineWidth);

                            // Draw the label area
                            this.ctx.beginPath();

                            if (this.options.gridLines.drawTicks) {
                                this.ctx.moveTo(xLineValue, yTickStart);
                                this.ctx.lineTo(xLineValue, yTickEnd);
                            }

                            // Draw the chart area
                            if (this.options.gridLines.drawOnChartArea) {
                                this.ctx.moveTo(xLineValue, chartArea.top);
                                this.ctx.lineTo(xLineValue, chartArea.bottom);
                            }

                            // Need to stroke in the loop because we are potentially changing line widths & colours
                            this.ctx.stroke();
                        }

                        if (this.options.ticks.display) {
                            this.ctx.save();
                            this.ctx.translate(xLabelValue + this.options.ticks.labelOffset, (isRotated) ? this.top + 12 : this.options.position === "top" ? this.bottom - tl : this.top + tl);
                            this.ctx.rotate(helpers.toRadians(this.labelRotation) * -1);
                            this.ctx.font = tickLabelFont;
                            this.ctx.textAlign = (isRotated) ? "right" : "center";
                            this.ctx.textBaseline = (isRotated) ? "middle" : this.options.position === "top" ? "bottom" : "top";
                            this.ctx.fillText(label, 0, 0);
                            this.ctx.restore();
                        }
                    }, xScale);
                }
            };
        }
    },
});