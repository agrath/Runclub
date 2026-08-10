using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// The disk cache that sits between the site and the Google Static Maps API.
    /// One billed request per distinct map, then nothing until the map changes.
    /// </summary>
    internal static class StaticMapCache
    {
        private const int MinimumImageBytes = 512;
        private const int MaximumImageBytes = 4 * 1024 * 1024;
        private const int ErrorTextLimit = 500;

        /// <summary>A file this new is assumed to belong to an in-flight request and is never pruned.</summary>
        private static readonly TimeSpan PruneGracePeriod = TimeSpan.FromMinutes(5);

        private static readonly ConcurrentDictionary<string, object> Gates =
            new ConcurrentDictionary<string, object>(StringComparer.Ordinal);

        /// <summary>
        /// Returns the cached image for a coordinate, fetching it from Google first if it
        /// is missing or has expired. Returns null only when there is nothing to serve:
        /// no cached copy and the fetch failed.
        /// </summary>
        public static FileInfo GetOrFetch(StaticMapSettings settings, MeetingPointAllowList allowList, string coordinate)
        {
            var fileName = settings.CacheFileName(coordinate);
            var file = new FileInfo(Path.Combine(settings.CacheDirectory, fileName));

            if (IsUsable(file, settings))
            {
                return file;
            }

            // One fetch per image, however many requests arrive together.
            lock (Gates.GetOrAdd(fileName, name => new object()))
            {
                file.Refresh();
                if (IsUsable(file, settings))
                {
                    return file;
                }

                try
                {
                    Download(settings.BuildRequestUri(coordinate), file.FullName, settings);
                    file.Refresh();
                    Prune(settings, allowList);
                    return file;
                }
                catch (Exception exception)
                {
                    StaticMapLog.Error("Could not fetch the static map for " + coordinate + ".", exception);

                    // An expired image still shows the right place, so serve it rather
                    // than break the page over a transient Google failure.
                    file.Refresh();
                    return file.Exists && file.Length >= MinimumImageBytes ? file : null;
                }
            }
        }

        private static bool IsUsable(FileInfo file, StaticMapSettings settings)
        {
            if (!file.Exists || file.Length < MinimumImageBytes)
            {
                return false;
            }

            return settings.MaxAge <= TimeSpan.Zero
                   || DateTime.UtcNow - file.LastWriteTimeUtc <= settings.MaxAge;
        }

        private static void Download(string requestUri, string destination, StaticMapSettings settings)
        {
            var image = Fetch(requestUri, settings);

            if (image.Length < MinimumImageBytes)
            {
                throw new InvalidDataException(
                    "Google returned " + image.Length + " bytes, which is too small to be a map.");
            }

            Directory.CreateDirectory(Path.GetDirectoryName(destination));

            // Write aside and move into place so a reader never sees a half-written file.
            var temporary = destination + "." + Guid.NewGuid().ToString("N") + ".tmp";
            File.WriteAllBytes(temporary, image);

            try
            {
                File.Delete(destination);
                File.Move(temporary, destination);
            }
            catch (IOException)
            {
                // Another worker beat us to it, or a request is still transmitting the
                // file we tried to replace. Either way there is a usable image in place,
                // so drop ours rather than log a failure the site never noticed.
                File.Delete(temporary);

                if (!IsUsable(new FileInfo(destination), settings))
                {
                    throw;
                }
            }
            catch (Exception)
            {
                File.Delete(temporary);
                throw;
            }
        }

        private static byte[] Fetch(string requestUri, StaticMapSettings settings)
        {
            var timeout = (int)settings.Timeout.TotalMilliseconds;

            var request = (HttpWebRequest)WebRequest.Create(requestUri);
            request.Method = "GET";
            request.Timeout = timeout;
            request.ReadWriteTimeout = timeout;
            request.Accept = "image/*";
            request.UserAgent = "Metrorun static map cache";
            request.AutomaticDecompression = DecompressionMethods.GZip | DecompressionMethods.Deflate;

            try
            {
                using (var response = (HttpWebResponse)request.GetResponse())
                {
                    var contentType = response.ContentType ?? string.Empty;
                    if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new InvalidDataException(
                            "Google returned '" + contentType + "' instead of an image: " + ReadText(response));
                    }

                    using (var stream = response.GetResponseStream())
                    using (var buffer = new MemoryStream())
                    {
                        Copy(stream, buffer);
                        return buffer.ToArray();
                    }
                }
            }
            catch (WebException exception)
            {
                throw new InvalidOperationException(
                    "The Google Static Maps request failed: " + Describe(exception), exception);
            }
        }

        private static void Copy(Stream source, Stream destination)
        {
            var buffer = new byte[8192];
            var total = 0;
            int read;

            while (source != null && (read = source.Read(buffer, 0, buffer.Length)) > 0)
            {
                total += read;
                if (total > MaximumImageBytes)
                {
                    throw new InvalidDataException(
                        "Google returned more than " + MaximumImageBytes + " bytes.");
                }

                destination.Write(buffer, 0, read);
            }
        }

        /// <summary>
        /// Google explains refused requests in the response body ("this API project is not
        /// authorized", "the provided API key is expired"). Surfacing it turns a silent
        /// broken image into a log entry that says what to fix.
        /// </summary>
        private static string Describe(WebException exception)
        {
            var response = exception.Response as HttpWebResponse;
            if (response == null)
            {
                return exception.Message;
            }

            using (response)
            {
                return (int)response.StatusCode + " " + response.StatusDescription + " - " + ReadText(response);
            }
        }

        private static string ReadText(HttpWebResponse response)
        {
            try
            {
                using (var stream = response.GetResponseStream())
                {
                    if (stream == null)
                    {
                        return string.Empty;
                    }

                    using (var reader = new StreamReader(stream, Encoding.UTF8))
                    {
                        var buffer = new char[ErrorTextLimit];
                        var read = reader.Read(buffer, 0, buffer.Length);
                        return new string(buffer, 0, read).Trim();
                    }
                }
            }
            catch (Exception)
            {
                return string.Empty;
            }
        }

        /// <summary>
        /// Deletes cached images that no longer correspond to a published meeting point.
        /// Moving a route's start point changes its cache file name, and this is what
        /// clears out the copy drawn at the old coordinates.
        /// </summary>
        private static void Prune(StaticMapSettings settings, MeetingPointAllowList allowList)
        {
            try
            {
                var wanted = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                foreach (var coordinate in allowList.Coordinates)
                {
                    wanted.Add(settings.CacheFileName(coordinate));
                }

                var cutoff = DateTime.UtcNow - PruneGracePeriod;

                foreach (var path in Directory.GetFiles(settings.CacheDirectory, "*" + settings.FileExtension))
                {
                    if (wanted.Contains(Path.GetFileName(path)) || File.GetLastWriteTimeUtc(path) > cutoff)
                    {
                        continue;
                    }

                    File.Delete(path);
                }
            }
            catch (Exception exception)
            {
                // Housekeeping only. A stale file costs a few kilobytes, not a request.
                StaticMapLog.Error("Could not prune the static map cache.", exception);
            }
        }
    }
}
