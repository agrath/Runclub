angular.module("umbraco").controller("SniperIconPicker", function ($scope, editorService) {

    $scope.openIconPicker = function(layout) {
        var iconPicker = {
            icon: $scope.model.value.split(' ')[0],
            color: $scope.model.value.split(' ')[1],
            submit: function (model) {
                if (model.icon) {
                    if (model.color) {
                        $scope.model.value = model.icon + " " + model.color;
                    } else {
                        $scope.model.value = model.icon;
                    }
                }
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };
        editorService.iconPicker(iconPicker);
    }
});
