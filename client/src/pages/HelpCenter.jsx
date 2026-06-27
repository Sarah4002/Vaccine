import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

const CATEGORIES = ['Patients', 'Vaccinations', 'Pharmacie', 'Rappels', 'Carte'];
const PUBLIC_ASSET_BASE = process.env.PUBLIC_URL || '';

const ADD_PATIENT_STEPS = [
  {
    number: 1,
    title: 'Ouvrir la création du dossier',
    text: 'Depuis le menu latéral, cliquez sur Patients, puis sur le bouton bleu Nouveau Patient.',
    image: `${PUBLIC_ASSET_BASE}/etape1.png`,
    alt: 'Étape 1 : bouton Nouveau Patient',
    caption: 'Étape 1 : repérez le bouton Nouveau Patient en haut à droite.',
  },
  {
    number: 2,
    title: "Remplir l'étape 1 : Identité & adresse",
    text: "Saisissez au minimum le nom, le prénom, l'âge, le sexe et si possible le téléphone, la wilaya, la daïra et la commune.",
    image: `${PUBLIC_ASSET_BASE}/etape2.png`,
    alt: 'Étape 2 : formulaire du nouveau patient',
    caption: 'Étape 2 : remplissez les informations principales dans la fenêtre Nouveau patient.',
  },
  {
    number: 3,
    title: 'Passer au dossier médical',
    text: 'Après avoir rempli les champs principaux, cliquez sur le bouton Suivant — Dossier médical pour continuer.',
    image: `${PUBLIC_ASSET_BASE}/etape3.png`,
    alt: 'Étape 3 : bouton Suivant vers le dossier médical',
    caption: 'Étape 3 : cliquez sur Suivant — Dossier médical pour passer à l\'étape suivante.',
  },
  {
    number: 4,
    title: 'Créer le patient',
    text: "Dans l'étape 2, ajoutez si besoin les antécédents, allergies et autres informations médicales, puis cliquez sur Créer le patient.",
    image: `${PUBLIC_ASSET_BASE}/etape4.png`,
    alt: 'Étape 4 : création du patient',
    caption: "Étape 4 : dans l'étape médicale, terminez par Créer le patient.",
  },
];

const ADD_VACCINE_STEPS = [
  {
    number: 1,
    title: 'Ouvrir la saisie vaccination',
    text: 'Depuis la page Vaccinations, cliquez sur le bouton pour ajouter un nouveau registre ou une nouvelle vaccination.',
    image: `${PUBLIC_ASSET_BASE}/etape1v.png`,
    alt: 'Etape 1 vaccination',
    caption: 'Etape 1 : ouvrir le formulaire de vaccination.',
  },
  {
    number: 2,
    title: 'Choisir le patient et le type',
    text: 'Selectionnez le patient concerne et le type de vaccination ou registre a renseigner.',
    image: `${PUBLIC_ASSET_BASE}/etape2v.png`,
    alt: 'Etape 2 vaccination',
    caption: 'Etape 2 : choisir le patient et le type de saisie.',
  },
  {
    number: 3,
    title: 'Remplir les champs requis',
    text: 'Renseignez les informations principales du vaccin, des doses et des dates demandees.',
    image: `${PUBLIC_ASSET_BASE}/etape3v.png`,
    alt: 'Etape 3 vaccination',
    caption: 'Etape 3 : completer les donnees de vaccination.',
  },
  {
    number: 4,
    title: 'Valider la vaccination',
    text: 'Verifiez les informations puis confirmez pour enregistrer la vaccination dans le systeme.',
    image: `${PUBLIC_ASSET_BASE}/etape4v.png`,
    alt: 'Etape 4 vaccination',
    caption: 'Etape 4 : valider et enregistrer la vaccination.',
  },
];

