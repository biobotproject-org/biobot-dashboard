import React, { useState, useEffect } from 'react';
import { AlertCircle, LogOut, Activity, ArrowLeft, Thermometer, Droplets, Wind, LineChart as LineChartIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';
import ThemeToggle from '../components/ThemeToggle';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ReadingsPage = ({ device, onNavigate }) => {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [count, setCount] = useState(0);
  const { user, token, logout } = useAuth();

  useEffect(() => {
    if (device) fetchReadings();
  }, [device]);

  const fetchReadings = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/sensordata?deviceId=${device.deviceId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch readings');

      setReadings(data.readings);
      setCount(data.count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupedByDevice = readings.reduce((acc, reading) => {
    const deviceId = reading.device?.deviceId || 'unknown';
    if (!acc[deviceId]) {
      acc[deviceId] = {
        device: reading.device,
        readings: []
      };
    }
    acc[deviceId].readings.push(reading);
    return acc;
  }, {});

  const getReadingIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'temperature': return <Thermometer size={18} className="text-orange-500" />;
      case 'humidity': return <Droplets size={18} className="text-blue-500" />;
      default: return <Wind size={18} className="text-gray-500" />;
    }
  };

  const prepareChartData = () => {
    const dataMap = {};
    
    readings.forEach(reading => {
      const timestamp = new Date(reading.timestamp).toLocaleTimeString();
      
      if (!dataMap[timestamp]) {
        dataMap[timestamp] = { timestamp };
      }
      
      const key = `${reading.device?.deviceId}_${reading.readingType}`;
      dataMap[timestamp][key] = parseFloat(reading.value);
    });
    
    return Object.values(dataMap);
  };

  const getChartLines = () => {
    const lines = new Map();
    
    readings.forEach(reading => {
      const key = `${reading.device?.deviceId}_${reading.readingType}`;
      if (!lines.has(key)) {
        lines.set(key, {
          key,
          name: `${reading.device?.name || reading.device?.deviceId} - ${reading.readingType}`,
          unit: reading.unit,
          color: getColorForReading(reading.readingType, reading.device?.deviceId)
        });
      }
    });
    
    return Array.from(lines.values());
  };

  const getColorForReading = (type, deviceId) => {
    const colors = {
      temperature: ['#f97316', '#ea580c', '#dc2626'],
      humidity: ['#3b82f6', '#2563eb', '#1d4ed8'],
      default: ['#8b5cf6', '#7c3aed', '#6d28d9']
    };
    
    const colorArray = colors[type?.toLowerCase()] || colors.default;
    const deviceIndex = parseInt(deviceId?.split('-')[1]) || 0;
    return colorArray[deviceIndex % colorArray.length];
  };

  const chartData = prepareChartData();
  const chartLines = getChartLines();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('devices')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sensor Readings</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">{device?.name}</h2>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Device ID: </span>
                  <span className="font-medium text-gray-800 dark:text-white">{device?.deviceId}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Type: </span>
                  <span className="font-medium text-gray-800 dark:text-white">{device?.type}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Status: </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      device?.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {device?.status}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Readings: </span>
                  <span className="font-medium text-gray-800 dark:text-white">{count}</span>
                </div>
              </div>
            </div>
            <button
              onClick={fetchReadings}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading readings...</p>
          </div>
        ) : readings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <Activity size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No readings available for this device.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedByDevice).map(([deviceId, group]) => (
              <div key={deviceId} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                  <h3 className="text-lg font-semibold text-white">{group.device?.name || 'Unknown Device'}</h3>
                  <p className="text-indigo-100 text-sm">Device ID: {group.device?.deviceId}</p>
                  <p className="text-indigo-100 text-sm">{group.readings.length} readings</p>
                </div>
                
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Type</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Value</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Request ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.readings.map((reading) => (
                          <tr key={reading.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getReadingIcon(reading.readingType)}
                                <span className="text-gray-900 dark:text-gray-300 capitalize">{reading.readingType}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {reading.value} {reading.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                              {new Date(reading.timestamp).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-gray-500 dark:text-gray-500 text-xs font-mono">
                              {reading.requestId?.substring(0, 8)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Chart Section */}
        {readings.length > 0 && (
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-6">
              <LineChartIcon size={24} className="text-indigo-600" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Readings Over Time</h3>
            </div>
            
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="timestamp" 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <YAxis 
                    className="text-gray-600 dark:text-gray-400"
                    tick={{ fill: 'currentColor' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  {chartLines.map((line) => (
                    <Line
                      key={line.key}
                      type="monotone"
                      dataKey={line.key}
                      name={line.name}
                      stroke={line.color}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ReadingsPage;