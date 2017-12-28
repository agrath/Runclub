///////////////////////////////////////////////////////////////////////////////
// loadgpx.4.js
//
// Javascript object to load GPX-format GPS data into Google Maps.
//
// Copyright (C) 2006 Kaz Okuda (http://notions.okuda.ca)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// If you use this script or have any questions please leave a comment
// at http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
// A link to the GPL license can also be found there.
//
///////////////////////////////////////////////////////////////////////////////
//
// History:
//    revision 1 - Initial implementation
//    revision 2 - Removed LoadGPXFileIntoGoogleMap and made it the callers
//                 responsibility.  Added more options (colour, width, delta).
//    revision 3 - Waypoint parsing now compatible with Firefox.
//    revision 4 - Upgraded to Google Maps API version 2.  Tried changing the way
//               that the map calculated the way the center and zoom level, but
//               GMAP API 2 requires that you center and zoom the map first.
//               I have left the bounding box calculations commented out in case
//               they might come in handy in the future.
//
//    5/28/2010 - Upgraded to Google Maps API v3 and refactored the file a bit.
//                          (Chris Peplin)
//
// Author: Kaz Okuda
// URI: http://notions.okuda.ca/geotagging/projects-im-working-on/gpx-viewer/
//
// Updated for Google Maps API v3 by Chris Peplin
// Fork moved to GitHub: https://github.com/peplin/gpxviewer
//
///////////////////////////////////////////////////////////////////////////////

function GPXParser(xmlDoc, map) {
    this.xmlDoc = xmlDoc;
    this.map = map;
    this.trackcolour = "#ff00ff"; // red
    this.trackwidth = 5;
    this.mintrackpointdelta = 0.0001
}

// Set the colour of the track line segements.
GPXParser.prototype.setTrackColour = function (colour) {
    this.trackcolour = colour;
}

// Set the width of the track line segements
GPXParser.prototype.setTrackWidth = function (width) {
    this.trackwidth = width;
}

// Set the minimum distance between trackpoints.
// Used to cull unneeded trackpoints from map.
GPXParser.prototype.setMinTrackPointDelta = function (delta) {
    this.mintrackpointdelta = delta;
}

GPXParser.prototype.translateName = function (name) {
    if (name == "wpt") {
        return "Waypoint";
    }
    else if (name == "trkpt") {
        return "Track Point";
    }
    else if (name == "rtept") {
        return "Route Point";
    }
}


GPXParser.prototype.createMarker = function (point) {
    var lon = parseFloat(point.getAttribute("lon"));
    var lat = parseFloat(point.getAttribute("lat"));
    var html = "";

    var pointElements = point.getElementsByTagName("html");
    if (pointElements.length > 0) {
        for (i = 0; i < pointElements.item(0).childNodes.length; i++) {
            html += pointElements.item(0).childNodes[i].nodeValue;
        }
    }
    else {
        // Create the html if it does not exist in the point.
        html = "<b>" + this.translateName(point.nodeName) + "</b><br>";
        var attributes = point.attributes;
        var attrlen = attributes.length;
        for (i = 0; i < attrlen; i++) {
            html += attributes.item(i).name + " = " +
                attributes.item(i).nodeValue + "<br>";
        }

        if (point.hasChildNodes) {
            var children = point.childNodes;
            var childrenlen = children.length;
            for (i = 0; i < childrenlen; i++) {
                // Ignore empty nodes
                if (children[i].nodeType != 1) continue;
                if (children[i].firstChild == null) continue;
                html += children[i].nodeName + " = " +
                    children[i].firstChild.nodeValue + "<br>";
            }
        }
    }

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lon),
        map: this.map
    });

    var infowindow = new google.maps.InfoWindow({
        content: html,
        size: new google.maps.Size(50, 50)
    });

    google.maps.event.addListener(marker, "click", function () {
        infowindow.open(this.map, marker);
    });
}

