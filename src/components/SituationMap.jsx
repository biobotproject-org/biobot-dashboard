import { Fragment, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, CircleMarker, Marker, Polygon, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { hasCoords } from '../utils/incidents';
import { SEVERITY_COLOR, isStale } from '../utils/situation';

// One map for the live view and the incident page: nodes coloured by their
// last on-device severity, a pulsing ring on nodes in an open incident, the
// wind-driven spread envelope around them, and NASA FIRMS hotspots.

// 120 min drawn first (faintest, underneath), 30 min last.
const HORIZON_STYLE = {
  120: { color: '#f97316', fillOpacity: 0.07, opacity: 0.45, dashArray: '4 6' },
  60: { color: '#f97316', fillOpacity: 0.12, opacity: 0.6, dashArray: '6 4' },
  30: { color: '#ef4444', fillOpacity: 0.2, opacity: 0.85 },
};

// Keyless basemaps. Satellite shows forest cover and burn scars; terrain
// shows the slopes a fire runs up.
const ESRI = 'Tiles &copy; <a href="https://www.esri.com/">Esri</a>';
const BASE_LAYERS = [
  {
    name: 'Dark',
    urls: [
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    ],
    attribution: `${ESRI} &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors`,
    maxZoom: 16,
  },
  {
    name: 'Satellite',
    urls: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
    attribution: `${ESRI} &mdash; Source: Esri, Maxar, Earthstar Geographics`,
    maxZoom: 18,
  },
  {
    name: 'Terrain',
    urls: ['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'],
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
  },
];
const BASE_KEY = 'biobot.map.base';

function readBase() {
  try {
    const v = localStorage.getItem(BASE_KEY);
    return BASE_LAYERS.some(l => l.name === v) ? v : 'Dark';
  } catch {
    return 'Dark';
  }
}

function RememberBase() {
  useMapEvents({
    baselayerchange: e => {
      try { localStorage.setItem(BASE_KEY, e.name); } catch { /* private mode */ }
    },
  });
  return null;
}

function pulseIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span class="bb-pulse" style="--c:${color}"></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

// Fit the view to the given points once per `fitKey`, so polling does not
// yank the map away from wherever the user has panned.
function FitTo({ points, fitKey }) {
  const map = useMap();
  const last = useRef(null);
  useEffect(() => {
    if (!points.length || last.current === fitKey) return;
    last.current = fitKey;
    if (points.length === 1) map.setView(points[0], 13);
    else map.fitBounds(points, { padding: [40, 40], maxZoom: 14 });
  }, [map, points, fitKey]);
  return null;
}

function MapRef({ onReady }) {
  const map = useMap();
  useEffect(() => { if (onReady) onReady(map); }, [map, onReady]);
  return null;
}

function fmtTime(value) {
  return value ? new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
}

const SituationMap = ({
  devices = [], incidents = [], hotspots = [], fitKey = 'initial', className, onSelectDevice, onReady, scrollWheelZoom = true,
}) => {
  const [initialBase] = useState(readBase);
  const located = devices.filter(hasCoords);
  const openByDevice = new Map(incidents.filter(i => i.device).map(i => [i.device.id, i]));
  const points = [
    ...located.map(d => [Number(d.latitude), Number(d.longitude)]),
    ...hotspots.map(h => [h.latitude, h.longitude]),
    // Keep the whole 2-hour envelope in view, not just the node.
    ...incidents.flatMap(i => i.spread?.horizons?.find(h => h.minutes === 120)?.polygon || []),
  ];

  return (
    <MapContainer
      center={points[0] || [49.9056, -119.4626]}
      zoom={points.length ? 12 : 9}
      maxZoom={18}
      scrollWheelZoom={scrollWheelZoom}
      className={className}
      style={{ background: '#0b0f1a' }}
    >
      <LayersControl position="topright">
        {BASE_LAYERS.map(l => (
          <LayersControl.BaseLayer key={l.name} name={l.name} checked={l.name === initialBase}>
            <LayerGroup>
              {l.urls.map(url => <TileLayer key={url} url={url} attribution={l.attribution} maxZoom={l.maxZoom} />)}
            </LayerGroup>
          </LayersControl.BaseLayer>
        ))}
      </LayersControl>
      <RememberBase />
      <FitTo points={points} fitKey={fitKey} />
      <MapRef onReady={onReady} />

      {incidents.flatMap(inc => (inc.spread?.horizons || [])
        .slice()
        .sort((a, b) => b.minutes - a.minutes)
        .map(h => (
          <Polygon
            key={`${inc.id}-${h.minutes}`}
            positions={h.polygon}
            pathOptions={{ weight: 1.5, fillColor: HORIZON_STYLE[h.minutes]?.color, ...HORIZON_STYLE[h.minutes] }}
            interactive={false}
          />
        )))}

      {hotspots.map(h => (
        <CircleMarker
          key={`${h.latitude},${h.longitude},${h.detectedAt}`}
          center={[h.latitude, h.longitude]}
          radius={5}
          pathOptions={{ color: '#fde047', weight: 2, fillColor: '#f59e0b', fillOpacity: 0.9 }}
        >
          <Tooltip>
            <div className="text-[12px]">
              <div className="font-semibold">Satellite hotspot</div>
              <div>{[h.instrument, h.satellite].filter(Boolean).join(' ')} · {fmtTime(h.detectedAt)}</div>
              <div>Confidence {h.confidence ?? '—'}{h.frpMw !== null && h.frpMw !== undefined ? ` · ${h.frpMw} MW` : ''}</div>
            </div>
          </Tooltip>
        </CircleMarker>
      ))}

      {located.map(d => {
        const inc = openByDevice.get(d.id);
        const sev = inc ? inc.severity : (d.lastSeverity || 'none');
        const color = SEVERITY_COLOR[sev] || SEVERITY_COLOR.none;
        const stale = isStale(d.lastSeen);
        const pos = [Number(d.latitude), Number(d.longitude)];
        return (
          <Fragment key={d.id}>
            {inc && <Marker position={pos} icon={pulseIcon(color)} interactive={false} />}
            <CircleMarker
              center={pos}
              radius={inc ? 9 : 7}
              pathOptions={{
                color: '#0b0f1a', weight: 2, fillColor: color,
                fillOpacity: stale && !inc ? 0.35 : 1,
              }}
              eventHandlers={onSelectDevice ? { click: () => onSelectDevice(d, inc) } : undefined}
            >
              <Tooltip direction="top" offset={[0, -8]}>
                <div className="text-[12px]">
                  <div className="font-semibold">{d.name || d.deviceId}</div>
                  <div className="uppercase">{sev}{inc ? ` · incident #${inc.id}` : ''}</div>
                  <div>Last seen {fmtTime(d.lastSeen)}{stale ? ' (stale)' : ''}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          </Fragment>
        );
      })}
    </MapContainer>
  );
};

export default SituationMap;
