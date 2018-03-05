angular.module("umbraco")
    .directive("u7dtRte",function(){
    return {
        restrict: 'A',
        link: function (scope, element, attr, ctrl) {
            element.on('hidden.bs.modal', function () {
                $("#contentwrapper").css("z-index", '10');
                $("#contentcolumn").css("z-index", '10');
            });
            element.on('show.bs.modal', function () {
                $("#contentwrapper").css("z-index", 'auto');
                $("#contentcolumn").css("z-index", 'auto');
            })
        }
    }
});