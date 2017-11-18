var app = angular.module('routesApp', ['ngSanitize', 'ngRoute']);
app.run(function ($rootScope) {
    $rootScope.$on('$locationChangeSuccess', function (event, to, from) {
        var url = to.toString();
        var view = url.substr(url.indexOf('/app') + 5, url.length).replace('/', '-');
        $rootScope.view = view;
    });
});
app.value('style', {
    lineStrokeColour: '#20bc5c',
    lineWeight: 3,
    diversionLinePath: 'M 0,-0.5 0,0.5',
    diversionLineSpacing: '10px',
    elevationGraphFillColour: 'rgba(32,188,92,0.4)',
    elevationGraphStrokeColour: '#20bc5c'
});
app.factory('CalendarService', ['$q', '$http', function ($q, $http) {
    var self = this;
    var _deferred = $q.defer();
    $http.get('/data/calendar.json')
        .then(
        function (transport, status, headers, config) {
            //console.log('calendar.json loaded');
            var data = transport.data;
            _deferred.resolve(data);
        },
        function (transport, status, headers, config) {
            _deferred.reject("Error loading calendar.json");
        });

    return {
        getCalendar: function () {
            return _deferred.promise;
        }
    };
}]);
app.factory('FaqService', ['$q', '$http', function ($q, $http) {
    var self = this;
    var _deferred = $q.defer();
    $http.get('/data/faq.json')
        .then(
        function (transport, status, headers, config) {
            //console.log('faq.json loaded');
            var data = transport.data;
            _deferred.resolve(data);
        },
        function (transport, status, headers, config) {
            _deferred.reject("Error loading faq.json");
        });

    return {
        getItems: function () {
            return _deferred.promise;
        }
    };
}]);
app.factory('RouteService', ['$q', '$http', '$interpolate', function ($q, $http, $interpolate) {
    var self = this;
    var _deferred = $q.defer();
    $http.get('/data/db.json')
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
                route.displayAnnotations = true;
                route.displayMeetingPoint = true;

                //when this site is hosted, change this to a local url
                //var markerImageUrl = 'http://metrorun.org.nz/images/static-meet-here.png';
                var markerImageUrl = 'https://i.imgur.com/8tChPdj.png';
                var staticMapImageTemplate = 'https://maps.googleapis.com/maps/api/staticmap?size=356x280&zoom=14&key=AIzaSyDeWHf1yBGiJgWoaQH_PEN2bnwZ2aCFSbE&center={{latitude}},{{longitude}}&markers=anchor:bottom|icon:{{icon}}|{{latitude}},{{longitude}}';
                route.staticMapImage = $interpolate(staticMapImageTemplate)({ latitude: route.meetingPoint.latitude, longitude: route.meetingPoint.longitude, icon: markerImageUrl });

                route.gpxData = null;
                route.gpx = function () {
                    var deferred = $q.defer();
                    if (route.gpxData) {
                        //console.log('cached', route.gpxData);
                        deferred.resolve(route.gpxData);
                    }
                    else {
                        //by convention, get the gpx file
                        var url = '/data/' + id + '.gpx';
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
        jQuery('a.gallery-box:not(.initialized)').colorbox({ maxWidth: '90%' }).addClass("initialized");
        jQuery('.dropdown-toggle:not(.initialized)')
            .dropdown()
            .addClass('initialized');
        $(document.body).on({
            "shown.bs.dropdown": function () { this.closable = true; },
            "hide.bs.dropdown": function () { return this.closable; },
            "click": function (e) {
                var c = !$(e.target).closest(".dropdown-menu").length;
                this.closable = c;
                window.setTimeout((function () {
                    this.closable = true;
                }).bind(this), 250)
            },
        }, ".dropdown.keepopen");

        jQuery('.tipTip:not(.initialized').tipTip().addClass('initialized');
    }, 250);
});