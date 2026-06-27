import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

// ─── Constantes ──────────────────────────────────────────────────────────────
const CATEGORIES = ['Bug', 'Amélioration', 'Question', 'Autre'];
const PRIORITIES  = ['basse', 'normal', 'haute'];

const PRIORITY_CONFIG = {
  haute:  { label: 'Haute',  color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  normal: { label: 'Normal', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  basse:  { label: 'Basse',  color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
};

// ─── Styles — reprend exactement le design system de HelpCenter ──────────────
const SUPPORT_STYLES = `
  .sp-root { padding-bottom: 80px; }

  /* ── SEARCH ICON (copié de HelpCenter) ── */
  .sp-search-wrap {
    position: relative;
    width: 350px;
  }
  .sp-search-wrap input {
    border-radius: 50px;
    padding-left: 40px;
    height: 50px;
    border: none;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
    width: 100%;
  }
  .sp-search-icon {
    position: absolute;
    left: 15px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.8;
    color: white;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  /* ── STATS BAR — dans le style « sup-card » ── */
  .sp-stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 14px;
    margin-bottom: 32px;
  }
  .sp-stat-card {
    background: #fff;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 20px;
    text-align: center;
    transition: transform 0.25s ease, box-shadow 0.25s ease;
    box-shadow: 0 4px 16px rgba(15,23,42,0.04);
  }
  .sp-stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(15,23,42,0.09);
  }
  .sp-stat-value {
    font-size: 32px;
    font-weight: 800;
    line-height: 1;
    margin-bottom: 4px;
  }
  .sp-stat-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .06em;
    text-transform: uppercase;
    color: #94a3b8;
  }
  .sp-stat-card.blue  .sp-stat-value { color: #2563eb; }
  .sp-stat-card.red   .sp-stat-value { color: #dc2626; }
  .sp-stat-card.green .sp-stat-value { color: #16a34a; }
  .sp-stat-card.amber .sp-stat-value { color: #d97706; }

  /* ── FORM CARD — reprend le style de l'article sélectionné ── */
  .sp-form-card {
    background: #ffffff;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 28px;
    margin-bottom: 20px;
    box-shadow: 0 12px 30px rgba(15,23,42,0.05);
    border-top: 4px solid #2563eb;
    animation: spSlideDown 0.3s ease both;
  }
  .sp-form-title {
    font-size: 17px;
    font-weight: 700;
    color: #111827;
    margin: 0 0 24px 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .sp-form-icon {
    width: 32px; height: 32px;
    border-radius: 10px;
    background: #eff6ff;
    display: flex; align-items: center; justify-content: center;
  }
  .sp-label {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .07em;
    text-transform: uppercase;
    color: #64748b;
    margin-bottom: 7px;
  }
  .sp-input {
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 11px 14px;
    font-size: 14px;
    color: #0f172a;
    background: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    outline: none;
    resize: none;
    appearance: none;
    font-family: inherit;
  }
  .sp-input:focus {
    border-color: #3b82f6;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
  }
  .sp-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  .sp-form-group { margin-bottom: 16px; }

  /* ── TICKET ITEMS — style identique aux article-cards de Help ── */
  .sp-ticket-item {
    background: #ffffff;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 18px 20px;
    margin-bottom: 12px;
    display: flex;
    align-items: flex-start;
    gap: 14px;
    cursor: default;
    transition: all 0.25s ease;
    box-shadow: 0 4px 12px rgba(15,23,42,0.03);
    position: relative;
    overflow: hidden;
  }
  .sp-ticket-item::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: #cbd5e1;
    border-radius: 4px 0 0 4px;
  }
  .sp-ticket-item.ouvert::before { background: #ef4444; }
  .sp-ticket-item.ferme::before  { background: #22c55e; }
  .sp-ticket-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(37,99,235,0.10);
    border-color: #93c5fd;
  }
  .sp-ticket-icon-wrap {
    width: 38px; height: 38px;
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .sp-ticket-icon-wrap.ouvert { background: rgba(239,68,68,0.08); }
  .sp-ticket-icon-wrap.ferme  { background: rgba(34,197,94,0.08); }
  .sp-ticket-body { flex: 1; min-width: 0; }
  .sp-ticket-top {
    display: flex; align-items: center;
    justify-content: space-between; gap: 8px;
    margin-bottom: 6px;
  }
  .sp-ticket-title {
    font-weight: 700; font-size: 14px; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .sp-ticket-badges { display: flex; gap: 6px; flex-shrink: 0; }
  .sp-pill {
    font-size: 10px; font-weight: 700;
    letter-spacing: .05em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 999px;
    border: 1px solid transparent;
  }
  .sp-pill.ouvert { background: rgba(239,68,68,0.1); color: #dc2626; border-color: #fecaca; }
  .sp-pill.ferme  { background: rgba(34,197,94,0.1); color: #16a34a; border-color: #bbf7d0; }
  .sp-ticket-foot {
    display: flex; gap: 16px; align-items: center;
    font-size: 11px; color: #94a3b8;
  }
  .sp-ticket-id { font-family: 'DM Mono', monospace, ui-monospace; }

  /* ── EMPTY STATE ── */
  .sp-empty {
    text-align: center; padding: 60px 24px;
    color: #94a3b8;
  }
  .sp-empty-icon {
    width: 56px; height: 56px; border-radius: 18px;
    background: #f1f5f9;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .sp-empty-title {
    font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 6px;
  }

  /* ── SIDEBAR CONTACT — style « sup-contact-box » de Help ── */
  .sp-contact-box {
    background: #3b82f6;
    border-radius: 20px;
    padding: 24px;
    position: relative;
    overflow: hidden;
    flex: 1;
    min-width: 0;
  }
  .sp-contact-box::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 70% at 100% 0%, rgba(99,102,241,0.22) 0%, transparent 60%);
    pointer-events: none;
  }
  .sp-contact-title {
    font-size: 14px; font-weight: 700;
    color: rgba(255,255,255,0.9);
    margin: 0 0 16px 0; position: relative;
  }
  .sp-contact-link {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 8px;
    text-decoration: none;
    transition: background 0.2s ease;
    position: relative;
  }
  .sp-contact-link:hover { background: rgba(255,255,255,0.11); }
  .sp-contact-link-icon {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .sp-contact-link-icon.mail  { background: rgba(59,130,246,0.25); }
  .sp-contact-link-icon.phone { background: rgba(34,197,94,0.2); }
  .sp-contact-link-text {
    font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 500;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  /* ── HOURS CARD — style « sup-glass » de Help ── */
  .sp-hours-card {
    background: #fff;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 20px 22px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.03);
    flex: 1;
    min-width: 0;
  }
  .sp-hours-title {
    font-size: 14px; font-weight: 700; color: #111827;
    margin: 0 0 14px 0; display: flex; align-items: center; gap: 8px;
  }
  .sp-hours-row {
    display: flex; justify-content: space-between;
    font-size: 13px; padding: 7px 0;
    border-bottom: 1px dashed #f1f5f9;
  }
  .sp-hours-row:last-child { border-bottom: none; }
  .sp-hours-day  { color: #475569; font-weight: 500; }
  .sp-hours-time { color: #0f172a; font-weight: 700; }
  .sp-hours-time.closed { color: #94a3b8; font-weight: 400; }

  /* ── CONTACT + HOURS SIDE BY SIDE ── */
  .sp-info-row {
    display: flex;
    gap: 14px;
    margin-bottom: 20px;
    align-items: stretch;
  }

  /* ── QUICK LINKS CARD ── */
  .sp-quicklinks-card {
    background: #fff;
    border: 1px solid var(--border, #e5e7eb);
    border-radius: 20px;
    padding: 20px 22px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(15,23,42,0.03);
  }
  .sp-quicklinks-title {
    font-size: 14px; font-weight: 700; color: #111827;
    margin: 0 0 14px 0;
  }
  .sp-quicklinks-card ul { list-style: none; padding: 0; margin: 0; }
  .sp-quicklinks-card li { margin-bottom: 10px; }
  .sp-quicklinks-card button {
    background: none; border: none;
    color: var(--accent, #2563eb);
    text-decoration: underline;
    font-size: 14px; font-weight: 500;
    cursor: pointer; padding: 0;
  }

  /* ── CHAT WINDOW — identique à HelpCenter ── */
  .chat-window {
    position: fixed; bottom: 90px; right: 24px;
    width: 360px; max-height: 480px;
    background: #ffffff;
    border-radius: 24px; border: 1px solid #e2e8f0;
    box-shadow: 0 24px 60px rgba(0,0,0,0.14);
    display: flex; flex-direction: column;
    z-index: 900; overflow: hidden;
    transform: translateY(20px) scale(0.96);
    opacity: 0; pointer-events: none;
    transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
  }
  .chat-window.active {
    transform: translateY(0) scale(1);
    opacity: 1; pointer-events: all;
  }
  .chat-header {
    background: linear-gradient(135deg, #0056ff 0%, #00a3ff 100%);
    padding: 14px 18px;
    display: flex; align-items: center; justify-content: space-between;
    flex-shrink: 0;
  }
  .chat-body {
    flex: 1; overflow-y: auto; padding: 14px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .chat-msg {
    max-width: 80%; padding: 10px 14px;
    border-radius: 16px; font-size: 13px; line-height: 1.5;
  }
  .chat-msg.bot  { background: #f1f5f9; color: #0f172a; align-self: flex-start; border-bottom-left-radius: 4px; }
  .chat-msg.user { background: #2563eb; color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
  .chat-footer {
    padding: 10px 14px; border-top: 1px solid #f1f5f9;
    display: flex; gap: 8px; flex-shrink: 0;
  }

  /* ── FAB — identique à HelpCenter ── */
  .floating-chat {
    position: fixed; bottom: 24px; right: 24px;
    width: 56px; height: 56px;
    border-radius: 18px;
    background: linear-gradient(135deg, #0056ff 0%, #00a3ff 100%);
    border: none; color: white; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 8px 24px rgba(0,86,255,0.40);
    transition: all 0.2s ease; z-index: 800;
  }
  .floating-chat:hover { transform: translateY(-3px) scale(1.05); }
  .pulse-primary { animation: spFabPulse 2.4s ease infinite; }
  .sp-fab-badge {
    position: absolute; top: -4px; right: -4px;
    width: 14px; height: 14px; border-radius: 50%;
    background: #ef4444; border: 2px solid white;
  }

  /* ── ANIMATIONS ── */
  @keyframes spSlideDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spFadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spFabPulse {
    0%, 100% { box-shadow: 0 8px 24px rgba(0,86,255,0.40); }
    50%       { box-shadow: 0 8px 36px rgba(0,86,255,0.65); }
  }
  .sp-anim-1 { animation: spFadeUp 0.4s ease 0.05s both; }
  .sp-anim-2 { animation: spFadeUp 0.4s ease 0.12s both; }
  .sp-anim-3 { animation: spFadeUp 0.4s ease 0.20s both; }
  .sp-anim-4 { animation: spFadeUp 0.4s ease 0.28s both; }
`;

// ─── Icônes ───────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><line x1="16.65" y1="16.65" x2="21" y2="21" />
    </svg>
  );
}

const ICON_OUVERT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
    <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);
