/**
 * Maps an ApiError to { title, detail } copy. The rule: say what failed and
 * what the user can do about it. Never "Something went wrong".
 */
const isOffline = () => typeof navigator !== 'undefined' && navigator.onLine === false;

export function describeWeatherError(err, cityName) {
  const place = cityName ? ` for ${cityName}` : '';
  if (isOffline()) {
    return {
      title: "You're offline",
      detail: `We couldn't load weather${place}, and there is no saved copy for this city yet. Reconnect to the internet, then press Try again.`,
    };
  }
  switch (err?.kind) {
    case 'network':
      return {
        title: 'Weather services are unreachable',
        detail: `Neither OpenWeatherMap nor Open-Meteo responded${place}. Check your connection, ad-blocker or firewall, then try again.`,
      };
    case 'timeout':
      return {
        title: 'The weather service is responding slowly',
        detail: `The request${place} timed out after 10 seconds. Wait a moment, then try again.`,
      };
    case 'rate-limit':
      return {
        title: 'Too many requests right now',
        detail: 'Both weather providers are limiting free requests. Wait about a minute, then try again.',
      };
    case 'not-found':
      return {
        title: 'No weather data for this location',
        detail: 'The providers have no forecast for these coordinates. Try a nearby larger city.',
      };
    default:
      return {
        title: `Weather${place} couldn't be loaded`,
        detail: `${err?.message || 'The weather provider sent an unexpected response'}. Try again in a moment.`,
      };
  }
}

export function describeSearchError(err) {
  if (isOffline()) {
    return "You're offline, so city suggestions aren't available. Reconnect, or pick one of your saved cities.";
  }
  switch (err?.kind) {
    case 'rate-limit':
      return 'City search is rate-limited. Pause for a second, then keep typing.';
    case 'timeout':
      return 'City search timed out. Keep typing, or press Enter to retry.';
    case 'network':
      return "Couldn't reach the city search service. Check your connection and press Enter to retry.";
    default:
      return `City search failed (${err?.message || 'unexpected response'}). Press Enter to retry.`;
  }
}
