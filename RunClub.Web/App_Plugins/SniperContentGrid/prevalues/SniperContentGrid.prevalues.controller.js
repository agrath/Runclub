angular.module("umbraco")
    .controller("SniperContentGrid.prevaluesController", function ($scope, controlDefinitionService) {
        if (!$scope.model.value) {
            $scope.model.value = { columns: [], viewStyle: 'horizontal' };
        }

        if (!$scope.model.viewStyle)
            $scope.model.viewStyle = 'horizontal';

        $scope.viewStyles = ['horizontal', 'vertical'];


        $scope.sortableOptions = {
            cursor: "move",
            handle: '.sortHandle',
            containment: 'parent',
            tolerance: 'pointer',
            axis: 'y',
            helper: function (e, ui) {
                ui.children().each(function () {
                    $(this).width($(this).width());
                });
                return ui;
            }
        };

        $scope.controlDefinitions = controlDefinitionService.getDefinitions();

        $scope.getControl = function (type) {
            return _.find($scope.controlDefinitions, function (def) { return def.type == type; });
        }

        $scope.addColumn = function () {
            $scope.model.value.columns.push({
                title: "",
                alias: "",
                type: "textbox",
                required: false,
                props: {}
            });
        }

        $scope.removeColumn = function (index) {
            $scope.model.value.columns.splice(index, 1);
        }

        $scope.addDropDownOption = function (column) {
            if (!column.props.options) {
                column.props.options = [];
            }
            column.props.options.push({
                text: "",
                value: ""
            });
        }

        $scope.optionRemoveRow = function (column, index) {
            column.props.options.splice(index, 1);
        }

        $scope.import = function (importData) {
            var json = atob(importData),
                value = JSON.parse(json);

            console.log('value', value);
            $scope.model.value = value;
        }

        $scope.export = function () {
            var json = JSON.stringify($scope.model.value),
                base64 = btoa(json);

            $scope.exportData = base64;
        };
    });
