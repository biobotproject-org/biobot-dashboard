import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ShieldCheck, ShieldOff, Trash2, KeyRound } from 'lucide-react';
import { Card, Badge } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { cn } from '../utils/utils';

// Admin-only user management: promote, demote, delete. The API refuses to
// demote or delete yourself or the last admin; the buttons mirror that so
// nobody clicks into a 409.

const ActionButton = ({ onClick, disabled, title, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded border transition-all min-h-[32px]',
      'disabled:opacity-30 disabled:cursor-not-allowed',
      danger
        ? 'text-red-400/80 border-red-400/20 hover:enabled:text-red-400 hover:enabled:bg-red-400/5'
        : 'text-text2 border-white/10 hover:enabled:text-text hover:enabled:bg-bg3'
    )}
  >
    {children}
  </button>
);

const UserRow = ({ u, isSelf, isLastAdmin, busy, onRole, onDelete }) => {
  const promote = u.role !== 'admin';
  const lockReason = isSelf ? 'You cannot change your own account here' : (isLastAdmin ? 'There must always be one admin' : null);
  return (
    <div className="px-4 py-3 sm:px-5 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
      <div className="min-w-0 sm:flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-semibold truncate">{u.username}</span>
          {isSelf && <span className="text-[10px] text-text3 uppercase tracking-wider">you</span>}
          <Badge status={u.role === 'admin' ? 'ingest' : 'user'}>{u.role}</Badge>
        </div>
        <div className="text-[12px] text-text3 truncate">{u.email}</div>
      </div>
      <div className="flex items-center gap-4 text-[12px] text-text2 sm:w-[260px] sm:shrink-0">
        <span>Joined {new Date(u.createdAt).toLocaleDateString()}</span>
        {u.ingestKeys > 0 && (
          <span className="inline-flex items-center gap-1 text-amber-300" title="Owns ingest keys used by Notehub routes">
            <KeyRound size={12} /> {u.ingestKeys} ingest
          </span>
        )}
      </div>
      <div className="flex gap-2 sm:w-[210px] sm:justify-end sm:shrink-0">
        <ActionButton
          onClick={() => onRole(u, promote ? 'admin' : 'user')}
          disabled={busy || (!promote && !!lockReason)}
          title={!promote && lockReason ? lockReason : undefined}
        >
          {promote ? <><ShieldCheck size={13} /> Make admin</> : <><ShieldOff size={13} /> Make user</>}
        </ActionButton>
        <ActionButton
          danger
          onClick={() => onDelete(u)}
          disabled={busy || !!lockReason}
          title={lockReason || 'Delete user'}
        >
          <Trash2 size={13} /> Delete
        </ActionButton>
      </div>
    </div>
  );
};

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let alive = true;
    api.get('/users')
      .then(res => { if (alive) { setUsers(res.data); setError(''); } })
      .catch(err => {
        if (!alive) return;
        setError(err.response?.status === 403 ? 'Only admins can manage users.' : (err.response?.data?.error || 'Could not load users'));
        setUsers([]);
      });
    return () => { alive = false; };
  }, [tick]);

  const changeRole = async (u, role) => {
    setBusyId(u.id);
    setError('');
    try {
      await api.patch(`/users/${u.id}/role`, { role });
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not change the role');
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (u) => {
    const warning = u.ingestKeys > 0
      ? `\n\n${u.username} owns ${u.ingestKeys} ingest key${u.ingestKeys > 1 ? 's' : ''}. Notehub routes using ${u.ingestKeys > 1 ? 'them' : 'it'} will stop delivering data until a new key is set.`
      : '';
    if (!window.confirm(`Delete ${u.username}? Their API keys are revoked. Incident outcomes they recorded are kept.${warning}`)) return;
    setBusyId(u.id);
    setError('');
    try {
      await api.delete(`/users/${u.id}`);
      reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not delete the user');
    } finally {
      setBusyId(null);
    }
  };

  if (users === null) {
    return <div className="flex items-center justify-center min-h-[300px]"><RefreshCw size={24} className="animate-spin text-accent" /></div>;
  }

  const admins = users.filter(u => u.role === 'admin').length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold">Users</h1>
        <p className="text-sm text-text3 mt-1">
          Admins can manage users, run the demo fire, and change any device. {admins} admin{admins === 1 ? '' : 's'}, {users.length} user{users.length === 1 ? '' : 's'} in total.
        </p>
      </div>
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-sm p-3 text-sm">{error}</div>}
      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-white/5">
          {users.map(u => (
            <UserRow
              key={u.id}
              u={u}
              isSelf={u.id === user?.id}
              isLastAdmin={u.role === 'admin' && admins <= 1}
              busy={busyId !== null}
              onRole={changeRole}
              onDelete={remove}
            />
          ))}
          {!users.length && !error && <div className="p-5 text-sm text-text3">No users.</div>}
        </div>
      </Card>
    </div>
  );
};

export default Users;
