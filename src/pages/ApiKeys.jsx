import { useState, useEffect } from 'react';
import { Card, Button, Input, Badge } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { cn } from '../utils/utils';
import { Plus, Copy, Check } from 'lucide-react';

const SCOPES = [
  { value: 'user', label: 'Dashboard / API access', hint: 'Acts as you on the whole API. For scripts and integrations.' },
  { value: 'ingest', label: 'Notehub ingest', hint: 'Paste this as the Bearer token in your Notehub route. It can only deliver sensor data; it cannot read or change anything.' },
];

const SCOPE_LABELS = { user: 'API', ingest: 'Ingest' };

const INGEST_URL = `${(import.meta.env.VITE_API_URL || window.location.origin).replace(/\/$/, '')}/ingest/notehub`;

const NotehubChecklist = ({ apiKey }) => (
  <div className="bg-bg3 border border-white/10 rounded-lg p-4 mb-4">
    <div className="text-[11px] font-bold text-text2 uppercase tracking-wider mb-2">Notehub route settings</div>
    <ol className="text-sm text-text2 space-y-1.5 list-decimal pl-5">
      <li>Route type: <span className="text-text">General HTTP/HTTPS Request/Response</span></li>
      <li className="break-all">URL: <code className="text-accent text-[13px]">{INGEST_URL}</code></li>
      <li className="break-all">HTTP header <code className="text-text text-[13px]">Authorization</code>: <code className="text-accent text-[13px]">Bearer {apiKey}</code></li>
      <li>Notefiles: <code className="text-text text-[13px]">device.qo</code>, <code className="text-text text-[13px]">data.qo</code>, <code className="text-text text-[13px]">alert.qo</code></li>
      <li>Data format: <span className="text-text">JSON</span>, default transform (the full event)</li>
    </ol>
  </div>
);

