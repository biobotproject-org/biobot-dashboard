import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DevicesPage from './pages/DevicesPage';
import ReadingsPage from './pages/ReadingsPage';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [selectedDevice, setSelectedDevice] = useState(null);

  const handleNavigate = (page, device = null) => {
    setCurrentPage(page);
    if (device) setSelectedDevice(device);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthRouter
          currentPage={currentPage}
          selectedDevice={selectedDevice}
          onNavigate={handleNavigate}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

const AuthRouter = ({ currentPage, selectedDevice, onNavigate }) => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated && currentPage !== 'login' && currentPage !== 'register') {
      onNavigate('login');
    }
  }, [isAuthenticated, currentPage]);

  if (!isAuthenticated) {
    if (currentPage === 'register') {
      return <RegisterPage onNavigate={onNavigate} />;
    }
    return <LoginPage onNavigate={onNavigate} />;
  }

  switch (currentPage) {
    case 'devices':
      return <DevicesPage onNavigate={onNavigate} />;
    case 'readings':
      return <ReadingsPage device={selectedDevice} onNavigate={onNavigate} />;
    default:
      return <DevicesPage onNavigate={onNavigate} />;
  }
};

export default App;