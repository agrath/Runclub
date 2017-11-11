<%@ Page Language="C#" AutoEventWireup="true" CodeBehind="AmenitiesGeoJson2DbJson.aspx.cs" Inherits="RunClub.Web.AmenitiesGeoJson2DbJson" %>

<!DOCTYPE html>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
        <div>
            <asp:TextBox runat="server" ID="uxGeoJson" TextMode="MultiLine" Placeholder="Paste Geo-Json here" Rows="20" Columns="200"></asp:TextBox><br /><br />
            <asp:Button runat="server" id="uxConvertButton" Text="vvvv Convert to db.json vvvv" OnClick="uxConvertButton_Click" /><br /><br />
            <asp:TextBox runat="server" ID="uxDbJson" TextMode="MultiLine" Placeholder="Output will appear here" Enabled="false" Rows="20" Columns="200"></asp:TextBox><br />
        </div>
    </form>
</body>
</html>
