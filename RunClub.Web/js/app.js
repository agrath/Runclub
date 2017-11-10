var app = angular.module('routesApp', ['ngSanitize']);
app.value('style', {
    lineStrokeColour: '#20bc5c',
    lineWeight: 3,
    diversionLinePath: 'M 0,-0.5 0,0.5',
    diversionLineSpacing: '10px',
    elevationGraphFillColour: 'rgba(32,188,92,0.4)',
    elevationGraphStrokeColour: '#20bc5c'
});

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