angular.module("umbraco").controller("UmbracoGridSniperContentGrid",
    function ($scope, $routeParams, $timeout, assetsService, mediaResource, imageHelper, angularHelper, dialogService) {
        $scope.field = {
            view: "/App_Plugins/SniperContentGrid/SniperContentGrid.editor.html",
            editor: "UmbracoGridSniperContentGrid",
            config: $scope.control.editor.config,
            value: $scope.control.value
        }

        $scope.$watch(function () { return $scope.field.value; }, function (value) {
            $scope.control.value = value;
        });
    });
