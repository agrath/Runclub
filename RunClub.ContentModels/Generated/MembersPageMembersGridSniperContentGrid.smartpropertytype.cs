using System;
using System.Collections.Generic;
using Newtonsoft.Json;
using Sniper.Umbraco.SmartPropertyTypes.SniperContentGrid;
using Umbraco.Core.Models;
using Umbraco.Core.Models.PublishedContent;

namespace RunClub.ContentModels
{

	public class MembersPageMembersGridSniperContentGridSmartPropertyRow : ISniperContentGridSmartPropertyRow
	{
		[JsonProperty]
		public string MemberName { get; private set; }
		[JsonProperty]
		public string MemberPosition { get; private set; }
		[JsonProperty]
		public string MemberGroup { get; private set; }
		[JsonProperty]
		[JsonConverter(typeof(UmbracoRteJsonConverter))]
		public System.Web.IHtmlString MemberContent { get; private set; }
		[JsonProperty]
		public string MemberImage { get; private set; }

	}

	public class MembersPageMembersGridSniperContentGrid : SniperContentGridSmartProperty<MembersPageMembersGridSniperContentGridSmartPropertyRow>
	{
		public MembersPageMembersGridSniperContentGrid(IPublishedContent content)
			: base(content, "membersGrid")
		{
		}
	}

}
