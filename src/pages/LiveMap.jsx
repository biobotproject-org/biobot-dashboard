import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Play, Trash2, ChevronUp, ChevronDown, Radio } from 'lucide-react';
import SituationMap from '../components/SituationMap';
import SituationFacts from '../components/SituationFacts';
import { Badge, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../utils/utils';
import { formatDuration, sortOpen, signalLabel } from '../utils/incidents';
import { SEVERITY_COLOR } from '../utils/situation';

const POLL_MS = 15000;
const DEMO_POLL_MS = 2500;

const LEGEND = [
  ['none', 'Normal'], ['watch', 'Watch'], ['alert', 'Alert'], ['critical', 'Critical'],
];

const IncidentRow = ({ inc }) => (
  <Link
    to={`/incidents/${inc.id}`}
    className="block rounded-sm border border-white/5 bg-bg3/60 hover:bg-bg3 p-3 transition-colors"
  >
    <div className="flex items-center gap-2 mb-1">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEVERITY_COLOR[inc.severity] || SEVERITY_COLOR.alert }} />
      <span className="font-semibold text-[14px] truncate">{inc.device?.name || inc.device?.deviceId}</span>
      <Badge status={inc.severity} className="ml-auto shrink-0">{inc.severity}</Badge>
    </div>
    <div className="text-[12px] text-text3 mb-2">
      Open {formatDuration(inc.openedAt)} · score {inc.score}
      {Array.isArray(inc.signals) && inc.signals.length > 0 && <> · {inc.signals.slice(0, 2).map(signalLabel).join(', ')}</>}
    </div>
    <SituationFacts context={inc} />
  </Link>
);

const DemoControls = ({ demo, onStart, onClear, busy }) => (
  <div className="border-t border-white/5 pt-3 mt-1">
    <div className="text-[10px] font-bold text-text3 uppercase tracking-widest mb-2">Demo</div>
    <div className="flex gap-2">
      <Button variant="primary" onClick={onStart} disabled={busy || demo?.running} className="flex-1 justify-center">
        <Play size={14} /> {demo?.running ? 'Fire spreading…' : 'Start demo fire'}
      </Button>
      <Button onClick={onClear} disabled={busy} title="Remove demo nodes and their data">
        <Trash2 size={14} />
      </Button>
    </div>
    <p className="text-[11px] text-text3 mt-1.5">
      Five demo nodes around the map centre, live wind. No emails are sent.
    </p>
  </div>
);

const LiveMap = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [data, setData] = useState(null);
  const [demo, setDemo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [fitKey, setFitKey] = useState('initial');
  const [sheetOpen, setSheetOpen] = useState(true);
  const mapRef = useRef(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let alive = true;
    Promise.all([api.get('/map'), api.get('/demo').catch(() => ({ data: null }))])
      .then(([m, d]) => {
        if (!alive) return;
        setData(m.data);
        setDemo(d.data);
        setError('');
      })
      .catch(err => { if (alive) setError(err.response?.data?.error || 'Could not load the map'); });
    return () => { alive = false; };
  }, [tick]);

  useEffect(() => {
    const id = setInterval(refresh, demo?.running ? DEMO_POLL_MS : POLL_MS);
    return () => clearInterval(id);
  }, [refresh, demo?.running]);

  const startDemo = async () => {
    setBusy(true);
    try {
      const c = mapRef.current?.getCenter();
      const res = await api.post('/demo/fire', c ? { latitude: c.lat, longitude: c.lng } : {});
      setDemo({ running: true, ...res.data });
      // Load the new nodes before refitting, or the fit uses the old view.
      const m = await api.get('/map');
      setData(m.data);
      setFitKey(`demo-${res.data.startedAt}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start the demo');
    } finally {
      setBusy(false);
    }
  };

  const clearDemo = async () => {
    if (!window.confirm('Remove all demo nodes, incidents and readings?')) return;
    setBusy(true);
    try {
      await api.delete('/demo');
      setDemo({ running: false });
      const m = await api.get('/map');
      setData(m.data);
      setFitKey(`cleared-${Date.now()}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not clear the demo');
    } finally {
      setBusy(false);
    }
  };

  if (!data && !error) {
    return <div className="flex items-center justify-center min-h-[300px]"><RefreshCw size={24} className="animate-spin text-accent" /></div>;
  }

  const devices = data?.devices || [];
  const incidents = sortOpen(data?.openIncidents || []);
  const hotspots = data?.satellite?.hotspots || [];
  const located = devices.filter(d => d.latitude !== null && d.longitude !== null).length;
  const hasDemo = devices.some(d => d.isDemo);

  return (
    <div className="-m-4 md:-m-6 h-[calc(100dvh-56px)] relative isolate flex">
      <SituationMap
        className="flex-1 h-full z-0"
        devices={devices}
        incidents={incidents}
        hotspots={hotspots}
        fitKey={fitKey}
        onReady={map => { mapRef.current = map; }}
      />

      {/* Panel: right column on desktop, bottom sheet on phones. */}
      <aside className={cn(
        'z-10 bg-bg2/95 backdrop-blur border-white/10 flex flex-col',
        'absolute inset-x-0 bottom-0 border-t rounded-t-[14px] max-h-[45%]',
        'md:static md:w-[340px] md:max-h-none md:border-t-0 md:border-l md:rounded-none'
      )}>
        <button
          type="button"
          onClick={() => setSheetOpen(o => !o)}
          className="md:pointer-events-none flex items-center gap-2 px-4 pt-3 pb-2 text-left"
          aria-expanded={sheetOpen}
        >
          <Radio size={15} className={cn(incidents.length ? 'text-red-400' : 'text-accent')} />
          <span className="font-semibold text-[14px]">
            {incidents.length ? `${incidents.length} open incident${incidents.length > 1 ? 's' : ''}` : 'All quiet'}
          </span>
          <span className="text-[12px] text-text3 ml-1">{located}/{devices.length} nodes on map</span>
          <span className="ml-auto md:hidden text-text3">{sheetOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}</span>
        </button>

        <div className={cn('flex-col gap-3 px-4 pb-4 overflow-y-auto', sheetOpen ? 'flex' : 'hidden md:flex')}>
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-2.5 text-[13px]">{error}</div>}

          {incidents.map(inc => <IncidentRow key={inc.id} inc={inc} />)}
          {!incidents.length && (
            <p className="text-[13px] text-text3">
              No node is reporting an incident. Nodes are coloured by their latest on-device reading.
            </p>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-text2 pt-1">
            {LEGEND.map(([sev, label]) => (
              <span key={sev} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: SEVERITY_COLOR[sev] }} />{label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-yellow-300" />Satellite hotspot
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm bg-red-500/40 border border-red-500" />Spread if fire: 30 / 60 / 120 min
            </span>
          </div>

          <p className="text-[11px] text-text3 leading-snug">
            Spread is a rough guide from live wind (10% wind rule, dry fuels); it ignores terrain and fuel moisture.
            {data?.satellite?.status === 'not_configured'
              ? ' Satellite cross-check is off until FIRMS_MAP_KEY is set.'
              : ` Satellite: NASA FIRMS, last 48 h within ${data?.satellite?.radiusKm ?? 25} km of a node.`}
            {' '}Weather: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-text2">Open-Meteo</a>.
          </p>

          {isAdmin && <DemoControls demo={demo} onStart={startDemo} onClear={clearDemo} busy={busy} />}
          {!isAdmin && hasDemo && (
            <p className="text-[11px] text-text3">Nodes named “Demo ·” are a simulation.</p>
          )}
        </div>
      </aside>
    </div>
  );
};

export default LiveMap;
