import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { RefreshCw, CheckCircle } from 'lucide-react';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/alerts?limit=100');
      setAlerts(res.data.alerts || []);
    } catch (err) {
      console.error('Failed to fetch alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const acknowledgeAlert = async (id) => {
    try {
      await api.post(`/alerts/${id}/acknowledge`, { notes: 'Acknowledged via Dashboard' });
      fetchAlerts();
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">Alerts</h1>
          <p className="text-sm text-text3">System incidents and notifications</p>
        </div>
        <Button onClick={fetchAlerts} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Time</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Device</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Message</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Severity</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {alerts.map(a => (
              <tr key={a.id} className={a.status === 'active' ? 'bg-amber-500/[0.02]' : ''}>
                <td className="px-5 py-4 text-sm text-text2 whitespace-nowrap">{timeAgo(a.triggeredAt)}</td>
                <td className="px-5 py-4 text-sm font-medium">
                  {a.device?.id ? (
                    <Link to={`/devices/${a.device.id}`} className="hover:text-accent transition-colors">
                      {a.device.name}
                    </Link>
                  ) : (
                    a.device?.name || 'System'
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-text">{a.message}</td>
                <td className="px-5 py-4">
                  <Badge status={a.severity}>{a.severity}</Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  {a.status === 'active' ? (
                    <Button onClick={() => acknowledgeAlert(a.id)} className="h-8 py-0 gap-1.5 text-xs text-green-400 border-green-400/20 hover:bg-green-400/10">
                      <CheckCircle size={13} /> Acknowledge
                    </Button>
                  ) : (
                    <span className="text-xs text-text3 italic">Acknowledged</span>
                  )}
                </td>
              </tr>
            ))}
            {!alerts.length && !loading && (
              <tr>
                <td colSpan="5" className="px-5 py-10 text-center text-text3">No alerts history.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Alerts;
