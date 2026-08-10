using System;
using System.Globalization;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// Normalises latitude/longitude pairs to a single canonical string so that the
    /// allow list, the cache key and the Google request all agree on the same value.
    /// Six decimal places is roughly 11cm on the ground, well below anything visible
    /// on a zoom 14 map, and it stops trivially different coordinates producing
    /// separate cache entries.
    /// </summary>
    internal static class Coordinate
    {
        private const string Precision = "F6";

        public static string Format(double latitude, double longitude)
        {
            return latitude.ToString(Precision, CultureInfo.InvariantCulture)
                   + "," + longitude.ToString(Precision, CultureInfo.InvariantCulture);
        }

        public static bool TryParse(string latitude, string longitude, out double parsedLatitude, out double parsedLongitude)
        {
            parsedLatitude = 0;
            parsedLongitude = 0;

            return TryParseValue(latitude, 90, out parsedLatitude)
                   && TryParseValue(longitude, 180, out parsedLongitude);
        }

        private static bool TryParseValue(string value, double limit, out double parsed)
        {
            parsed = 0;

            if (string.IsNullOrWhiteSpace(value) || value.Length > 32)
            {
                return false;
            }

            if (!double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out parsed))
            {
                return false;
            }

            return !double.IsNaN(parsed) && !double.IsInfinity(parsed) && Math.Abs(parsed) <= limit;
        }
    }
}
