angular.module("umbraco").controller("SniperCropperGridEditor",
    function ($scope,  $timeout, editorService) {
        $scope.setImage = function () {

            editorService.mediaPicker({
                startNodeId: $scope.control.editor.config && $scope.control.editor.config.startNodeId ? $scope.control.editor.config.startNodeId : undefined,
                view: 'mediapicker',
                multiPicker: false,
                disableFolderSelect: true,
                onlyImages: true,

                //cropSize: $scope.control.editor.config && $scope.control.editor.config.size ? $scope.control.editor.config.size : undefined,
                //showDetails: true,
                submit: function (model) {
                    var data = model.selection[0];
                    console.log('data', data);
                    $scope.control.value = {
                        id: data.id,
                        udi: data.udi,
                        image: data.image,
                        caption: data.image.altText
                    };
                    $scope.setUrl();

                    editorService.close();
                },
                close: function () {
                    editorService.close();
                }
            });
        };

        $scope.setUrl = function () {

            if ($scope.control.value.image) {
                var url = $scope.control.value.image;

                console.log('$scope.control.editor.config', $scope.control.editor.config);
                if ($scope.control.editor.config && $scope.control.editor.config.size) {
                    url += "?width=" + $scope.control.editor.config.size.width;
                    url += "&height=" + $scope.control.editor.config.size.height;

                    if ($scope.control.value.focalPoint) {
                        url += "&center=" + $scope.control.value.focalPoint.top + "," + $scope.control.value.focalPoint.left;
                    }
                    url += "&mode=crop";
                }

                $scope.url = url;
            }
        };

        $timeout(function () {
            if ($scope.control.$initializing) {
                $scope.setImage();
            } else {
                $scope.setUrl();
            }
        }, 200);
    });