GPXParser.prototype.addTrackSegmentToMap = function (trackSegment, colour,
    width) {

    var trackpoints = trackSegment.getElementsByTagName("trkpt");
    if (trackpoints.length == 0) {
        return;
    }

    var pointarray = [];

    // process first point
    var lastlon = parseFloat(trackpoints[0].getAttribute("lon"));
    var lastlat = parseFloat(trackpoints[0].getAttribute("lat"));
    var latlng = new google.maps.LatLng(lastlat, lastlon);
    pointarray.push(latlng);

    for (var i = 1; i < trackpoints.length; i++) {
        var trackPoint = trackpoints[i];
        var lon = parseFloat(trackPoint.getAttribute("lon"));
        var lat = parseFloat(trackPoint.getAttribute("lat"));
        // Verify that this is far enough away from the last point to be used.
        var latdiff = lat - lastlat;
        var londiff = lon - lastlon;
        if (Math.sqrt(latdiff * latdiff + londiff * londiff)
            > this.mintrackpointdelta) {
            lastlon = lon;
            lastlat = lat;
            latlng = new google.maps.LatLng(lat, lon);
            pointarray.push(latlng);
        }

    }

    var polyline = new google.maps.Polyline({
        path: pointarray,
        strokeColor: colour,
        strokeWeight: width,
        map: this.map
    });

    return polyline;
}
GPXParser.prototype.extractElevationData = function () {
    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");

    for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        var segments = track.getElementsByTagName("trkseg");
        var result = [];
        for (var s = 0; s < segments.length; s++) {
            var segment = segments[s];
            var trackpoints = segment.getElementsByTagName("trkpt");
            if (trackpoints.length == 0) {
                break;
            }
            var lastlon = parseFloat(trackpoints[0].getAttribute("lon"));
            var lastlat = parseFloat(trackpoints[0].getAttribute("lat"));
            for (var t = 1; t < trackpoints.length; t++) {
                var trackPoint = trackpoints[t];
                var eleNode = trackPoint.getElementsByTagName("ele");
                if (eleNode && eleNode.length) {
                    var ele = parseFloat(eleNode[0].textContent);
                    var lon = parseFloat(trackPoint.getAttribute("lon"));
                    var lat = parseFloat(trackPoint.getAttribute("lat"));
                    var latdiff = lat - lastlat;
                    var londiff = lon - lastlon;
                    if (Math.sqrt(latdiff * latdiff + londiff * londiff) > this.mintrackpointdelta) {
                        result.push({ elevation: ele, latitude: lat, longitude: lon });
                    }
                }
            }

        }
    }
    var routes = this.xmlDoc.documentElement.getElementsByTagName("rte");
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        var result = [];

        var routepoints = route.getElementsByTagName("rtept");
        if (routepoints.length == 0) {
            break;
        }
        var lastlon = parseFloat(routepoints[0].getAttribute("lon"));
        var lastlat = parseFloat(routepoints[0].getAttribute("lat"));
        for (var t = 1; t < routepoints.length; t++) {
            var routePoint = routepoints[t];
            var eleNode = routePoint.getElementsByTagName("ele");
            if (eleNode && eleNode.length) {
                var ele = parseFloat(eleNode[0].textContent);
                var lon = parseFloat(routePoint.getAttribute("lon"));
                var lat = parseFloat(routePoint.getAttribute("lat"));
                var latdiff = lat - lastlat;
                var londiff = lon - lastlon;
                if (Math.sqrt(latdiff * latdiff + londiff * londiff) > this.mintrackpointdelta) {
                    result.push({ elevation: ele, latitude: lat, longitude: lon });
                }
            }
        }
    }
    return result;

}

GPXParser.prototype.addTrackToMap = function (track, colour, width) {
    var segments = track.getElementsByTagName("trkseg");
    var result = [];
    for (var i = 0; i < segments.length; i++) {
        var polyline = this.addTrackSegmentToMap(segments[i], colour,
            width);
        result.push(polyline);
    }
    return result;
}

GPXParser.prototype.addRouteToMap = function (route, colour, width) {
    var routepoints = route.getElementsByTagName("rtept");
    if (routepoints.length == 0) {
        return;
    }

    var pointarray = [];

    // process first point
    var lastlon = parseFloat(routepoints[0].getAttribute("lon"));
    var lastlat = parseFloat(routepoints[0].getAttribute("lat"));
    var latlng = new google.maps.LatLng(lastlat, lastlon);
    pointarray.push(latlng);

    for (var i = 1; i < routepoints.length; i++) {
        var lon = parseFloat(routepoints[i].getAttribute("lon"));
        var lat = parseFloat(routepoints[i].getAttribute("lat"));

        // Verify that this is far enough away from the last point to be used.
        var latdiff = lat - lastlat;
        var londiff = lon - lastlon;
        if (Math.sqrt(latdiff * latdiff + londiff * londiff)
            > this.mintrackpointdelta) {
            lastlon = lon;
            lastlat = lat;
            latlng = new google.maps.LatLng(lat, lon);
            pointarray.push(latlng);
        }

    }

    var polyline = new google.maps.Polyline({
        path: pointarray,
        strokeColor: colour,
        strokeWeight: width,
        map: this.map
    });

    return polyline;
}

