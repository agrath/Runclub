using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Newtonsoft.Json.Linq;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// The set of meeting points published in data/db.json, in canonical
    /// "latitude,longitude" form.
    ///
    /// staticmap.axd serves these coordinates and nothing else. Without that check the
    /// handler would be an open proxy: anyone could walk it through millions of unique
    /// coordinates, every one a cache miss and a billed Google request.
    ///
    /// The file is re-read whenever its timestamp or length changes, so editing a
    /// meeting point takes effect on the next request.
    /// </summary>
    internal sealed class MeetingPointAllowList
    {
        private static readonly object SyncRoot = new object();
        private static MeetingPointAllowList _current;

        private readonly HashSet<string> _coordinates;
        private readonly DateTime _sourceWriteTimeUtc;
        private readonly long _sourceLength;

        private MeetingPointAllowList(HashSet<string> coordinates, FileInfo source)
        {
            _coordinates = coordinates;
            _sourceWriteTimeUtc = source.Exists ? source.LastWriteTimeUtc : DateTime.MinValue;
            _sourceLength = source.Exists ? source.Length : -1;
        }

        public static MeetingPointAllowList Current
        {
            get
            {
                var source = new FileInfo(StaticMapSettings.Current.RoutesFile);

                var loaded = _current;
                if (loaded != null && loaded.MatchesSource(source))
                {
                    return loaded;
                }

                lock (SyncRoot)
                {
                    if (_current == null || !_current.MatchesSource(source))
                    {
                        _current = Load(source);
                    }

                    return _current;
                }
            }
        }

        public IEnumerable<string> Coordinates
        {
            get { return _coordinates; }
        }

        public bool Contains(string coordinate)
        {
            return _coordinates.Contains(coordinate);
        }

        private bool MatchesSource(FileInfo source)
        {
            return source.Exists
                   && source.LastWriteTimeUtc == _sourceWriteTimeUtc
                   && source.Length == _sourceLength;
        }

        private static MeetingPointAllowList Load(FileInfo source)
        {
            var coordinates = new HashSet<string>(StringComparer.Ordinal);

            if (!source.Exists)
            {
                StaticMapLog.Warn("Cannot serve static maps: " + source.FullName + " was not found.");
                return new MeetingPointAllowList(coordinates, source);
            }

            try
            {
                using (var reader = new StreamReader(source.FullName, Encoding.UTF8, true))
                {
                    foreach (var route in JArray.Parse(reader.ReadToEnd()))
                    {
                        var meetingPoint = route["meetingPoint"];
                        if (meetingPoint == null || meetingPoint.Type != JTokenType.Object)
                        {
                            continue;
                        }

                        var latitude = meetingPoint["latitude"];
                        var longitude = meetingPoint["longitude"];
                        if (latitude == null || longitude == null)
                        {
                            continue;
                        }

                        coordinates.Add(Coordinate.Format(latitude.Value<double>(), longitude.Value<double>()));
                    }
                }
            }
            catch (Exception exception)
            {
                StaticMapLog.Error("Cannot serve static maps: " + source.FullName + " could not be read.", exception);
                coordinates.Clear();
            }

            return new MeetingPointAllowList(coordinates, source);
        }
    }
}
