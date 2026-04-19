import { useState, useEffect } from 'react';
import { Card, Button, Input } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { Key, Plus, Copy, Trash2, CheckCircle } from 'lucide-react';

const ApiKeys = () => {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey] = useState({ name: '', description: '' });
  const [createdKey, setCreatedKey] = useState(null);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api-keys');
      setKeys(res.data.apiKeys || []);
    } catch (err) {
      console.error('Failed to fetch keys', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api-keys', newKey);
      setCreatedKey(res.data.apiKey.key);
      setNewKey({ name: '', description: '' });
      fetchKeys();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create key');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    try {
      await api.delete(`/api-keys/${id}`);
      fetchKeys();
    } catch (err) {
      alert('Failed to revoke key');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-text">API Keys</h1>
          <p className="text-sm text-text3">Manage credentials for programmatic access</p>
        </div>
        {!showCreate && (
          <Button variant="primary" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} /> Create Key
          </Button>
        )}
      </div>

      {showCreate && (
        <Card title={createdKey ? "Key Created" : "Create New API Key"} className="mb-6 border-accent/20">
          {!createdKey ? (
            <form onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Name" 
                  placeholder="e.g. Production Webhook" 
                  value={newKey.name}
                  onChange={e => setNewKey({...newKey, name: e.target.value})}
                  required
                />
                <Input 
                  label="Description (Optional)" 
                  placeholder="What is this key for?" 
                  value={newKey.description}
                  onChange={e => setNewKey({...newKey, description: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Generate Key</Button>
              </div>
            </form>
          ) : (
            <div>
              <div className="bg-bg3 border border-accent/30 rounded-lg p-4 mb-4">
                <div className="text-[11px] font-bold text-accent uppercase mb-2">Your New API Key</div>
                <div className="flex items-center gap-3">
                  <code className="flex-1 bg-transparent p-0 text-accent font-mono text-sm break-all">{createdKey}</code>
                  <Button onClick={() => copyToClipboard(createdKey)} className="h-8 w-8 p-0 flex items-center justify-center">
                    <Copy size={14} />
                  </Button>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex gap-3 mb-4">
                <div className="text-amber-500 mt-0.5">⚠️</div>
                <div className="text-xs text-text2 leading-relaxed">
                  Make sure to copy your API key now. You won't be able to see it again for security reasons.
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
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Name</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Created</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Last Used</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {keys.map(k => (
              <tr key={k.id} className="hover:bg-white/[0.01]">
                <td className="px-5 py-4">
                  <div className="text-[14px] font-semibold">{k.name}</div>
                  <div className="text-[12px] text-text3 truncate max-w-[200px]">{k.description || 'No description'}</div>
                </td>
                <td className="px-5 py-4 text-sm text-text2">
                  {new Date(k.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-sm text-text2">
                  {k.lastUsedAt ? timeAgo(k.lastUsedAt) : 'Never'}
                </td>
                <td className="px-5 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(k.id)}
                    className="text-[11px] font-bold text-red-400/70 hover:text-red-400 uppercase tracking-wider px-2 py-1 border border-red-400/20 rounded hover:bg-red-400/5 transition-all"
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
            {!keys.length && !loading && (
              <tr>
                <td colSpan="4" className="px-5 py-10 text-center text-text3">
                  No API keys found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ApiKeys;