GPXParser.prototype.centerAndZoom = function (trackSegment) {

    var pointlist = new Array("trkpt", "rtept", "wpt");
    var minlat = 0;
    var maxlat = 0;
    var minlon = 0;
    var maxlon = 0;

    for (var pointtype = 0; pointtype < pointlist.length; pointtype++) {

        // Center the map and zoom on the given segment.
        var trackpoints = trackSegment.getElementsByTagName(
            pointlist[pointtype]);

        // If the min and max are uninitialized then initialize them.
        if ((trackpoints.length > 0) && (minlat == maxlat) && (minlat == 0)) {
            minlat = parseFloat(trackpoints[0].getAttribute("lat"));
            maxlat = parseFloat(trackpoints[0].getAttribute("lat"));
            minlon = parseFloat(trackpoints[0].getAttribute("lon"));
            maxlon = parseFloat(trackpoints[0].getAttribute("lon"));
        }

        for (var i = 0; i < trackpoints.length; i++) {
            var lon = parseFloat(trackpoints[i].getAttribute("lon"));
            var lat = parseFloat(trackpoints[i].getAttribute("lat"));

            if (lon < minlon) minlon = lon;
            if (lon > maxlon) maxlon = lon;
            if (lat < minlat) minlat = lat;
            if (lat > maxlat) maxlat = lat;
        }
    }

    if ((minlat == maxlat) && (minlat == 0)) {
        this.map.setCenter(new google.maps.LatLng(49.327667, -122.942333), 14);
        return;
    }

    // Center around the middle of the points
    var centerlon = (maxlon + minlon) / 2;
    var centerlat = (maxlat + minlat) / 2;

    var bounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(minlat, minlon),
        new google.maps.LatLng(maxlat, maxlon));
    this.map.setCenter(new google.maps.LatLng(centerlat, centerlon));
    this.map.fitBounds(bounds);
}

GPXParser.prototype.centerAndZoomToLatLngBounds = function (latlngboundsarray) {
    var boundingbox = new google.maps.LatLngBounds();
    for (var i = 0; i < latlngboundsarray.length; i++) {
        if (!latlngboundsarray[i].isEmpty()) {
            boundingbox.extend(latlngboundsarray[i].getSouthWest());
            boundingbox.extend(latlngboundsarray[i].getNorthEast());
        }
    }

    var centerlat = (boundingbox.getNorthEast().lat() +
        boundingbox.getSouthWest().lat()) / 2;
    var centerlng = (boundingbox.getNorthEast().lng() +
        boundingbox.getSouthWest().lng()) / 2;
    this.map.setCenter(new google.maps.LatLng(centerlat, centerlng),
        this.map.getBoundsZoomLevel(boundingbox));
}

GPXParser.prototype.addTrackpointsToMap = function () {
    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");
    var results = [];
    for (var i = 0; i < tracks.length; i++) {
        var polylines = this.addTrackToMap(tracks[i], this.trackcolour, this.trackwidth);
        results.push(polylines);
    }
    return results;
}

GPXParser.prototype.addRoutesAndTrackpointsToMap = function () {
    var tracks = this.xmlDoc.documentElement.getElementsByTagName("trk");
    var routes = this.xmlDoc.documentElement.getElementsByTagName("rte");
    var results = [];
    for (var i = 0; i < tracks.length; i++) {
        var polylines = this.addTrackToMap(tracks[i], this.trackcolour, this.trackwidth);
        results.push(polylines);
    }
    for (var i = 0; i < routes.length; i++) {
        var polylines = this.addRouteToMap(routes[i], this.trackcolour, this.trackwidth);
        results.push(polylines);
    }
    return results;
}


GPXParser.prototype.addWaypointsToMap = function () {
    var waypoints = this.xmlDoc.documentElement.getElementsByTagName("wpt");
    var results = [];
    for (var i = 0; i < waypoints.length; i++) {
        var marker = this.createMarker(waypoints[i]);
        results.add(marker);
    }
    return results;
}

GPXParser.prototype.addRoutepointsToMap = function () {
    var routes = this.xmlDoc.documentElement.getElementsByTagName("rte");
    var results = [];
    for (var i = 0; i < routes.length; i++) {
        var route = this.addRouteToMap(routes[i], this.trackcolour, this.trackwidth);
        results.add(route);
    }
    return results;
}
