var app = angular.module('routesApp', ['ngSanitize', 'ngRoute']);
app.value('style', {
    lineStrokeColour: '#20bc5c',
    lineWeight: 3,
    diversionLinePath: 'M 0,-0.5 0,0.5',
    diversionLineSpacing: '10px',
    elevationGraphFillColour: 'rgba(32,188,92,0.4)',
    elevationGraphStrokeColour: '#20bc5c'
});
app.factory('RouteService', ['$q', '$http', function ($q, $http) {
    var self = this;
    var _deferred = $q.defer();
    $http.get('routes/db.json')
        .then(
        function (transport, status, headers, config) {
            //console.log('db.json loaded');
            var data = transport.data;
            //iterate over each route and add a promise for the gpx data
            _.each(data, function (route) {

                var id = route.id;
                if (!route.enabled) return;
                route.displayGpxRoute = true;
                route.displayDistanceMarkers = true;

                route.staticMapImage = 'https://maps.googleapis.com/maps/api/staticmap?size=356x280&zoom=14&key=AIzaSyDeWHf1yBGiJgWoaQH_PEN2bnwZ2aCFSbE&center=' + route.meetingPoint.latitude + ',' + route.meetingPoint.longitude;

                route.gpxData = null;
                route.gpx = function () {
                    var deferred = $q.defer();
                    if (route.gpxData) {
                        //console.log('cached', route.gpxData);
                        deferred.resolve(route.gpxData);
                    }
                    else {
                        //by convention, get the gpx file
                        var url = 'routes/' + id + '.gpx';
                        route.gpxFile = url;
                        $http({ method: 'get', url: url, transformResponse: function (data) { return $.parseXML(data); } }).then(function (res) {
                            //console.log('loaded ' + url, res.data);
                            route.gpxData = res.data;
                            deferred.resolve(route.gpxData);
                        });
                    }
                    return deferred.promise;
                };


            });

            _deferred.resolve(data);
        },
        function (transport, status, headers, config) {
            _deferred.reject("Error loading db.json");
        });

    return {
        getRoutes: function () {
            return _deferred.promise;
        }
    };
}]);
//this filter transforms newlines into brs
app.filter('br', function () {
    return function (text) {
        if (!text) return text;
        return text.replace(/\r?\n/g, '<br/>');
    }
});

//because I don't want to use an angular binding library for bootstrap 4
jQuery(document).ready(function () {
    window.setInterval(function () {
        jQuery('.dropdown-toggle:not(.initialized)')
            .dropdown()
            .addClass('initialized');
        $(document.body).on({
            "shown.bs.dropdown": function () { this.closable = true; },
            "hide.bs.dropdown": function () { return this.closable; },
            "click": function (e) { this.closable = !$(e.target).closest(".dropdown-menu").length; },
        }, ".dropdown.keepopen");

    }, 250);
});