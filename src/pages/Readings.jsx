import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Input } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { Search, RefreshCw, Filter } from 'lucide-react';

const Readings = () => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReadings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/readings?limit=100');
      
      // Flatten the nested readings from requests
      const allReadings = (res.data.requests || []).flatMap(req => 
        (req.readings || []).map(reading => ({
          ...reading,
          deviceName: req.deviceName,
          deviceId: req.deviceId,
          type: reading.readingType // Map readingType to type for compatibility
        }))
      );
      
      setReadings(allReadings);
    } catch (err) {
      console.error('Failed to fetch readings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = readings.filter(r => 
    r.deviceName?.toLowerCase().includes(search.toLowerCase()) ||
    r.type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Readings</h1>
          <p className="text-sm text-text3">Live telemetry from your sensor network</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchReadings} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text3" />
          <input 
            className="input pl-10" 
            placeholder="Search by device or sensor type..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button className="gap-2">
          <Filter size={16} /> Filters
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Time</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Device</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.01]">
                <td className="px-5 py-3 text-sm text-text2">{timeAgo(r.timestamp)}</td>
                <td className="px-5 py-3 text-sm font-medium">
                  <Link to={`/devices/${r.deviceId}`} className="hover:text-accent transition-colors">
                    {r.deviceName || 'Unknown'}
                  </Link>
                </td>
                <td className="px-5 py-3 text-sm text-text3 capitalize">{r.type}</td>
                <td className="px-5 py-3 text-right">
                  <span className="font-mono font-bold text-accent">{r.value}</span>
                  <span className="text-[10px] text-text3 ml-1 font-medium">{r.unit}</span>
                </td>
              </tr>
            ))}
            {!filtered.length && !loading && (
              <tr>
                <td colSpan="4" className="px-5 py-10 text-center text-text3">No readings found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Readings;
