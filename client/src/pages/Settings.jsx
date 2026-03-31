import React, { useState, useEffect } from 'react';
import '../styles/Settings.css';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

export default function Settings() {
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
        setSettings(data);
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

  const translations = {
    fr: {
      title: 'Paramètres',
      description: 'Gérez vos préférences et paramètres d\'application',
      language: 'Langue',
      theme: 'Thème',
      light: 'Clair',
      dark: 'Sombre',
      auto: 'Auto',
      notifications: 'Notifications',
      email: 'Notifications par email',
      push: 'Notifications push',
      reminders: 'Rappels de vaccination',
      show_reminders: 'Afficher les rappels de vaccination',
      save: 'Enregistrer les paramètres',
      saved: 'Paramètres sauvegardés avec succès'
    },
    en: {
      title: 'Settings',
      description: 'Manage your preferences and application settings',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      auto: 'Auto',
      notifications: 'Notifications',
      email: 'Email notifications',
      push: 'Push notifications',
      reminders: 'Vaccination Reminders',
      show_reminders: 'Show vaccination reminders',
      save: 'Save Settings',
      saved: 'Settings saved successfully'
    },
    ar: {
      title: 'الإعدادات',
      description: 'إدارة تفضيلاتك وإعدادات التطبيق',
      language: 'اللغة',
      theme: 'الموضوع',
      light: 'فاتح',
      dark: 'داكن',
      auto: 'تلقائي',
      notifications: 'الإشعارات',
      email: 'إخطارات البريد الإلكتروني',
      push: 'إشعارات الدفع',
      reminders: 'تذكيرات التطعيم',
      show_reminders: 'عرض تذكيرات التطعيم',
      save: 'حفظ الإعدادات',
      saved: 'تم حفظ الإعدادات بنجاح'
    }
  };

  const t = translations[settings.langue] || translations.fr;

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>⚙️ {t.title}</h1>
        <p>{t.description}</p>
      </div>

      {saved && <div className="settings-message success">✓ {t.saved}</div>}

      <div className="settings-grid">
        {/* Section Langue */}
        <div className="settings-section">
          <div className="section-icon">🌐</div>
          <h2>{t.language}</h2>
          <select name="langue" value={settings.langue} onChange={handleChange} className="input-select">
            <option value="fr">Français</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {/* Section Thème */}
        <div className="settings-section">
          <div className="section-icon">🎨</div>
          <h2>{t.theme}</h2>
          <select name="theme" value={settings.theme} onChange={handleChange} className="input-select">
            <option value="light">{t.light}</option>
            <option value="dark">{t.dark}</option>
            <option value="auto">{t.auto}</option>
          </select>
        </div>

        {/* Section Notifications */}
        <div className="settings-section">
          <div className="section-icon">🔔</div>
          <h2>{t.notifications}</h2>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="notificationsEmail"
                checked={settings.notificationsEmail}
                onChange={handleChange}
              />
              <span>{t.email}</span>
            </label>
            <label>
              <input
                type="checkbox"
                name="notificationsPush"
                checked={settings.notificationsPush}
                onChange={handleChange}
              />
              <span>{t.push}</span>
            </label>
          </div>
        </div>

        {/* Section Rappels */}
        <div className="settings-section">
          <div className="section-icon icon-calendar"></div>
          <h2>{t.reminders}</h2>
          <label>
            <input
              type="checkbox"
              name="affichageRappels"
              checked={settings.affichageRappels}
              onChange={handleChange}
            />
            <span>{t.show_reminders}</span>
          </label>
        </div>
      </div>

      <button className="btn btn-primary btn-save" onClick={handleSave}>
        <span className="icon-save"></span> {t.save}
      </button>
    </div>
  );
}
