import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, MapPin, Navigation, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../utils/utils';
import {
  formatDuration, hasCoords, osmLink, geoLink, formatCoords, signalLabel, outcomeLabel,
} from '../utils/incidents';

// Reading channels shown above the fold, with the direction that means
// "worse" for a wildfire signature.
const CHANNELS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', dangerous: 'up' },
  { key: 'gasResistance', label: 'Gas resistance', unit: 'kΩ', dangerous: 'down' },
  { key: 'humidity', label: 'Humidity', unit: '%', dangerous: 'down' },
  { key: 'temperature', label: 'Temperature', unit: '°C', dangerous: 'up' },
];

const OUTCOMES = [
  { value: 'fire', label: 'Fire', hint: 'Smoke or flames seen' },
  { value: 'false_alarm', label: 'False alarm', hint: 'Nothing found on site' },
  { value: 'sensor_fault', label: 'Sensor fault', hint: 'Node or sensor problem' },
  { value: 'unknown', label: 'Unknown', hint: 'Could not determine' },
];

const EVENT_LABELS = { raised: 'Raised', updated: 'Updated', cleared: 'Cleared' };

function fmtTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtNum(value, digits = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(digits).replace(/\.0$/, '') : '—';
}

const ReadingsVsBaseline = ({ readings, baseline }) => {
  const rows = CHANNELS.filter(c => readings && readings[c.key] !== undefined);
  if (!rows.length) return <div className="text-sm text-text3">No readings attached to this incident.</div>;
  return (
    <div>
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-[11px] font-semibold text-text3 uppercase tracking-wider pb-1.5 border-b border-white/5">
        <span>Now</span><span className="text-right">Baseline</span><span className="text-right w-[70px]">Change</span>
      </div>
      {rows.map(c => {
        const now = Number(readings[c.key]);
        const base = baseline ? Number(baseline[c.key]) : NaN;
        const hasBase = Number.isFinite(base);
        const delta = hasBase ? now - base : null;
        const worse = delta !== null && (c.dangerous === 'up' ? delta > 0 : delta < 0) && Math.abs(delta) >= 0.05;
        return (
          <div key={c.key} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-baseline py-2 border-b border-white/5 last:border-0">
            <div className="min-w-0">
              <div className="text-[12px] text-text3">{c.label}</div>
              <div className={cn('text-[17px] font-semibold tabular-nums', worse && 'text-red-300')}>
                {fmtNum(now)} <span className="text-[11px] text-text3 font-normal">{c.unit}</span>
              </div>
            </div>
            <div className="text-right text-sm text-text2 tabular-nums">{hasBase ? fmtNum(base) : '—'}</div>
            <div className={cn('text-right text-sm tabular-nums w-[70px]', worse ? 'text-red-300 font-semibold' : 'text-text3')}>
              {delta === null ? '—' : `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${fmtNum(Math.abs(delta))}`}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AcknowledgedBlock = ({ incident }) => (
  <Card className="border-green-500/20">
    <div className="flex items-start gap-3">
      <CheckCircle className="text-green-400 shrink-0 mt-0.5" size={20} />
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">Checked on site</span>
          <Badge status={incident.outcome}>{outcomeLabel(incident.outcome)}</Badge>
        </div>
        <div className="text-[12px] text-text3 mt-1">
          {fmtTime(incident.acknowledgedAt)}
          {incident.acknowledger?.username && <> by <span className="text-text2">{incident.acknowledger.username}</span></>}
        </div>
        {incident.outcomeNotes && (
          <p className="text-sm text-text2 mt-2 whitespace-pre-wrap">{incident.outcomeNotes}</p>
        )}
      </div>
    </div>
  </Card>
);

const AcknowledgeForm = ({ incident, onDone }) => {
  const { user } = useAuth();
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!outcome) { setError('Pick what you found first.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post(`/incidents/${incident.id}/acknowledge`, { outcome, notes: notes.trim() || undefined });
      onDone({ ...incident, ...res.data, acknowledger: user ? { id: user.id, username: user.username } : null });
    } catch (err) {
      const data = err.response?.data || {};
      const details = Array.isArray(data.details) ? data.details : Array.isArray(data.errors) ? data.errors : null;
      if (details && details.length) {
        setError(details.map(d => {
          const field = d.field || d.path;
          const msg = d.message || d.msg;
          return field ? `${field}: ${msg}` : msg;
        }));
      } else {
        setError(data.error || 'Could not save the outcome. Try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="sticky bottom-0 -mx-4 md:mx-0 md:static bg-bg2 md:bg-transparent border-t md:border-0 border-white/10 p-4 md:p-0">
      <Card className="md:border md:p-5 border-0 p-0 bg-transparent md:bg-bg2">
        <div className="text-[13px] font-semibold text-text2 uppercase tracking-wider mb-3">What did you find?</div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-3 text-sm mb-3">
            {Array.isArray(error) ? error.map((line, i) => <div key={i}>{line}</div>) : error}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mb-3" role="radiogroup" aria-label="Outcome">
          {OUTCOMES.map(o => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={outcome === o.value}
              onClick={() => setOutcome(o.value)}
              className={cn(
                'text-left rounded-sm border px-3 py-2.5 min-h-[48px] transition-colors',
                outcome === o.value
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-white/10 bg-bg3 text-text2 hover:bg-bg4'
              )}
            >
              <div className="text-[15px] font-semibold">{o.label}</div>
              <div className="text-[11px] text-text3 hidden sm:block">{o.hint}</div>
            </button>
          ))}
        </div>
        <textarea
          className="input mb-3 resize-none"
          rows={1}
          placeholder="Notes (optional)"
          value={notes}
          maxLength={2000}
          onChange={e => setNotes(e.target.value)}
        />
        <Button variant="primary" type="submit" disabled={submitting} className="w-full justify-center py-2.5 text-[15px]">
          {submitting ? 'Saving…' : 'Record outcome'}
        </Button>
      </Card>
    </form>
  );
};

const IncidentDetail = () => {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get(`/incidents/${id}`);
        if (alive) { setIncident(res.data); setError(''); }
      } catch (err) {
        if (alive) setError(err.response?.status === 404 ? 'Incident not found' : (err.response?.data?.error || 'Failed to load incident'));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[300px]"><RefreshCw size={24} className="animate-spin text-accent" /></div>;
  }
  if (!incident) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold mb-4">{error || 'Incident not found'}</h2>
        <Link to="/incidents"><Button variant="primary">Back to incidents</Button></Link>
      </div>
    );
  }

  const dev = incident.device || {};
  const open = incident.status === 'open';
  const coords = hasCoords(dev);
  const events = [...(incident.events || [])].sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
  const signals = Array.isArray(incident.signals) ? incident.signals : [];

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 md:gap-5">
      {/* WHERE + HOW BAD */}
      <div>
        <Link to="/incidents" className="inline-flex items-center gap-1 text-[12px] text-text3 hover:text-text mb-2">
          <ChevronLeft size={14} /> All incidents
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[22px] md:text-2xl font-bold leading-tight">
            <Link to={`/devices/${dev.id}`} className="hover:text-accent transition-colors">{dev.name || dev.deviceId || 'Unknown node'}</Link>
          </h1>
          <Badge status={incident.severity} className="text-[12px] px-2.5 py-1">{incident.severity}</Badge>
          <Badge status={incident.status}>{open ? 'open' : 'closed'}</Badge>
        </div>
        {dev.deviceId && <div className="text-[11px] text-text3 font-mono mt-0.5">{dev.deviceId}</div>}
        {incident.peakSeverity && incident.peakSeverity !== incident.severity && (
          <div className="text-[12px] text-text3 mt-1">Peaked at <span className="uppercase font-semibold text-text2">{incident.peakSeverity}</span></div>
        )}
      </div>

      {coords ? (
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={osmLink(dev.latitude, dev.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-mono text-[13px] text-text2 hover:text-accent transition-colors"
          >
            <MapPin size={14} /> {formatCoords(dev.latitude, dev.longitude)}
          </a>
          <a href={geoLink(dev.latitude, dev.longitude)} className="btn btn-primary py-2 px-3.5 ml-auto sm:ml-0">
            <Navigation size={14} /> Open in Maps
          </a>
        </div>
      ) : (
        <div className="text-sm text-text3">No location reported by this node yet.</div>
      )}

      {/* HOW LONG */}
      <div className="text-sm text-text2 leading-relaxed">
        <div>
          Opened <span className="text-text">{fmtTime(incident.openedAt)}</span>,{' '}
          <span className="text-text">{formatDuration(incident.openedAt, open ? undefined : incident.closedAt)}</span>
          {open ? ' ago' : ' long'}
          {!open && incident.closedAt && <>, cleared {fmtTime(incident.closedAt)}</>}
        </div>
        <div className="text-[12px] text-text3">Last event {fmtTime(incident.lastEventAt)} · score {incident.score}</div>
      </div>

      <Card className="p-4 md:p-5">
        <ReadingsVsBaseline readings={incident.readings} baseline={incident.baseline} />
        {signals.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/5">
            {signals.map(s => (
              <span key={s} className="text-[12px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-200 border border-amber-500/20">{signalLabel(s)}</span>
            ))}
          </div>
        )}
      </Card>

      {/* TIMELINE */}
      <Card title="Timeline" className="p-4 md:p-5">
        {events.length ? (
          <ol className="divide-y divide-white/5">
            {events.map(ev => (
              <li key={ev.id} className="py-2 flex items-center gap-3">
                <Badge status={ev.severity} className="w-[74px] justify-center shrink-0">{ev.severity}</Badge>
                <span className="text-sm font-medium w-[64px] shrink-0">{EVENT_LABELS[ev.event] || ev.event}</span>
                <span className="text-[12px] text-text3 tabular-nums">{fmtTime(ev.occurredAt)}</span>
                <span className="text-[11px] text-text3 ml-auto">score {ev.score}</span>
                {ev.notified && <Mail size={14} className="text-accent shrink-0" title="Email sent" aria-label="Email sent" />}
              </li>
            ))}
          </ol>
        ) : <div className="text-sm text-text3">No events recorded.</div>}
      </Card>

      {/* OUTCOME */}
      {incident.acknowledgedAt
        ? <AcknowledgedBlock incident={incident} />
        : <AcknowledgeForm incident={incident} onDone={setIncident} />}
    </div>
  );
};

export default IncidentDetail;
