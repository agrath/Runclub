angular.module("umbraco").controller("SniperUrlPickerController", function ($scope, dialogService) {
    $scope.renderModel = []
    $scope.cfg = { multiPicker: "0" }

    if ($scope.model.value) {
        if (angular.isArray($scope.model.value)) {
            _.each($scope.model.value, function (item, i) {
                $scope.renderModel.push({ name: item.name, id: item.id, url: item.url, target: item.target })
            })
        } else if (angular.isObject($scope.model.value)) {
            $scope.renderModel.push($scope.model.value);
        }
    }

    if ($scope.model.config) {
        $scope.cfg = angular.extend($scope.cfg, $scope.model.config)
    }

    $scope.cfg.multiPicker = ($scope.cfg.multiPicker === "1" ? true : false)

    $scope.openLinkPicker = function () {
        dialogService.linkPicker({ callback: $scope.onContentSelected })
    }

    $scope.edit = function (index) {
        var link = $scope.renderModel[index]
        dialogService.linkPicker({ currentTarget: { id: link.id, index: index, name: link.name, url: link.url, target: link.target }, callback: $scope.onContentSelected })
    }

    $scope.remove = function (index) {
        $scope.renderModel.splice(index, 1)
        $scope.model.value = $scope.renderModel
    }

    $scope.$watch(
        function () {
            return $scope.renderModel
        }
      , function (newVal) {
          updateModelValue();
      }
    )

    var updateModelValue = function () {
        if ($scope.renderModel.length) {
            if ($scope.cfg.multiPicker) {
                $scope.model.value = $scope.renderModel;
            }
            else {
                $scope.model.value = $scope.renderModel[0];
            }
        } else {
            $scope.model.value = null
        }
    }

    $scope.$on("formSubmitting", function (ev, args) {
        updateModelValue();
    })


    $scope.onContentSelected = function (e) {
        var link = {
            id: e.id,
            name: e.name,
            url: e.url,
            target: e.target
        };
        if (e.index != null) {
            $scope.renderModel[e.index] = link
        } else {
            $scope.renderModel.push(link)
        }
        updateModelValue();

        dialogService.closeAll()
    }
})