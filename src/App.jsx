import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Devices from './pages/Devices';
import Readings from './pages/Readings';
import Alerts from './pages/Alerts';
import ApiHealth from './pages/ApiHealth';
import ApiKeys from './pages/ApiKeys';
import DeviceDetails from './pages/DeviceDetails';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={!isAuthenticated ? <Auth /> : <Navigate to="/" />} />
      
      <Route path="/" element={
        <PrivateRoute>
          <AppLayout><Dashboard /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/devices" element={
        <PrivateRoute>
          <AppLayout><Devices /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/devices/:id" element={
        <PrivateRoute>
          <AppLayout><DeviceDetails /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/readings" element={
        <PrivateRoute>
          <AppLayout><Readings /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/alerts" element={
        <PrivateRoute>
          <AppLayout><Alerts /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/health" element={
        <PrivateRoute>
          <AppLayout><ApiHealth /></AppLayout>
        </PrivateRoute>
      } />
      
      <Route path="/keys" element={
        <PrivateRoute>
          <AppLayout><ApiKeys /></AppLayout>
        </PrivateRoute>
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
