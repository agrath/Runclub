using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Sniper.Umbraco.SmartPropertyTypes.SniperContentGrid;
using Umbraco.Core.Models;
using Umbraco.Core.Models.PublishedContent;

namespace RunClub.ContentModels
{

	public class FAQFaqGridSniperContentGridSmartPropertyRow : ISniperContentGridSmartPropertyRow
	{
		[JsonProperty]
		public string FaqGroup { get; private set; }
		[JsonProperty]
		public string FaqQuestion { get; private set; }
		[JsonProperty]
		[JsonConverter(typeof(UmbracoRteJsonConverter))]
		public System.Web.IHtmlString FaqAnswer { get; private set; }

	}

	public class FAQFaqGridSniperContentGrid : SniperContentGridSmartProperty<FAQFaqGridSniperContentGridSmartPropertyRow>
	{
		public FAQFaqGridSniperContentGrid(IPublishedContent content)
			: base(content, "faqGrid")
		{
		}
	}

}
