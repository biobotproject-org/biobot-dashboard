import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, RefreshCw } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import api from '../services/api';
import {
  formatDuration, hasCoords, osmLink, formatCoords, outcomeLabel, sortOpen, sortClosed,
} from '../utils/incidents';

const IncidentRow = ({ incident }) => {
  const dev = incident.device || {};
  const open = incident.status === 'open';
  const duration = open
    ? `open for ${formatDuration(incident.openedAt)}`
    : `lasted ${formatDuration(incident.openedAt, incident.closedAt)}`;
  const showPeak = incident.peakSeverity && incident.peakSeverity !== incident.severity;

  return (
    <div className="px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 sm:w-[180px] sm:shrink-0">
        <Badge status={incident.severity}>{incident.severity}</Badge>
        {showPeak && (
          <span className="text-[11px] text-text3 whitespace-nowrap" title="Peak severity during this incident">
            peak <span className="uppercase font-semibold">{incident.peakSeverity}</span>
          </span>
        )}
      </div>

      <div className="min-w-0 sm:flex-1">
        <Link to={`/incidents/${incident.id}`} className="font-semibold text-[15px] hover:text-accent transition-colors">
          {dev.name || dev.deviceId || `Incident #${incident.id}`}
        </Link>
        {dev.deviceId && dev.name && (
          <span className="ml-2 text-[11px] text-text3 font-mono">{dev.deviceId}</span>
        )}
      </div>

      <div className="text-sm text-text2 sm:w-[190px] sm:shrink-0">
        {hasCoords(dev) ? (
          <a
            href={osmLink(dev.latitude, dev.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[13px] hover:text-accent transition-colors"
          >
            <MapPin size={13} className="shrink-0" />
            {formatCoords(dev.latitude, dev.longitude)}
          </a>
        ) : <span className="text-text3">No location</span>}
      </div>

      <div className="text-sm text-text2 sm:w-[150px] sm:shrink-0 tabular-nums">{duration}</div>

      <div className="sm:w-[120px] sm:shrink-0 sm:text-right">
        {!open && <Badge status={incident.outcome}>{outcomeLabel(incident.outcome)}</Badge>}
      </div>
    </div>
  );
};

const Incidents = () => {
  const [openIncidents, setOpenIncidents] = useState([]);
  const [closedIncidents, setClosedIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [openRes, closedRes] = await Promise.all([
          api.get('/incidents?status=open&limit=100'),
          api.get('/incidents?status=closed&limit=20'),
        ]);
        if (!alive) return;
        setOpenIncidents(sortOpen(openRes.data || []));
        setClosedIncidents(sortClosed(closedRes.data || []).slice(0, 20));
        setError('');
      } catch (err) {
        if (alive) setError(err.response?.data?.error || 'Failed to load incidents');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [tick]);

  const refresh = () => { setLoading(true); setTick(t => t + 1); };

  return (
    <div>
      <div className="flex justify-between items-start mb-6 gap-3">
        <div>
          <h1 className="text-xl font-bold">Incidents</h1>
          <p className="text-sm text-text3">Anomaly episodes raised by nodes. Tap one to see where, how bad, and record what you found.</p>
        </div>
        <Button onClick={refresh} disabled={loading} aria-label="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-3 text-sm mb-4">{error}</div>
      )}

      <section className="mb-6">
        <div className="flex items-center gap-2 mb-2 px-1">
          <h2 className="text-[13px] font-semibold text-text2 uppercase tracking-wider">Open</h2>
          {openIncidents.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{openIncidents.length}</span>
          )}
        </div>
        <Card className="p-0 overflow-hidden">
          {loading && !openIncidents.length ? (
            <div className="px-5 py-6 text-text3 text-sm">Loading…</div>
          ) : openIncidents.length ? (
            <div className="divide-y divide-white/5">
              {openIncidents.map(i => <IncidentRow key={i.id} incident={i} />)}
            </div>
          ) : (
            <div className="px-5 py-5 text-text3 text-sm">No open incidents</div>
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-[13px] font-semibold text-text2 uppercase tracking-wider mb-2 px-1">Recent closed</h2>
        <Card className="p-0 overflow-hidden">
          {closedIncidents.length ? (
            <div className="divide-y divide-white/5">
              {closedIncidents.map(i => <IncidentRow key={i.id} incident={i} />)}
            </div>
          ) : (
            <div className="px-5 py-5 text-text3 text-sm">{loading ? 'Loading…' : 'No closed incidents yet'}</div>
          )}
        </Card>
      </section>

      <div className="mt-6 text-right">
        <Link to="/alerts" className="text-[12px] text-text3 hover:text-text2 hover:underline">Legacy alerts</Link>
      </div>
    </div>
  );
};

export default Incidents;
