
app.directive('gpxViewer', function ($timeout, style) {
    var helper =
        {
            distanceMarkerIcon: [
                '<?xml version="1.0"?>',
                '<svg xmlns="http://www.w3.org/2000/svg" width="94" height="128">',
                '<path d="M46.977 126.643c-.283-.687-6.163-6.437-10.374-11.662C11.656 81.86-16.157 51.084 16.32 13.684 30.7-.21 48.433-1.003 66.663 5.473c51.33 29.702 14.166 78.155-10.236 110.008l-9.45 11.163zm15.44-50.77c34.237-24.486 7.768-71.634-29.848-55.96C21.584 25.77 16.134 35.96 15.943 47.98 15.42 59.675 21.63 69.453 31.47 75.44c7.056 3.842 10.157 4.535 18.146 4.06 5.178-.31 8.16-1.155 12.8-3.628zM37.164 87.562a44.99 43.92 0 1 1 1.12.22" fill="green" fill-opacity=".988"/>',
                '<path d="M44.277 69.13a26.01 20.99 0 1 1 .648.103" opacity=".34" fill="none"/><path d="M32.537 114.28a16.656 11.75 0 1 1 .416.06" fill="none"/>',
                '    <path d="M40.106 81.38a33.426 34.453 0 1 1 .833.173" fill="#009400"/>',
                '<path d="M42.017 69.425a22.106 22.59 0 1 1 .55.112" fill="#fff"/>',
                '<text x="45" y="58" text-anchor="middle" font-family="Open Sans Bold" font-weight="600" font-size="30px" fill="#000000">{{km}}</text>',
                '</svg>'
            ].join('\n'),
            parseGpx: function (data, map) {
                var parser = new GPXParser(data, map);
                parser.setTrackColour(style.lineStrokeColour);     // Set the track line colour
                parser.setTrackWidth(style.lineStrokeWidth);          // Set the track line width
                parser.setMinTrackPointDelta(0.001);      // Set the minimum distance between track points
                parser.centerAndZoom(data);
                var polylines = parser.addTrackpointsToMap();         // Add the trackpoints
                //the gpx parser library exposes nested arrays as the gpx may contain multiple tracks
                var polyline = _.flatten(polylines)[0];
                return polyline;
            },
            getDistanceMarkers: function (polyline, length, interval, iconSvg) {
                var markers = [];
                for (var i = interval; i < length; i += interval) {
                    var km = i / interval;
                    //inject the km marker into the template
                    var svg = iconSvg.replace('{{km}}', km);
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
                        var icon = new google.maps.MarkerImage('/images/map-icons/' + place.type + '.png', null, null, null, new google.maps.Size(width, height));
                        markers.push({
                            id: 'place' + i,
                            latitude: place.latitude,
                            longitude: place.longitude,
                            icon: icon,
                            options: {
                                zIndex: 100 + (options && options.zIndex ? options.zIndex : (place.zIndex ? place.zIndex : 0))
                            }
                        });
                    }
                }
                return markers;
            },
            addDiversionToMap: function (diversion, map) {
                console.log('diversion', diversion);

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
                }

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
            var mapContainer = element.find(".map-canvas").get(0);
            var map = new google.maps.Map(mapContainer, {
                center: { lat: route.mapDefaults.center.latitude, lng: route.mapDefaults.center.longitude },
                zoom: route.mapDefaults.zoom
            });

            var polyline = helper.parseGpx(route.gpx, map);

            //compute the polyline length
            var lengthInMeters = google.maps.geometry.spherical.computeLength(polyline.getPath());
            console.log('route length is ', lengthInMeters);

            var distanceMarkers = helper.getDistanceMarkers(polyline, lengthInMeters, 1000, helper.distanceMarkerIcon);
            var placesOfInterestMarkers = helper.getPlacesOfInterestMarkers(route);
            var markers = distanceMarkers.concat(placesOfInterestMarkers);
            _.each(markers, function (marker) { helper.addMarkerToMap(marker, map); });
            _.each(route.diversions, function (diversion) { helper.addDiversionToMap(diversion, map); });

            //only so the running man shows up
            $timeout(function () {
                $scope.loading = false;
            }, 2000)

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
            return elevationData;
        },
        sampleElevationData: function (data) {
            var o = {
                data: [],
                labels: []
            };
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
                if (elevation < 0) elevation = 0;
                var distanceStepped = step(distance, 100, 0);
                if (distanceStepped % 100 == 0 && distanceStepped > distanceSteppedMax) {
                    distanceSteppedMax = distanceStepped;
                    o.data.push(Math.round(elevation));
                    o.labels.push(Math.ceil(distanceStepped / 1000) - 1 + ' km');
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
            var container = element.find(".elevation-chart").get(0);
            var config = helper.getDefaultChartConfig();
            var data = helper.getElevationData(route.gpx);
            var chartData = helper.sampleElevationData(data);
            config.data.labels = chartData.labels;
            config.data.datasets[0].data = chartData.data;
            var ctx = element.find("canvas").get(0).getContext("2d");
            var line = new Chart(ctx, config);

            console.log('chart', config);
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