angular.module("umbraco").controller("SniperMultiple", function ($scope) {
    $scope.sortableOptions = {
        axis: 'y',
        containment: 'parent',
        cursor: 'move',
        items: '> div.textbox-wrapper',
        tolerance: 'pointer'
    };

    $scope.value = [];
    if ($scope.model.value) {
        $scope.value = _.map($scope.model.value, function (item) {
            return {
                view: $scope.model.config.editor,
                value: item
            };
        });
    }

    //add any fields that there isn't values for
    if ($scope.min > 0) {
        for (var i = 0; i < $scope.min; i++) {
            if ((i + 1) > $scope.value.length) {
                $scope.value.push({ value: "", view: $scope.model.config.editor });
            }
        }
    }

    $scope.add = function () {
        if ($scope.model.config.max <= 0 || $scope.model.value.length < $scope.model.config.max) {
            $scope.value.push({ value: '', view: $scope.model.config.editor });
        }
    };

    $scope.remove = function (index) {
        // Make sure not to trigger other prompts when remove is triggered
        $scope.hidePrompt();
        var remainder = [];
        for (var x = 0; x < $scope.value.length; x++) {
            if (x !== index) {
                remainder.push($scope.value[x]);
            }
        }
        $scope.value = remainder;
    };
    $scope.showPrompt = function (idx, item) {
        var i = $scope.value.indexOf(item);
        // Make the prompt visible for the clicked tag only
        if (i === idx) {
            $scope.promptIsVisible = i;
        }
    };
    $scope.hidePrompt = function () {
        $scope.promptIsVisible = '-1';
    }

    $scope.$watch('value', function (newValue) {
        $scope.model.value = _.map(newValue, function (item) {
            return item.value;
        });
    }, true);

});
