angular.module("umbraco").controller("SniperUmbracoGridContentPicker", function ($scope, $rootScope, $timeout, dialogService, $routeParams, entityResource) {

	$scope.setWidget = function () {

		var config = {
			multiPicker: false,
			entityType: "Document",
			type: "content",
			treeAlias: "content"
		};

		var currentId = $routeParams.id;

		entityResource.getByQuery("$parent/ancestor-or-self::Homepage", currentId, "Document").then(function (ent) {

			dialogService.contentPicker({
				section: config.type,
				treeAlias: config.type,
				multiPicker: config.multiPicker,
				startNodeId: ent.id,
				callback: function (data) {
					console.log(config.startNodeId);
					$scope.control.value = data;
				}
			});

		});

	};
});