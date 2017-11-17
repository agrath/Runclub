app.directive('ngIncludeTemplate', function () {
    return {
        templateUrl: function (elem, attrs) { return attrs.ngIncludeTemplate; },
        restrict: 'A',
        scope: {
            'ngIncludeVariables': '&'
        },
        link: function (scope, elem, attrs) {
            var vars = scope.ngIncludeVariables();
            console.log('vars', vars);
            Object.keys(vars).forEach(function (key) {
                scope[key] = vars[key];
            });
        }
    }
});

app.directive('displayRatingStars', function (style) {
    return {
        restrict: 'E',
        scope: {
            value: '<',
            max: '<',
        },
        template: '<div class="rating-container"></div>',
        link: function ($scope, element, attributes, ngModelCtrl) {
            var container = element.find(".rating-container");
            $scope.loading = true;
            var value = $scope.value;
            var max = $scope.max;
            for (var i = 0; i < max; i++) {
                var rating = jQuery('<div></div>').addClass("rating");
                var icon = jQuery('<i></i>').addClass('fa');
                if (value >= i && value > i + 1) {
                    icon.addClass('fa-star')
                    rating.addClass('active');
                } else if (value >= i + 0.5 && value < i + 1) {
                    icon.addClass('fa-star-half-o');
                    rating.addClass('active-half');
                } else {
                    icon.addClass('fa-star-o');
                }
                container.append(rating.append(icon));
            }
        }
    };
});

