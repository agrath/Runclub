angular.module('umbraco.services').factory('controlDefinitionService', function () {
    /*
     * Adding a new column:
     * Add a new control definition as per below, optionally using a template 
     * (will default to umb-editor otherwise, which may be necessary as it invokes a separate scope for the actual property editor)
     * (Optional) Add a template to propertyViews
     * (Optional) Add a template to propertyPrevalueViews if additional properties needed
     */
    return {
        getDefinitions: function () {
            var controlDefinitions = [
                {
                    type: 'textbox',
                    name: 'Textbox',
                    control: {
                        alias: 'textbox',
                        label: '',
                        description: '',
                        view: 'textbox',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/textbox.html'
                    }
                },
                {
                    type: 'numeric',
                    name: 'Numeric Textbox',
                    control: {
                        alias: 'numeric',
                        label: '',
                        description: '',
                        view: 'numeric',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/numeric.html'
                    }
                },
                {
                    type: 'readonly',
                    name: 'Read-only',
                    control: {
                        alias: 'readonly',
                        label: '',
                        description: '',
                        view: 'readonly',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/readonly.html'
                    }
                },
                {
                    type: 'textarea',
                    name: 'Textarea',
                    control: {
                        alias: 'textarea',
                        label: '',
                        description: '',
                        view: 'textarea',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/textarea.html'
                    }
                },
                {
                    type: 'checkbox',
                    name: 'Checkbox',
                    control: {
                        alias: 'checkbox',
                        view: 'checkbox',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/checkbox.html'
                    }
                },
                {
                    type: 'dropdown',
                    name: 'Dropdown',
                    control: {
                        alias: 'dropdown',
                        view: 'dropdown',
                        config: {},
                        template: '/App_Plugins/SniperContentGrid/propertyViews/dropdown.html'
                    },
                    prevalueTemplate: '/App_Plugins/SniperContentGrid/propertyPrevalueViews/dropdown.html'
                },
                {
                    type: 'contentpicker',
                    name: 'Content picker',
                    control: {
                        alias: 'SniperContentGridContentPicker',
                        label: '',
                        description: '',
                        view: 'contentpicker',
                        config: {
                            minNumber: 0,
                            maxNumber: 0,
                            multiPicker: '0'
                        }
                    },
                    prevalueTemplate: '/App_Plugins/SniperContentGrid/propertyPrevalueViews/contentpicker.html',
                    applyProperties: function (control, controlDefinition, props) {
                        if (props.multiple)
                            control.config.multiPicker = '1';
                    }
                },
                {
                    type: 'mediapicker',
                    name: 'Media Picker',
                    control: {
                        alias: 'SniperContentGridMediaPicker',
                        label: '',
                        description: '',
                        view: 'mediapicker',
                        config: {
                            multiPicker: '0'
                        }
                    },
                    prevalueTemplate: '/App_Plugins/SniperContentGrid/propertyPrevalueViews/mediapicker.html',
                    applyProperties: function (control, controlDefinition, props) {
                        if (props.multiple)
                            control.config.multiPicker = '1';
                    }
                },
                {
                    type: 'datepicker',
                    name: 'Date Picker',
                    control: {
                        alias: 'SniperContentGridDatePicker',
                        label: '',
                        description: '',
                        view: 'datepicker',
                        config: {
                            format: "YYYY-MM-DD",
                            pickTime: false
                        }
                    },
                    prevalueTemplate: '/App_Plugins/SniperContentGrid/propertyPrevalueViews/datepicker.html',
                    applyProperties: function (control, controlDefinition, props) {
                        if (props.time) {
                            control.config.pickTime = true;
                            control.config.format = "YYYY-MM-DD HH:mm:ss"
                        }
                    }
                },
                {
                    type: 'link',
                    name: 'Link',
                    control: {
                        alias: 'link',
                        label: '',
                        description: '',
                        view: '/App_Plugins/SniperUrlPicker/SniperUrlPicker.html',
                        config: {}
                    }
                },
                {
                    type: 'rte',
                    name: 'Rich Text Editor',
                    control: {
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
                    }
                },
                {
                    type: 'icon',
                    name: 'Icon',
                    control: {
                        alias: 'icon',
                        label: '',
                        description: '',
                        view: '/App_Plugins/SniperIconPicker/SniperIconPicker.html',
                        config: {}
                    }
                }
            ];
            return controlDefinitions;
        }
    };
});