const KeyRow = ({ k, onRevoke }) => (
  <div className="px-4 py-3 sm:px-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 hover:bg-white/[0.01]">
    <div className="flex items-center gap-2 sm:w-[90px] sm:shrink-0">
      <Badge status={k.scope || 'user'}>{SCOPE_LABELS[k.scope] || k.scope || 'API'}</Badge>
    </div>
    <div className="min-w-0 sm:flex-1">
      <div className="text-[14px] font-semibold truncate">{k.name}</div>
      <div className="text-[12px] text-text3 truncate">{k.description || 'No description'}</div>
    </div>
    <div className="flex items-center gap-4 text-sm text-text2 sm:w-[260px] sm:shrink-0">
      <div className="sm:w-1/2">
        <div className="text-[10px] text-text3 uppercase tracking-wider sm:hidden">Created</div>
        {new Date(k.createdAt).toLocaleDateString()}
      </div>
      <div className="sm:w-1/2">
        <div className="text-[10px] text-text3 uppercase tracking-wider sm:hidden">Last used</div>
        {k.lastUsedAt ? timeAgo(k.lastUsedAt) : 'never'}
      </div>
    </div>
    <div className="sm:text-right sm:w-[80px] sm:shrink-0">
      <button
        onClick={() => onRevoke(k.id)}
        className="text-[11px] font-bold text-red-400/70 hover:text-red-400 uppercase tracking-wider px-2 py-1 border border-red-400/20 rounded hover:bg-red-400/5 transition-all"
      >
        Revoke
      </button>
    </div>
  </div>
);

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', description: '', scope: 'user' });
  const [createdKey, setCreatedKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const fetchKeys = async () => {
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data.apiKeys || []);
    } catch (err) {
      console.error('Failed to fetch keys', err);
    }
  };

  useEffect(() => {
    let alive = true;
    api.get('/api-keys')
      .then(res => { if (alive) setKeys(res.data.apiKeys || []); })
      .catch(err => console.error('Failed to fetch keys', err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/api-keys', newKey);
      setCreatedKey(res.data.apiKey);
      setNewKey({ name: '', description: '', scope: 'user' });
      setCopied(false);
      fetchKeys();
    } catch (err) {
      const details = err.response?.data?.details;
      if (Array.isArray(details) && details.length) {
        setError(details.map(d => (d.field ? `${d.field}: ${d.message}` : d.message)));
      } else {
        setError(err.response?.data?.error || 'Failed to create key');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Revoke this API key? Anything using it stops working immediately.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch {
      alert('Failed to revoke key');
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Copy failed. Select the key and copy it manually.');
    }
  };

  const sortedKeys = [...keys].sort((a, b) => {
    const sa = a.scope === 'ingest' ? 0 : 1;
    const sb = b.scope === 'ingest' ? 0 : 1;
    if (sa !== sb) return sa - sb;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-start gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">API Keys</h1>
          <p className="text-sm text-text3">Dashboard access for scripts, and ingest keys for Notehub routes</p>
        </div>
        {!showCreate && (
          <Button variant="primary" onClick={() => setShowCreate(true)} className="gap-2 shrink-0">
            <Plus size={16} /> New key
          </Button>
        )}
      </div>

      {showCreate && (
        <Card title={createdKey ? 'Key created' : 'Create new API key'} className="mb-6 border-accent/20">
          {!createdKey ? (
            <form onSubmit={handleCreate}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-3 text-sm mb-4">
                  {Array.isArray(error) ? error.map((line, i) => <div key={i}>{line}</div>) : error}
                </div>
              )}
              <div className="mb-4">
                <div className="block text-xs font-semibold text-text2 mb-1.5 uppercase tracking-wide">Scope</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Scope">
                  {SCOPES.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      role="radio"
                      aria-checked={newKey.scope === s.value}
                      onClick={() => setNewKey({ ...newKey, scope: s.value })}
                      className={cn(
                        'text-left rounded-sm border px-3 py-2.5 transition-colors',
                        newKey.scope === s.value ? 'border-accent bg-accent/10 text-text' : 'border-white/10 bg-bg3 text-text2 hover:bg-bg4'
                      )}
                    >
                      <div className="text-[14px] font-semibold">{s.label}</div>
                      <div className="text-[12px] text-text3 mt-0.5 leading-snug">{s.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name"
                  placeholder={newKey.scope === 'ingest' ? 'e.g. Notehub route (Kelowna)' : 'e.g. Grafana import'}
                  value={newKey.name}
                  onChange={e => setNewKey({ ...newKey, name: e.target.value })}
                  required
                />
                <Input
                  label="Description (optional)"
                  placeholder="What is this key for?"
                  value={newKey.description}
                  onChange={e => setNewKey({ ...newKey, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" onClick={() => { setShowCreate(false); setError(''); }}>Cancel</Button>
                <Button variant="primary" type="submit">Generate key</Button>
              </div>
            </form>
          ) : (
            <div>
              <div className="bg-bg3 border border-accent/30 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-[11px] font-bold text-accent uppercase">Your new key</div>
                  <Badge status={createdKey.scope || 'user'}>{SCOPE_LABELS[createdKey.scope] || 'API'}</Badge>
                  <span className="text-[12px] text-text3 truncate">{createdKey.name}</span>
                </div>
                <div className="flex items-start gap-3">
                  <code className="flex-1 bg-transparent p-0 text-accent font-mono text-[13px] break-all select-all">{createdKey.key}</code>
                  <Button onClick={() => copyToClipboard(createdKey.key)} className="h-8 w-8 p-0 flex items-center justify-center shrink-0" aria-label="Copy key">
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </Button>
                </div>
              </div>
              {createdKey.scope === 'ingest' && <NotehubChecklist apiKey={createdKey.key} />}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3 mb-4">
                <div className="text-amber-500 mt-0.5">⚠️</div>
                <div className="text-xs text-text2 leading-relaxed">
                  Copy the key now. It is stored hashed and cannot be shown again.
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="primary" onClick={() => { setShowCreate(false); setCreatedKey(null); }}>
                  I've saved it
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="hidden sm:flex px-5 py-3 gap-4 border-b border-white/5 bg-white/[0.02] text-[11px] font-bold text-text3 uppercase tracking-wider">
          <div className="w-[90px] shrink-0">Scope</div>
          <div className="flex-1">Name</div>
          <div className="w-[260px] shrink-0 flex"><span className="w-1/2">Created</span><span className="w-1/2">Last used</span></div>
          <div className="w-[80px] shrink-0 text-right">Actions</div>
        </div>
        <div className="divide-y divide-white/5">
          {sortedKeys.map(k => <KeyRow key={k.id} k={k} onRevoke={handleDelete} />)}
          {!keys.length && !loading && (
            <div className="px-5 py-10 text-center text-text3">No API keys yet. Create one to get started.</div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApiKeys;
