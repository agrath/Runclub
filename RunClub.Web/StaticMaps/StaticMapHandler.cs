using System;
using System.Globalization;
using System.IO;
using System.Web;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// Serves Google Static Maps images from a local disk cache:
    ///
    ///     GET /staticmap.axd?lat={latitude}&amp;lng={longitude}
    ///
    /// The Google API is billed per request, so the site asks it for a given map once and
    /// serves every later request from disk. Because the coordinates are part of the URL,
    /// moving a route's meeting point produces a new URL, a new cache entry and a single
    /// fresh fetch; the old image is deleted on the way past.
    ///
    /// The API key stays on the server. Only meeting points published in data/db.json are
    /// served, which keeps the endpoint from being used to run up a Google bill.
    /// </summary>
    public class StaticMapHandler : IHttpHandler
    {
        public bool IsReusable
        {
            get { return true; }
        }

        public void ProcessRequest(HttpContext context)
        {
            var settings = StaticMapSettings.Current;

            if (string.IsNullOrEmpty(settings.ApiKey))
            {
                StaticMapLog.Warn("Cannot serve static maps: the StaticMap.GoogleApiKey appSetting is empty.");
                Fail(context, 500, "Static maps are not configured.");
                return;
            }

            double latitude, longitude;
            if (!Coordinate.TryParse(context.Request.QueryString["lat"], context.Request.QueryString["lng"], out latitude, out longitude))
            {
                Fail(context, 400, "A valid lat and lng are required.");
                return;
            }

            var coordinate = Coordinate.Format(latitude, longitude);
            var allowList = MeetingPointAllowList.Current;

            if (!allowList.Contains(coordinate))
            {
                Fail(context, 404, "No meeting point is published at those coordinates.");
                return;
            }

            var image = StaticMapCache.GetOrFetch(settings, allowList, coordinate);

            if (image == null)
            {
                Fail(context, 502, "The static map could not be retrieved.");
                return;
            }

            Serve(context, image, settings);
        }

        private static void Serve(HttpContext context, FileInfo image, StaticMapSettings settings)
        {
            var response = context.Response;
            var lastModified = Truncate(image.LastWriteTimeUtc);
            var etag = "\"" + Path.GetFileNameWithoutExtension(image.Name) + "\"";

            response.Cache.SetCacheability(HttpCacheability.Public);
            response.Cache.SetMaxAge(settings.BrowserMaxAge);
            response.Cache.SetETag(etag);
            response.AddHeader("Last-Modified", lastModified.ToString("R", CultureInfo.InvariantCulture));

            if (IsNotModified(context.Request, etag, lastModified))
            {
                response.StatusCode = 304;
                response.SuppressContent = true;
                return;
            }

            response.ContentType = settings.ContentType;
            response.AddHeader("Content-Length", image.Length.ToString(CultureInfo.InvariantCulture));
            response.TransmitFile(image.FullName);
        }

        private static bool IsNotModified(HttpRequest request, string etag, DateTime lastModifiedUtc)
        {
            var ifNoneMatch = request.Headers["If-None-Match"];
            if (!string.IsNullOrEmpty(ifNoneMatch))
            {
                // Matches the bare tag so that a weak validator (W/"...") counts too.
                return ifNoneMatch.Trim() == "*"
                       || ifNoneMatch.IndexOf(etag.Trim('"'), StringComparison.Ordinal) >= 0;
            }

            var ifModifiedSince = request.Headers["If-Modified-Since"];
            DateTime since;
            if (!string.IsNullOrEmpty(ifModifiedSince)
                && DateTime.TryParse(ifModifiedSince, CultureInfo.InvariantCulture,
                    DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out since))
            {
                return lastModifiedUtc <= since;
            }

            return false;
        }

        /// <summary>HTTP dates carry no sub-second part, so drop it before comparing.</summary>
        private static DateTime Truncate(DateTime value)
        {
            return new DateTime(value.Ticks - value.Ticks % TimeSpan.TicksPerSecond, DateTimeKind.Utc);
        }

        private static void Fail(HttpContext context, int statusCode, string message)
        {
            var response = context.Response;

            response.Clear();
            response.StatusCode = statusCode;
            response.TrySkipIisCustomErrors = true;
            response.Cache.SetCacheability(HttpCacheability.NoCache);
            response.ContentType = "text/plain";
            response.Write(message);
        }
    }
}
