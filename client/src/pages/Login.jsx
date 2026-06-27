import React, { useState } from 'react';
import { api } from '../utils/api';
import { useI18n } from '../i18n';

export default function Login({ setAuthenticated }) {
  const { langue, t } = useI18n();
  const [email, setEmail] = useState('serviceepi@chu-tlemcen.dz');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const logoSrc = `${process.env.PUBLIC_URL || '.'}/chu-logo.png`;
  const loginLogoSrc = `${process.env.PUBLIC_URL || '.'}/logo1.png`;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(langue === 'en' ? 'Please fill in all fields.' : 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.login(email, password);
      localStorage.setItem('vaccitrack_token', res.token);
      localStorage.setItem('vaccitrack_user', JSON.stringify(res.user));
      setAuthenticated(true);
    } catch (err) {
      setError(langue === 'en' ? 'Incorrect credentials. Check your email and password.' : 'Identifiants incorrects. Verifiez votre email et mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-login">
      <div className="login-left">
        <div className="login-sphere-bg"></div>
        <div className="login-logo">
          <div className="logo-mark">
            <div className="logo-text" >
              <img
                src={loginLogoSrc}
                alt="Logo"
                style={{ width: '300px', height: 'auto' }}
              />
            </div>
          </div>
        </div>

        <div className="login-left-content">
          <h1>{langue === 'en' ? 'Vaccination Logistics Optimization.' : 'Optimisation de la Logistique de Vaccination.'}</h1>
          <p>
            {langue === 'en'
              ? 'Access the VacciTrack professional platform for complete vaccination tracking and optimal patient management.'
              : 'Accedez a la plateforme professionnelle VacciTrack pour un suivi complet des vaccinations et une gestion optimale de vos patients.'}
          </p>
        </div>
      </div>

      <div className="login-right">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', marginBottom: '36px' }}>
          <img src={logoSrc} alt="CHU Tlemcen" style={{ height: '75px', width: 'auto', display: 'block', marginBottom: '8px' }} />
          <div style={{ color: '#1d2129', fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {t('header_service')}
          </div>
        </div>

        <h2>{langue === 'en' ? 'Welcome' : 'Bienvenue'}</h2>
        <p className="subtitle">{langue === 'en' ? 'Access your VacciTrack dashboard' : 'Accedez a votre tableau de bord VacciTrack'}</p>

        {error && <div className="alert alert-danger" style={{ fontSize: '13px' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="login-form-group">
            <label className="login-label">{langue === 'en' ? 'Email address' : 'Adresse e-mail'}</label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </span>
              <input type="email" className="form-control" placeholder="email@chu-tlemcen.dz" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          </div>

          <div className="login-form-group">
            <label className="login-label">{langue === 'en' ? 'Password' : 'Mot de passe'}</label>
            <div className="login-input-wrapper">
              <span className="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </span>
              <input type={showPassword ? 'text' : 'password'} className="form-control" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <span className="input-icon-right" onClick={() => setShowPassword(!showPassword)} title={langue === 'en' ? 'Show/Hide password' : 'Afficher/Masquer le mot de passe'} style={{ display: 'flex', alignItems: 'center' }}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                )}
              </span>
            </div>
          </div>

          <div className="login-options">
            <label className="checkbox-wrapper">
              <input type="checkbox" /> {langue === 'en' ? 'Stay logged in' : 'Rester connecte'}
            </label>
            <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>{langue === 'en' ? 'Forgot password' : 'Mot de passe oublie'}</a>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (langue === 'en' ? 'Signing in...' : 'Connexion en cours...') : t('login_submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