const MAP_STEPS = [
  {
    number: 1,
    title: 'Explorer la carte',
    text: 'Utilisez la carte SIG pour visualiser les zones, patients et indicateurs geographiques.',
    image: `${PUBLIC_ASSET_BASE}/carte.png`,
    alt: 'Guide carte SIG',
    caption: 'Vue generale de la carte SIG Tlemcen.',
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
    background: rgba(15, 23, 42, 0.82);
    backdrop-filter: blur(8px);
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
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.35);
    animation: helpGuideFloatIn 0.25s ease;
    display: flex;
    flex-direction: column;
  }
  .help-guide-lightbox-card img {
    display: block;
    width: 100%;
    flex: 1;
    object-fit: contain;
    background: #eef4ff;
    min-height: 0;
    max-height: calc(90vh - 130px);
  }
  .help-guide-lightbox-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 16px 20px;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 1px solid #e2e8f0;
    flex-shrink: 0;
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
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease;
  }
  .help-guide-lightbox-close:hover {
    background: #dbeafe;
  }
  .help-guide-lightbox-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
    flex-shrink: 0;
  }
  .help-guide-lightbox-nav {
    border: none;
    background: #2563eb;
    color: #ffffff;
    padding: 10px 22px;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 700;
    font-size: 14px;
    transition: background 0.2s ease, transform 0.15s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .help-guide-lightbox-nav:hover {
    background: #1d4ed8;
    transform: scale(1.03);
  }
  .help-guide-lightbox-nav:disabled {
    background: #cbd5e1;
    cursor: default;
    transform: none;
  }
  .help-guide-lightbox-dots {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .help-guide-lightbox-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #cbd5e1;
    transition: all 0.2s ease;
    cursor: pointer;
    border: none;
    padding: 0;
  }
  .help-guide-lightbox-dot.active {
    background: #2563eb;
    width: 24px;
  }
  .help-guide-lightbox-meta {
    font-size: 13px;
    color: #64748b;
    font-weight: 700;
    min-width: 60px;
    text-align: center;
  }
  .help-article-card-clickable {
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .help-article-card-clickable:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
    border-color: #93c5fd !important;
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
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ADD_PATIENT_GUIDE = {
  id: 'guide-ajouter-patient',
  titre: 'Comment ajouter un patient',
  categorie: 'Patients',
  summary: 'Guide visuel en 4 étapes pour créer un dossier patient depuis la page Patients.',
  contenu: '',
};

const GUIDE_ARTICLES = [
  {
    id: 'guide-ajouter-patient',
    titre: 'Comment ajouter un patient',
    categorie: 'Patients',
    summary: 'Guide visuel en 4 etapes pour creer un dossier patient depuis la page Patients.',
    contenu: '',
    steps: ADD_PATIENT_STEPS,
  },
  {
    id: 'guide-ajouter-vaccin',
    titre: 'Comment ajouter une vaccination',
    categorie: 'Vaccinations',
    summary: 'Guide visuel en 4 etapes pour saisir une vaccination depuis la page Vaccinations.',
    contenu: '',
    steps: ADD_VACCINE_STEPS,
  },
  {
    id: 'guide-carte-sig',
    titre: 'Guide de la carte SIG',
    categorie: 'Carte',
    summary: 'Capture guide pour retrouver rapidement la vue cartographique et ses principaux reperes.',
    contenu: '',
    steps: MAP_STEPS,
  },
];

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="7"></circle>
      <line x1="16.65" y1="16.65" x2="21" y2="21"></line>
    </svg>
  );
}

