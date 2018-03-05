//So when you define a 300x300 crop, we're saying we want a 300x300 square image as the result. 
//We upload an image which is 2000x2000. For the purposes of this example, lets say the image we are using is square.
//During cropping, we show the image at 900x900. 
//So the user comes into the admin area and can draw a square box using jCrop on the image at any size. 
//That operation is saying that they want the 300x300 resulting image to show this area/content from the original source image.
//That will produce a crop data set of e.g. 400,200,450,450 which is relative to the 900x900 image. (This is a 450x450 square located at 400x200 in the image)
//Then we take that set of coordinates and scale it up to the original non scaled image dimensions/size - 450x450 is 50% of 900x900 so that means we make a square image which is 1000x1000 square, located at 800x400 in the image. 
//Then, that square 1000x1000 image of that segment of the image is scaled down to 300x300 for the final output.
//The green/red highlighting of the crop is determined by comparing the output crop size (1000x1000) to the target crop size (300x300)
//If the region of the image selected was very small, then the output section of the image (1000x1000 in example above) after scaling would be less than the desired real size of the resulting image (300x300) so in the final resize operation we'd be scaling up. 
//That would mostly happen if the user uploaded a source image that was really small in comparison to the crop sizes we wanted to produce, then took small sections from the image in the cropper.

angular.module("umbraco").controller("SniperCropperGridEditor",
    function ($scope, $routeParams, $timeout, assetsService, mediaResource, imageHelper, angularHelper, dialogService) {
        $scope.setImage = function () {

            dialogService.mediaPicker({
                startNodeId: $scope.control.editor.config && $scope.control.editor.config.startNodeId ? $scope.control.editor.config.startNodeId : undefined,
                multiPicker: false,
                cropSize: $scope.control.editor.config && $scope.control.editor.config.size ? $scope.control.editor.config.size : undefined,
                showDetails: true,
                callback: function (data) {

                    $scope.control.value = {
                        focalPoint: data.focalPoint,
                        id: data.id,
                        image: data.image
                    };

                    $scope.setUrl();
                }
            });
        };

        $scope.setUrl = function () {

            if ($scope.control.value.image) {
                var url = $scope.control.value.image;

                if ($scope.control.editor.config && $scope.control.editor.config.size) {
                    url += "?width=" + $scope.control.editor.config.size.width;
                    url += "&height=" + $scope.control.editor.config.size.height;

                    if ($scope.control.value.focalPoint) {
                        url += "&center=" + $scope.control.value.focalPoint.top + "," + $scope.control.value.focalPoint.left;
                        url += "&mode=crop";
                    }
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
