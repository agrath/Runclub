using System;
using System.Configuration;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Web.Hosting;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// Configuration for staticmap.axd, read from appSettings keys prefixed with "StaticMap.".
    /// Values are read once; editing Web.config recycles the app pool and reloads them.
    /// </summary>
    internal sealed class StaticMapSettings
    {
        private const string Endpoint = "https://maps.googleapis.com/maps/api/staticmap";
        private const string KeyPrefix = "StaticMap.";

        private static readonly Lazy<StaticMapSettings> Instance =
            new Lazy<StaticMapSettings>(Load, true);

        private StaticMapSettings()
        {
        }

        public static StaticMapSettings Current
        {
            get { return Instance.Value; }
        }

        public string ApiKey { get; private set; }

        public string Size { get; private set; }

        public string Zoom { get; private set; }

        public string Scale { get; private set; }

        public string MapType { get; private set; }

        public string Format { get; private set; }

        public string MarkerIconUrl { get; private set; }

        public string MarkerAnchor { get; private set; }

        public string CacheDirectory { get; private set; }

        public string RoutesFile { get; private set; }

        /// <summary>How long a cached image is served before it is fetched again. Zero never expires.</summary>
        public TimeSpan MaxAge { get; private set; }

        /// <summary>The max-age sent to browsers and proxies.</summary>
        public TimeSpan BrowserMaxAge { get; private set; }

        public TimeSpan Timeout { get; private set; }

        public string ContentType
        {
            get
            {
                switch (Format.ToLowerInvariant())
                {
                    case "jpg":
                    case "jpeg":
                    case "jpg-baseline":
                        return "image/jpeg";
                    case "gif":
                        return "image/gif";
                    default:
                        return "image/png";
                }
            }
        }

        public string FileExtension
        {
            get
            {
                switch (Format.ToLowerInvariant())
                {
                    case "jpg":
                    case "jpeg":
                    case "jpg-baseline":
                        return ".jpg";
                    case "gif":
                        return ".gif";
                    default:
                        return ".png";
                }
            }
        }

        /// <summary>
        /// The name of the cached file for a coordinate. Every input that affects what
        /// Google draws feeds the hash, so changing a meeting point, the zoom, the size
        /// or the marker icon produces a different file and forces a fresh fetch.
        /// The API key is deliberately excluded: rotating it must not throw the cache away.
        /// </summary>
        public string CacheFileName(string coordinate)
        {
            var signature = string.Join("|", new[]
            {
                coordinate, Size, Zoom, Scale, MapType, Format, MarkerIconUrl, MarkerAnchor
            });

            using (var hash = SHA256.Create())
            {
                var digest = hash.ComputeHash(Encoding.UTF8.GetBytes(signature));
                var name = new StringBuilder(32);
                for (var i = 0; i < 16; i++)
                {
                    name.Append(digest[i].ToString("x2", CultureInfo.InvariantCulture));
                }

                return name.ToString() + FileExtension;
            }
        }

        public string BuildRequestUri(string coordinate)
        {
            var url = new StringBuilder(Endpoint);
            url.Append("?size=").Append(Uri.EscapeDataString(Size));
            url.Append("&zoom=").Append(Uri.EscapeDataString(Zoom));
            url.Append("&format=").Append(Uri.EscapeDataString(Format));

            if (!string.IsNullOrEmpty(Scale))
            {
                url.Append("&scale=").Append(Uri.EscapeDataString(Scale));
            }

            if (!string.IsNullOrEmpty(MapType))
            {
                url.Append("&maptype=").Append(Uri.EscapeDataString(MapType));
            }

            url.Append("&center=").Append(coordinate);
            url.Append("&markers=").Append(BuildMarker(coordinate));
            url.Append("&key=").Append(Uri.EscapeDataString(ApiKey));

            return url.ToString();
        }

        private string BuildMarker(string coordinate)
        {
            var marker = new StringBuilder();

            if (!string.IsNullOrEmpty(MarkerAnchor))
            {
                marker.Append("anchor:").Append(Uri.EscapeDataString(MarkerAnchor)).Append("%7C");
            }

            if (!string.IsNullOrEmpty(MarkerIconUrl))
            {
                marker.Append("icon:").Append(Uri.EscapeDataString(MarkerIconUrl)).Append("%7C");
            }

            return marker.Append(coordinate).ToString();
        }

        private static StaticMapSettings Load()
        {
            return new StaticMapSettings
            {
                ApiKey = Read("GoogleApiKey", string.Empty),
                Size = Read("Size", "356x280"),
                Zoom = Read("Zoom", "14"),
                Scale = Read("Scale", string.Empty),
                MapType = Read("MapType", string.Empty),
                Format = Read("Format", "png"),
                MarkerIconUrl = Read("MarkerIconUrl", "http://metrorun.nz/images/static-meet-here.png"),
                MarkerAnchor = Read("MarkerAnchor", "bottom"),
                CacheDirectory = MapPath(Read("CachePath", "~/App_Data/StaticMapCache")),
                RoutesFile = MapPath(Read("RoutesFile", "~/data/db.json")),
                MaxAge = TimeSpan.FromDays(ReadDouble("MaxAgeDays", 365)),
                BrowserMaxAge = TimeSpan.FromDays(ReadDouble("BrowserMaxAgeDays", 7)),
                Timeout = TimeSpan.FromSeconds(ReadDouble("TimeoutSeconds", 10))
            };
        }

        private static string Read(string key, string fallback)
        {
            var value = ConfigurationManager.AppSettings[KeyPrefix + key];
            return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        }

        private static double ReadDouble(string key, double fallback)
        {
            double value;
            return double.TryParse(Read(key, string.Empty), NumberStyles.Float, CultureInfo.InvariantCulture, out value) && value >= 0
                ? value
                : fallback;
        }

        private static string MapPath(string virtualPath)
        {
            return virtualPath.StartsWith("~", StringComparison.Ordinal)
                ? HostingEnvironment.MapPath(virtualPath)
                : virtualPath;
        }
    }
}
