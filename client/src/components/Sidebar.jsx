import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useI18n } from '../i18n';

const NAV_IDS = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>, labelKey: 'sidebar_dashboard', id: 'dashboard' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>, labelKey: 'sidebar_patients', id: 'patients' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>, labelKey: 'sidebar_vaccinations', id: 'vaccinations' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>, labelKey: 'sidebar_rappels', id: 'rappels' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>, labelKey: 'sidebar_pharmacy', id: 'pharmacy' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>, labelKey: 'sidebar_map', id: 'map-tlemcen' }
];

const BOTTOM_IDS = [
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>, labelKey: 'sidebar_settings', id: 'settings' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>, labelKey: 'sidebar_help', id: 'help-center' },
  { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>, labelKey: 'sidebar_support', id: 'support' }
];

export default function Sidebar({ page, setPage, setIsAuthenticated }) {
  const [hasStockAlert, setHasStockAlert] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const checkStocks = async () => {
      try {
        const stocks = await api.getStocks();
        const alert = stocks.some(s => {
          const isLow = s.quantiteInitiale > 0 && (s.quantiteRestante / s.quantiteInitiale <= 0.2);
          const isExpired = s.datePeremption && new Date(s.datePeremption) < new Date();
          const isEmpty = s.quantiteRestante === 0;
          return isLow || isExpired || isEmpty;
        });
        setHasStockAlert(alert);
      } catch (e) { }
    };
    checkStocks();
    const timer = setInterval(checkStocks, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('vaccitrack_token');
    localStorage.removeItem('vaccitrack_user');
    setIsAuthenticated(false);
  };

  return (
    <aside className="sidebar">

      <div className="sidebar-logo">
        <div className="logo-text" style={{ fontSize: 22 }}>
          Vacci<span>Track</span>
        </div>
      </div>

      <nav className="sidebar-nav main-nav">
        {NAV_IDS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
            style={{ position: 'relative' }}
          >
            <span className="nav-icon">{item.icon}</span>
            {t(item.labelKey)}
            {item.id === 'pharmacy' && hasStockAlert && (
              <span style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                width: 8, height: 8, background: '#ef4444', borderRadius: '50%',
                boxShadow: '0 0 0 2px white'
              }}></span>
            )}
          </button>
        ))}
      </nav>

      <nav className="sidebar-nav bottom-nav">
        {BOTTOM_IDS.map(item => (
          <button
            key={item.id}
            className={`nav-item ${page === item.id ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            {t(item.labelKey)}
          </button>
        ))}

        <button
          onClick={handleLogout}
          style={{
            background: '#fef2f2',
            color: '#ef4444',
            border: '1px solid #fee2e2',
            padding: '8px 16px',
            borderRadius: '50px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          {t('sidebar_logout')}
        </button>
      </nav>
    </aside>
  );
}