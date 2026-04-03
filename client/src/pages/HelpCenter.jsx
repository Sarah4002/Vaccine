import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

const CATEGORIES = ['Patients', 'Vaccinations', 'Pharmacie', 'Rappels', 'Carte'];
const PUBLIC_ASSET_BASE = process.env.PUBLIC_URL || '';
const ADD_PATIENT_STEPS = [
  {
    number: 1,
    title: 'Ouvrir la creation du dossier',
    text: 'Depuis le menu lateral, cliquez sur Patients, puis sur le bouton bleu Nouveau Patient.',
    image: `${PUBLIC_ASSET_BASE}/etape1.png`,
    alt: 'Etape 1 : bouton Nouveau Patient',
    caption: 'Etape 1 : reperez le bouton Nouveau Patient en haut a droite.',
  },
  {
    number: 2,
    title: "Remplir l'etape 1 : Identite & adresse",
    text: "Saisissez au minimum le nom, le prenom, l'age, le sexe et si possible le telephone, la wilaya, la daira et la commune.",
    image: `${PUBLIC_ASSET_BASE}/etape2.png`,
    alt: 'Etape 2 : formulaire du nouveau patient',
    caption: 'Etape 2 : remplissez les informations principales dans la fenetre Nouveau patient.',
  },
  {
    number: 3,
    title: 'Passer au dossier medical',
    text: 'Apres avoir rempli les champs principaux, cliquez sur le bouton Suivant - Dossier medical pour continuer.',
    image: `${PUBLIC_ASSET_BASE}/etape3.png`,
    alt: 'Etape 3 : bouton Suivant vers le dossier medical',
    caption: "Etape 3 : cliquez sur Suivant - Dossier medical pour passer a l'etape suivante.",
  },
];
const HELP_GUIDE_STYLES = `
  .help-guide-grid {
    display: grid;
    gap: 18px;
  }
  .help-guide-hero {
    padding: 20px;
    border: 1px solid #dbeafe;
    border-radius: 20px;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
  }
  .help-guide-step {
    padding: 18px;
    border: 1px solid #e5e7eb;
    border-radius: 20px;
    background: #ffffff;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.04);
  }
  .help-guide-step-head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  .help-guide-step-num {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    flex-shrink: 0;
  }
  .help-guide-shot {
    position: relative;
    overflow: hidden;
    border-radius: 18px;
    border: 1px solid #dbeafe;
    background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
    animation: helpGuideFloatIn 0.6s ease both;
    cursor: zoom-in;
  }
  .help-guide-shot img {
    display: block;
    width: 100%;
    height: auto;
    transition: transform 0.45s ease, filter 0.45s ease;
  }
  .help-guide-shot:hover img {
    transform: scale(1.025);
    filter: saturate(1.03) contrast(1.02);
  }
  .help-guide-shot::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(37,99,235,0.00) 35%, rgba(37,99,235,0.10) 100%);
    pointer-events: none;
  }
  .help-guide-caption {
    padding: 12px 14px;
    font-size: 13px;
    font-weight: 700;
    color: #1e3a8a;
    background: #f8fafc;
    border-top: 1px dashed #93c5fd;
  }
  .help-guide-tip {
    padding: 16px 18px;
    border-radius: 18px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
  }
  .help-guide-lightbox {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.78);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    z-index: 1400;
    animation: fadeIn 0.2s ease;
  }
  .help-guide-lightbox-card {
    position: relative;
    width: min(1100px, 96vw);
    max-height: 90vh;
    border-radius: 24px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.28);
    animation: helpGuideFloatIn 0.25s ease;
  }
  .help-guide-lightbox-card img {
    display: block;
    width: 100%;
    max-height: calc(90vh - 72px);
    object-fit: contain;
    background: #eef4ff;
  }
  .help-guide-lightbox-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 18px;
    font-weight: 700;
    color: #0f172a;
  }
  .help-guide-lightbox-close {
    border: none;
    background: #eff6ff;
    color: #2563eb;
    width: 38px;
    height: 38px;
    border-radius: 999px;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  }
  .help-guide-lightbox-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 0 18px 18px;
  }
  .help-guide-lightbox-nav {
    border: none;
    background: #2563eb;
    color: #ffffff;
    padding: 10px 18px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 700;
  }
  .help-guide-lightbox-meta {
    font-size: 13px;
    color: #64748b;
    font-weight: 700;
    min-width: 90px;
    text-align: center;
  }
  @keyframes helpGuideFloatIn {
    from {
      opacity: 0;
      transform: translateY(18px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;
const ADD_PATIENT_GUIDE = {
  id: 'guide-ajouter-patient',
  titre: 'Comment ajouter un patient',
  categorie: 'Patients',
  contenu: `
    <div class="help-guide-grid">
      <div class="help-guide-hero">
        <div style="font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:8px;">Guide visuel</div>
        <h3 style="margin:0 0 8px 0;color:#0f172a;">Ajouter un nouveau patient dans VacciTrack</h3>
        <p style="margin:0;color:#475569;">Suivez ces 4 étapes pour créer rapidement un dossier patient depuis la page <strong>Patients</strong>.</p>
      </div>

      <div class="help-guide-step">
        <div class="help-guide-step-head">
          <div class="help-guide-step-num">1</div>
          <div>
            <div style="font-weight:800;color:#0f172a;">Ouvrir la création du dossier</div>
            <div style="font-size:13px;color:#64748b;">Depuis le menu latéral, cliquez sur <strong>Patients</strong>, puis sur le bouton bleu <strong>Nouveau Patient</strong>.</div>
          </div>
        </div>
        <div class="help-guide-shot">
          <img src="${PUBLIC_ASSET_BASE}/etape1.png" alt="Etape 1 : bouton Nouveau Patient" />
          <div class="help-guide-caption">Étape 1 : repérez le bouton <strong>Nouveau Patient</strong> en haut à droite.</div>
        </div>
      </div>

      <div class="help-guide-step">
        <div class="help-guide-step-head">
          <div class="help-guide-step-num">2</div>
          <div>
            <div style="font-weight:800;color:#0f172a;">Remplir l'étape 1 : Identité & adresse</div>
            <div style="font-size:13px;color:#64748b;">Saisissez au minimum le <strong>nom</strong>, le <strong>prénom</strong>, l'<strong>âge</strong>, le <strong>sexe</strong> et si possible le <strong>téléphone</strong>, la <strong>wilaya</strong>, la <strong>daïra</strong> et la <strong>commune</strong>.</div>
          </div>
        </div>
        <div class="help-guide-shot">
          <img src="${PUBLIC_ASSET_BASE}/etape2.png" alt="Etape 2 : formulaire du nouveau patient" />
          <div class="help-guide-caption">Étape 2 : remplissez les informations principales dans la fenêtre <strong>Nouveau patient</strong>.</div>
        </div>
      </div>

      <div class="help-guide-step">
        <div class="help-guide-step-head">
          <div class="help-guide-step-num">3</div>
          <div>
            <div style="font-weight:800;color:#0f172a;">Passer au dossier médical</div>
            <div style="font-size:13px;color:#64748b;">Après avoir rempli les champs principaux, cliquez sur le bouton <strong>Suivant — Dossier médical</strong> en bas à droite.</div>
          </div>
        </div>
        <div class="help-guide-shot">
          <img src="${PUBLIC_ASSET_BASE}/etape3.png" alt="Etape 3 : bouton Suivant vers le dossier medical" />
          <div class="help-guide-caption">Étape 3 : cliquez sur <strong>Suivant — Dossier médical</strong> pour passer à l'étape 2.</div>
        </div>
      </div>

      <div class="help-guide-step">
        <div class="help-guide-step-head">
          <div class="help-guide-step-num">4</div>
          <div>
            <div style="font-weight:800;color:#0f172a;">Créer le patient</div>
            <div style="font-size:13px;color:#64748b;">Dans <strong>Étape 2</strong>, ajoutez si besoin les antécédents, allergies et autres informations médicales, puis cliquez sur <strong>Créer le patient</strong>.</div>
          </div>
        </div>
        <div class="help-guide-shot">
          <img src="${PUBLIC_ASSET_BASE}/etape3.png" alt="Etape 4 : creation du patient" />
          <div class="help-guide-caption">Étape 4 : dans l'étape médicale, terminez par <strong>Créer le patient</strong>.</div>
        </div>
      </div>

      <div class="help-guide-tip">
        <strong>Conseil :</strong> même si le dossier médical n'est pas complet, vous pouvez d'abord créer le patient puis revenir plus tard pour enrichir ses informations.
      </div>
    </div>
  `,
};

ADD_PATIENT_GUIDE.summary = 'Guide visuel pour ajouter un patient et naviguer entre les 3 captures.';

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
  const [selectedArticle, setSelectedArticle] = useState(ADD_PATIENT_GUIDE);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

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
    { text: 'Comment ajouter un patient', query: 'ajouter patient' },
    { text: 'Protocole Anti-Rabique', query: 'Anti-Rabique' },
    { text: 'Gestion des Stocks FEFO', query: 'FEFO' },
    { text: 'Guide Carte SIG', query: 'Carte' }
  ];

  const mergedArticles = [ADD_PATIENT_GUIDE, ...articles.filter(article => article.id !== ADD_PATIENT_GUIDE.id)];
  const normalizedSearch = search.trim().toLowerCase();
  const visibleArticles = mergedArticles.filter(article => {
    const categoryOk = !selectedCategory || article.categorie === selectedCategory;
    const haystack = `${article.titre || ''} ${String(article.contenu || '').replace(/<[^>]*>?/gm, '')}`.toLowerCase();
    const searchOk = !normalizedSearch || haystack.includes(normalizedSearch);
    return categoryOk && searchOk;
  });

  const currentPreviewIndex = previewImage
    ? ADD_PATIENT_STEPS.findIndex((step) => step.image === previewImage.src)
    : -1;

  const openPreviewAt = (index) => {
    const step = ADD_PATIENT_STEPS[index];
    if (!step) return;
    setPreviewImage({ src: step.image, alt: step.alt, caption: step.caption });
  };

  const showPreviousPreview = () => {
    if (currentPreviewIndex === -1) return;
    const nextIndex = (currentPreviewIndex - 1 + ADD_PATIENT_STEPS.length) % ADD_PATIENT_STEPS.length;
    openPreviewAt(nextIndex);
  };

  const showNextPreview = () => {
    if (currentPreviewIndex === -1) return;
    const nextIndex = (currentPreviewIndex + 1) % ADD_PATIENT_STEPS.length;
    openPreviewAt(nextIndex);
  };

  const renderAddPatientGuide = () => (
    <div className="help-guide-grid">
      <div className="help-guide-hero">
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#2563eb', marginBottom: 8 }}>Guide visuel</div>
        <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>Ajouter un nouveau patient dans VacciTrack</h3>
        <p style={{ margin: 0, color: '#475569' }}>Suivez ces 3 etapes pour creer rapidement un dossier patient depuis la page <strong>Patients</strong>.</p>
      </div>

      {ADD_PATIENT_STEPS.map((step) => (
        <div key={step.number} className="help-guide-step">
          <div className="help-guide-step-head">
            <div className="help-guide-step-num">{step.number}</div>
            <div>
              <div style={{ fontWeight: 800, color: '#0f172a' }}>{step.title}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{step.text}</div>
            </div>
          </div>
          <div
            className="help-guide-shot"
            onClick={() => setPreviewImage({ src: step.image, alt: step.alt, caption: step.caption })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setPreviewImage({ src: step.image, alt: step.alt, caption: step.caption });
              }
            }}
          >
            <img src={step.image} alt={step.alt} />
            <div className="help-guide-caption">{step.caption}</div>
          </div>
        </div>
      ))}

      <div className="help-guide-tip">
        <strong>Conseil :</strong> cliquez sur une photo pour l'afficher en grand.
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      <style>{HELP_GUIDE_STYLES}</style>
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
          ) : visibleArticles.length === 0 ? (
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
              {visibleArticles.map(article => (
                <div
                  key={article.id || article.titre}
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
                      DOC-{String(article.id || 'doc').toUpperCase()}
                    </span>
                  </div>
                  <h3 style={{ marginBottom: '8px' }}>{article.titre || 'Article'}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.4' }}>
                    {article.summary || `${String(article.contenu || '').replace(/<[^>]*>?/gm, '').substring(0, 150)}...`}
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
              {selectedArticle.id === ADD_PATIENT_GUIDE.id ? (
                <div style={{ lineHeight: '1.8', color: '#374151', fontSize: '15px' }} className="article-body-content">
                  {renderAddPatientGuide()}
                </div>
              ) : (
                <div
                  style={{ lineHeight: '1.8', color: '#374151', fontSize: '15px' }}
                  className="article-body-content"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.contenu }}
                />
              )}
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

      {previewImage && (
        <div className="help-guide-lightbox" onClick={() => setPreviewImage(null)}>
          <div className="help-guide-lightbox-card" onClick={(e) => e.stopPropagation()}>
            <div className="help-guide-lightbox-bar">
              <span>{previewImage.caption}</span>
              <button className="help-guide-lightbox-close" onClick={() => setPreviewImage(null)} aria-label="Fermer l'image">
                ×
              </button>
            </div>
            <img src={previewImage.src} alt={previewImage.alt} />
            <div className="help-guide-lightbox-actions">
              <button className="help-guide-lightbox-nav" onClick={showPreviousPreview}>
                Precedent
              </button>
              <div className="help-guide-lightbox-meta">
                {currentPreviewIndex + 1} / {ADD_PATIENT_STEPS.length}
              </div>
              <button className="help-guide-lightbox-nav" onClick={showNextPreview}>
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

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
