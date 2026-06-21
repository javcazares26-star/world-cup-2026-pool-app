// Mapping of countries and cities to IANA timezone names
const COUNTRY_TIMEZONES: Record<string, string> = {
  "US": "America/New_York",      // Default US timezone
  "Mexico": "America/Mexico_City",
  "MX": "America/Mexico_City",
  "Canada": "America/Toronto",
  "CA": "America/Toronto",
  "Argentina": "America/Argentina/Buenos_Aires",
  "AR": "America/Argentina/Buenos_Aires",
  "Brazil": "America/Sao_Paulo",
  "BR": "America/Sao_Paulo",
  "Uruguay": "America/Montevideo",
  "UY": "America/Montevideo",
  "Paraguay": "America/Asuncion",
  "PY": "America/Asuncion",
  "France": "Europe/Paris",
  "FR": "Europe/Paris",
  "Germany": "Europe/Berlin",
  "DE": "Europe/Berlin",
  "Spain": "Europe/Madrid",
  "ES": "Europe/Madrid",
  "Italy": "Europe/Rome",
  "IT": "Europe/Rome",
  "Portugal": "Europe/Lisbon",
  "PT": "Europe/Lisbon",
  "England": "Europe/London",
  "UK": "Europe/London",
  "GB": "Europe/London",
  "Netherlands": "Europe/Amsterdam",
  "NL": "Europe/Amsterdam",
  "Belgium": "Europe/Brussels",
  "BE": "Europe/Brussels",
  "Poland": "Europe/Warsaw",
  "PL": "Europe/Warsaw",
  "Ukraine": "Europe/Kyiv",
  "UA": "Europe/Kyiv",
  "Japan": "Asia/Tokyo",
  "JP": "Asia/Tokyo",
  "South Korea": "Asia/Seoul",
  "KR": "Asia/Seoul",
  "Australia": "Australia/Sydney",
  "AU": "Australia/Sydney",
};

// Mapping of US cities/states to timezone
const US_CITY_TIMEZONES: Record<string, string> = {
  "new york": "America/New_York",
  "ny": "America/New_York",
  "los angeles": "America/Los_Angeles",
  "la": "America/Los_Angeles",
  "chicago": "America/Chicago",
  "il": "America/Chicago",
  "denver": "America/Denver",
  "co": "America/Denver",
  "dallas": "America/Chicago",
  "tx": "America/Chicago",
  "houston": "America/Chicago",
  "san francisco": "America/Los_Angeles",
  "ca": "America/Los_Angeles",
  "seattle": "America/Los_Angeles",
  "wa": "America/Los_Angeles",
  "miami": "America/New_York",
  "fl": "America/New_York",
  "phoenix": "America/Phoenix",
  "az": "America/Phoenix",
  // Additional 2026 World Cup host venues
  "atlanta": "America/New_York",
  "boston": "America/New_York",
  "foxborough": "America/New_York",
  "philadelphia": "America/New_York",
  "kansas city": "America/Chicago",
  "east rutherford": "America/New_York",
};

// Mapping of common cities to country codes and timezones
const CITY_TIMEZONES: Record<string, { country: string; tz: string }> = {
  "mexico city": { country: "MX", tz: "America/Mexico_City" },
  "monterrey": { country: "MX", tz: "America/Mexico_City" },
  "guadalajara": { country: "MX", tz: "America/Mexico_City" },
  "buenos aires": { country: "AR", tz: "America/Argentina/Buenos_Aires" },
  "sao paulo": { country: "BR", tz: "America/Sao_Paulo" },
  "rio de janeiro": { country: "BR", tz: "America/Sao_Paulo" },
  "toronto": { country: "CA", tz: "America/Toronto" },
  "vancouver": { country: "CA", tz: "America/Vancouver" },
  "paris": { country: "FR", tz: "Europe/Paris" },
  "london": { country: "GB", tz: "Europe/London" },
  "madrid": { country: "ES", tz: "Europe/Madrid" },
  "berlin": { country: "DE", tz: "Europe/Berlin" },
  "rome": { country: "IT", tz: "Europe/Rome" },
  "amsterdam": { country: "NL", tz: "Europe/Amsterdam" },
  "moscow": { country: "RU", tz: "Europe/Moscow" },
  "tokyo": { country: "JP", tz: "Asia/Tokyo" },
  "sydney": { country: "AU", tz: "Australia/Sydney" },
};

