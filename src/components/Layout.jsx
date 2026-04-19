import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Smartphone, 
  Activity, 
  Flag, 
  HeartPulse, 
  Key, 
  LogOut,
  Circle
} from 'lucide-react';
import { cn } from '../utils/utils';
import api from '../services/api';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await api.get('/alerts?status=active');
        setAlertCount(res.data.alerts?.length || 0);
      } catch (err) {
        console.error('Failed to fetch alerts', err);
      }
    };
    if (user) {
      fetchAlerts();
      const interval = setInterval(fetchAlerts, 60000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const navItems = [
    { label: 'Monitor', items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/devices', icon: Smartphone, label: 'Devices' },
      { to: '/readings', icon: Activity, label: 'Readings' },
      { to: '/alerts', icon: Flag, label: 'Alerts', badge: alertCount },
    ]},
    { label: 'System', items: [
      { to: '/health', icon: HeartPulse, label: 'API Health' },
      { to: '/keys', icon: Key, label: 'API Keys' },
    ]}
  ];

  return (
    <div className="w-[220px] min-w-[220px] bg-bg2 border-r border-white/5 flex flex-col h-screen z-10">
      <div className="flex items-center gap-2.5 p-5 pb-4 border-b border-white/5">
        <div className="w-[30px] h-[30px] bg-gradient-to-br from-accent to-accent2 rounded-lg flex items-center justify-center font-bold text-bg text-sm">B</div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight">BioBot Cloud</div>
          <div className="text-[10px] text-text3 font-semibold uppercase tracking-widest">IoT Platform</div>
        </div>
      </div>
      
      <nav className="p-2.5 flex-1 overflow-y-auto">
        {navItems.map((section) => (
          <div key={section.label} className="mb-1.5">
            <div className="text-[10px] font-bold text-text3 uppercase tracking-widest px-2 py-1.5">{section.label}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  "flex items-center gap-2.5 p-2 rounded-sm text-text2 hover:bg-bg3 hover:text-text transition-all text-[13.5px]",
                  isActive && "bg-accent/10 text-accent hover:bg-accent/15 hover:text-accent"
                )}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="p-2.5 border-t border-white/5">
        <div className="flex items-center gap-2.5 p-2 rounded-sm cursor-pointer hover:bg-bg3 group transition-colors">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-accent2 flex items-center justify-center text-white text-xs font-bold">
            {user?.username?.[0].toUpperCase() || '?'}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="text-[13px] font-medium truncate">{user?.username || '—'}</div>
            <div className="text-[11px] text-text3 truncate capitalize">{user?.role || '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Topbar = () => {
  const { logout } = useAuth();
  const location = useLocation();
  const [status, setStatus] = useState('connected');

  const titles = {
    '/': 'Dashboard',
    '/devices': 'Devices',
    '/readings': 'Sensor Readings',
    '/alerts': 'Alerts',
    '/health': 'API Health',
    '/keys': 'API Keys'
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await api.get('/api/health/stats');
        setStatus('connected');
      } catch (err) {
        setStatus('offline');
      }
    };
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-14 min-h-[56px] flex items-center justify-between px-6 border-b border-white/5 bg-bg2">
      <div className="text-base font-semibold">{titles[location.pathname] || 'BioBot Cloud'}</div>
      <div className="flex items-center gap-2.5">
        <div className={cn(
          "w-2 h-2 rounded-full",
          status === 'connected' ? "bg-green-500 shadow-[0_0_0_2px_rgba(34,197,94,0.2)]" : "bg-red-500 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]"
        )} />
        <span className="text-xs text-text2 capitalize">{status}</span>
        <button onClick={logout} className="btn ml-2.5">Sign out</button>
      </div>
    </div>
  );
};

export const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
