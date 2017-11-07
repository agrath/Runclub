function registerHttpFileDownload(app) {
    // HTML5 Ajax download
    app.factory('$httpFileDownload', function ($http, $q, $timeout) {
        function base64ToBlob(base64, mimetype, slicesize) {
            if (!window.atob || !window.Uint8Array) {
                // The current browser doesn't have the atob function. Cannot continue
                return null;
            }
            mimetype = mimetype || '';
            slicesize = slicesize || 512;
            var bytechars = atob(base64);
            var bytearrays = [];
            for (var offset = 0; offset < bytechars.length; offset += slicesize) {
                var slice = bytechars.slice(offset, offset + slicesize);
                var bytenums = new Array(slice.length);
                for (var i = 0; i < slice.length; i++) {
                    bytenums[i] = slice.charCodeAt(i);
                }
                var bytearray = new Uint8Array(bytenums);
                bytearrays[bytearrays.length] = bytearray;
            }
            return new Blob(bytearrays, { type: mimetype });
        };

        return {
            get: function (url, options) {
                var deferred = $q.defer();
                var self = this;
                //for get, we assume the payload is not base64
                $http.get(url, options).then(function (response) {
                    var data = response.data;
                    self.handle(btoa(data));
                }, function () {
                    deferred.reject();
                });

                return deferred.promise;
            },
            post: function (url, options) {
                var deferred = $q.defer();
                var self = this;
                //if you're using post, you'll probably be running a webapi method to emit base64 encoded content
                $http.post(url, options).then(function (response) {
                    self.handle(response.data);
                }, function () {
                    deferred.reject();
                });

                return deferred.promise;
            },
            handle: function (data) {
                var a = document.createElement('a'),
                  blob;
                if ('msSaveBlob' in window.navigator) {
                    blob = base64ToBlob(data, result.MimeType);
                    window.navigator.msSaveBlob(blob, result.FileName);
                    deferred.resolve();
                } else if (window.URL && window.Blob && ('download' in a) && window.atob) {
                    // Do it the HTML5 compliant way
                    blob = base64ToBlob(data, result.MimeType);
                    var url = window.URL.createObjectURL(blob);
                    a.href = url;
                    a.download = result.FileName;
                    document.body.appendChild(a);
                    a.click();
                    $timeout(function () {
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                    }, 100);
                    deferred.resolve();
                } else {
                    deferred.reject();
                }
            }
        };
    });
};