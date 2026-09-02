using System;
using System.Diagnostics;
using Umbraco.Core.Composing;

namespace RunClub.Web.StaticMaps
{
    /// <summary>
    /// Writes to the Umbraco log, falling back to trace output if Umbraco is not
    /// available (a request that arrives while the site is still booting, for example).
    /// </summary>
    internal static class StaticMapLog
    {
        public static void Warn(string message)
        {
            try
            {
                Current.Logger.Warn(typeof(StaticMapHandler), message);
            }
            catch (Exception)
            {
                Trace.TraceWarning(message);
            }
        }

        public static void Error(string message, Exception exception)
        {
            try
            {
                Current.Logger.Error(typeof(StaticMapHandler), exception, message);
            }
            catch (Exception)
            {
                Trace.TraceError(message + " " + exception);
            }
        }
    }
}
