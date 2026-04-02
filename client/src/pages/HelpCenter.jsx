import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

const CATEGORIES = ['Patients', 'Vaccinations', 'Pharmacie', 'Rappels', 'Carte'];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
    </svg>
  );
}

export default function HelpCenter() {
  const { t } = useI18n();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);

  // Chat state (same as Support for consistency)
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState([{ type: 'bot', text: t('sup_chat_welcome') }]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const loadArticles = async () => {
    try {
      const data = await api.getHelpArticles({ search, categorie: selectedCategory });
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (type) => {
    if (!selectedArticle || feedbackGiven) return;
    try {
      await api.sendHelpFeedback(selectedArticle.id, type);
      setFeedbackGiven(type);
    } catch (err) {
      console.error(err);
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

  const quickLinks = [
    { text: 'Protocole Anti-Rabique', query: 'Anti-Rabique' },
    { text: 'Gestion des Stocks FEFO', query: 'FEFO' },
    { text: 'Guide Carte SIG', query: 'Carte' }
  ];

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      <div className="page-header" style={{ background: 'linear-gradient(135deg, #0056ff 0%, #00a3ff 100%)', color: 'white', padding: '40px', borderRadius: '24px', marginBottom: '32px' }}>
        <div>
          <h1 className="page-title" style={{ color: 'white' }}>{t('help_title')}</h1>
          <p className="page-subtitle" style={{ color: 'rgba(255,255,255,0.8)' }}>{t('help_subtitle')}</p>
        </div>
        <div style={{ position: 'relative', width: '350px' }}>
          <input
            type="text"
            className="form-control"
            style={{ borderRadius: '50px', paddingLeft: '40px', height: '50px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
            placeholder={t('help_search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span style={{ position: 'absolute', left: '15px', top: '15px', opacity: 0.8, color: 'white' }}>
            <SearchIcon />
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '10px' }}>
        <button
          className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSelectedCategory('')}
          style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
        >
          {t('help_all')}
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setSelectedCategory(cat)}
            style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="sup-grid">
        <div className="sup-main">
          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>Chargement...</div>
          ) : articles.length === 0 ? (
            <div className="sup-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-muted)' }}>Aucun résultat</div>
              <h3 style={{ marginBottom: '12px' }}>{t('help_no_results')}</h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>{t('help_no_results_desc')}</p>
              <button
                className="btn btn-primary"
                onClick={() => { setSearch(''); setSelectedCategory(''); }}
              >
                {t('help_reset')}
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {articles.map(article => (
                <div
                  key={article.id}
                  className={`sup-card animate-slide-up ${selectedArticle?.id === article.id ? 'selected' : ''}`}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    borderLeft: selectedArticle?.id === article.id ? '6px solid var(--accent)' : '1px solid var(--border)',
                    transform: selectedArticle?.id === article.id ? 'translateX(10px)' : 'none'
                  }}
                  onClick={() => {
                    setSelectedArticle(article);
                    setFeedbackGiven(null);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge" style={{ marginBottom: '8px' }}>{article.categorie}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                      DOC-{article.id.toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: '8px' }}>{article.titre}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.4' }}>
                    {article.contenu.replace(/<[^>]*>?/gm, '').substring(0, 150)}...
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sup-sidebar">
          {selectedArticle ? (
            <div className="sup-card animate-slide-up" style={{ position: 'sticky', top: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}>{selectedArticle.categorie}</span>
                <button onClick={() => setSelectedArticle(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Fermer
                </button>
              </div>
              <h2 style={{ marginBottom: '20px', color: '#111827' }}>{selectedArticle.titre}</h2>
              <div
                style={{ lineHeight: '1.8', color: '#374151', fontSize: '15px' }}
                className="article-body-content"
                dangerouslySetInnerHTML={{ __html: selectedArticle.contenu }}
              />
              <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>{t('help_feedback')}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  {feedbackGiven ? (
                    <div style={{ padding: '12px', background: '#dcfce7', color: '#166534', borderRadius: '12px', width: '100%', fontSize: '13px' }}>
                      {t('help_thanks')}
                    </div>
                  ) : (
                    <>
                      <button className="btn btn-outline" style={{ borderRadius: '12px', flex: 1 }} onClick={() => handleFeedback('useful')}>
                        {t('help_useful')}
                      </button>
                      <button className="btn btn-outline" style={{ borderRadius: '12px', flex: 1 }} onClick={() => handleFeedback('not-useful')}>
                        {t('help_not_useful')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="sup-card sup-glass" style={{ marginBottom: '20px' }}>
                <h3 style={{ marginBottom: '16px' }}>{t('help_quick_links')}</h3>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {quickLinks.map((link, i) => (
                    <li key={i} style={{ marginBottom: '12px' }}>
                      <button
                        onClick={() => setSearch(link.query)}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', fontSize: '14px', fontWeight: 500, cursor: 'pointer', padding: 0 }}
                      >
                        {link.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="sup-contact-box" style={{ background: '#111827' }}>
                <h4 style={{ marginBottom: '8px' }}>{t('help_expert')}</h4>
                <p style={{ fontSize: '12px', opacity: 0.8, marginBottom: '16px' }}>{t('help_expert_desc')}</p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', background: 'white', color: '#111827' }}
                  onClick={() => setChatOpen(true)}
                >
                  {t('help_start_chat')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CHAT WINDOW (Synced with Support) */}
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
