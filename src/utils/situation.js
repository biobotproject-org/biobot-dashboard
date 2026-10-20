// Text helpers for wind, spread and the satellite cross-check. Shapes mirror
// biobot-cloud services/situation.js.

export const SEVERITY_COLOR = {
  none: '#2dd4bf',
  watch: '#fbbf24',
  alert: '#f97316',
  critical: '#ef4444',
  fault: '#9ca3af',
};

const STALE_MS = 60 * 60 * 1000;

// A node that has not reported for an hour is drawn faded.
export function isStale(lastSeen) {
  return !lastSeen || Date.now() - new Date(lastSeen).getTime() > STALE_MS;
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export function compass(deg) {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

export function windText(weather) {
  if (!weather || weather.status !== 'ok') return null;
  const gust = Number.isFinite(weather.windGustKmh) && weather.windGustKmh > weather.windSpeedKmh + 5
    ? `, gusts ${Math.round(weather.windGustKmh)}` : '';
  return `${compass(weather.windFromDeg)} ${Math.round(weather.windSpeedKmh)} km/h${gust}`;
}

// "1.2 km" / "350 m"
export function kmText(km) {
  if (!Number.isFinite(km)) return '—';
  return km < 1 ? `${Math.round(km * 1000 / 10) * 10} m` : `${km.toFixed(1)} km`;
}

export function horizon(spread, minutes) {
  return spread?.horizons?.find(h => h.minutes === minutes) || null;
}

export function hoursAgo(iso) {
  const h = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} min ago`;
  return `${Math.round(h)} h ago`;
}

// One line on what satellites have seen near the node.
export function satelliteText(sat) {
  if (!sat) return null;
  switch (sat.status) {
    case 'not_configured': return 'Satellite check off (no FIRMS key)';
    case 'unavailable': return 'Satellite data unavailable right now';
    case 'ok': {
      const n = sat.nearest || sat.hotspots?.[0];
      if (!n) return `No satellite hotspot within ${sat.radiusKm} km in the last 48 h`;
      return `Hotspot ${kmText(n.distanceKm)} ${compass(n.bearingDeg)}, seen ${hoursAgo(n.detectedAt)}`;
    }
    default: return null;
  }
}