const ICON_FERME = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);
export default function Support() {
  const { langue, t } = useI18n();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: 'Question',
    priorite: 'normal',
  });

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(t('sup_connection_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim()) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const createdTicket = await api.createTicket(formData);
      setTickets((current) => [createdTicket, ...current]);
      setFormData({ titre: '', description: '', categorie: 'Question', priorite: 'normal' });
      setShowForm(false);
      setSuccess(t('sup_ticket_created'));
    } catch (err) {
      console.error(err);
      setError(t('sup_connection_error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ticket) => {
    const nextStatus = (ticket.statut || 'ouvert') === 'ferme' ? 'ouvert' : 'ferme';
    setUpdatingId(ticket.id || '');
    setError('');
    setSuccess('');

    try {
      const updatedTicket = await api.updateTicketStatus(ticket.id, nextStatus);
      setTickets((current) => current.map((item) => (item.id === updatedTicket.id ? updatedTicket : item)));
      setSuccess(nextStatus === 'ferme' ? 'Ticket marque comme resolu.' : 'Ticket rouvert.');
    } catch (err) {
      console.error(err);
      setError(t('sup_connection_error'));
    } finally {
      setUpdatingId('');
    }
  };

  const openCount = tickets.filter((ticket) => ticket.statut === 'ouvert').length;
  const closedCount = tickets.filter((ticket) => ticket.statut !== 'ouvert').length;
  const highCount = tickets.filter((ticket) => ticket.priorite === 'haute').length;

  const normalizedSearch = search.trim().toLowerCase();
  const visibleTickets = tickets.filter((ticket) => {
    const statusOk = !filterStatus || ticket.statut === filterStatus;
    const searchOk = !normalizedSearch
      || String(ticket.titre || '').toLowerCase().includes(normalizedSearch)
      || String(ticket.description || '').toLowerCase().includes(normalizedSearch);

    return statusOk && searchOk;
  });

  const statusFilters = [
    { value: '', label: langue === 'en' ? 'All' : 'Tous' },
    { value: 'ouvert', label: langue === 'en' ? 'Open' : 'En cours' },
    { value: 'ferme', label: langue === 'en' ? 'Resolved' : 'Resolus' },
  ];

  const quickLinks = [
    { text: langue === 'en' ? 'View open tickets' : 'Voir tickets en cours', action: () => setFilterStatus('ouvert') },
    { text: langue === 'en' ? 'View resolved tickets' : 'Voir tickets resolus', action: () => setFilterStatus('ferme') },
    { text: langue === 'en' ? 'New ticket' : 'Nouveau ticket', action: () => setShowForm(true) },
    { text: langue === 'en' ? 'All tickets' : 'Tous les tickets', action: () => { setFilterStatus(''); setSearch(''); } },
  ];

  return (
    <div className="sp-root animate-fade-in">
      <style>{SUPPORT_STYLES}</style>

      <div
        className="page-header sp-anim-1"
        style={{
          background: 'linear-gradient(135deg, #0056ff 0%, #00a3ff 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '24px',
          marginBottom: '32px',
        }}
      >
        <div>
          <h1 className="page-title" style={{ color: 'white' }}>{t('sup_title')}</h1>
          <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('sup_subtitle')}</p>
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#4ade80', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '999px' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'spFabPulse 1.8s ease infinite' }} />
            {langue === 'en' ? 'Team available - Response within 24h' : 'Equipe disponible - Reponse sous 24h'}
          </div>
        </div>

        <div className="sp-search-wrap">
          <input
            type="text"
            className="form-control"
            placeholder={langue === 'en' ? 'Search a ticket...' : 'Rechercher un ticket...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="sp-search-icon"><SearchIcon /></span>
        </div>
      </div>

      <div className="sp-anim-2" style={{ display: 'flex', gap: '10px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '6px' }}>
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            className={`btn ${filterStatus === filter.value ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilterStatus(filter.value)}
            style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
          >
            {filter.label}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <button
            className={`btn ${showForm ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowForm((current) => !current)}
            style={{ borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {showForm ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>{langue === 'en' ? 'Close' : 'Fermer'}</>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                {t('sup_open_ticket')}
              </>
            )}
          </button>
        </div>
      </div>

      {(error || success) && (
        <div
          className="sp-anim-2"
          style={{
            marginBottom: '18px',
            padding: '14px 16px',
            borderRadius: '16px',
            border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`,
            background: error ? '#fef2f2' : '#f0fdf4',
            color: error ? '#b91c1c' : '#166534',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {error || success}
        </div>
      )}

      <div className="sp-stats-row sp-anim-2">
        <div className="sp-stat-card blue">
          <div className="sp-stat-value">{tickets.length}</div>
          <div className="sp-stat-label">Total</div>
        </div>
        <div className="sp-stat-card red">
          <div className="sp-stat-value">{openCount}</div>
          <div className="sp-stat-label">{langue === 'en' ? 'Open' : 'En cours'}</div>
        </div>
        <div className="sp-stat-card green">
          <div className="sp-stat-value">{closedCount}</div>
          <div className="sp-stat-label">{langue === 'en' ? 'Resolved' : 'Resolus'}</div>
        </div>
        <div className="sp-stat-card amber">
          <div className="sp-stat-value">{highCount}</div>
          <div className="sp-stat-label">{langue === 'en' ? 'High priority' : 'Priorite haute'}</div>
        </div>
      </div>

      <div className="sup-grid">
        <div className="sup-main sp-anim-3">
          {showForm && (
            <div className="sp-form-card">
              <h3 className="sp-form-title">
                <span className="sp-form-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </span>
                {t('sup_new_request')}
              </h3>

              <form onSubmit={handleSubmit}>
                <div className="sp-form-group">
                  <label className="sp-label">{t('sup_subject')}</label>
                  <input
                    className="sp-input"
                    value={formData.titre}
                    onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                    placeholder="Decrivez votre probleme en quelques mots..."
                    required
                  />
                </div>

                <div className="sp-form-group">
                  <label className="sp-label">{t('sup_details')}</label>
                  <textarea
                    className="sp-input"
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Donnez le maximum de details pour accelerer la resolution..."
                    required
                  />
                </div>

                <div className="sp-form-row">
                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label className="sp-label">{t('sup_type')}</label>
                    <select
                      className="sp-input"
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sp-form-group" style={{ marginBottom: 0 }}>
                    <label className="sp-label">{t('sup_priority')}</label>
                    <select
                      className="sp-input"
                      value={formData.priorite}
                      onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
                    >
                      {PRIORITIES.map((priority) => (
                        <option key={priority} value={priority}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '20px', borderRadius: '12px', height: '46px', fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={submitting}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  {submitting ? 'Envoi en cours...' : t('sup_submit')}
                </button>
              </form>
            </div>
          )}

          <div className="sup-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                {t('sup_tracking')}
              </h3>
              {!loading && (
                <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '12px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px' }}>
                  {visibleTickets.length} ticket{visibleTickets.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {loading ? (
              <div className="loading" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                {langue === 'en' ? 'Loading tickets...' : 'Chargement des tickets...'}
              </div>
            ) : visibleTickets.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div className="sp-empty-title">{t('sup_no_tickets')}</div>
                <p style={{ fontSize: '13px', margin: 0 }}>
                  {search ? 'Aucun ticket ne correspond a votre recherche.' : 'Aucun ticket soumis pour le moment.'}
                </p>
                {search && (
                  <button className="btn btn-primary" style={{ marginTop: '16px', borderRadius: '12px' }} onClick={() => setSearch('')}>
                    Reinitialiser
                  </button>
                )}
              </div>
            ) : (
              <div>
                {visibleTickets.map((ticket) => {
                  const status = (ticket.statut || 'ouvert').toLowerCase();
                  const priority = PRIORITY_CONFIG[ticket.priorite] || PRIORITY_CONFIG.normal;
                  const isUpdating = updatingId === ticket.id;

                  return (
                    <div key={ticket.id || `${ticket.titre}-${ticket.createdAt}`} className={`sp-ticket-item ${status}`}>
                      <div className={`sp-ticket-icon-wrap ${status}`}>
                        {status === 'ferme' ? ICON_FERME : ICON_OUVERT}
                      </div>
                      <div className="sp-ticket-body">
                        <div className="sp-ticket-top">
                          <div className="sp-ticket-title">{ticket.titre || 'Sans titre'}</div>
                          <div className="sp-ticket-badges">
                            <span className="sp-pill" style={{ background: priority.bg, color: priority.color, borderColor: priority.border }}>
                              {priority.label}
                            </span>
                            <span className={`sp-pill ${status}`}>{status.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="sp-ticket-foot">
                          <span className="sp-ticket-id">#{String(ticket.id || 'N/A').substring(0, 8).toUpperCase()}</span>
                          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>
                            {ticket.categorie || 'Question'}
                          </span>
                          <span>
                            {ticket.createdAt
                              ? new Date(ticket.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '--'}
                          </span>
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className={`btn ${status === 'ferme' ? 'btn-outline' : 'btn-primary'}`}
                            onClick={() => handleToggleStatus(ticket)}
                            disabled={isUpdating}
                            style={{ borderRadius: '12px', minWidth: '130px' }}
                          >
                            {isUpdating ? (langue === 'en' ? 'Updating...' : 'Mise a jour...') : status === 'ferme' ? (langue === 'en' ? 'Reopen' : 'Rouvrir') : (langue === 'en' ? 'Mark resolved' : 'Marquer resolu')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sup-sidebar sp-anim-4">
          <div className="sup-card sup-glass" style={{ marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '16px', fontWeight: 700, fontSize: '14px' }}>{t('help_quick_links')}</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {quickLinks.map((link, index) => (
                <li key={index} style={{ marginBottom: '12px' }}>
                  <button
                    onClick={link.action}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                  >
                    {link.text}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact + Horaires côte à côte ── */}
          <div className="sp-info-row">
            <div className="sp-contact-box">
              <h4 className="sp-contact-title">{t('sup_contacts')}</h4>
              <a href="mailto:derkaouitema9@gmail.com" className="sp-contact-link">
                <div className="sp-contact-link-icon mail">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span className="sp-contact-link-text">derkaouitema9@gmail.com</span>
              </a>

              <a href="mailto:sarabelmahi378@gmail.com" className="sp-contact-link">
                <div className="sp-contact-link-icon mail">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <span className="sp-contact-link-text">sarabelmahi378@gmail.com</span>
              </a>

              <a href="tel:0554199024" className="sp-contact-link">
                <div className="sp-contact-link-icon phone">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.05 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.91 10.91a16 16 0 0 0 6.09 6.09l1.27-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="sp-contact-link-text">0554 19 90 24</span>
              </a>

              <a href="tel:0561148201" className="sp-contact-link">
                <div className="sp-contact-link-icon phone">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 3.08 5.18 2 2 0 0 1 5.05 3h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L9.91 10.91a16 16 0 0 0 6.09 6.09l1.27-.9a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <span className="sp-contact-link-text">0561 14 82 01</span>
              </a>
            </div>

            <div className="sp-hours-card">
              <h4 className="sp-hours-title">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {langue === 'en' ? 'Support hours' : "Horaires d'assistance"}
              </h4>
              <div>
                <div className="sp-hours-row"><span className="sp-hours-day">Dim - Jeu</span><span className="sp-hours-time">08:00 - 17:00</span></div>
                <div className="sp-hours-row"><span className="sp-hours-day">Vendredi</span><span className="sp-hours-time closed">Ferme</span></div>
                <div className="sp-hours-row"><span className="sp-hours-day">Samedi</span><span className="sp-hours-time">09:00 - 13:00</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}