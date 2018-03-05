angular.module("umbraco").controller("SniperIconPicker", function ($scope, dialogService) {
    $scope.openIconPicker = function () {
        dialogService.iconPicker({
            callback: function (icon) {
                $scope.model.value = icon;
            }
        });
    } 
});