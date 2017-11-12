
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
                    var anchor = alignment == 0 ? new google.maps.Point(0, 32) : new google.maps.Point(32, 32);
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
                    var i = null;
                    for (i = 0; i < route.placesOfInterestOptions.length; i += 1) {
                        placesOfInterestOptions[route.placesOfInterestOptions[i].type] = route.placesOfInterestOptions[i];
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
                console.log('diversion', diversion);
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

                if (diversion.label) {
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(diversion.label.anchor.latitude, diversion.label.anchor.longitude),
                        map: map,
                        visible: false
                    });
                    var info = new SnazzyInfoWindow({
                        marker: marker,
                        placement: diversion.label.placement || 'right',
                        offset: diversion.label.offset,
                        maxWidth: 180,
                        content: '<strong>' + diversion.label.title + '</strong>' +
                        '<div>' + diversion.label.description + '</div>',
                        showCloseButton: diversion.label.showCloseButton || false,
                        closeOnMapClick: false,
                        padding: '10px',
                        backgroundColor: diversion.label.backgroundColour || 'rgba(0, 0, 0, 0.7)',
                        border: false,
                        borderRadius: '0px',
                        shadow: false,
                        fontColor: diversion.label.fontColour || '#fff',
                        fontSize: diversion.label.fontSize || '14px'
                    });
                    info.open();
                    o.info = info;
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
                console.log('annotation', annotation);

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
            }
        };
    return {
        restrict: 'E',
        scope: {
            route: '<'
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
                                    diversion.g.info.setMap(visible ? $scope.map : null);
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
                console.log('route length is ', lengthInMeters);

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
                if (elevation < 0) elevation = 0;

                if (distanceStepped % 100 == 0 && distanceStepped > distanceSteppedMax) {
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