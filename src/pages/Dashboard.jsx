import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Badge } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';

const MetricCard = ({ label, value, change, color }) => (
  <Card className="bg-bg3 flex flex-col justify-between p-4 min-h-[110px]">
    <div className="text-[12px] text-text3 font-medium uppercase tracking-wider mb-1.5">{label}</div>
    <div className="text-[26px] font-bold leading-none mb-1.5" style={{ color: color }}>{value}</div>
    <div className="text-[12px] text-text2 flex items-center gap-1">
      {change}
    </div>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState({
    devices: [],
    alerts: [],
    health: null,
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, alertRes, healthRes] = await Promise.all([
          api.get('/devices?limit=100'),
          api.get('/alerts?limit=50'),
          api.get('/api/health/stats')
        ]);
        setData({
          devices: devRes.data.devices || [],
          alerts: alertRes.data.alerts || [],
          health: healthRes.data,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
        setData(prev => ({ ...prev, loading: false }));
      }
    };
    fetchData();
  }, []);

  if (data.loading) {
    return <div className="flex items-center justify-center h-50 text-text3"><span className="animate-spin mr-2">◌</span> Loading dashboard...</div>;
  }

  const activeDevices = data.devices.filter(d => d.status === 'active').length;
  const activeAlerts = data.alerts.filter(a => a.status === 'active').length;
  const totalEndpoints = data.health ? Object.keys(data.health.endpoints || {}).length : 0;

  const deviceStats = [
    { label: 'Active', val: data.devices.filter(d => d.status === 'active').length, color: 'var(--green)' },
    { label: 'Inactive', val: data.devices.filter(d => d.status === 'inactive').length, color: 'var(--text3)' },
    { label: 'Maintenance', val: data.devices.filter(d => d.status === 'maintenance').length, color: 'var(--amber)' },
    { label: 'Hibernating', val: data.devices.filter(d => d.status === 'hibernation').length, color: 'var(--blue)' },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        <MetricCard 
          label="Active Devices" 
          value={activeDevices} 
          change={<><span className="text-green-500">↑</span> monitoring</>} 
        />
        <MetricCard 
          label="Readings (24h)" 
          value={data.alerts.length} 
          change="total alerts logged" 
        />
        <MetricCard 
          label="Active Alerts" 
          value={activeAlerts} 
          color={activeAlerts > 0 ? 'var(--amber)' : 'var(--green)'}
          change={activeAlerts > 0 ? `${activeAlerts} need attention` : 'All clear'} 
        />
        <MetricCard 
          label="API Health" 
          value={totalEndpoints} 
          color="var(--green)"
          change="endpoints monitored" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card title="Recent Alerts" action={<Link to="/alerts">View all →</Link>}>
          <div className="divide-y divide-white/5">
            {data.alerts.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <Badge status={a.severity}>{a.severity}</Badge>
                <div className="flex-1">
                  <div className="text-sm leading-snug">{a.message}</div>
                  <div className="text-[11px] text-text3 mt-0.5">{a.device?.name || 'Unknown device'} · {timeAgo(a.triggeredAt)}</div>
                </div>
                <Badge status={a.status} className="text-[10px]">{a.status}</Badge>
              </div>
            ))}
            {!data.alerts.length && <div className="text-center py-6 text-text3 text-sm">No alerts</div>}
          </div>
        </Card>

        <Card title="Device Status" action={<Link to="/devices">Manage →</Link>}>
          <div className="divide-y divide-white/5">
            {deviceStats.map(stat => (
              <div key={stat.label} className="flex items-center justify-between py-2.5">
                <span className="text-[13px] text-text2">{stat.label}</span>
                <span className="text-[15px] font-semibold" style={{ color: stat.color }}>{stat.val}</span>
              </div>
            ))}
          </div>
          <div className="pt-3">
            <div className="flex gap-1 h-2.5 rounded-full overflow-hidden">
              {deviceStats.map(stat => (
                <div 
                  key={stat.label} 
                  style={{ 
                    flex: stat.val || 0.01, 
                    backgroundColor: stat.color,
                    opacity: 0.8
                  }} 
                />
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card title="API Health Overview" action={<Link to="/health">Details →</Link>}>
        {!data.health ? (
          <div className="text-text3 text-sm">No health data available</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(data.health.endpoints || {}).slice(0, 8).map(([path, stats]) => {
              const rate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
              const color = rate >= 95 ? 'var(--green)' : rate >= 80 ? 'var(--amber)' : 'var(--red)';
              return (
                <div key={path} className="bg-bg3 border border-white/5 rounded-lg p-3">
                  <div className="font-mono text-[11px] text-text2 mb-1.5 truncate" title={path}>{path}</div>
                  <div className="text-lg font-bold mb-1" style={{ color }}>{rate.toFixed(1)}%</div>
                  <div className="text-[11px] text-text3">{stats.total} req · {Math.round(stats.avgDuration || 0)}ms</div>
                  <div className="bg-bg4 h-1 rounded-full overflow-hidden mt-2">
                    <div className="h-full transition-all duration-500" style={{ width: `${rate}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
