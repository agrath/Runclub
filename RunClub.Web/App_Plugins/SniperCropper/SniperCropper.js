angular.module("umbraco").controller("ImageCropper", function ($scope, mediaResource, editorState) {
    $scope.currentCrop = null;
    $scope.state = null; // store a copy of $scope.model.value, revert to it if we cancel
    var cropper;
    var config = {
        items: [],
        multiple: true
    };

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

    // remove any crops that don't exist anymore
    $scope.model.value.crops = _.reject($scope.model.value.crops, function (cropItem) {
        return _.find($scope.cropsettings, function (settingItem) { return settingItem.id == cropItem.alias; }) == null;
    })

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
        destroyCropper();
        createCropper(crop);
    }
    // cancel current edit - revert
    $scope.cancel = function () {
        $scope.model.value = JSON.parse($scope.state);
        destroyCropper();
        $scope.state = null;
        $scope.currentCrop = null;
    }
    // done - commit change
    $scope.done = function () {
        destroyCropper();
        $scope.state = null;
        $scope.currentCrop = null;
    }

    // reset current crop
    $scope.reset = function () {
        // suprisingly this is all we need to do
        delete $scope.currentCrop.coordinates;
    }

    function destroyCropper() {
        try {
            cropper.destroy();
        }
        catch (err) {
        }
    }

    function createCropper(crop) {
        var umbracoWidth = $scope.mainimagewidth,
            umbracoHeight = $scope.mainimageheight,
            ratio = umbracoWidth / umbracoHeight,
            width = Math.min(umbracoWidth, 1024) * ratio,
            height = Math.min(umbracoHeight, 768);
        
        jQuery('#mainimage')
            .parents('.cropper-parent')
            .css('max-width', width)
            .css('max-height', height);

        var image = document.getElementById('mainimage');
        cropper = new Cropper(image, {
            aspectRatio: crop.width / crop.height,
            viewMode: 3,
            modal: false,
            center: false,
            zoomable: false,
            scalable: false,
            autoCrop: false,
            movable: false,
            rotatable: false,
            background: false,
            ready: function () {
                if (crop.coordinates) {
                    var c = crop.coordinates,
                        cropBoxData = {
                            left: parseFloat(c.x),
                            top: parseFloat(c.y),
                            width: parseFloat(c.width),
                            height: parseFloat(c.height)
                        };
                    cropper.crop();
                    cropper.setCropBoxData(cropBoxData);
                }
            },
            crop: function (event) {
                var c = event.detail;
                $scope.currentCrop.coordinates = {
                    x: c.x,
                    y: c.y,
                    width: c.width,
                    height: c.height
                };
            }
        })
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

    mediaResource.getById(editorState.current.id).then(function (media) {
        var myMedia = media;
        var props = [];
        if ({ imageModel: myMedia }.imageModel.properties) {
            props = { imageModel: myMedia }.imageModel.properties;
        } else {
            $({ imageModel: myMedia }.imageModel.tabs).each(function (i, tab) {
                props = props.concat(tab.properties);
            });
        }
        _.each(props, function (item) {
            if (item.alias === "umbracoWidth") {
                $scope.mainimagewidth = parseInt(item.value)
            }
            else if (item.alias === "umbracoHeight") {
                $scope.mainimageheight = parseInt(item.value);
            }
        });

        var myMediaUrl = media.mediaLink;
        $('#mainimage').attr("src", myMediaUrl);
        $scope.mainimageurl = myMediaUrl;

        $scope.ratio = $scope.mainimagewidth / $scope.mainimageheight;
        $scope.maxWidth = Math.min($scope.mainimagewidth, 1024) * $scope.ratio;
        $scope.maxHeight = Math.min($scope.mainimageheight, 768);

    });

    $scope.$watch('currentCrop', computeCropUrl, true);

    $scope.focalPointChanged = function (left, top) {
        $scope.model.value.focalPoint = {
            left: left,
            top: top
        };
        _.each($scope.model.value.crops, computeCropUrl);
    }

    // initialize crop urls
    _.each($scope.model.value.crops, computeCropUrl);
});
