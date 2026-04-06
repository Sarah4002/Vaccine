import React, { useState, useEffect } from 'react';
import './index.css';
import './styles/theme.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinations from './pages/Vaccinations';
import Rappels from './pages/Rappels';
import Pharmacy from './pages/Pharmacy';
import MapTlemcen from './pages/MapTlemcen';
import Settings from './pages/Settings';
import HelpCenter from './pages/HelpCenter';
import Support from './pages/Support';
import Login from './pages/Login';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erreur inconnue',
    };
  }

  componentDidCatch(error) {
    console.error('Page render error:', error);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            background: 'var(--color-header-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <h2 style={{ marginBottom: '8px', color: 'var(--color-text-primary)', fontFamily: 'Syne, sans-serif' }}>
            Cette page a rencontre une erreur
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
            Rechargez l'application ou revenez a une autre section depuis le menu lateral.
          </p>
          <p style={{ color: '#ef4444', margin: '12px 0 0', fontSize: '13px', fontFamily: 'monospace' }}>
            {this.state.errorMessage}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stocksAlertCount, setStocksAlertCount] = useState(0);
  const [settings, setSettings] = useState({
    langue: 'fr',
    theme: 'light',
    notificationsEmail: true,
    notificationsPush: true,
    affichageRappels: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('vaccitrack_token');
    if (token) {
      setIsAuthenticated(true);
    }
    loadSettings();
  }, []);

  useEffect(() => {
    const loadAlertCount = async () => {
      try {
        const res = await fetch(`${API}/api/stats`);
        if (!res.ok) return;
        const data = await res.json();
        setStocksAlertCount(Number(data?.stocksCritiques || 0));
      } catch (err) {
        console.log('Stocks alert count unavailable');
      }
    };

    if (isAuthenticated) {
      loadAlertCount();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applySettings(data);
        return;
      }
    } catch (err) {
      console.log('Settings par defaut utilises');
    }
    applySettings(settings);
  };

  const applySettings = (settingsData) => {
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', settingsData.theme === 'dark' ? 'dark' : 'light');
    htmlElement.setAttribute('lang', settingsData.langue || 'fr');
    localStorage.setItem('app_theme', settingsData.theme || 'light');
    localStorage.setItem('app_langue', settingsData.langue || 'fr');
  };

  useEffect(() => {
    applySettings(settings);
  }, [settings.theme, settings.langue]);

  const handleLogout = () => {
    localStorage.removeItem('vaccitrack_token');
    localStorage.removeItem('vaccitrack_user');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    const wrap = (node) => <PageErrorBoundary key={page} resetKey={page}>{node}</PageErrorBoundary>;
    switch (page) {
      case 'dashboard':
        return wrap(<Dashboard setPage={setPage} />);
      case 'patients':
        return wrap(<Patients setPage={setPage} setSelectedPatient={setSelectedPatient} />);
      case 'vaccinations':
        return wrap(<Vaccinations selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />);
      case 'rappels':
        return wrap(<Rappels />);
      case 'pharmacy':
        return wrap(<Pharmacy />);
      case 'map-tlemcen':
        return wrap(<MapTlemcen />);
      case 'settings':
        return wrap(<Settings />);
      case 'help-center':
        return wrap(<HelpCenter />);
      case 'support':
        return wrap(<Support />);
      default:
        return wrap(<Dashboard setPage={setPage} />);
    }
  };

  if (!isAuthenticated) {
    return <Login setAuthenticated={setIsAuthenticated} />;
  }

  const logoSrc = `${process.env.PUBLIC_URL || '.'}/chu-logo.png`;

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} onLogout={handleLogout} stocksAlertCount={stocksAlertCount} />

      <main className="main-content">
        <header
          style={{
            width: '100%',
            background: 'var(--color-header-bg)',
            padding: '24px',
            borderRadius: '20px',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid var(--color-border)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img src={logoSrc} alt="CHU Tlemcen" style={{ height: '75px', width: 'auto', display: 'block', marginBottom: '8px' }} />
            <div style={{ color: 'var(--color-text-primary)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Service d'Epidemiologie
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: 600 }}>
              Centre Hospitalo-Universitaire de Tlemcen
            </div>
          </div>

        </header>
        {renderPage()}
      </main>
    </div>
  );
}
