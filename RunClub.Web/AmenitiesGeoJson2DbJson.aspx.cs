using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace RunClub.Web
{
    public partial class AmenitiesGeoJson2DbJson : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {

        }

        protected void uxConvertButton_Click(object sender, EventArgs e)
        {
            Dictionary<string, string> typeMap = new Dictionary<string, string>();
            typeMap.Add("toilets", "public-bathroom");
            typeMap.Add("drinking_water", "water-fountain");
            typeMap.Add("viewpoint", "photo-camera");
            List<DbJsonPlace> places = new List<DbJsonPlace>();
            if (!string.IsNullOrWhiteSpace(uxGeoJson.Text))
            {
                try
                {
                    var geoJson = JsonConvert.DeserializeObject<Rootobject>(uxGeoJson.Text);
                    if (geoJson != null)
                    {
                        foreach (var feature in geoJson.features)
                        {
                            float latitude = feature.geometry.coordinates[1];
                            float longitude = feature.geometry.coordinates[0];
                            string geoType = feature.properties.amenity ?? feature.properties.tourism;
                            string type = null;
                            if (typeMap.TryGetValue(geoType, out type))
                            {
                                places.Add(new DbJsonPlace() { Latitude = latitude, Longitude = longitude, Type = type });
                            }
                        }

                        uxDbJson.Text = JsonConvert.SerializeObject(places.ToArray(), Formatting.Indented);

                        return;
                    }
                    else
                    {
                        uxDbJson.Text = "Could not deserialize geo json data";
                    }
                }
                catch (Exception ex)
                {
                    uxDbJson.Text = ex.ToString();
                }
            }
            else
            {
                uxDbJson.Text = "Missing geo json data";
            }
        }
    }
    public class DbJsonPlace
    {
        [JsonProperty("type")]
        public string Type { get; set; }
        [JsonProperty("latitude")]
        public float Latitude { get; set; }
        [JsonProperty("longitude")]
        public float Longitude { get; set; }
    }

    public class Rootobject
    {
        public string type { get; set; }
        public string generator { get; set; }
        public string copyright { get; set; }
        public DateTime timestamp { get; set; }
        public Feature[] features { get; set; }
    }

    public class Feature
    {
        public string type { get; set; }
        public Properties properties { get; set; }
        public Geometry geometry { get; set; }
        public string id { get; set; }
    }

    public class Properties
    {
        public string id { get; set; }
        public string amenity { get; set; }
        public string tourism { get; set; }
        public string name { get; set; }
        public string nameen { get; set; }
        public string namezh { get; set; }
    }

    public class Geometry
    {
        public string type { get; set; }
        public float[] coordinates { get; set; }
    }

}