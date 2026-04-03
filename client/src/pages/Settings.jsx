import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import '../styles/Settings.css';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

export default function Settings() {
  const { t, setLangue } = useI18n();
  const [settings, setSettings] = useState({
    langue: 'fr',
    theme: 'light',
    notificationsEmail: true,
    notificationsPush: true,
    affichageRappels: true
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${API}/api/settings`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          langue: data.langue || 'fr',
          theme: data.theme || 'light',
          notificationsEmail: Boolean(data.notificationsEmail),
          notificationsPush: Boolean(data.notificationsPush),
          affichageRappels: Boolean(data.affichageRappels),
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newSettings = {
      ...settings,
      [name]: type === 'checkbox' ? checked : value
    };
    setSettings(newSettings);
    setSaved(false);

    // Appliquer immédiatement le thème et la langue
    if (name === 'theme' || name === 'langue') {
      applySettings(newSettings);
      if (name === 'langue') {
        setLangue(value);
      }
    }
  };

  const applySettings = (settingsData) => {
    // Appliquer le thème
    const htmlElement = document.documentElement;
    htmlElement.setAttribute('data-theme', settingsData.theme === 'dark' ? 'dark' : 'light');
    htmlElement.setAttribute('lang', settingsData.langue);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('app_theme', settingsData.theme);
    localStorage.setItem('app_langue', settingsData.langue);
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
    }
  };

  if (loading) {
    return <div className="settings-container loading">Chargement...</div>;
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>{t('set_title')}</h1>
        <p>{t('set_description')}</p>
      </div>

      {saved && <div className="settings-message success">{t('set_saved')}</div>}

      <div className="settings-grid">
        {/* Section Langue */}
        <div className="settings-section">
          <h2>{t('set_language')}</h2>
          <select name="langue" value={settings.langue} onChange={handleChange} className="input-select">
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {/* Section Thème */}
        <div className="settings-section">
          <h2>{t('set_theme')}</h2>
          <select name="theme" value={settings.theme} onChange={handleChange} className="input-select">
            <option value="light">{t('set_light')}</option>
            <option value="dark">{t('set_dark')}</option>
            <option value="auto">{t('set_auto')}</option>
          </select>
        </div>

        {/* Section Notifications */}
        <div className="settings-section">
          <h2>{t('set_notifications')}</h2>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notificationsEmail"
                checked={settings.notificationsEmail}
                onChange={handleChange}
              />
              <span>{t('set_email')}</span>
            </label>
            <label>
              <input
                type="checkbox"
                name="notificationsPush"
                checked={settings.notificationsPush}
                onChange={handleChange}
              />
              <span>{t('set_push')}</span>
            </label>
          </div>
        </div>

        {/* Section Rappels */}
        <div className="settings-section">
          <h2>{t('set_reminders')}</h2>
          <label>
            <input
              type="checkbox"
              name="affichageRappels"
              checked={settings.affichageRappels}
              onChange={handleChange}
            />
            <span>{t('set_show_reminders')}</span>
          </label>
        </div>
      </div>

      <button className="btn btn-primary btn-save" onClick={handleSave}>
        <span className="icon-save"></span> {t('set_save')}
      </button>
    </div>
  );
}