export function getTimezoneFromLocation(location: string): string | null {
  if (!location) return null;
  return resolveTimezone(location);
}

/**
 * Resolve a city/location string to an IANA timezone using precise matching.
 * Avoids the substring bug where e.g. "dallas" matched "la" (Los Angeles)
 * or "atlanta" matched "la". Matches whole multi-word phrases, then exact
 * tokens (city names, then 2-letter state/country codes).
 */
function resolveTimezone(input: string): string | null {
  const lower = input.toLowerCase().trim();

  // 1. Exact full-string match
  if (CITY_TIMEZONES[lower]) return CITY_TIMEZONES[lower].tz;
  if (US_CITY_TIMEZONES[lower]) return US_CITY_TIMEZONES[lower];

  // 2. Multi-word phrase contained in the string (e.g. "new york/new jersey" → "new york")
  for (const key of Object.keys(US_CITY_TIMEZONES)) {
    if (key.includes(" ") && lower.includes(key)) return US_CITY_TIMEZONES[key];
  }
  for (const key of Object.keys(CITY_TIMEZONES)) {
    if (key.includes(" ") && lower.includes(key)) return CITY_TIMEZONES[key].tz;
  }

  // 3. Exact token matches — city names first, then state/country codes
  const tokens = lower.split(/[\s,/•|]+/).filter(Boolean);
  for (const t of tokens) {
    if (US_CITY_TIMEZONES[t]) return US_CITY_TIMEZONES[t];
    if (CITY_TIMEZONES[t]) return CITY_TIMEZONES[t].tz;
  }
  for (const t of tokens) {
    const up = t.toUpperCase();
    if (COUNTRY_TIMEZONES[up]) return COUNTRY_TIMEZONES[up];
  }
  return null;
}

export function getCountryCodeFromCity(city: string | null): string {
  if (!city) return "–";

  const lower = city.toLowerCase();

  // Check exact city match
  if (CITY_TIMEZONES[lower]) {
    return CITY_TIMEZONES[lower].country;
  }

  // Default mapping for common World Cup venues
  if (lower.includes("mexico")) return "MX";
  if (lower.includes("canada")) return "CA";
  if (lower.includes("usa")) return "US";

  return "–";
}

export function formatDualTime(
  kickoffUtc: string,
  matchCity: string | null,
  userLocation: string | null
): string {
  const date = new Date(kickoffUtc);

  // Get timezones
  const matchTz = matchCity ? getTimezoneFromCity(matchCity) : null;
  const userTz = userLocation ? getTimezoneFromLocation(userLocation) : null;

  if (!matchTz && !userTz) {
    // Fallback to default browser formatting
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  // Format match local time
  const matchTimeStr = matchTz ? date.toLocaleString(undefined, {
    timeZone: matchTz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) : "";

  const matchCountry = getCountryCodeFromCity(matchCity);
  const matchTimeDisplay = matchTimeStr ? `${matchTimeStr} ${matchCountry}` : "";

  // Format user's local time
  const userTimeStr = userTz ? date.toLocaleString(undefined, {
    timeZone: userTz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) : date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });

  const userLocation_short = userLocation ? userLocation.split(/[,•]/)[0].trim() : "Local";
  const userTimeDisplay = `${userTimeStr} ${userLocation_short}`;

  // Format date (use match timezone if available, otherwise browser)
  const dateStr = matchTz
    ? new Date(date.toLocaleString(undefined, { timeZone: matchTz }))
        .toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return `${dateStr}, ${matchTimeDisplay} / ${userTimeDisplay}`;
}

function getTimezoneFromCity(city: string): string | null {
  if (!city) return null;
  return resolveTimezone(city);
}
