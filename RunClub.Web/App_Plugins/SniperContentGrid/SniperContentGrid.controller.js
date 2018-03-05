angular.module("umbraco")
    .controller("SniperContentGrid.editorController", ['$scope', '$timeout', 'debounce', 'controlDefinitionService', function ($scope, $timeout, debounce, controlDefinitionService) {
        if (!angular.isObject($scope.model.value))
            $scope.model.value = {};

        $scope.invalidCells = [];

        $scope.cellHasError = function (columnIndex, rowIndex) {
            var key = columnIndex + "x" + rowIndex;
            return $scope.invalidCells.indexOf(key) !== -1;
        }

        $scope.viewStyle = 'horizontal';
        if ($scope.model.config.viewStyle && $scope.model.config.viewStyle.viewStyle) {
            $scope.viewStyle = $scope.model.config.viewStyle.viewStyle;
        }

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

        var controlDefinitions = controlDefinitionService.getDefinitions();

        var maxRows = parseInt($scope.model.config.rows.rows) || 0;

        var createRow = function (row, rowKey) {
            var rowData = [];
            // iterate over each column
            angular.forEach($scope.model.config.columns.columns, function (column, columnKey) {
                // build the control for the row
                var controlDefinition = _.find(controlDefinitions, function (item) { return item.type == column.type; });

                if (controlDefinition) {
                    var control = angular.copy(controlDefinition.control);
                    control.column = column;
                    control.alias = $scope.model.alias + '-' + rowKey + '-' + column.alias;
                    control.value = row[column.alias] || "";

                    // apply properties (ie if value.props.time is true on datepicker then set datepicker.config.pickTime to true and datepicker.config.format to "YYYY-MM-DD HH:mm:ss"                    
                    if (controlDefinition.applyProperties) {
                        controlDefinition.applyProperties(control, controlDefinition, column.props);
                    }

                    rowData[columnKey] = control;
                }
            });
            return rowData;
        }

        var validateMandatory = function () {
            $scope.invalidCells = [];

            var rowIndex = 0;
            angular.forEach($scope.model.value, function (row, rowKey) {
                var columnIndex = 0;

                angular.forEach(row, function (cell, cellKey) {
                    var column = _.find($scope.model.config.columns.columns, function (c) { return c.alias == cellKey; })
                    var required = column.required;

                    if (required && (cell == null || cell == "")) {
                        var key = columnIndex + "x" + rowIndex;
                        $scope.invalidCells.push(key);
                    }
                    columnIndex++;
                });

                rowIndex++;
            });
            return $scope.invalidCells.length == 0;
        }

        var setupPropertyEditors = function () {
            $scope.controls = [];
            // iterate over each row
            angular.forEach($scope.model.value, function (row, rowKey) {
                var rowData = createRow(row, rowKey);
                $scope.controls.push(rowData);
            });

            // track changes
            var updateValue = debounce(250, function () {
                var value = _.map($scope.controls, function (row) {
                    return _.reduce(row, function (memo, control) {
                        var o = {};
                        o[control.column.alias] = control.value;
                        return _.extend(memo, o);
                    }, {});
                });
                $scope.model.value = value;
                $scope.propertyForm.modelValue.$setValidity("modelValue", validateMandatory());
            });

            $scope.$watch('controls', updateValue, true);
        }
        setupPropertyEditors();

        $scope.addRow = function () {
            if (maxRows == 0 || $scope.controls.length < maxRows) {
                var rowData = createRow([], $scope.controls.length);
                $scope.controls.push(rowData);
            }
            else {
                alert("Max rows is - " + maxRows);
            }
        }

        $scope.removeRow = function (index) {
            $scope.controls.splice(index, 1);
        }

        $scope.selectedEditorTitle = null;
        $scope.selectedControl = null;

        $scope.editorOpen = function (control) {
            $scope.selectedEditorTitle = control.column.title;
            $scope.selectedControl = control;
        }


    }]);
