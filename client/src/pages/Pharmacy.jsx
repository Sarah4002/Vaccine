import React, { useState, useEffect } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';

// ── Compte-rendu des mouvements ───────────────────────────────────────────────
function MovementsTable({ movements }) {
  const { t } = useI18n();
  if (movements.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px 0', color: '#8a94a6' }}>Aucun mouvement enregistré.</div>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
            <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_col_date') || 'Date'}</th>
            <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_col_type') || 'Type'}</th>
            <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_col_prod') || 'Produit & Lot'}</th>
            <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_col_qty') || 'Quantité'}</th>
            <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_col_detail') || 'Détails / Patient'}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((m, i) => (
            <tr key={m.id} style={{ borderBottom: i < movements.length - 1 ? '1px solid #eaebef' : 'none' }}>
              <td style={{ padding: '14px 8px', fontSize: 13, color: '#64748b' }}>
                {new Date(m.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td style={{ padding: '14px 8px' }}>
                <span style={{
                  padding: '4px 10px', borderRadius: '6px', fontSize: 11, fontWeight: 800,
                  background: m.type === 'ENTREE' ? '#d1fae5' : m.type === 'SORTIE' ? '#fee2e2' : '#f3f4f6',
                  color: m.type === 'ENTREE' ? '#10b981' : m.type === 'SORTIE' ? '#ef4444' : '#6b7280',
                }}>
                  {m.type}
                </span>
              </td>
              <td style={{ padding: '14px 8px' }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#1d2129' }}>{m.vaccin}</div>
                <div style={{ fontSize: 11, color: '#8a94a6' }}>Lot: {m.lot}</div>
              </td>
              <td style={{ padding: '14px 8px', fontWeight: 800, color: m.type === 'ENTREE' ? '#10b981' : '#ef4444' }}>
                {m.type === 'ENTREE' ? '+' : '-'}{m.quantite}
              </td>
              <td style={{ padding: '14px 8px', fontSize: 13, color: '#374151' }}>
                {m.patientNom ? (
                <span style={{ fontWeight: 600 }}>{m.patientNom}</span>
                ) : (
                  <span style={{ fontStyle: 'italic', color: '#8a94a6' }}>{m.motif || '--'}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Modal de réception de stock ───────────────────────────────────────────────
function StockModal({ isOpen, onClose, onSave }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ vaccin: '', lot: '', quantiteInitiale: '', datePeremption: '' });
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createStock({
        ...form,
        quantiteRestante: Number(form.quantiteInitiale),
        quantiteInitiale: Number(form.quantiteInitiale)
      });
      onSave();
      onClose();
      setForm({ vaccin: '', lot: '', quantiteInitiale: '', datePeremption: '' });
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
      <div style={{ background: 'white', width: '500px', borderRadius: '20px', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, marginBottom: 24, color: '#1d2129' }}>{t('pha_recept_title') || 'Réceptionner un nouveau Lot'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', marginBottom: 6, textTransform: 'uppercase' }}>{t('pha_recept_prod') || 'Produit Vaccinal'}</label>
            <input required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eaebef', background: '#f8f9fb' }} 
              placeholder="Ex: Anti-Rabique Cellulaire" value={form.vaccin} onChange={e => setForm({...form, vaccin: e.target.value})} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', marginBottom: 6, textTransform: 'uppercase' }}>{t('pha_recept_lot') || 'Numéro de Lot'}</label>
              <input required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eaebef', background: '#f8f9fb' }} 
                placeholder="ABC1234" value={form.lot} onChange={e => setForm({...form, lot: e.target.value})} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', marginBottom: 6, textTransform: 'uppercase' }}>{t('pha_recept_qty') || 'Quantité (Doses)'}</label>
              <input required type="number" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eaebef', background: '#f8f9fb' }} 
                placeholder="100" value={form.quantiteInitiale} onChange={e => setForm({...form, quantiteInitiale: e.target.value})} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#8a94a6', marginBottom: 6, textTransform: 'uppercase' }}>{t('pha_recept_exp') || "Date d'Expiration"}</label>
            <input required type="date" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #eaebef', background: '#f8f9fb' }} 
              value={form.datePeremption} onChange={e => setForm({...form, datePeremption: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #eaebef', background: 'white', fontWeight: 700, cursor: 'pointer' }}>{t('pha_cancel') || 'Annuler'}</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '14px', borderRadius: '12px', border: 'none', background: '#0056ff', color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
              {saving ? t('pha_saving') || 'Enregistrement...' : t('pha_confirm') || 'Confirmer la réception'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Composant Principal Pharmacy ──────────────────────────────────────────────
export default function Pharmacy() {
  const { t } = useI18n();
  const [stocks, setStocks] = useState([]);
  const [movements, setMovements] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'history'
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, mData] = await Promise.all([
        api.getStocks(),
        api.getStockMovements()
      ]);
      setStocks(sData);
      setMovements(mData);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStocks = stocks.filter(s =>
    String(s?.vaccin || '').toLowerCase().includes(search.toLowerCase()) ||
    String(s?.lot || '').toLowerCase().includes(search.toLowerCase())
  );

  const getExpirationStatus = (dateString) => {
    if (!dateString) return { label: 'Inconnue', color: '#8a94a6', bg: '#f4f5f9' };
    const now = new Date();
    const expiryDate = new Date(dateString);
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Périmé', color: '#ef4444', bg: '#fee2e2' };
    if (diffDays <= 90) return { label: `Expire dans ${diffDays} j`, color: '#f59e0b', bg: '#fffbeb' };
    return { label: 'Valide', color: '#10b981', bg: '#d1fae5' };
  };

  const getStockStatus = (restante, initiale) => {
    if (restante === 0) return { label: 'Rupture', color: '#ef4444' };
    const ratio = initiale > 0 ? restante / initiale : 0;
    if (ratio <= 0.2) return { label: 'Critique', color: '#f59e0b' };
    return { label: 'Normal', color: '#10b981' };
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce lot de l\'inventaire ?')) {
      await api.deleteStock(id);
      loadData();
    }
  };

  const tabStyle = (id) => ({
    padding: '12px 24px', borderRadius: '50px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
    background: activeTab === id ? 'white' : 'transparent',
    color: activeTab === id ? '#0056ff' : '#8a94a6',
    boxShadow: activeTab === id ? '0 4px 10px rgba(0,0,0,0.05)' : 'none',
    transition: 'all 0.2s'
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>{t('pha_title_main') || 'Pharmacie & Stocks'}</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>{t('pha_subtitle_main') || 'Gérez l\'inventaire des doses et suivez la traçabilité.'}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#0056ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          {t('pha_receive') || 'Réceptionner un Lot'}
        </button>
      </div>

      {/* STATS RAPIDES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #eaebef', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#ebf2ff', color: '#0056ff', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#8a94a6', fontWeight: 600, textTransform: 'uppercase' }}>Lots Actifs</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d2129' }}>{stocks.filter(s => s.quantiteRestante > 0).length}</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #eaebef', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fff5eb', color: '#f59e0b', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#8a94a6', fontWeight: 600, textTransform: 'uppercase' }}>Stocks Critiques</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d2129' }}>{stocks.filter(s => s.quantiteRestante > 0 && (s.quantiteInitiale > 0 && s.quantiteRestante/s.quantiteInitiale <= 0.2)).length}</div>
          </div>
        </div>
        <div style={{ background: 'white', padding: 20, borderRadius: 16, border: '1px solid #eaebef', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#fee2e2', color: '#ef4444', width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#8a94a6', fontWeight: 600, textTransform: 'uppercase' }}>Périmés / Ruptures</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#1d2129' }}>{stocks.filter(s => s.quantiteRestante === 0 || getExpirationStatus(s.datePeremption).label === 'Périmé').length}</div>
          </div>
        </div>
      </div>

      {/* TABS & SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ background: '#f4f5f9', padding: 4, borderRadius: '50px', display: 'inline-flex', gap: 4 }}>
          <div onClick={() => setActiveTab('inventory')} style={tabStyle('inventory')}>Inventaire</div>
          <div onClick={() => setActiveTab('history')} style={tabStyle('history')}>Historique des Mouvements</div>
        </div>
        {activeTab === 'inventory' && (
          <div style={{ position: 'relative', width: '300px' }}>
            <svg style={{ position: 'absolute', left: 16, top: 10, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 42px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', outline: 'none', fontSize: 13, width: '100%', color: '#1d2129' }} 
            />
          </div>
        )}
      </div>

      <div className="card" style={{ border: 'none', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', minHeight: 400 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#8a94a6' }}>Chargement...</div>
        ) : activeTab === 'inventory' ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_recept_prod') || 'Produit Vaccinal'}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_recept_lot') || 'Numéro de Lot'}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_jauge') || 'Jauge de Stock'}</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{t('pha_recept_exp') || "Date d'Expiration"}</th>
                  <th style={{ padding: '16px 8px', textAlign: 'right' }}>{t('pat_actions') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((s, i) => {
                  const stockStatus = getStockStatus(s.quantiteRestante, s.quantiteInitiale);
                  const expiryStatus = getExpirationStatus(s.datePeremption);
                  const fillRatio = s.quantiteInitiale > 0 ? (s.quantiteRestante / s.quantiteInitiale) * 100 : 0;

                  return (
                    <tr key={s.id} style={{ borderBottom: i < filteredStocks.length-1 ? '1px solid #eaebef' : 'none', opacity: s.quantiteRestante === 0 ? 0.6 : 1 }}>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontWeight: 800, color: '#1d2129', fontSize: 14 }}>{s.vaccin}</div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#64748b' }}>{s.lot}</div>
                      </td>
                      <td style={{ padding: '16px 8px', minWidth: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: stockStatus.color }}>{s.quantiteRestante} doses</span>
                          <span style={{ color: '#8a94a6' }}>/ {s.quantiteInitiale}</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#f4f5f9', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${Math.max(0, Math.min(100, fillRatio))}%`, height: '100%', background: stockStatus.color, borderRadius: 3 }}></div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ background: expiryStatus.bg, color: expiryStatus.color, padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 700 }}>
                          {s.datePeremption ? new Date(s.datePeremption).toLocaleDateString('fr-FR') : '--'} • {expiryStatus.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                         <button onClick={() => handleDelete(s.id)} style={{ background: '#fce7f3', border: '1px solid #fbcfe8', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: '#ec4899' }} title="Supprimer le lot">
                           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>
                         </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <MovementsTable movements={movements} />
        )}
      </div>

      <StockModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={loadData} />
    </div>
  );
}
