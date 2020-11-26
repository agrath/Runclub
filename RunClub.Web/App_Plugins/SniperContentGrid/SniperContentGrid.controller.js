angular.module('umbraco').controller('SniperContentGrid.RichTextEditorController', function ($scope, umbPropEditorHelper) {
    var vm = this;

    vm.submit = submit;
    vm.close = close;

    vm.control = {
        alias: 'richtexteditor',
        label: '',
        description: '',
        view: 'rte',
        config: {
            editor: {
                toolbar: ["code", "styleselect", "undo", "formats", "cut", "bold", "redo", "italic", "alignleft", "aligncenter", "alignright", "bullist", "numlist", "link", "umbmediapicker", "umbmacro", "table", "umbembeddialog"],
                stylesheets: ['RTE'],
                dimensions: { height: 400 }
            }
        },
        template: '/App_Plugins/SniperContentGrid/propertyViews/rte.html'
    };
    $scope.propertyEditorView = umbPropEditorHelper.getViewPath('rte', false);

    function submit() {
        if ($scope.model.submit) {
            $scope.model.submit($scope.model);
        }
    }

    function close() {
        if ($scope.model.close) {
            $scope.model.close();
        }
    }

});

// wrap nested property editors that use the formSubmitting event to build their values
// https://github.com/umco/umbraco-property-list/issues/5
angular.module('umbraco.directives').directive('sniperContentGridPropertyEditor', [function () {
    return {
        require: '^form',
        restrict: 'E',
        link: function ($scope, $element, $attrs, $ctrl) {
            var unsubscribe = $scope.$on('sniperContentGridSubmitting', function (ev, args) {
                $scope.$broadcast('formSubmitting', { scope: $scope });
            });

            $scope.$on('$destroy', unsubscribe);
        },
        template: '<umb-property-editor model="control" />',
        scope: {
            control: '=model'
        }
    };
}]);

angular.module("umbraco").controller("SniperContentGrid.editorController", ['$scope', '$timeout', 'debounce', 'editorService', 'controlDefinitionService', function ($scope, $timeout, debounce, editorService, controlDefinitionService) {
    $scope.model.hideLabel = true;

    if (!angular.isArray($scope.model.value)) {
        $scope.model.value = [];
    }

    $scope.invalidCells = [];

    $scope.isReadOnly = function () {
        return $scope.model.config.readonly;
    };

    $scope.cellHasError = function (columnIndex, rowIndex) {
        var key = columnIndex + "x" + rowIndex;
        return $scope.invalidCells.indexOf(key) !== -1;
    }

    $scope.viewStyle = $scope.model.config.viewStyle || 'horizontal';

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


    $scope.editorOpen = function (control) {
        editorService.open({
            title: control.column.title,
            value: control.value,
            config: control.config,
            view: '/App_Plugins/SniperContentGrid/rte-editor.html',
            submit: function (model) {
                control.value = model.value;
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        });
    };

    $scope.openMediaPicker = function (control) {
        var mediaPickerOptions = {
            multiPicker: true,
            submit: function (model) {
                editorService.close();
            },
            close: function () {
                editorService.close();
            }
        };
        editorService.mediaPicker(mediaPickerOptions);
    };

    $scope.removeRow = function (index) {
        $scope.controls.splice(index, 1);
    }

    $scope.selectedEditorTitle = null;
    $scope.selectedControl = null;

    var validateMandatory = function () {
        $scope.invalidCells = [];

        var rowIndex = 0;
        angular.forEach($scope.model.value, function (row, rowKey) {
            var columnIndex = 0;

            angular.forEach(row, function (cell, cellKey) {
                var column = _.find($scope.model.config.columns, function (c) { return c.alias == cellKey; })
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

    $scope.$on('formSubmitting', function () {
        validateMandatory();
        $scope.$broadcast('sniperContentGridSubmitting');

        var value = _.map($scope.controls, function (row) {
            return _.reduce(row, function (memo, control) {
                var o = {};
                o[control.column.alias] = control.value;
                return _.extend(memo, o);
            }, {});
        });
        $scope.model.value = value;

    });

    $scope.maxRows = ($scope.model.config.rows && parseInt($scope.model.config.rows)) || 0;

    var matchAnyRegexp = new RegExp('.*');
    $scope.getPattern = function (cell) {
        if (cell.column.props.regexValidation && cell.column.props.regexValidationPattern) {
            if (!cell.column.props.regexValidationRegexp) {
                cell.column.props.regexValidationRegexp = new RegExp(cell.column.props.regexValidationPattern);
            }
            return; cell.column.props.regexValidationRegexp;
        }
        return matchAnyRegexp;
    };

    controlDefinitionService.getDefinitions().then(function (controlDefinitions) {
        var createRow = function (row, rowKey) {
            var rowData = [];
            // iterate over each column
            angular.forEach($scope.model.config.columns, function (column, columnKey) {
                // build the control for the row
                var controlDefinition = _.find(controlDefinitions, function (item) { return item.type == column.type; });

                if (controlDefinition) {
                    var control = angular.copy(controlDefinition.control);
                    control.column = column;
                    control.alias = $scope.model.alias + '-' + rowKey + '-' + column.alias;
                    control.value = row[column.alias] || "";
                    control.validation = control.validation || {};
                    control.validation.mandatory = control.column.required;

                    // apply properties (ie if value.props.time is true on datepicker then set datepicker.config.pickTime to true and datepicker.config.format to "YYYY-MM-DD HH:mm:ss"                    
                    if (controlDefinition.applyProperties) {
                        controlDefinition.applyProperties(control, controlDefinition, column.props);
                    }

                    rowData[columnKey] = control;
                }
            });
            return rowData;
        }

        $scope.addRow = function () {
            if ($scope.maxRows == 0 || $scope.controls.length < $scope.maxRows) {
                var rowData = createRow([], $scope.controls.length);
                $scope.controls.push(rowData);
            }
            else {
                alert("Max rows is - " + maxRows);
            }
        }

        $scope.controls = [];
        // iterate over each row
        angular.forEach($scope.model.value, function (row, rowKey) {
            var rowData = createRow(row, rowKey);
            $scope.controls.push(rowData);
        });
    });
}]);
