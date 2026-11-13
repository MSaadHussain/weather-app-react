/**
 * Both providers are normalised to one internal condition vocabulary so the
 * UI (icons, colours, copy) never has to know which API answered.
 */
export const CONDITIONS = ['clear', 'partly-cloudy', 'cloudy', 'fog', 'drizzle', 'rain', 'snow', 'thunderstorm'];

/** OpenWeatherMap condition id -> internal condition. https://openweathermap.org/weather-conditions */
export function conditionFromOwm(id) {
  if (id >= 200 && id < 300) return 'thunderstorm';
  if (id >= 300 && id < 400) return 'drizzle';
  if (id === 511) return 'snow';
  if (id >= 500 && id < 600) return 'rain';
  if (id >= 600 && id < 700) return 'snow';
  if (id >= 700 && id < 800) return 'fog';
  if (id === 800) return 'clear';
  if (id === 801 || id === 802) return 'partly-cloudy';
  return 'cloudy';
}

const WMO = {
  0: ['clear', 'Clear sky'],
  1: ['partly-cloudy', 'Mainly clear'],
  2: ['partly-cloudy', 'Partly cloudy'],
  3: ['cloudy', 'Overcast'],
  45: ['fog', 'Fog'],
  48: ['fog', 'Depositing rime fog'],
  51: ['drizzle', 'Light drizzle'],
  53: ['drizzle', 'Moderate drizzle'],
  55: ['drizzle', 'Dense drizzle'],
  56: ['drizzle', 'Light freezing drizzle'],
  57: ['drizzle', 'Dense freezing drizzle'],
  61: ['rain', 'Slight rain'],
  63: ['rain', 'Moderate rain'],
  65: ['rain', 'Heavy rain'],
  66: ['rain', 'Light freezing rain'],
  67: ['rain', 'Heavy freezing rain'],
  71: ['snow', 'Slight snowfall'],
  73: ['snow', 'Moderate snowfall'],
  75: ['snow', 'Heavy snowfall'],
  77: ['snow', 'Snow grains'],
  80: ['rain', 'Slight rain showers'],
  81: ['rain', 'Moderate rain showers'],
  82: ['rain', 'Violent rain showers'],
  85: ['snow', 'Slight snow showers'],
  86: ['snow', 'Heavy snow showers'],
  95: ['thunderstorm', 'Thunderstorm'],
  96: ['thunderstorm', 'Thunderstorm with slight hail'],
  99: ['thunderstorm', 'Thunderstorm with heavy hail'],
};

/** Open-Meteo WMO weather code -> [condition, description]. */
export function conditionFromWmo(code) {
  return WMO[code] || ['cloudy', 'Unknown conditions'];
}

export function capitalise(text = '') {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---- Unit formatting -------------------------------------------------------
// Data is always stored in metric (°C, m/s, metres) so switching units is a pure
// presentation change: no refetch, no page reload.

export const toFahrenheit = (c) => (c * 9) / 5 + 32;

export function formatTemp(celsius, unit, { withUnit = false } = {}) {
  if (celsius == null || Number.isNaN(celsius)) return '–';
  const value = Math.round(unit === 'F' ? toFahrenheit(celsius) : celsius);
  return `${value}°${withUnit ? unit : ''}`;
}

export function formatWind(ms, unit) {
  if (ms == null) return { value: '–', label: '' };
  return unit === 'F'
    ? { value: Math.round(ms * 2.23694), label: 'mph' }
    : { value: Math.round(ms * 3.6), label: 'km/h' };
}

export function formatVisibility(metres, unit) {
  if (metres == null) return { value: '–', label: '' };
  if (unit === 'F') {
    const mi = metres / 1609.344;
    return { value: mi >= 10 ? Math.round(mi) : mi.toFixed(1), label: 'mi' };
  }
  const km = metres / 1000;
  return { value: km >= 10 ? Math.round(km) : km.toFixed(1), label: 'km' };
}

export function windDirection(deg) {
  if (deg == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function describeHumidity(h) {
  if (h == null) return '';
  if (h < 30) return 'Dry air';
  if (h < 60) return 'Comfortable';
  if (h < 80) return 'Humid';
  return 'Very humid';
}

export function describeVisibility(m) {
  if (m == null) return 'Not reported';
  if (m >= 10000) return 'Clear view';
  if (m >= 5000) return 'Good';
  if (m >= 1000) return 'Reduced';
  return 'Poor';
}

export function describePressure(hpa) {
  if (hpa == null) return '';
  if (hpa < 1000) return 'Low, unsettled';
  if (hpa > 1022) return 'High, settled';
  return 'Normal';
}

export function describeWind(ms) {
  if (ms == null) return '';
  if (ms < 1.5) return 'Calm';
  if (ms < 5.5) return 'Light breeze';
  if (ms < 10.8) return 'Breezy';
  if (ms < 17.2) return 'Strong wind';
  return 'Gale';
}