app.directive('gpxViewer', function ($timeout, style) {
    var helper =
        {
            distanceMarkerIcons: [
                [
                    '<?xml version="1.0"?>',
                    '<svg xmlns= "http://www.w3.org/2000/svg" width= "40" height= "40" viewBox="0 0 10.583333 10.583332">',
                    '  <g transform="translate(271.16771,-49.144185)">',
                    '    <path style="fill:#20bc5c;fill-opacity:1;stroke:#000000;stroke-width:0.01369718;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"',
                    '          d="m -269.41966,49.163168 h 8.35147 c 0.21764,0 0.5417,0.372559 0.5417,0.609381 v 5.843323 c 0,0.236828 -0.29099,0.677277 -0.50863,0.675525 l -2.05478,-0.01654 h -2.17055 -1.3904 l -4.46566,3.49756 2.26688,-3.49756 h -0.63617 c -0.21764,0 -0.50861,-0.356016 -0.50861,-0.592844 0,-2.030456 0,0.340007 0,-5.909468 0,-0.236822 0.35711,-0.609381 0.57475,-0.609381 z"',
                    '    />',
                    '    <text xml:space="preserve" style="font-size:5.64444447px;line-height:1.25;font-family:Calibri;text-align:center;text-anchor:middle;fill:#FFFFFF;stroke-width:0.26458332"',
                    '          x="-265.18155" y="54.430794">{{km}}</text>',
                    '  </g>',
                    '</svg>'
                ].join('\n'),
                [
                    '<?xml version="1.0"?>',
                    '<svg xmlns= "http://www.w3.org/2000/svg" width= "40" height= "40" viewBox="0 0 10.583333 10.583332">',
                    '   <g transform="matrix(-1,0,0,1,-260.47419,-49.144185)">',
                    '    <path style="fill:#20bc5c;fill-opacity:1;stroke:#000000;stroke-width:0.01369718;stroke-miterlimit:4;stroke-dasharray:none;stroke-opacity:1"',
                    '          d="m -269.41966,49.163168 h 8.35147 c 0.21764,0 0.5417,0.372559 0.5417,0.609381 v 5.843323 c 0,0.236828 -0.29099,0.677277 -0.50863,0.675525 l -2.05478,-0.01654 h -2.17055 -1.3904 l -4.46566,3.49756 2.26688,-3.49756 h -0.63617 c -0.21764,0 -0.50861,-0.356016 -0.50861,-0.592844 0,-2.030456 0,0.340007 0,-5.909468 0,-0.236822 0.35711,-0.609381 0.57475,-0.609381 z"',
                    '    />',
                    '  </g>',
                    '  <g transform="translate(271.16771,-49.144185)">',
                    '    <text xml:space="preserve" style="font-size:5.64444447px;line-height:1.25;font-family:Calibri;text-align:center;text-anchor:middle;fill:#FFFFFF;stroke-width:0.26458332"',
                    '          x="-265.18155" y="54.430794">{{km}}</text>',
                    '  </g>',
                    '</svg>'
                ].join('\n')
            ],
            parseGpx: function (data, map) {
                var parser = new GPXParser(data, map);
                parser.setTrackColour(style.lineStrokeColour);     // Set the track line colour
                parser.setTrackWidth(style.lineStrokeWidth);          // Set the track line width
                parser.setMinTrackPointDelta(0);      // Set the minimum distance between track points
                parser.centerAndZoom(data);
                var polylines = parser.addTrackpointsToMap();         // Add the trackpoints
                //the gpx parser library exposes nested arrays as the gpx may contain multiple tracks
                var polyline = _.flatten(polylines)[0];
                return polyline;
            },
            getDistanceMarkers: function (polyline, length, interval, svgIcons, alignmentHint) {
                var markers = [];
                for (var i = interval; i < length; i += interval) {
                    var km = i / interval;
                    //inject the km marker into the template
                    var alignment = 0
                    if (alignmentHint) {
                        if (km <= alignmentHint.length) {
                            alignment = alignmentHint[km - 1];
                        }
                    }
                    var anchor = alignment === 0 ? new google.maps.Point(0, 32) : new google.maps.Point(32, 32);
                    var svg = svgIcons[alignment].replace('{{km}}', km)
                    //pass the injected svg as a data-uri svg
                    var icon = new google.maps.MarkerImage('data:image/svg+xml;charset=UTF-8;base64,' + btoa(svg), null, null, anchor, new google.maps.Size(32, 32));
                    var point = polyline.GetPointAtDistance(i);
                    if (point) {
                        markers.push({
                            id: km,
                            latitude: point.lat(),
                            longitude: point.lng(),
                            title: km + 'km',
                            icon: icon,
                            zIndex: google.maps.Marker.MAX_ZINDEX + km
                        });
                    }
                }
                return markers;
            },
            getPlacesOfInterestMarkers: function (route) {
                var markers = [];
                //add places of interest markers to the markers collection
                var placesOfInterest = route.placesOfInterest;
                var placesOfInterestOptions;
                if (route.placesOfInterestOptions) {
                    // read placesOfInterestOptions into a dictionary for fast lookup later
                    placesOfInterestOptions = {};
                    for (var o = 0; o < route.placesOfInterestOptions.length; o++) {
                        placesOfInterestOptions[route.placesOfInterestOptions[o].type] = route.placesOfInterestOptions[o];
                    }
                }
                if (placesOfInterest) {
                    for (var i = 0; i < placesOfInterest.length; i++) {
                        var place = placesOfInterest[i];
                        var options;
                        if (placesOfInterestOptions) {
                            options = placesOfInterestOptions[place.type];
                        }

                        var width = 32 * (options && options.widthMultiplier ? options.widthMultiplier : (place.widthMultiplier ? place.widthMultiplier : 1));
                        var height = 32 * (options && options.heightMultiplier ? options.heightMultiplier : (place.heightMultiplier ? place.heightMultiplier : 1));
                        var icon = new google.maps.MarkerImage('/images/map-icons/' + place.type + '.png', null, null, new google.maps.Point(16, 16), new google.maps.Size(width, height));
                        var marker = {
                            id: 'place' + i,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            icon: icon,
                            zIndex: google.maps.Marker.MAX_ZINDEX + 100 + (options && options.zIndex ? options.zIndex : (place.zIndex ? place.zIndex : 0))
                        };
                        markers.push(marker);
                        options.markers = options.markers || [];
                        options.markers.push(marker);
                    }
                }
                return markers;
            },
            addDiversionToMap: function (diversion, map) {
                //console.log('diversion', diversion);
                var o = {};
                var polylineCoordinates = [];
                for (var p = 0; p < diversion.points.length; p++) {
                    var pair = diversion.points[p];
                    polylineCoordinates.push(new google.maps.LatLng(pair[0], pair[1]));
                }

                var lineSymbol = {
                    path: style.diversionLinePath,
                    strokeOpacity: 1,
                    scale: 4,
                    strokeColor: diversion.strokeColour || '#f27b08'
                };

                var line = new google.maps.Polyline({
                    path: polylineCoordinates,
                    strokeOpacity: 0,
                    icons: [{
                        icon: lineSymbol,
                        offset: '0',
                        repeat: style.diversionLineSpacing
                    }],
                    map: map
                });
                o.line = line;
                //mouse hovers the polyline
                google.maps.event.addListener(line, 'mouseover', function () {
                    //the mouseover event will fire immediately, so we use a timeout to cause it to be a slow hover
                    //console.log('polyline.mouseover', this);
                    var self = this;
                    if (self.info) {
                        //start a timeout and store it on the polyline
                        this.infoTimeout = window.setTimeout(function () {
                            //console.log('polyline.mouseover.timeout');
                            //timeout is up, show info box if it is not already open
                            if (!self.info.isOpen()) {
                                self.info.open();
                                self.info.openedByHover = true;
                            }
                            //clear timeout reference
                            self.infoTimeout = null;

                        }, 100);
                    }
                });

                //mouse leaves the polyline
                google.maps.event.addListener(line, 'mouseout', function () {
                    //console.log('polyline.mouseout', this);
                    //if we started a timeout in the mouseover
                    if (this.infoTimeout)
                    {
                        //clear it - means a fast mouse move over the polyline doesn't trigger the info
                        window.clearTimeout(this.infoTimeout);
                        this.infoTimeout = null;
                    }
                    if (this.info && this.info.isOpen() && this.info.openedByHover)
                    {
                        this.info.openedByHover = false;
                        this.info.close();
                    }
                });

                //polyline is clicked
                google.maps.event.addListener(line, 'click', function () {
                    //console.log('polyline.click', this);
                    if (this.info && this.info.isOpen() && this.info.openedByHover)
                    {
                        //lock it open so the mouseout doesn't close it
                        this.info.openedByHover = false;
                        if (this.infoTimeout) {
                            //clear timeout
                            window.clearTimeout(this.infoTimeout);
                            this.infoTimeout = null;
                        }
                    }
                });

                if (diversion.label) {
                    var label = diversion.label;
                    //var labelMarkerTemplateSvg = [
                    //    '<?xml version= "1.0" encoding= "utf-8" ?>',
                    //    '    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"',
                    //    '        width="48px" height="48px" viewBox="0 0 48 48" xml:space="preserve">',
                    //    '        <path fill="{{backgroundColour}}" class="path1" d="M8 2.1c1.1 0 2.2 0.5 3 1.3 0.8 0.9 1.3 1.9 1.3 3.1s-0.5 2.5-1.3 3.3l-3 3.1-3-3.1c-0.8-0.8-1.3-2-1.3-3.3 0-1.2 0.4-2.2 1.3-3.1 0.8-0.8 1.9-1.3 3-1.3z"></path>',
                    //    '        <path fill="#000" class="path2" d="M8 15.8l-4.4-4.6c-1.2-1.2-1.9-2.9-1.9-4.7 0-1.7 0.6-3.2 1.8-4.5 1.3-1.2 2.8-1.8 4.5-1.8s3.2 0.7 4.4 1.9c1.2 1.2 1.8 2.8 1.8 4.5s-0.7 3.5-1.8 4.7l-4.4 4.5zM4 10.7l4 4.1 3.9-4.1c1-1.1 1.6-2.6 1.6-4.2 0-1.5-0.6-2.9-1.6-4s-2.4-1.7-3.9-1.7-2.9 0.6-4 1.7c-1 1.1-1.6 2.5-1.6 4 0 1.6 0.6 3.2 1.6 4.2v0z"></path>',
                    //    '        <path fill="#000" class="path3" d="M8 16l-4.5-4.7c-1.2-1.2-1.9-3-1.9-4.8 0-1.7 0.6-3.3 1.9-4.6 1.2-1.2 2.8-1.9 4.5-1.9s3.3 0.7 4.5 1.9c1.2 1.3 1.9 2.9 1.9 4.6 0 1.8-0.7 3.6-1.9 4.8l-4.5 4.7zM8 0.3c-1.6 0-3.2 0.7-4.3 1.9-1.2 1.2-1.8 2.7-1.8 4.3 0 1.7 0.7 3.4 1.8 4.5l4.3 4.5 4.3-4.5c1.1-1.2 1.8-2.9 1.8-4.5s-0.6-3.1-1.8-4.4c-1.2-1.1-2.7-1.8-4.3-1.8zM8 15.1l-4.1-4.2c-1-1.2-1.7-2.8-1.7-4.4s0.6-3 1.7-4.1c1.1-1.1 2.6-1.7 4.1-1.7s3 0.6 4.1 1.7c1.1 1.1 1.7 2.6 1.7 4.1 0 1.6-0.6 3.2-1.7 4.3l-4.1 4.3zM4.2 10.6l3.8 4 3.8-4c1-1 1.6-2.6 1.6-4.1s-0.6-2.8-1.6-3.9c-1-1-2.4-1.6-3.8-1.6s-2.8 0.6-3.8 1.6c-1 1.1-1.6 2.4-1.6 3.9 0 1.6 0.6 3.1 1.6 4.1v0z"></path>',
                    //    '    </svg>'].join('\n');
                    //var labelMarkerSvg = labelMarkerTemplateSvg.replace('{{backgroundColour}}', (label.backgroundColour || 'rgba(0, 0, 0, 0.7)'));
                    //var icon = new google.maps.MarkerImage('data:image/svg+xml;charset=UTF-8;base64,' + btoa(labelMarkerSvg), null, null, new google.maps.Point(-8, 0), new google.maps.Size(48, 48));
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(label.anchor.latitude, label.anchor.longitude),
                        map: map,
                        //icon: icon,
                        //visible: true
                        visible: false
                    });
                    o.marker = marker;
                    var info = new SnazzyInfoWindow({
                        marker: marker,
                        placement: label.placement || 'right',
                        offset: label.offset,
                        maxWidth: 180,
                        content: '<strong>' + label.title + '</strong>' +
                        '<div>' + label.description + '</div>',
                        showCloseButton: label.showCloseButton || false,
                        closeOnMapClick: false,
                        padding: '10px',
                        backgroundColor: label.backgroundColour || 'rgba(0, 0, 0, 0.7)',
                        border: false,
                        borderRadius: '0px',
                        shadow: false,
                        fontColor: label.fontColour || '#fff',
                        fontSize: label.fontSize || '14px'
                    });
                    if (label.visible) {
                        info.open();
                    }
                    o.info = info;
                    line.info = info;
                }
                return o;
            },
            addMarkerToMap: function (data, map) {
                var point = new google.maps.LatLng(data.latitude, data.longitude);
                var marker = new google.maps.Marker({
                    position: point,
                    map: map,
                    icon: data.icon,
                    optimised: false,
                    zIndex: data.zIndex
                });
                google.maps.event.addListener(marker, 'click', function (event) {
                    var lat = event.latLng.lat();
                    lat = lat.toFixed(8);
                    var lng = event.latLng.lng();
                    lng = lng.toFixed(8);
                    console.log("\"latitude\": " + lat + ",\n\"longitude\": " + lng);
                });
                return marker;
            },
            addAnnotationToMap: function (annotation, map) {
                //console.log('annotation', annotation);

                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(annotation.anchor.latitude, annotation.anchor.longitude),
                    map: map,
                    visible: false
                });
                var info = new SnazzyInfoWindow({
                    marker: marker,
                    placement: annotation.placement || 'right',
                    offset: annotation.offset,
                    maxWidth: 180,
                    content: '<strong>' + annotation.title + '</strong>' +
                    '<div>' + annotation.description + '</div>',
                    showCloseButton: annotation.showCloseButton || false,
                    closeOnMapClick: false,
                    padding: '10px',
                    backgroundColor: annotation.backgroundColour || 'rgba(0, 0, 0, 0.7)',
                    border: annotation.border,
                    borderRadius: '0px',
                    shadow: false,
                    fontColor: annotation.fontColour || '#fff',
                    fontSize: annotation.fontSize || '14px'
                });
                info.open();
                return info;
            },
            addMeetingPointToMap: function (scope, meetingPoint, route, map) {
                //console.log('meetingPoint', meetingPoint);

                var marker = new google.maps.Marker({
                    position: new google.maps.LatLng(meetingPoint.latitude, meetingPoint.longitude),
                    map: map,
                    visible: false
                });
                var info = new SnazzyInfoWindow({
                    marker: marker,
                    placement: meetingPoint.placement || 'right',
                    offset: meetingPoint.offset,
                    maxWidth: 180,
                    content: '<h4>Meet here</h4>' +
                    '<div>' + meetingPoint.label + '</div>',
                    closeOnMapClick: false,
                    padding: '10px',
                    backgroundColor: '#ffffff',
                    border: true,
                    borderRadius: '0px',
                    shadow: false,
                    fontColor: '#000000',
                    fontSize: '14px',
                    showCloseButton: true,
                    callbacks: {
                        afterClose: function () {
                            //console.log('meetingPoint.close', this, route);
                            route.displayMeetingPoint = false;
                            //console.log(route.displayMeetingPoint);
                            //tell angular we changed this
                            scope.$apply();
                        }
                    }
                });
                info.open();
                return info;
            }
        };
    return {
        restrict: 'E',
        scope: {
            route: '='
        },
        template: '<div class="map-loading" ng-show="loading"><div class="run"></div></div><div class="map-canvas"></div>',
        link: function ($scope, element, attributes, ngModelCtrl) {

            $scope.loading = true;
            var route = $scope.route;
            route.gpx().then(function (gpx) {

                //console.log('map.directive.init');

                $scope.$watch('route.displayGpxRoute', function (v) {
                    //console.log('route.displayGpxRoute', v);
                    $scope.gpxPolyline.setMap(v ? $scope.map : null);
                });
                $scope.$watch('route.displayDistanceMarkers', function (v) {
                    //console.log('route.displayDistanceMarkers', v);
                    _.each($scope.distanceMarkers, function (marker) {
                        marker.g.setMap(v ? $scope.map : null);
                    });
                });
                if (route.placesOfInterestOptions) {
                    $scope.$watch(function ($scope) {
                        return route.placesOfInterestOptions.map(function (p) {
                            return p.visible;
                        });
                    }, function (v) {
                        //console.log('route.placeOfInterestOption', v);
                        _.each(route.placesOfInterestOptions, function (option, index) {
                            //console.log('option', option, index, v[index]);
                            var visible = v[index];
                            if (option.markers && option.markers.length) {
                                _.each(option.markers, function (marker) {
                                    if ((marker.g.map && !visible) || (!marker.g.map && visible)) {
                                        marker.g.setMap(visible ? $scope.map : null);
                                    }
                                });
                            }
                        });
                    }, true);
                }
                if (route.diversions && route.diversions.length) {
                    $scope.$watch(function ($scope) {
                        return route.diversions.map(function (diversion) {
                            return diversion.visible;
                        });
                    }, function (v) {
                        //console.log('route.diversions', v);
                        _.each(route.diversions, function (diversion, index) {
                            //console.log('diversion', diversion, index, v[index]);
                            var visible = v[index];
                            if (diversion.g && diversion.g) {
                                if ((diversion.g.line.map && !visible) || (!diversion.g.line.map && visible)) {
                                    diversion.g.line.setMap(visible ? $scope.map : null);
                                    diversion.g.marker.setMap(visible ? $scope.map : null);
                                    diversion.g.info.setMap(visible ? $scope.map : null);
                                    diversion.g.info.close();
                                }
                            }
                        });
                    }, true);
                }

                if (route.annotations && route.annotations.length) {
                    $scope.$watch('route.displayAnnotations', function (v) {
                        //console.log('route.displayAnnotations', v);
                        _.each(route.annotations, function (annotation) {
                            annotation.g.setMap(v ? $scope.map : null);
                        });
                    });
                }

                if (route.meetingPoint) {
                    $scope.$watch('route.displayMeetingPoint', function (v) {
                        //console.log('route.displayMeetingPoint', v)
                        route.meetingPoint.g.setMap(v ? $scope.map : null);
                    });
                }

                var mapContainer = element.find(".map-canvas").get(0);
                var map = new google.maps.Map(mapContainer, {
                    center: { lat: route.mapDefaults.center.latitude, lng: route.mapDefaults.center.longitude },
                    zoom: route.mapDefaults.zoom
                });
                $scope.map = map;

                var polyline = helper.parseGpx(gpx, map);
                $scope.gpxPolyline = polyline;

                //compute the polyline length
                var lengthInMeters = google.maps.geometry.spherical.computeLength(polyline.getPath());
                //console.log('route length is ', lengthInMeters);

                route.meetingPoint.g = helper.addMeetingPointToMap($scope, route.meetingPoint, $scope.route, map);

                var distanceMarkers = helper.getDistanceMarkers(polyline, lengthInMeters, 1000, helper.distanceMarkerIcons, route.distanceMarkerAlignments);
                $scope.distanceMarkers = distanceMarkers;
                var placesOfInterestMarkers = helper.getPlacesOfInterestMarkers(route);
                $scope.placesOfInterestMarkers = placesOfInterestMarkers;
                var markers = distanceMarkers.concat(placesOfInterestMarkers);
                _.each(markers, function (marker) { marker.g = helper.addMarkerToMap(marker, map); });
                _.each(route.diversions, function (diversion) { diversion.g = helper.addDiversionToMap(diversion, map); });
                _.each(route.annotations, function (annotation) { annotation.g = helper.addAnnotationToMap(annotation, map); });
                //only so the running man shows up
                $timeout(function () {
                    $scope.loading = false;
                }, 2000)

                google.maps.event.addListener(map, 'click', function (event) {
                    var lat = event.latLng.lat();
                    lat = lat.toFixed(8);
                    var lng = event.latLng.lng();
                    lng = lng.toFixed(8);
                    console.log("\"latitude\": " + lat + ",\n\"longitude\": " + lng);
                });

            });
        }
    };
});


