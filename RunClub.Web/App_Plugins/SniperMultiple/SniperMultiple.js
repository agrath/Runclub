angular.module("umbraco").controller("SniperMultiple", function ($scope) {
    $scope.editor = $scope.model.config.editor;
    $scope.min = $scope.model.config.min || 0;
    $scope.max = $scope.model.config.max || 0;

    $scope.sortableOptions = {
        axis: 'y',
        containment: 'parent',
        cursor: 'move',
        items: '> div.control-group',
        tolerance: 'pointer'
    };

    $scope.value = [];
    if ($scope.model.value) {
        $scope.value = _.map($scope.model.value, function (item) {
            return {
                view: $scope.editor,
                value: item
            };
        });
    }

    //add any fields that there isn't values for
    if ($scope.min > 0) {
        for (var i = 0; i < $scope.min; i++) {
            if ((i + 1) > $scope.value.length) {
                $scope.value.push({ value: "", view: $scope.editor });
            }
        }
    }

    $scope.add = function () {
        if ($scope.max <= 0 || $scope.value.length < $scope.max) {
            var item = { value: "", view: $scope.editor };
            $scope.value.push(item);
        }
    };

    $scope.remove = function (index) {
        var remainder = [];
        for (var x = 0; x < $scope.value.length; x++) {
            if (x !== index) {
                remainder.push($scope.value[x]);
            }
        }
        $scope.value = remainder;
    };


    $scope.$watch('value', function (newValue) {
        $scope.model.value = _.map(newValue, function (item) {
            return item.value;
        });
    }, true);

});
