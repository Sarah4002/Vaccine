import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

const CATEGORIES = ['Bug', 'Amélioration', 'Question', 'Autre'];
const PRIORITIES = ['basse', 'normal', 'haute'];

export default function Support() {
  const { t } = useI18n();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ titre: '', description: '', categorie: 'Question', priorite: 'normal' });
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState([{ type: 'bot', text: t('sup_chat_welcome') }]);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.getTickets();
      setTickets(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim()) return;

    try {
      const newT = await api.createTicket(formData);
      setTickets([newT, ...tickets]);
      setFormData({ titre: '', description: '', categorie: 'Question', priorite: 'normal' });
      setShowForm(false);
      alert(`OK - ${t('sup_ticket_created')}`);
    } catch (err) {
      alert(t('sup_connection_error'));
    }
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatMsg.trim()) return;
    const newMsgs = [...messages, { type: 'user', text: chatMsg }];
    setMessages(newMsgs);
    setChatMsg('');
    setTimeout(() => {
      setMessages([...newMsgs, { type: 'bot', text: t('sup_chat_reply') }]);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('sup_title')}</h1>
          <p className="page-subtitle">
            <span className="sup-status-dot"></span> {t('sup_subtitle')}
          </p>
        </div>
        <button className="btn btn-primary pulse-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('sup_close') : t('sup_open_ticket')}
        </button>
      </div>

      <div className="sup-grid">
        <div className="sup-main">
          {showForm && (
            <div className="sup-card animate-slide-up" style={{ marginBottom: '24px', border: '1px solid var(--accent)' }}>
              <h3 style={{ marginBottom: '16px' }}>{t('sup_new_request')}</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">{t('sup_subject')}</label>
                  <input className="form-control" value={formData.titre} onChange={e => setFormData({ ...formData, titre: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('sup_details')}</label>
                  <textarea className="form-control" rows="4" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} required></textarea>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">{t('sup_type')}</label>
                    <select className="form-control" value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t('sup_priority')}</label>
                    <select className="form-control" value={formData.priorite} onChange={e => setFormData({ ...formData, priorite: e.target.value })}>
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  {t('sup_submit')}
                </button>
              </form>
            </div>
          )}

          <div className="sup-card">
            <h3 style={{ marginBottom: '20px' }}>{t('sup_tracking')}</h3>
            {loading ? (
              <p>Mise à jour...</p>
            ) : tickets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--text-muted)' }}>{t('sup_no_tickets')}</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {tickets.map(ticket => (
                  <div key={ticket.id || `${ticket.titre}-${ticket.createdAt}`} className="sig-commune-item" style={{ cursor: 'default', background: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span
                        className="badge"
                        style={{
                          background: ticket.statut === 'ouvert' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                          color: ticket.statut === 'ouvert' ? '#ef4444' : '#22c55e'
                        }}
                      >
                        {String(ticket.statut || 'ouvert').toUpperCase()}
                      </span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '--'}
                      </span>
                    </div>
                    <div style={{ fontWeight: 700 }}>{ticket.titre || 'Sans titre'}</div>
                    <div style={{ fontSize: '12px', opacity: 0.7 }}>ID: {String(ticket.id || 'inconnu').substring(0, 8)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sup-sidebar">
          <div className="sup-contact-box">
            <h4 style={{ marginBottom: '12px' }}>{t('sup_contacts')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a href="mailto:derkaouitema9@gmail.com" className="sup-contact-link">derkaouitema9@gmail.com</a>
              <a href="mailto:sarabelmahi378@gmail.com" className="sup-contact-link">sarahbelmahi378@gmail.com</a>
              <a href="tel:0554199024" className="sup-contact-link">0554 19 90 24</a>
              <a href="tel:0561148201" className="sup-contact-link">0561 14 82 01</a>
            </div>
          </div>
          <div className="sup-card sup-glass">
            <h4 style={{ marginBottom: '12px' }}>VacciTrack Aide</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Notre équipe est à votre écoute pour optimiser la vaccination à Tlemcen.
            </p>
          </div>
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div className={`chat-window ${chatOpen ? 'active' : ''}`}>
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="sup-status-dot" style={{ margin: 0 }}></div>
            <span style={{ fontWeight: 700 }}>{t('sup_chat_title')}</span>
          </div>
          <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 700 }}>
            Fermer
          </button>
        </div>
        <div className="chat-body">
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.type}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="chat-footer" onSubmit={handleSendChat}>
          <input
            className="form-control"
            style={{ borderRadius: '20px', padding: '8px 15px', height: '40px' }}
            placeholder={t('sup_chat_placeholder')}
            value={chatMsg}
            onChange={e => setChatMsg(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ borderRadius: '20px', padding: '0 16px', height: '40px' }}>
            Envoyer
          </button>
        </form>
      </div>

      <button className="floating-chat pulse-primary" onClick={() => setChatOpen(!chatOpen)} title="Chat en direct">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>
    </div>
  );
}
