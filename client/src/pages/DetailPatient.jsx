import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return '?';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─── Impression : Carnet Vaccinal ─────────────────────────────────────────────
async function printCarnetVaccinal(patient, vaccinations) {
  const age = calcAge(patient.dateNaissance);
  const rows = vaccinations.map((v, i) => {
    const typeLabel =
      v.type === 'rage' ? 'Anti-Rabique' :
      v.type === 'hepb' ? 'Hépatite B' :
      v.type === 'dt'   ? 'DT' :
      v.vaccin || '—';
    const details =
      v.type === 'rage' ? `Grade : ${v.protocoleData?.grade || '—'}` :
      v.type === 'hepb' ? `Schéma : ${v.protocoleData?.schema || '—'}` :
      'Formulaire Officiel';
    const erig = v.protocoleData?.erig ? 'Oui' : 'Non';
    return `<tr>
      <td style="font-weight:800;">${i + 1}</td>
      <td>${formatDateShort(v.createdAt)}</td>
      <td><strong>${typeLabel}</strong></td>
      <td>${v.dose || '—'}</td>
      <td>${details}</td>
      <td>${v.dateProchaineDose ? formatDateShort(v.dateProchaineDose) : '—'}</td>
      <td>${erig}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/>
<title>Carnet Vaccinal - ${patient.prenom} ${patient.nom}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; color:#111827; font-size:12px; }
  .page { width:210mm; min-height:297mm; padding:16mm 20mm; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111827; padding-bottom:12px; margin-bottom:18px; }
  .header-left h1 { font-size:18px; font-weight:800; text-transform:uppercase; }
  .header-right { text-align:right; font-size:11px; color:#6b7280; }
  table { width:100%; border-collapse:collapse; font-size:11px; margin-top:12px; }
  thead tr { background:#111827; color:white; }
  th { padding:7px 10px; text-align:left; font-weight:700; font-size:9px; text-transform:uppercase; }
  td { padding:8px 10px; border-bottom:1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-left"><h1>Carnet Vaccinal Officiel</h1><div>SEMEP / VacciTrack</div></div>
    <div class="header-right"><strong>${patient.prenom} ${patient.nom}</strong>${age} ans — ${patient.sexe === 'M' ? 'Masculin' : 'Féminin'}</div>
  </div>
  <table>
    <thead><tr><th>N°</th><th>Date</th><th>Type de Vaccin</th><th>Dose</th><th>Détails</th><th>Prochaine Dose</th><th>ERIG</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="7" style="text-align:center;padding:24px;color:#9ca3af;font-style:italic;">Aucun vaccin enregistré.</td></tr>'}</tbody>
  </table>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body></html>`;
  const w = window.open('', '_blank', 'width=950,height=750');
  w.document.write(html);
  w.document.close();
}

// ─── Composants UI ────────────────────────────────────────────────────────────
const InfoItem = ({ label, value, icon, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
      {icon && <span>{icon}</span>}
      {label}
    </div>
    <div style={{ fontSize: 13, color: value ? '#1d2129' : '#cbd5e0', fontWeight: value ? 600 : 400 }}>
      {value || '—'}
    </div>
  </div>
);

const SectionCard = ({ title, icon, children, accent = '#0056ff' }) => (
  <div style={{
    background: 'white',
    borderRadius: 16,
    border: '1px solid #eaebef',
    overflow: 'hidden',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      padding: '14px 20px',
      borderBottom: '1px solid #f0f1f5',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      background: '#fafbff',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8, background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
      }}>
        {icon}
      </div>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>{title}</span>
    </div>
    <div style={{ padding: '20px' }}>
      {children}
    </div>
  </div>
);

// ─── Badge de type vaccin ─────────────────────────────────────────────────────
function VaccinTypeBadge({ type }) {
  const config = {
    rage:  { label: 'Anti-Rabique', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    hepb:  { label: 'Hépatite B',   bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    dt:    { label: 'DT',            bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  };
  const c = config[type] || { label: type || 'Autre', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {c.label}
    </span>
  );
}

// ─── Ligne de vaccination ─────────────────────────────────────────────────────
function VaccinRow({ v, index, isLast }) {
  const [open, setOpen] = useState(false);
  const hasProchain = v.dateProchaineDose && new Date(v.dateProchaineDose) > new Date();
  const isOverdue   = v.dateProchaineDose && new Date(v.dateProchaineDose) < new Date();

  return (
    <div style={{
      borderBottom: isLast ? 'none' : '1px solid #f0f1f5',
      transition: 'background .15s',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'grid',
          gridTemplateColumns: '36px 1fr auto auto auto',
          alignItems: 'center',
          gap: 12,
          padding: '14px 20px',
          cursor: 'pointer',
          background: open ? '#f8f9ff' : 'transparent',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = '#fafbff'; }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* N° */}
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#f0f1f5', color: '#8a94a6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
        }}>
          {index + 1}
        </div>

        {/* Infos principales */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <VaccinTypeBadge type={v.type} />
            {v.dose && (
              <span style={{ fontSize: 11, color: '#8a94a6', fontWeight: 600 }}>
                {v.dose}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 3 }}>
            {formatDate(v.createdAt)}
          </div>
        </div>

        {/* Prochaine dose */}
        <div style={{ textAlign: 'right' }}>
          {v.dateProchaineDose ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700,
              color: isOverdue ? '#dc2626' : hasProchain ? '#059669' : '#8a94a6',
              background: isOverdue ? '#fef2f2' : hasProchain ? '#f0fdf4' : '#f8fafc',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {isOverdue ? '' : ''} {formatDateShort(v.dateProchaineDose)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#cbd5e0' }}>Pas de rappel</span>
          )}
        </div>

        {/* ERIG */}
        <div style={{ textAlign: 'center' }}>
          {v.protocoleData?.erig ? (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9333ea', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '2px 7px', borderRadius: 4 }}>
              ERIG ✓
            </span>
          ) : null}
        </div>

        {/* Chevron */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {/* Détails dépliants */}
      {open && (
        <div style={{
          padding: '0 20px 16px 68px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 12,
          background: '#f8f9ff',
          borderTop: '1px solid #eef0ff',
        }}>
          {v.type === 'rage' && v.protocoleData?.grade && (
            <InfoItem label="Grade" value={v.protocoleData.grade} />
          )}
          {v.type === 'hepb' && v.protocoleData?.schema && (
            <InfoItem label="Schéma" value={v.protocoleData.schema} />
          )}
          {v.lot && <InfoItem label="N° de lot" value={v.lot} />}
          {v.site && <InfoItem label="Site d'injection" value={v.site} />}
          {v.praticien && <InfoItem label="Praticien" value={v.praticien} />}
          {v.notes && <InfoItem label="Notes" value={v.notes} full />}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ num, label, color = '#0056ff', bg = '#ebf2ff', icon }) => (
  <div style={{
    background: 'white',
    borderRadius: 14,
    border: '1px solid #eaebef',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{
      width: 46, height: 46, borderRadius: 12,
      background: bg, color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 20, flexShrink: 0,
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#1d2129', lineHeight: 1 }}>
        {num}
      </div>
      <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
        {label}
      </div>
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DetailPatient({ patient, onBack, onEdit, onVaccin, onOrdonnance }) {
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('vaccins');

  const age = calcAge(patient.dateNaissance);
  const sexeCouleur = patient.sexe === 'M' ? '#0056ff' : '#ec4899';
  const sexeBg      = patient.sexe === 'M' ? '#ebf2ff' : '#fce7f3';
  const initiales   = `${patient.prenom?.[0] || ''}${patient.nom?.[0] || ''}`.toUpperCase();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.getVaccinations({ patientId: patient.id });
        setVaccinations(data);
      } catch {}
      setLoading(false);
    })();
  }, [patient.id]);

  const vaccsByType = {
    rage: vaccinations.filter(v => v.type === 'rage').length,
    hepb: vaccinations.filter(v => v.type === 'hepb').length,
    dt:   vaccinations.filter(v => v.type === 'dt').length,
  };

  const nextDose = vaccinations
    .filter(v => v.dateProchaineDose && new Date(v.dateProchaineDose) > new Date())
    .sort((a, b) => new Date(a.dateProchaineDose) - new Date(b.dateProchaineDose))[0];

  const hasMedical = patient.antecedents || patient.allergies || patient.maladiesChroniques || patient.traitementEnCours;

  const TABS = [
    { id: 'vaccins',    label: 'Vaccinations',      count: vaccinations.length },
    { id: 'identite',   label: 'Identité',           count: null },
    { id: 'medical',    label: 'Dossier Médical',    count: null },
    { id: 'pro',        label: 'Situation Pro.',     count: null },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f9' }}>

      {/* ── Hero Header ── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #eaebef',
        padding: '28px 36px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
      }}>
        {/* Breadcrumb + Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          {/* Retour */}
          <button
            onClick={onBack}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#8a94a6', fontWeight: 600, fontSize: 13, padding: 0,
            }}
            onMouseOver={e => e.currentTarget.style.color = '#0056ff'}
            onMouseOut={e => e.currentTarget.style.color = '#8a94a6'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dossiers Patients
          </button>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => onVaccin && onVaccin(patient.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 50, border: 'none',
                background: '#ebf2ff', color: '#0056ff',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l-2 2 4 4 2-2-4-4z"/>
                <path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"/>
                <line x1="14" y1="10" x2="4" y2="20"/>
              </svg>
              Nouveau Protocole
            </button>
            <button
              onClick={() => onOrdonnance && onOrdonnance(patient)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 50, border: 'none',
                background: '#f0fdf4', color: '#16a34a',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12h6"/><path d="M9 16h6"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              </svg>
              Ordonnance
            </button>
            <button
              onClick={() => printCarnetVaccinal(patient, vaccinations)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 50,
                border: '1px solid #eaebef', background: 'white', color: '#64748b',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimer
            </button>
            <button
              onClick={() => onEdit && onEdit(patient)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 16px', borderRadius: 50, border: 'none',
                background: '#0056ff', color: 'white',
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,86,255,0.25)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9"/>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Modifier
            </button>
          </div>
        </div>

        {/* Identité Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: sexeBg, color: sexeCouleur,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22,
            flexShrink: 0, border: `3px solid ${sexeCouleur}22`,
          }}>
            {initiales}
          </div>
          <div>
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>
              {patient.prenom} {patient.nom}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#0056ff', background: '#ebf2ff', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                {patient.id}
              </span>
              <span style={{ fontSize: 12, color: '#8a94a6', fontWeight: 600 }}>
                {age} ans · {patient.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </span>
              {patient.dateNaissance && (
                <span style={{ fontSize: 12, color: '#8a94a6' }}>
                  né{patient.sexe === 'F' ? 'e' : ''} le {formatDate(patient.dateNaissance)}
                </span>
              )}
              {hasMedical && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#059669', background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '2px 8px', borderRadius: 10 }}>
                  ✓ Dossier médical
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f0f1f5' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0056ff' : '2px solid transparent',
                color: activeTab === tab.id ? '#0056ff' : '#8a94a6',
                fontWeight: activeTab === tab.id ? 700 : 600,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all .15s',
                marginBottom: -1,
              }}
            >
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  background: activeTab === tab.id ? '#0056ff' : '#eaebef',
                  color: activeTab === tab.id ? 'white' : '#8a94a6',
                  borderRadius: 20, fontSize: 10, fontWeight: 800,
                  padding: '1px 7px', transition: 'all .15s',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ padding: '28px 36px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ══ VACCINATIONS ══ */}
        {activeTab === 'vaccins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              <StatCard num={vaccinations.length} label="Total Certificats" color="#0056ff" bg="#ebf2ff" icon="" />
              <StatCard num={vaccsByType.rage}     label="Anti-Rabique"    color="#c2410c" bg="#fff7ed" icon="" />
              <StatCard num={vaccsByType.hepb}     label="Hépatite B"      color="#16a34a" bg="#f0fdf4" icon="" />
              <StatCard num={vaccsByType.dt}        label="DT"              color="#1d4ed8" bg="#eff6ff" icon="" />
            </div>

            {/* Prochain rendez-vous */}
            {nextDose && (
              <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0',
                borderRadius: 14, padding: '14px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{ fontSize: 28 }}></div>
                <div>
                  <div style={{ fontWeight: 800, color: '#166534', fontSize: 13 }}>Prochain rendez-vous vaccinal</div>
                  <div style={{ fontSize: 12, color: '#16a34a', marginTop: 2 }}>
                    <VaccinTypeBadge type={nextDose.type} /> — {formatDate(nextDose.dateProchaineDose)}
                  </div>
                </div>
              </div>
            )}

            {/* Liste vaccinations */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eaebef', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ebf2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💉</div>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>Historique des Vaccinations</span>
                </div>
                <span style={{ fontSize: 12, color: '#8a94a6', fontWeight: 600 }}>Cliquez sur une ligne pour les détails</span>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}></div>
                  Chargement…
                </div>
              ) : vaccinations.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8a94a6' }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}></div>
                  <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Aucune vaccination enregistrée</div>
                  <div style={{ fontSize: 12 }}>Démarrez un protocole vaccinal pour ce patient.</div>
                </div>
              ) : (
                <div>
                  {vaccinations.map((v, i) => (
                    <VaccinRow key={v.id || i} v={v} index={i} isLast={i === vaccinations.length - 1} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══ IDENTITÉ ══ */}
        {activeTab === 'identite' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Informations Personnelles" icon="">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <InfoItem label="Nom" value={patient.nom} />
                <InfoItem label="Prénom" value={patient.prenom} />
                <InfoItem label="Date de naissance" value={formatDate(patient.dateNaissance)} />
                <InfoItem label="Âge" value={age !== '?' ? `${age} ans` : null} />
                <InfoItem label="Sexe" value={patient.sexe === 'M' ? 'Masculin' : 'Féminin'} />
                <InfoItem label="Poids" value={patient.poids ? `${patient.poids} Kg` : null} />
              </div>
            </SectionCard>

            <SectionCard title="Contact" icon="" accent="#059669">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <InfoItem label="Téléphone" value={patient.telephone} />
                <InfoItem label="Email" value={patient.email} />
              </div>
            </SectionCard>

            <SectionCard title="Résidence & Adresse" icon="" accent="#7c3aed">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <InfoItem label="Wilaya" value={patient.wilaya} />
                <InfoItem label="Daïra" value={patient.daira} />
                <InfoItem label="Commune" value={patient.commune} />
                <InfoItem label="Adresse complète" value={patient.adresse} full />
              </div>
            </SectionCard>
          </div>
        )}

        {/* ══ DOSSIER MÉDICAL ══ */}
        {activeTab === 'medical' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!hasMedical && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a',
                borderRadius: 12, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, color: '#92400e', fontWeight: 600,
              }}>
                Aucune information médicale renseignée pour ce patient.
              </div>
            )}

            <SectionCard title="Antécédents & Allergies" icon="" accent="#dc2626">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <InfoItem label="Antécédents médicaux" value={patient.antecedents} full />
                <InfoItem label="Allergies connues" value={patient.allergies} full />
                <InfoItem label="Contre-indications vaccinales" value={patient.contreIndications} full />
              </div>
            </SectionCard>

            <SectionCard title="Maladies chroniques & Traitements" icon="" accent="#d97706">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <InfoItem label="Maladies chroniques" value={patient.maladiesChroniques} full />
                <InfoItem label="Traitement en cours" value={patient.traitementEnCours} full />
              </div>
            </SectionCard>

            <SectionCard title="Mode de Vie" icon="" accent="#16a34a">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <InfoItem label="Tabagisme" value={
                  patient.fumeur === 'non'     ? 'Non-fumeur' :
                  patient.fumeur === 'ancien'  ? 'Ancien fumeur' :
                  patient.fumeur === 'oui'     ? 'Fumeur actif' : null
                } />
                <InfoItem label="Alcool" value={
                  patient.alcool === 'non'        ? 'Non' :
                  patient.alcool === 'occasionnel' ? 'Occasionnel' :
                  patient.alcool === 'regulier'    ? 'Régulier' : null
                } />
                <InfoItem label="Activité physique" value={
                  patient.activitePhysique === 'sedentaire' ? 'Sédentaire' :
                  patient.activitePhysique === 'moderee'    ? 'Modérée' :
                  patient.activitePhysique === 'intense'    ? 'Intense' : null
                } />
              </div>
            </SectionCard>

            <SectionCard title="Informations Administratives" icon="" accent="#0891b2">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                <InfoItem label="N° CNAS" value={patient.numeroCNAS} />
                <InfoItem label="Mutuelle" value={patient.mutuelle} />
                <InfoItem label="Médecin traitant" value={patient.medecinTraitant} />
              </div>
            </SectionCard>

            {patient.notesClinicien && (
              <SectionCard title="Notes Clinicien" icon="" accent="#8b5cf6">
                <InfoItem label="Observations libres" value={patient.notesClinicien} full />
              </SectionCard>
            )}
          </div>
        )}

        {/* ══ SITUATION PRO ══ */}
        {activeTab === 'pro' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <SectionCard title="Situation Professionnelle" icon="" accent="#0056ff">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                <InfoItem label="Fonction" value={patient.fonction} />
                <InfoItem label="Service" value={patient.service} />
                <InfoItem label="Profession" value={patient.profession} />
                <InfoItem label="Niveau d'instruction" value={patient.instruction} />
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
}