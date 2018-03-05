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

angular.module("umbraco").controller("ImageCropper",
    function ($scope, $routeParams, assetsService, mediaResource, cropperHelper, mediaHelper, angularHelper, dialogService) {
        $scope.currentCrop = null;
        $scope.state = null; // store a copy of $scope.model.value, revert to it if we cancel

        var jcrop_api;

        var config = {
            items: [],
            multiple: true
        };

        String.prototype.format = function (args) {
            var newStr = this;
            for (var key in args) {
                newStr = newStr.replace('{' + key + '}', args[key]);
            }
            return newStr;
        }
        // start editing
        $scope.startEditing = function (crop) {
            $scope.state = JSON.stringify($scope.model.value);
            $scope.currentCrop = crop;
            destroyJcrop();
            createJcrop(crop.width, crop.height);

            if (crop.coordinates) {
                var c = crop.coordinates;
                jcrop_api.setSelect([c.x, c.y, c.x + c.width, c.y + c.height]);
            }
        }
        // cancel current edit - revert
        $scope.cancel = function () {
            $scope.model.value = JSON.parse($scope.state);
            destroyJcrop();
            $scope.state = null;
            $scope.currentCrop = null;
        }
        // done - commit change
        $scope.done = function () {
            destroyJcrop();
            $scope.state = null;
            $scope.currentCrop = null;
        }
        // reset current crop
        $scope.reset = function () {
            // suprisingly this is all we need to do
            delete $scope.currentCrop.coordinates;
        }

     
        function destroyJcrop() {
            try {
                jcrop_api.destroy();
            }
            catch (err) {
            }
        }

        function createJcrop(w, h) {
            $('#mainimage').Jcrop({
                aspectRatio: w / h,
                boxWidth: 1024,
                boxHeight: 768,
                onChange: updateCoords,
                bgOpacity: 0.3
            }, function () {
                jcrop_api = this;
            });

        }

        function updateCoords(c) {
            $scope.currentCrop.coordinates = {
                x: c.x,
                y: c.y,
                width: c.w,
                height: c.h
            };
        }

        function computeCropUrl(cropItem) {
            if (cropItem == null)
                return;
            var width = cropItem.width,
                height = cropItem.height;

            if (cropItem.coordinates) {
                var x = cropItem.coordinates.x,
                    y = cropItem.coordinates.y,
                    cropWidth = cropItem.coordinates.width,
                    cropHeight = cropItem.coordinates.height;

                // crop with coordinates
                cropItem.url = '?crop={x},{y},{cropWidth},{cropHeight}&width={width}&height={height}'.format({ x: x, y: y, cropWidth: cropWidth, cropHeight: cropHeight, width: width, height: height });
            } else {
                // crop with focal point
                var focalPoint = $scope.model.value.focalPoint;
                cropItem.url = '?center={top},{left}&mode=crop&width={width}&height={height}'.format({ top: focalPoint.top, left: focalPoint.left, width: width, height: height });
            }
        }

        function loadData() {
            angular.extend(config, $scope.model.config);
            $scope.model.config = config;
            if (angular.isArray($scope.model.config.items)) {
                $scope.cropsettings = [];
                for (var i = 0; i < $scope.model.config.items.length; i++) {
                    var c = $scope.model.config.items[i];
                    $scope.cropsettings.push({ id: c.alias, name: c.alias + ' (' + c.width + 'x' + c.height + ')', width: c.width, height: c.height });
                }
            }
            else if (!angular.isObject($scope.model.config.items)) {
                throw "The items property an array";
            }

            // set up initial data
            if (!angular.isObject($scope.model.value)) {
                $scope.model.value = {
                    focalPoint: { top: 0.5, left: 0.5 },
                    crops: _.map($scope.cropsettings, function (settings) {
                        return {
                            alias: settings.id,
                            width: settings.width,
                            height: settings.height
                        };
                    })
                };
            }

            // remove any crops that don't exist anymore
            $scope.model.value.crops = _.reject($scope.model.value.crops, function (cropItem) {
                return _.find($scope.cropsettings, function (settingItem) { return settingItem.id == cropItem.alias; }) == null;
            })

            // create or update crops
            _.each($scope.cropsettings, function (settingItem) {
                var crop = _.find($scope.model.value.crops, function (cropItem) { return cropItem.alias == settingItem.id; });
                // create
                if (crop == null) {
                    $scope.model.value.crops.push({ alias: settingItem.id, width: settingItem.width, height: settingItem.height });
                } else {
                    // update
                    crop.width = settingItem.width;
                    crop.height = settingItem.height;
                }
            });

            $scope.$watch('model.value.focalPoint', function (newValue) {
                _.each($scope.model.value.crops, computeCropUrl);
            }, true);

            $scope.$watch('currentCrop', computeCropUrl, true);
        }

        loadData();

        assetsService.load(["/App_Plugins/SniperCropper/jquery.jcrop.min.js"]).then(function () {
            var cId = $routeParams.id;

            mediaResource.getById(cId).then(function (media) {
                var myMedia = media;
                var props = [];
                if ({ imageModel: myMedia }.imageModel.properties) {
                    props = { imageModel: myMedia }.imageModel.properties;
                } else {
                    $({ imageModel: myMedia }.imageModel.tabs).each(function (i, tab) {
                        props = props.concat(tab.properties);
                    });
                }
                var imageProp = _.find(props, function (item) {
                    if (item.alias === "umbracoWidth") {
                        $scope.mainimagewidth = parseInt(item.value)
                        $scope.resizeimagewidth = 0;
                    }
                    if (item.alias === "umbracoHeight") {
                        $scope.mainimageheight = parseInt(item.value);
                        $scope.resizeimageheight = 0;
                    }
                });

                var myMediaUrl = getMediaUrl({ mediaModel: myMedia });
                $('#mainimage').attr("src", myMediaUrl);
                $scope.mainimageratio = $scope.mainimagewidth / $scope.mainimageheight;
                $scope.mainimageurl = myMediaUrl;
            });
        });

        function getMediaUrl(options) {
            //combine all props, TODO: we really need a better way then this
            var props = [];
            if (options.mediaModel.properties) {
                props = options.mediaModel.properties;
            } else {
                $(options.mediaModel.tabs).each(function (i, tab) {
                    props = props.concat(tab.properties);
                });
            }

            var mediaRoot = Umbraco.Sys.ServerVariables.umbracoSettings.mediaPath;
            var imageProp = _.find(props, function (item) {
                if (item.alias === "umbracoFile") {
                    return true;
                }

                //this performs a simple check to see if we have a media file as value
                //it doesnt catch everything, but better then nothing
                if (angular.isString(item.value) && item.value.indexOf(mediaRoot) === 0) {
                    return true;
                }

                return false;
            });

            if (!imageProp) {
                return "";
            }
            return imageProp.value.src;
        }
    });
