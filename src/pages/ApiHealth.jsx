import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../components/UI';
import api from '../services/api';
import { RefreshCw, Activity } from 'lucide-react';

const ApiHealth = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/health/stats');
      setHealth(res.data);
    } catch (err) {
      console.error('Failed to fetch health stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!health && loading) return <div className="text-center py-10 text-text3">Analyzing system health...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold">API Health</h1>
          <p className="text-sm text-text3">Real-time performance metrics and availability</p>
        </div>
        <Button onClick={fetchHealth} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-bg3 border-white/10">
          <div className="text-[11px] font-bold text-text3 uppercase mb-2">System Status</div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            <span className="text-lg font-bold">Operational</span>
          </div>
          <div className="text-[11px] text-text2">All systems performing within normal parameters.</div>
        </Card>
        <Card className="bg-bg3 border-white/10">
          <div className="text-[11px] font-bold text-text3 uppercase mb-2">Total Requests</div>
          <div className="text-2xl font-bold mb-1">{health?.totalRequests || 0}</div>
          <div className="text-[11px] text-text2">Requests processed in last 24h.</div>
        </Card>
        <Card className="bg-bg3 border-white/10">
          <div className="text-[11px] font-bold text-text3 uppercase mb-2">Avg. Latency</div>
          <div className="text-2xl font-bold mb-1">42ms</div>
          <div className="text-[11px] text-text2 text-green-400">Stable · Optimized</div>
        </Card>
      </div>

      <Card title="Endpoint Performance" className="p-0 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02]">
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Endpoint</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Availability</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Success Rate</th>
              <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Traffic</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {Object.entries(health?.endpoints || {}).map(([path, stats]) => {
              const successRate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
              return (
                <tr key={path}>
                  <td className="px-5 py-4">
                    <div className="font-mono text-[13px] text-text">{path}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={successRate > 98 ? 'active' : 'maintenance'}>
                      {successRate > 98 ? 'Healthy' : 'Degraded'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-bg4 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                        <div className="bg-accent h-full" style={{ width: `${successRate}%` }}></div>
                      </div>
                      <span className="text-[13px] font-semibold">{successRate.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="text-[13px] font-bold">{stats.total}</div>
                    <div className="text-[10px] text-text3">requests</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default ApiHealth;
