var app = angular.module('routesApp', ['ngSanitize']);
app.value('style', {
    lineStrokeColour: '#20bc5c',
    lineWeight: 3,
    diversionLinePath: 'M 0,-0.5 0,0.5',
    diversionLineSpacing: '10px'
});

//this filter transforms newlines into brs
app.filter('br', function () {
    return function (text) {
        if (!text) return text;
        return text.replace(/\r?\n/g, '<br/>');
    }
});