export default function HelpCenter() {
  const { langue, t } = useI18n();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const guideIds = GUIDE_ARTICLES.map((guide) => guide.id);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!previewImage) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') showPreviousPreview();
      if (e.key === 'ArrowRight') showNextPreview();
      if (e.key === 'Escape') setPreviewImage(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [previewImage]);

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

  const quickLinks = [
    { text: langue === 'en' ? 'How to add a patient' : 'Comment ajouter un patient', query: langue === 'en' ? 'patient' : 'ajouter patient' },
    { text: langue === 'en' ? 'How to add a vaccination' : 'Comment ajouter une vaccination', query: langue === 'en' ? 'vaccination' : 'ajouter vaccination' },
    { text: langue === 'en' ? 'Anti-rabies protocol' : 'Protocole Anti-Rabique', query: 'Anti-Rabique' },
    { text: langue === 'en' ? 'FEFO stock management' : 'Gestion des Stocks FEFO', query: 'FEFO' },
    { text: langue === 'en' ? 'GIS map guide' : 'Guide Carte SIG', query: 'Carte' },
  ];

  const mergedArticles = [
    ...GUIDE_ARTICLES,
    ...articles.filter((a) => !guideIds.includes(a.id)),
  ];

  const normalizedSearch = search.trim().toLowerCase();
  const visibleArticles = mergedArticles.filter((article) => {
    const categoryOk = !selectedCategory || article.categorie === selectedCategory;
    const haystack = `${article.titre || ''} ${String(article.contenu || '').replace(/<[^>]*>?/gm, '')}`.toLowerCase();
    const searchOk = !normalizedSearch || haystack.includes(normalizedSearch);
    return categoryOk && searchOk;
  });

  const activeGuide = previewImage
    ? GUIDE_ARTICLES.find((guide) => guide.id === previewImage.guideId)
    : null;
  const activeSteps = activeGuide?.steps || [];
  const currentPreviewIndex = previewImage
    ? activeSteps.findIndex((step) => step.image === previewImage.src)
    : -1;

  const openPreviewAt = (guideId, index) => {
    const guide = GUIDE_ARTICLES.find((item) => item.id === guideId);
    const step = guide?.steps?.[index];
    if (!step) return;
    setPreviewImage({ guideId, src: step.image, alt: step.alt, caption: step.caption });
  };

  const showPreviousPreview = () => {
    if (currentPreviewIndex <= 0) return;
    openPreviewAt(previewImage.guideId, currentPreviewIndex - 1);
  };

  const showNextPreview = () => {
    if (currentPreviewIndex === -1 || currentPreviewIndex >= activeSteps.length - 1) return;
    openPreviewAt(previewImage.guideId, currentPreviewIndex + 1);
  };

  const handleArticleClick = (article) => {
    if (guideIds.includes(article.id)) {
      setSelectedArticle(null);
      openPreviewAt(article.id, 0);
      return;
    }

    setSelectedArticle(article);
    setFeedbackGiven(null);
    return;

    if (article.id === ADD_PATIENT_GUIDE.id) {
      // Ouvre directement la lightbox à l'étape 1
      openPreviewAt(0);
    } else {
      setSelectedArticle(article);
      setFeedbackGiven(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '80px' }}>
      <style>{HELP_GUIDE_STYLES}</style>

      {/* Header */}
      <div
        className="page-header"
        style={{
          background: 'linear-gradient(135deg, #0056ff 0%, #00a3ff 100%)',
          color: 'white',
          padding: '40px',
          borderRadius: '24px',
          marginBottom: '32px',
        }}
      >
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

      {/* Category filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '10px' }}>
        <button
          className={`btn ${!selectedCategory ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setSelectedCategory('')}
          style={{ borderRadius: '50px', whiteSpace: 'nowrap' }}
        >
          {t('help_all')}
        </button>
        {CATEGORIES.map((cat) => (
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

      {/* Main grid */}
      <div className="sup-grid">
        <div className="sup-main">
          {loading ? (
            <div className="loading" style={{ textAlign: 'center', padding: '40px' }}>{langue === 'en' ? 'Loading...' : 'Chargement...'}</div>
          ) : visibleArticles.length === 0 ? (
            <div className="sup-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '14px', marginBottom: '16px', color: 'var(--text-muted)' }}>{langue === 'en' ? 'No result' : 'Aucun resultat'}</div>
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
              {visibleArticles.map((article) => {
                const isGuide = guideIds.includes(article.id);
                const isSelected = selectedArticle?.id === article.id;
                const guide = isGuide ? GUIDE_ARTICLES.find((item) => item.id === article.id) : null;
                return (
                  <div
                    key={article.id || article.titre}
                    className={`sup-card animate-slide-up help-article-card-clickable ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderLeft: isSelected
                        ? '6px solid var(--accent)'
                        : isGuide
                        ? '4px solid #3b82f6'
                        : '1px solid var(--border)',
                      transform: isSelected ? 'translateX(10px)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onClick={() => handleArticleClick(article)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleArticleClick(article);
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge" style={{ marginBottom: '8px' }}>{article.categorie}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {isGuide && (
                          <span style={{ fontSize: '11px', color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                            📸 Guide visuel
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: '#f0f0f0', padding: '2px 8px', borderRadius: '4px' }}>
                          DOC-{String(article.id || 'doc').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <h3 style={{ marginBottom: '8px' }}>{article.titre || 'Article'}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.4' }}>
                      {article.summary || `${String(article.contenu || '').replace(/<[^>]*>?/gm, '').substring(0, 150)}...`}
                    </p>
                    {isGuide && (
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                        {guide.steps.map((step, i) => (
                          <div
                            key={i}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '999px',
                              background: '#bfdbfe',
                            }}
                          />
                        ))}
                        <span style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, marginLeft: '4px' }}>
                          {langue === 'en'
                            ? `${guide.steps.length} steps - click to view`
                            : `${guide.steps.length} etapes - cliquer pour voir`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="sup-sidebar">
          {selectedArticle ? (
            <div className="sup-card animate-slide-up" style={{ position: 'sticky', top: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span className="badge" style={{ background: 'var(--accent)', color: 'white' }}>{selectedArticle.categorie}</span>
                <button
                  onClick={() => setSelectedArticle(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 700, color: 'var(--text-muted)' }}
                >{langue === 'en' ? 'Close' : 'Fermer'}</button>
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
              
            </div>
          )}
        </div>
      </div>

      {/* ===== LIGHTBOX ===== */}
      {previewImage && (
        <div
          className="help-guide-lightbox"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu de l'étape"
        >
          <div
            className="help-guide-lightbox-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="help-guide-lightbox-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '999px',
                    background: '#2563eb',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {currentPreviewIndex + 1}
                </div>
                <span style={{ fontSize: '15px', color: '#0f172a' }}>
                  {activeGuide ? `${activeGuide.titre} - ${previewImage.caption}` : previewImage.caption}
                </span>
              </div>
              <button
                className="help-guide-lightbox-close"
                onClick={() => setPreviewImage(null)}
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Image */}
            <img src={previewImage.src} alt={previewImage.alt} />

            {/* Navigation */}
            <div className="help-guide-lightbox-actions">
              <button
                className="help-guide-lightbox-nav"
                onClick={showPreviousPreview}
                disabled={currentPreviewIndex <= 0}
                aria-label="Étape précédente"
              >
                ← Précédent
              </button>

              {/* Dot indicators */}
              <div className="help-guide-lightbox-dots">
                {activeSteps.map((_, i) => (
                  <button
                    key={i}
                    className={`help-guide-lightbox-dot ${i === currentPreviewIndex ? 'active' : ''}`}
                    onClick={() => openPreviewAt(previewImage.guideId, i)}
                    aria-label={`Aller à l'étape ${i + 1}`}
                  />
                ))}
              </div>

              <div className="help-guide-lightbox-meta">
                {currentPreviewIndex + 1} / {activeSteps.length}
              </div>

              <button
                className="help-guide-lightbox-nav"
                onClick={showNextPreview}
                disabled={currentPreviewIndex >= activeSteps.length - 1}
                aria-label="Étape suivante"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

