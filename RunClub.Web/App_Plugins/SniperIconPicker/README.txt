1. Add the provided CSS to your page:
	<link type="text/css" rel="stylesheet" href="~/App_Plugins/SniperIconPicker/css/icons.css" />
   Or you can @import this into a less file

2. Use the icon as follows:
	<i class="icon @(Model.Content.GetPropertyValue<string>("iconPicker"))"></i>

