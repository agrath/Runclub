using System;
using Umbraco.Core.Models;
using System.ComponentModel;
using Sniper.Umbraco.Plugins;

namespace RunClub.ContentModels
{

	public enum Crop
	{
	}

	public class ImageCropsSniperCropper
	{
		private IPublishedContent _Content;
		private string _PropertyName = "crops";


		public ImageCropsSniperCropper(IPublishedContent content)
		{
			this._Content = content;
		}
	}

	public static class CropperExtensions
	{
		public static string GetImageCrop( this IPublishedContent content, Crop crop )
		{
			return Sniper.Umbraco.Plugins.Cropper.GetImageCrop(content, "crops", Sniper.Common.EnumHelper.GetDescription(crop) );
		}
	}

}
