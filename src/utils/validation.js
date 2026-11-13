// Letters from any script (São Paulo, Zürich, 東京), plus spaces, dots,
// apostrophes, commas and hyphens (St. John's, Winston-Salem).
const CITY_PATTERN = /^[\p{L}\p{M}\s.'’,-]+$/u;

export function validateCityQuery(raw) {
  const value = (raw || '').trim();
  if (!value) return 'Enter a city name to search.';
  if (value.length < 2) return 'Type at least 2 characters so we can suggest cities.';
  if (value.length > 85) return 'That name is too long. City names are under 85 characters.';
  if (!CITY_PATTERN.test(value)) {
    return 'City names can only contain letters, spaces, hyphens, dots and apostrophes. Remove any numbers or symbols.';
  }
  return null;
}

export function validateReminderTime(value) {
  if (!value) return 'Choose a time for your daily reminder.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return 'Enter a valid time, for example 07:30.';
  return null;
}
