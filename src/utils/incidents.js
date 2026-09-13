// Helpers shared by the incident pages. Vocabulary mirrors biobot-cloud:
// severity none | watch | alert | critical | fault, outcome unknown | fire |
// false_alarm | sensor_fault.

export const SEVERITY_RANK = { none: 0, watch: 1, alert: 2, fault: 2, critical: 3 };

export const OUTCOME_LABELS = {
  unknown: 'Unknown',
  fire: 'Fire',
  false_alarm: 'False alarm',
  sensor_fault: 'Sensor fault',
};

export const SIGNAL_LABELS = {
  pm25_high: 'PM2.5 high',
  pm25_elevated: 'PM2.5 elevated',
  pm25_critical: 'PM2.5 very high',
  gas_resistance_drop: 'Gas resistance dropped',
  humidity_drop: 'Humidity dropped',
  temperature_rise: 'Temperature rising',
  sensor_fault: 'Particulate sensor fault',
};

export function signalLabel(key) {
  return SIGNAL_LABELS[key] || key;
}

export function outcomeLabel(outcome) {
  return OUTCOME_LABELS[outcome] || outcome || 'Unknown';
}

// "2h 15m", "3d 4h", "12m". `to` defaults to now.
export function formatDuration(from, to) {
  if (!from) return '';
  const start = new Date(from).getTime();
  const end = to ? new Date(to).getTime() : Date.now();
  const mins = Math.max(0, Math.floor((end - start) / 60000));
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const rem = mins % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${rem}m`;
  return `${rem}m`;
}

export function hasCoords(obj) {
  return obj && Number.isFinite(Number(obj.latitude)) && Number.isFinite(Number(obj.longitude));
}

export function osmLink(lat, lon) {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`;
}

export function geoLink(lat, lon) {
  return `geo:${lat},${lon}?q=${lat},${lon}`;
}

export function formatCoords(lat, lon) {
  return `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`;
}

// Open incidents: worst peak first, then oldest first (waited longest).
export function sortOpen(list) {
  return [...list].sort((a, b) => {
    const r = (SEVERITY_RANK[b.peakSeverity] ?? -1) - (SEVERITY_RANK[a.peakSeverity] ?? -1);
    if (r !== 0) return r;
    return new Date(a.openedAt) - new Date(b.openedAt);
  });
}

// Closed incidents: most recently closed first.
export function sortClosed(list) {
  return [...list].sort((a, b) => new Date(b.closedAt || b.lastEventAt) - new Date(a.closedAt || a.lastEventAt));
}
