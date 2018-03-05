angular.module("umbraco").controller("SniperDropdown.Prevalues.Items", function ($scope, $timeout) {
    //NOTE: We need to make each item an object, not just a string because you cannot 2-way bind to a primitive.
    $scope.newItemName = "";
    $scope.newItemAlias = "";
    $scope.hasError = false;

    if (!angular.isArray($scope.model.value)) {
        $scope.model.value = [];
    }

    $scope.remove = function (item, evt) {
        evt.preventDefault();

        $scope.model.value = _.reject($scope.model.value, function (x) {
            return x.name === item.name;
        });

    };

    $scope.add = function (evt) {
        evt.preventDefault();

        if (!$scope.newItemName && $scope.newItemAlias)
            $scope.newItemName = $scope.newItemAlias;
        else if ($scope.newItemName && !$scope.newItemAlias)
            $scope.newItemAlias = $scope.newItemName;

        if ($scope.newItemName) {
            if (!_.contains($scope.model.value, $scope.newItemName)) {
                $scope.model.value.push({ name: $scope.newItemName, alias: $scope.newItemAlias });
                $scope.newItemName = "";
                $scope.newItemAlias = "";
                $scope.hasError = false;
                return;
            }
        }

        //there was an error, do the highlight (will be set back by the directive)
        $scope.hasError = true;
    };

    $scope.sortableOptions = {
        axis: 'y',
        containment: 'parent',
        cursor: 'move',
        items: '> div.control-group',
        tolerance: 'pointer',
        update: function (e, ui) {
            // Get the new and old index for the moved element (using the text as the identifier, so 
            // we'd have a problem if two prevalues were the same, but that would be unlikely)
            var newIndex = ui.item.index();
            var movedPrevalueText = $('input[type="text"]', ui.item).val();
            var originalIndex = getElementIndexByPrevalueText(movedPrevalueText);

            // Move the element in the model
            if (originalIndex > -1) {
                var movedElement = $scope.model.value[originalIndex];
                $scope.model.value.splice(originalIndex, 1);
                $scope.model.value.splice(newIndex, 0, movedElement);
            }
        }
    };

    function getElementIndexByPrevalueText(value) {
        for (var i = 0; i < $scope.model.value.length; i++) {
            if ($scope.model.value[i].value === value) {
                return i;
            }
        }

        return -1;
    }

});