app.directive('gpxElevationChart', function (style) {
    var helper = {
        getDefaultChartConfig: function () {
            var config = {
                type: 'line',
                options: {
                    scales: {
                        xAxes: [
                            {
                                id: 'x-axis-0',
                                type: 'category',
                                display: true,
                                ticks: {
                                    maxTicksLimit: 20
                                }
                            }
                        ]
                    }
                },
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Route elevation',
                            backgroundColor: style.elevationGraphFillColour,
                            borderColor: style.elevationGraphStrokeColour,
                            data: [
                            ]
                        }
                    ]
                }
            };
            return config;
        },
        getElevationData: function (gpx) {
            var parser = new GPXParser(gpx, null);
            var elevationData = parser.extractElevationData();
            //console.log('getElevationData', elevationData);
            return elevationData;
        },
        sampleElevationData: function (data) {
            var o = {
                data: [],
                labels: []
            };
            //console.log('sampleElevationData', data);
            var last = new google.maps.LatLng(data[0].latitude, data[0].longitude);
            var distance = 0, distanceSteppedMax = 0, elevation = 0;
            var lastElevation = data[0].elevation;
            elevation = lastElevation;
            //console.log('e', lastElevation);
            var step = function (number, increment, offset) {
                return Math.ceil((number - offset) / increment) * increment + offset;
            }
            _.each(data, function (point, index) {
                var current = new google.maps.LatLng(point.latitude, point.longitude);
                var metersSinceLastPoint = google.maps.geometry.spherical.computeDistanceBetween(last, current);
                last = current;
                distance += metersSinceLastPoint;
                var elevationDelta = point.elevation - lastElevation;
                lastElevation = point.elevation;
                elevation += elevationDelta;
                var distanceStepped = step(distance, 100, 0);
                //console.log('sed', JSON.stringify({ metersSinceLastPoint: metersSinceLastPoint, distance: distance, distanceStepped: distanceStepped, distanceSteppedMax: distanceSteppedMax, elevationDelta: elevationDelta, elevation: elevation }));
                if (distanceStepped % 100 === 0 && distanceStepped > distanceSteppedMax) {
                    distanceSteppedMax = distanceStepped;
                    var intervalElevation = Math.round(elevation);
                    var intervalLabel = Math.ceil(distanceStepped / 1000) - 1 + ' km';
                    //console.log('sed.interval', JSON.stringify({ distanceStepped: distanceStepped, elevation: intervalElevation, label: intervalLabel  }));
                    o.data.push(intervalElevation);
                    o.labels.push(intervalLabel);

                }
            })
            return o;
        }

    };
    return {
        restrict: 'E',
        scope: {
            route: '<'
        },
        template: '<div class="elevation-chart"><canvas width="800" height="200"></canvas></div>',
        link: function ($scope, element, attributes, ngModelCtrl) {
            var route = $scope.route;
            route.gpx().then(function (gpx) {
                var container = element.find(".elevation-chart").get(0);
                var config = helper.getDefaultChartConfig();
                var data = helper.getElevationData(gpx);
                var chartData = helper.sampleElevationData(data);
                config.data.labels = chartData.labels;
                config.data.datasets[0].data = chartData.data;
                var ctx = element.find("canvas").get(0).getContext("2d");
                var line = new Chart(ctx, config);
                //console.log('chart', config);
            });
        }
    };
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

