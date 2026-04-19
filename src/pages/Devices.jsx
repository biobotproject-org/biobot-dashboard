import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input, Badge } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({ name: '', deviceId: '', type: 'sensor', location: '' });

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/devices');
      setDevices(res.data.devices || []);
    } catch (err) {
      console.error('Failed to fetch devices', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/devices', newDevice);
      setNewDevice({ name: '', deviceId: '', type: 'sensor', location: '' });
      setShowAdd(false);
      fetchDevices();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add device');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    try {
      await api.delete(`/devices/${id}`);
      fetchDevices();
    } catch (err) {
      alert('Failed to delete device');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Devices</h1>
          <p className="text-sm text-text3">Manage your connected IoT hardware</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchDevices} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
          <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={14} /> Add Device
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card title="Register New Device" className="mb-6">
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <Input 
              label="Name" 
              placeholder="e.g. Living Room Sensor" 
              value={newDevice.name}
              onChange={e => setNewDevice({...newDevice, name: e.target.value})}
              required
            />
            <Input 
              label="Device ID" 
              placeholder="e.g. dev-abc-123" 
              value={newDevice.deviceId}
              pattern="^[a-zA-Z0-9_\-:]+$"
              title="Only letters, numbers, underscores, hyphens, and colons are allowed"
              onChange={e => setNewDevice({...newDevice, deviceId: e.target.value})}
              required
            />
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text2 mb-1.5 uppercase tracking-wide">Type</label>
              <select 
                className="input appearance-none"
                value={newDevice.type}
                onChange={e => setNewDevice({...newDevice, type: e.target.value})}
              >
                <option value="sensor">Sensor</option>
                <option value="actuator">Actuator</option>
                <option value="gateway">Gateway</option>
              </select>
            </div>
            <Input 
              label="Location" 
              placeholder="e.g. Floor 1" 
              value={newDevice.location}
              onChange={e => setNewDevice({...newDevice, location: e.target.value})}
            />
            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-2">
              <Button type="button" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button variant="primary" type="submit">Save Device</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Device</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Location</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Last Seen</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {devices.map(dev => (
              <tr key={dev.id} className="hover:bg-white/[0.01] transition-colors group">
                <td className="px-5 py-4">
                  <Link to={`/devices/${dev.id}`} className="hover:text-accent transition-colors">
                    <div className="font-semibold text-[14px]">{dev.name}</div>
                    <div className="text-[11px] text-text3 font-mono">{dev.uid}</div>
                  </Link>
                </td>
                <td className="px-5 py-4">
                  <Badge status={dev.status}>{dev.status}</Badge>
                </td>
                <td className="px-5 py-4 text-sm text-text2 capitalize">{dev.type}</td>
                <td className="px-5 py-4 text-sm text-text2">{dev.location || '—'}</td>
                <td className="px-5 py-4 text-sm text-text2">{timeAgo(dev.lastSeenAt)}</td>
                <td className="px-5 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(dev.id)}
                    className="p-1.5 text-text3 hover:text-red-400 transition-colors rounded-md hover:bg-red-400/10 opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {!devices.length && !loading && (
              <tr>
                <td colSpan="6" className="px-5 py-10 text-center text-text3">No devices found. Add one to get started.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Devices;
