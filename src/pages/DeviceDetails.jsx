import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, Button, Badge } from '../components/UI';
import api from '../services/api';
import { timeAgo } from '../utils/utils';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';
import { ChevronLeft, RefreshCw, Cpu, Activity, Clock, MapPin, Database } from 'lucide-react';

const DeviceDetails = () => {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [readings, setReadings] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Try to fetch specific device details
      let deviceData = null;
      try {
        const devRes = await api.get(`/devices/${id}`);
        deviceData = devRes.data.device;
      } catch (err) {
        if (err.response?.status === 404) {
          console.warn(`Device ${id} not found via specific endpoint, falling back to full device list`);
          // Fallback: Fetch all devices and find the one that matches
          const allDevsRes = await api.get('/devices');
          const allDevices = allDevsRes.data.devices || [];
          deviceData = allDevices.find(d => String(d.id) === String(id) || d.uid === id);
        } else {
          throw err;
        }
      }
      
      if (!deviceData) {
        throw new Error('Device not found');
      }

      setDevice(deviceData);

      // Fetch readings and alerts for this device
      const [readRes, alertRes] = await Promise.all([
        (async () => {
          try {
            return await api.get(`/readings?deviceId=${id}&limit=500`);
          } catch (err) {
            if (err.response?.status === 404 && deviceData?.uid) {
              return await api.get(`/readings?deviceId=${deviceData.uid}&limit=500`);
            }
            throw err;
          }
        })(),
        api.get(`/alerts?deviceId=${id}&limit=100`)
      ]);
      
      const allReadings = (readRes.data.requests || []).flatMap(req => 
        (req.readings || []).map(reading => ({
          ...reading,
          timestamp: new Date(reading.timestamp).getTime(),
          displayTime: new Date(reading.timestamp).toLocaleString()
        }))
      );
      
      // Filter alerts for this device locally as backup, 
      // although API ?deviceId=id should ideally handle it
      const filteredAlerts = (alertRes.data.alerts || []).filter(a => 
        String(a.device?.id) === String(id) || a.device?.uid === id || a.device?.uid === deviceData.uid
      );
      
      setReadings(allReadings.sort((a, b) => a.timestamp - b.timestamp));
      setAlerts(filteredAlerts);
    } catch (err) {
      console.error('Failed to fetch device data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  // Dynamic colors for charts
  const chartColors = ['#4fd1c5', '#63b3ed', '#f6ad55', '#f687b3', '#9f7aea', '#48bb78', '#f56565'];

  // Group readings by type for multiple charts
  const readingsByType = useMemo(() => {
    const grouped = {};
    readings.forEach(r => {
      if (!grouped[r.readingType]) {
        grouped[r.readingType] = [];
      }
      grouped[r.readingType].push(r);
    });
    return grouped;
  }, [readings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!device) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-4">Device Not Found</h2>
        <Link to="/devices">
          <Button variant="primary">Back to Devices</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/devices">
            <button className="p-2 hover:bg-white/5 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{device.name}</h1>
              <Badge status={device.status}>{device.status}</Badge>
            </div>
            <p className="text-sm text-text3 font-mono">UID: {device.uid}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={refreshing}>
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <Cpu className="text-accent mb-2" size={24} />
          <span className="text-xs text-text3 uppercase font-bold tracking-wider mb-1">Type</span>
          <span className="text-lg font-semibold capitalize">{device.type}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <MapPin className="text-blue-400 mb-2" size={24} />
          <span className="text-xs text-text3 uppercase font-bold tracking-wider mb-1">Location</span>
          <span className="text-lg font-semibold">{device.location || 'Not Set'}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <Clock className="text-amber-400 mb-2" size={24} />
          <span className="text-xs text-text3 uppercase font-bold tracking-wider mb-1">Last Seen</span>
          <span className="text-lg font-semibold">{timeAgo(device.lastSeenAt)}</span>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center p-6">
          <Database className="text-green-400 mb-2" size={24} />
          <span className="text-xs text-text3 uppercase font-bold tracking-wider mb-1">Readings</span>
          <span className="text-lg font-semibold">{readings.length}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Recent Device Alerts" className="flex flex-col">
          <div className="flex-1 overflow-y-auto max-h-[300px] -mx-5 px-5 divide-y divide-white/5">
            {alerts.map(a => (
              <div key={a.id} className="py-3 flex items-start gap-3">
                <Badge status={a.severity} className="mt-0.5">{a.severity}</Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text leading-snug">{a.message}</p>
                  <p className="text-[11px] text-text3 mt-1">{new Date(a.triggeredAt).toLocaleString()}</p>
                </div>
                <Badge status={a.status} className="text-[10px] shrink-0">{a.status}</Badge>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="py-10 text-center text-text3 italic">No alerts recorded for this device.</div>
            )}
          </div>
        </Card>

        {Object.keys(readingsByType).map((type, index) => {
          const color = chartColors[index % chartColors.length];
          return (
            <Card key={type} title={`${type.charAt(0).toUpperCase() + type.slice(1)} Analytics`}>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={readingsByType[type]}>
                    <defs>
                      <linearGradient id={`color${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={color} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                    <XAxis 
                      dataKey="timestamp" 
                      type="number"
                      domain={['auto', 'auto']}
                      tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      stroke="#888888"
                      fontSize={10}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickFormatter={(val) => `${val}${readingsByType[type][0]?.unit || ''}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '4px' }}
                      labelStyle={{ color: '#888888', fontSize: '10px' }}
                      itemStyle={{ color: color, fontWeight: 'bold' }}
                      labelFormatter={(label) => new Date(label).toLocaleString()}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name={type.charAt(0).toUpperCase() + type.slice(1)}
                      stroke={color} 
                      fillOpacity={1} 
                      fill={`url(#color${type})`} 
                      strokeWidth={2}
                      activeDot={{ r: 6, stroke: '#1a1a1a', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          );
        })}
        {Object.keys(readingsByType).length === 0 && (
          <Card className="col-span-full py-20 text-center">
            <Activity className="mx-auto mb-4 text-text3" size={48} />
            <p className="text-text3 italic">No telemetry data available for this device yet.</p>
          </Card>
        )}
      </div>

      <Card title="Raw Sensor Data" className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Time</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider">Sensor Type</th>
                <th className="px-5 py-3 text-[11px] font-bold text-text3 uppercase tracking-wider text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...readings].reverse().slice(0, 50).map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                  <td className="px-5 py-3 text-sm text-text2">{new Date(r.timestamp).toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-text3 capitalize">{r.readingType}</td>
                  <td className="px-5 py-3 text-right">
                    <span className="font-mono font-bold text-accent">{r.value}</span>
                    <span className="text-[10px] text-text3 ml-1 font-medium">{r.unit}</span>
                  </td>
                </tr>
              ))}
              {!readings.length && (
                <tr>
                  <td colSpan="3" className="px-5 py-10 text-center text-text3 italic">No historical data found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default DeviceDetails;
