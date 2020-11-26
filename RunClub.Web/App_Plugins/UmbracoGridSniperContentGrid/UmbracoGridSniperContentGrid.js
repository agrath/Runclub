angular.module("umbraco").controller("UmbracoGridSniperContentGrid",
    function ($scope, $routeParams, $timeout, assetsService, mediaResource, imageHelper, angularHelper) {
        $scope.field = {
            view: "/App_Plugins/SniperContentGrid/SniperContentGrid.editor.html",
            editor: "UmbracoGridSniperContentGrid",
            config: $scope.control.editor.config,
            value: $scope.control.value
        }

        $scope.$on('formSubmitting', function () {
            $scope.$broadcast('sniperContentGridSubmitting');
            $scope.control.value = $scope.field.value;
        });

    });
