using System;
using Umbraco.Core.Models;
using Sniper.Umbraco.SmartPropertyTypes.SniperContentGrid;
using Sniper.Umbraco.PropertyConverters.SniperUrlPicker.Models;
using Newtonsoft.Json;

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
		public string MemberContent { get; private set; }
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
