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
import { t } from './utils/translations';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState({
    langue: 'fr',
    theme: 'light',
    notificationsEmail: true,
    notificationsPush: true,
    affichageRappels: true
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    // Vérification basique d'une connexion persistante
    const token = localStorage.getItem('vaccitrack_token');
    if (token) {
      setIsAuthenticated(true);
    }
    // Charger les settings
    loadSettings();
  }, []);

  // Charger et appliquer les settings
  const loadSettings = async () => {
    try {
      const res = await fetch(`${API}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
        applySettings(data);
      }
    } catch (err) {
      console.log('Settings par défaut utilisés');
      applySettings(settings);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Appliquer les settings (thème et langue)
  const applySettings = (settingsData) => {
    // Appliquer le thème
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', settingsData.theme === 'dark' ? 'dark' : 'light');
    htmlElement.setAttribute('lang', settingsData.langue);
    
    // Sauvegarder dans localStorage pour la persistance
    localStorage.setItem('app_theme', settingsData.theme);
    localStorage.setItem('app_langue', settingsData.langue);
  };

  // Watcher pour les changements de settings
  useEffect(() => {
    applySettings(settings);
  }, [settings.theme, settings.langue]);

  const handleLogout = () => {
    localStorage.removeItem('vaccitrack_token');
    localStorage.removeItem('vaccitrack_user');
    setIsAuthenticated(false);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPage} />;
      case 'patients': return <Patients setPage={setPage} setSelectedPatient={setSelectedPatient} />;
      case 'vaccinations': return <Vaccinations selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />;
      case 'rappels': return <Rappels />;
      case 'pharmacy': return <Pharmacy />;
      case 'map-tlemcen': return <MapTlemcen />;
      case 'settings': return <Settings />;
      case 'help-center': return <HelpCenter />;
      case 'support': return <Support />;
      default: return <Dashboard setPage={setPage} />;
    }
  };

  // Si non authentifié, on montre SEULEMENT l'écran de Login
  if (!isAuthenticated) {
    return <Login setAuthenticated={setIsAuthenticated} />;
  }

  // Sinon, on montre l'application normale
  return (
    <div className="app-layout">
      {/* On passe handleLogout si vous souhaitez ajouter un bouton de déconnexion dans la Sidebar ultérieurement */}
      <Sidebar page={page} setPage={setPage} />


      <main className="main-content">
        <header style={{ 
          background: 'var(--color-header-bg)', 
          padding: '24px', 
          borderRadius: '20px', 
          marginBottom: '32px',
          boxShadow: 'var(--shadow-lg)',
          border: `1px solid var(--color-border)`,
          position: 'relative'
        }}>
          {/* Branding Central (Comme sur le Login) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <img src="/chu-logo.png" alt="CHU Tlemcen" style={{ height: '75px', width: 'auto', display: 'block', marginBottom: '8px' }} />
            <div style={{ color: 'var(--color-text-primary)', fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Service d'Épidémiologie
            </div>
            <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px', fontWeight: 600 }}>Centre Hospitalo-Universitaire de Tlemcen</div>
          </div>

          {/* Déconnexion déportée à droite */}
          <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
            <button onClick={handleLogout} style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', 
              border: '1px solid rgba(239, 68, 68, 0.2)',
              padding: '8px 16px',
              borderRadius: '50px',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </header>
        {renderPage()}
      </main>
    </div>
  );
}
