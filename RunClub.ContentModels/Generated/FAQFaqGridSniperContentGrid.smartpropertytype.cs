using System;
using Umbraco.Core.Models;
using Sniper.Umbraco.SmartPropertyTypes.SniperContentGrid;
using Sniper.Umbraco.PropertyConverters.SniperUrlPicker.Models;
using Newtonsoft.Json;

namespace RunClub.ContentModels
{

	public class FAQFaqGridSniperContentGridSmartPropertyRow : ISniperContentGridSmartPropertyRow
	{
		[JsonProperty]
		public string FaqGroup { get; private set; }
		[JsonProperty]
		public string FaqQuestion { get; private set; }
		[JsonProperty]
		public string FaqAnswer { get; private set; }

	}

	public class FAQFaqGridSniperContentGrid : SniperContentGridSmartProperty<FAQFaqGridSniperContentGridSmartPropertyRow>
	{
		public FAQFaqGridSniperContentGrid(IPublishedContent content)
			: base(content, "faqGrid")
		{
		}
	}

}
