import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import VaccinModal from '../components/VaccinModal';
import OrdonnanceModal from '../components/OrdonnanceModal';
import algeriaData from '../data/algeria.json';

// ─── Impression : Dossier Patient ────────────────────────────────────────────
function printDossierPatient(patient) {
  const age = getPatientAge(patient);

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Dossier Patient - ${patient.prenom} ${patient.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; color:#111827; background:#fff; font-size:12px; }
    .page { width:210mm; min-height:297mm; padding:18mm 22mm; margin:0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111827; padding-bottom:14px; margin-bottom:20px; }
    .header-left h1 { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#111827; text-transform:uppercase; letter-spacing:1px; }
    .header-left .sub { font-size:11px; color:#6b7280; margin-top:4px; font-weight:500; }
    .header-right { text-align:right; font-size:11px; color:#6b7280; line-height:1.6; }
    .header-right strong { display:block; color:#111827; font-size:12px; font-weight:700; }
    .identity-bar { display:flex; align-items:center; gap:20px; border:1px solid #e5e7eb; border-radius:6px; padding:14px 18px; margin-bottom:20px; background:#f9fafb; }
    .initials { width:56px; height:56px; border-radius:50%; border:2px solid #d1d5db; background:#f3f4f6; display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:#374151; flex-shrink:0; }
    .identity-main h2 { font-family:'Syne',sans-serif; font-size:17px; font-weight:800; color:#111827; }
    .identity-main .dossier-id { font-family:monospace; font-size:10px; color:#9ca3af; margin-top:3px; }
    .badges { display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
    .badge { padding:2px 10px; border-radius:3px; font-size:10px; font-weight:700; border:1px solid #e5e7eb; color:#374151; background:white; text-transform:uppercase; letter-spacing:0.3px; }
    .section { margin-bottom:18px; }
    .section-title { font-size:10px; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:0.8px; padding-bottom:5px; border-bottom:1px solid #e5e7eb; margin-bottom:10px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px 28px; }
    .info-item label { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:2px; }
    .info-item span { font-size:12px; font-weight:600; color:#111827; }
    .info-item.full { grid-column:span 2; }
    .footer { margin-top:36px; border-top:1px solid #e5e7eb; padding-top:14px; display:flex; justify-content:space-between; align-items:flex-end; }
    .footer-note { font-size:9px; color:#9ca3af; line-height:1.6; max-width:220px; }
    .sign-area { text-align:center; }
    .sign-stamp { border:1px solid #d1d5db; padding:8px 20px; font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
    .sign-line { border-top:1px solid #374151; width:160px; margin:40px auto 5px; }
    .sign-label { font-size:10px; color:#6b7280; }
    @media print { .page { padding:12mm 16mm; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>Dossier Patient</h1>
      <div class="sub">Systeme de Gestion Vaccinale — SEMEP / VacciTrack</div>
    </div>
    <div class="header-right">
      <strong>Imprime le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</strong>
      Document confidentiel — usage medical uniquement
    </div>
  </div>
  <div class="identity-bar">
    <div class="initials">${patient.prenom[0]}${patient.nom[0]}</div>
    <div class="identity-main">
      <h2>${patient.prenom} ${patient.nom}</h2>
      <div class="dossier-id">N° Dossier : ${patient.id}</div>
      <div class="badges">
        <span class="badge">${patient.sexe === 'M' ? 'Masculin' : 'Feminin'}</span>
        <span class="badge">${age} ans</span>
        ${patient.poids ? `<span class="badge">${patient.poids} Kg</span>` : ''}
      </div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Informations Personnelles</div>
    <div class="info-grid">
      <div class="info-item"><label>Prenom</label><span>${patient.prenom}</span></div>
      <div class="info-item"><label>Nom</label><span>${patient.nom}</span></div>
      <div class="info-item"><label>Date de naissance</label><span>${patient.dateNaissance ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR') : '—'}</span></div>
      <div class="info-item"><label>Age</label><span>${age} ans</span></div>
      <div class="info-item"><label>Sexe</label><span>${patient.sexe === 'M' ? 'Masculin' : 'Feminin'}</span></div>
      <div class="info-item"><label>Poids</label><span>${patient.poids ? patient.poids + ' Kg' : '—'}</span></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Coordonnees</div>
    <div class="info-grid">
      <div class="info-item"><label>Telephone</label><span>${patient.telephone || '—'}</span></div>
      <div class="info-item"><label>Email</label><span>${patient.email || '—'}</span></div>
      <div class="info-item full"><label>Adresse</label><span>${patient.adresse || [patient.commune, patient.daira, patient.wilaya].filter(Boolean).join(', ') || '—'}</span></div>
    </div>
  </div>
  <div class="section">
    <div class="section-title">Situation Professionnelle</div>
    <div class="info-grid">
      <div class="info-item"><label>Fonction</label><span>${patient.fonction || '—'}</span></div>
      <div class="info-item"><label>Service</label><span>${patient.service || '—'}</span></div>
      <div class="info-item"><label>Profession</label><span>${patient.profession || '—'}</span></div>
      <div class="info-item"><label>Niveau d'instruction</label><span>${patient.instruction || '—'}</span></div>
    </div>
  </div>
  ${patient.antecedents || patient.allergies || patient.maladiesChroniques || patient.traitementEnCours ? `
  <div class="section">
    <div class="section-title">Dossier Medical</div>
    <div class="info-grid">
      ${patient.antecedents ? `<div class="info-item full"><label>Antécédents médicaux</label><span>${patient.antecedents}</span></div>` : ''}
      ${patient.allergies ? `<div class="info-item full"><label>Allergies connues</label><span>${patient.allergies}</span></div>` : ''}
      ${patient.maladiesChroniques ? `<div class="info-item full"><label>Maladies chroniques</label><span>${patient.maladiesChroniques}</span></div>` : ''}
      ${patient.traitementEnCours ? `<div class="info-item full"><label>Traitement en cours</label><span>${patient.traitementEnCours}</span></div>` : ''}
      ${patient.contreIndications ? `<div class="info-item full"><label>Contre-indications</label><span>${patient.contreIndications}</span></div>` : ''}
    </div>
  </div>` : ''}
  <div class="footer">
    <div class="footer-note">VacciTrack — Systeme de Gestion Vaccinale<br/>Document genere automatiquement. SEMEP.</div>
    <div class="sign-area">
      <div class="sign-stamp">Cachet du Responsable Medical</div>
      <div class="sign-line"></div>
      <div class="sign-label">Visa et signature</div>
    </div>
  </div>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=900,height=750');
  w.document.write(html);
  w.document.close();
}

// ─── Impression : Carnet Vaccinal ─────────────────────────────────────────────
async function printDossierVaccinal(patient) {
  let vaccinations = [];
  try { vaccinations = await api.getVaccinations({ patientId: patient.id }); } catch {}

  const age = getPatientAge(patient);

  const rows = vaccinations.map((v, i) => {
    const typeLabel = v.type === 'rage' ? 'Anti-Rabique' : v.type === 'hepb' ? 'Hepatite B' : v.type === 'dt' ? 'DT' : v.vaccin || '—';
    const details = v.type === 'rage' ? `Grade : ${v.protocoleData?.grade || '—'}` : v.type === 'hepb' ? `Schema : ${v.protocoleData?.schema || '—'}` : 'Formulaire Officiel';
    const erig = v.protocoleData?.erig ? 'Oui' : 'Non';
    return `<tr>
      <td style="font-weight:800;">${i + 1}</td>
      <td>${new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
      <td><strong>${typeLabel}</strong></td>
      <td>${v.dose || '—'}</td>
      <td>${details}</td>
      <td>${v.dateProchaineDose ? new Date(v.dateProchaineDose).toLocaleDateString('fr-FR') : '—'}</td>
      <td>${erig}</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/>
<title>Carnet Vaccinal - ${patient.prenom} ${patient.nom}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'DM Sans',sans-serif; color:#111827; background:#fff; font-size:12px; }
  .page { width:210mm; min-height:297mm; padding:16mm 20mm; margin:0 auto; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:2px solid #111827; padding-bottom:12px; margin-bottom:18px; }
  .header-left h1 { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; text-transform:uppercase; letter-spacing:1px; }
  .header-left .sub { font-size:11px; color:#6b7280; margin-top:3px; }
  .header-right { text-align:right; font-size:11px; color:#6b7280; }
  .header-right strong { display:block; color:#111827; font-weight:700; font-size:12px; }
  .patient-block { display:flex; justify-content:space-between; align-items:flex-start; border:1px solid #e5e7eb; border-left:4px solid #111827; border-radius:4px; padding:12px 16px; margin-bottom:18px; background:#f9fafb; }
  .patient-block h2 { font-family:'Syne',sans-serif; font-size:15px; font-weight:800; }
  .patient-block .meta { font-size:11px; color:#6b7280; margin-top:2px; }
  .patient-block .tags { display:flex; gap:6px; margin-top:7px; flex-wrap:wrap; }
  .tag { padding:2px 9px; border:1px solid #e5e7eb; border-radius:3px; font-size:10px; font-weight:700; color:#374151; background:white; text-transform:uppercase; }
  .summary { display:flex; gap:12px; margin-bottom:18px; }
  .sum-card { flex:1; border:1px solid #e5e7eb; border-radius:4px; padding:10px 14px; text-align:center; }
  .sum-num { font-family:'Syne',sans-serif; font-size:22px; font-weight:800; color:#111827; }
  .sum-lbl { font-size:10px; color:#9ca3af; margin-top:2px; text-transform:uppercase; letter-spacing:0.3px; }
  .section-title { font-size:10px; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:0.8px; padding-bottom:5px; border-bottom:1px solid #e5e7eb; margin-bottom:10px; }
  table { width:100%; border-collapse:collapse; font-size:11px; }
  thead tr { background:#111827; color:white; }
  th { padding:7px 10px; text-align:left; font-weight:700; font-size:9px; text-transform:uppercase; letter-spacing:0.5px; }
  td { padding:8px 10px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
  tbody tr:nth-child(even) { background:#f9fafb; }
  .empty-row { text-align:center; padding:24px; color:#9ca3af; font-style:italic; }
  .footer { margin-top:28px; border-top:1px solid #e5e7eb; padding-top:12px; display:flex; justify-content:space-between; align-items:flex-end; font-size:9px; color:#9ca3af; }
  .sign-area { text-align:center; }
  .sign-stamp { border:1px solid #d1d5db; padding:7px 18px; font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; }
  .sign-line { border-top:1px solid #374151; width:150px; margin:40px auto 5px; }
  .sign-label { font-size:9px; color:#6b7280; }
  @media print { .page { padding:10mm 14mm; } body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="header-left"><h1>Carnet Vaccinal Officiel</h1><div class="sub">Service de Medecine Preventive — SEMEP / VacciTrack</div></div>
    <div class="header-right"><strong>Imprime le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</strong>Document confidentiel — usage medical</div>
  </div>
  <div class="patient-block">
    <div>
      <h2>${patient.prenom} ${patient.nom}</h2>
      <div class="meta">N° Dossier : ${patient.id}</div>
      <div class="tags">
        <span class="tag">${patient.sexe === 'M' ? 'Masculin' : 'Feminin'}</span>
        <span class="tag">${age} ans</span>
        ${patient.telephone ? `<span class="tag">Tel : ${patient.telephone}</span>` : ''}
      </div>
    </div>
    <div style="text-align:right; font-size:11px; color:#6b7280; line-height:1.6;">
      <div>Naissance : ${patient.dateNaissance ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR') : '—'}</div>
      <div>Adresse : ${patient.adresse || '—'}</div>
    </div>
  </div>
  <div class="summary">
    <div class="sum-card"><div class="sum-num">${vaccinations.length}</div><div class="sum-lbl">Total certificats</div></div>
    <div class="sum-card"><div class="sum-num">${vaccinations.filter(v => v.type === 'rage').length}</div><div class="sum-lbl">Anti-Rabique</div></div>
    <div class="sum-card"><div class="sum-num">${vaccinations.filter(v => v.type === 'hepb').length}</div><div class="sum-lbl">Hepatite B</div></div>
    <div class="sum-card"><div class="sum-num">${vaccinations.filter(v => v.type === 'dt').length}</div><div class="sum-lbl">DT</div></div>
  </div>
  <div class="section-title">Historique des Vaccinations</div>
  ${vaccinations.length === 0
    ? '<div class="empty-row">Aucun vaccin enregistre pour ce patient.</div>'
    : `<table><thead><tr><th style="width:28px;">N°</th><th>Date</th><th>Type de Vaccin</th><th>Dose</th><th>Details</th><th>Prochaine Dose</th><th>Serum (ERIG)</th></tr></thead><tbody>${rows}</tbody></table>`}
  <div class="footer">
    <div>VacciTrack — Systeme de Gestion Vaccinale | Document genere automatiquement. SEMEP.</div>
    <div class="sign-area"><div class="sign-stamp">Cachet du Responsable Medical</div><div class="sign-line"></div><div class="sign-label">Visa et signature</div></div>
  </div>
</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body></html>`;

  const w = window.open('', '_blank', 'width=950,height=750');
  w.document.write(html);
  w.document.close();
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', age: '', sexe: 'M',
  telephone: '', email: '',
  wilaya: '', daira: '', commune: '', adressePrecise: '',
  poids: '', fonction: '', service: '',
  profession: '', instruction: '',
  antecedents: '', allergies: '', maladiesChroniques: '',
  traitementEnCours: '', contreIndications: '',
  fumeur: '', alcool: '', activitePhysique: '',
  mutuelle: '', numeroCNAS: '', medecinTraitant: '',
  notesClinicien: '',
};

// ─── Composant champ de formulaire ───────────────────────────────────────────
const Field = ({ label, required, children }) => (
  <div>
    <label style={{ fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #eaebef', outline: 'none', fontSize: '13px',
  background: '#f8f9fb', color: '#1d2129', transition: 'border .15s',
};

const textareaStyle = {
  ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit',
};

// ─── Badge étape ─────────────────────────────────────────────────────────────
const StepBadge = ({ num, label, active, done, onClick }) => (
  <div
    onClick={done ? onClick : undefined}
    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: done ? 'pointer' : 'default' }}
  >
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800,
      background: done ? '#8a94a6' : active ? '#0056ff' : '#eaebef',
      color: done || active ? 'white' : '#8a94a6',
      transition: 'all .2s',
    }}>
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : num}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#0056ff' : done ? '#8a94a6' : '#8a94a6' }}>
        Étape {num}
      </div>
      <div style={{ fontSize: 11, color: '#8a94a6' }}>{label}</div>
    </div>
  </div>
);

// ─── Section médicale avec toggle ────────────────────────────────────────────
const MedSection = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid #eaebef', borderRadius: 12, overflow: 'hidden' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', cursor: 'pointer',
          background: open ? '#f8f9ff' : '#fafbfc',
          borderBottom: open ? '1px solid #eaebef' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1d2129' }}>{title}</span>
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="#8a94a6" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
      {open && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {children}
        </div>
      )}
    </div>
  );
};

// ─── Modal Patient (2 étapes) ─────────────────────────────────────────────────
function PatientModal({ patient, onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(patient ? { ...EMPTY, ...patient, wilaya: 'Tlemcen' } : { ...EMPTY, wilaya: 'Tlemcen' });
  const [saving, setSaving] = useState(false);

  const wilayas = algeriaData.wilayas;
  const selectedWilaya = wilayas.find(w => w.name === 'Tlemcen');
  const dairas = selectedWilaya?.dairas || [];
  const selectedDaira = dairas.find(d => d.name === form.daira);
  const communes = selectedDaira?.communes || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const ageBadge = form.age ? `${form.age} ans` : '';

  const step1Valid = form.prenom && form.nom && form.age && form.wilaya && form.daira && form.commune;

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const data = { ...form, wilaya: 'Tlemcen' };
      if (!patient?.id) {
        const dob = form.dateNaissance ? form.dateNaissance.replace(/-/g, '') : `AGE${String(form.age).padStart(3, '0')}`;
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        data.id = `${dob}-${today}-${rand}`;
        data.adresse = `${form.commune}, ${form.daira}, ${form.wilaya}${form.adressePrecise ? ' (' + form.adressePrecise + ')' : ''}`;
        await api.createPatient(data);
      } else {
        data.adresse = `${form.commune}, ${form.daira}, ${form.wilaya}${form.adressePrecise ? ' (' + form.adressePrecise + ')' : ''}`;
        await api.updatePatient(patient.id, data);
      }
      onSave();
    } finally {
      setSaving(false);
    }
  };

  const isEditing = Boolean(patient?.id);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,41,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white', borderRadius: 20, width: '100%', maxWidth: 680,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* ── En-tête fixe ── */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#1d2129', marginBottom: 2 }}>
                {isEditing ? 'Modifier le patient' : 'Nouveau patient'}
              </h2>
              {ageBadge && (
                <span style={{ background: '#ebf2ff', color: '#0056ff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {ageBadge}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6', padding: 4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* ── Stepper ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
            <StepBadge num={1} label="Identité & Adresse" active={step === 1} done={step > 1} onClick={() => setStep(1)} />
            <div style={{ flex: 1, height: 2, background: step > 1 ? '#8a94a6' : '#eaebef', margin: '0 12px', borderRadius: 1, transition: 'background .3s' }} />
            <StepBadge num={2} label="Dossier Médical" active={step === 2} done={false} />
          </div>

          <div style={{ height: 1, background: '#f0f1f5', marginLeft: -28, marginRight: -28 }} />
        </div>

        {/* ── Corps scrollable ── */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>

          {/* ══ ÉTAPE 1 ══ */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Nom" required>
                  <input required value={form.nom} onChange={e => set('nom', e.target.value)}
                    placeholder="Benali" style={inputStyle} />
                </Field>
                <Field label="Prénom" required>
                  <input required value={form.prenom} onChange={e => set('prenom', e.target.value)}
                    placeholder="Ahmed" style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
               <Field label="Âge" required>
  <input 
    type="number"
    value={form.age || ''} 
    onChange={e => set('age', e.target.value)}
    placeholder="Saisir l'âge"
    style={inputStyle}
  />
</Field>
                <Field label="Date de naissance" >
                  <input type="date" value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Sexe">
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {[['M','Masculin','#0056ff'],['F','Féminin','#ec4899']].map(([val, lbl, color]) => (
                      <button
                        key={val} type="button"
                        onClick={() => set('sexe', val)}
                        style={{
                          flex: 1, padding: '10px 0', borderRadius: 8, border: `1.5px solid`,
                          borderColor: form.sexe === val ? color : '#eaebef',
                          background: form.sexe === val ? color + '12' : 'white',
                          color: form.sexe === val ? color : '#8a94a6',
                          fontWeight: 700, fontSize: 12, cursor: 'pointer', transition: 'all .15s',
                        }}
                      >{lbl}</button>
                    ))}
                  </div>
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Téléphone">
                  <input value={form.telephone} onChange={e => set('telephone', e.target.value)}
                    placeholder="05XXXXXXXX" style={inputStyle} />
                </Field>
                <Field label="Email">
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="email@exemple.com" style={inputStyle} />
                </Field>
              </div>

              {/* Adresse */}
              <div style={{ border: '1px solid #eaebef', borderRadius: 12, padding: '16px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -10, left: 14, background: 'white', padding: '0 6px', fontSize: 10, fontWeight: 800, color: '#0056ff', textTransform: 'uppercase', letterSpacing: '.4px' }}>
                  Résidence & Adresse
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <Field label="Wilaya" required>
                    <input required value="Tlemcen" readOnly style={{ ...inputStyle, background: '#ebf2ff', color: '#0056ff', fontWeight: 700 }} />
                  </Field>
                  <Field label="DaÃ¯ra" required>
                    <>
                      <input
                        required
                        list="patient-daira-options"
                        value={form.daira}
                        onChange={e => { set('daira', e.target.value); set('commune', ''); }}
                        placeholder="Rechercher une daira..."
                        style={inputStyle}
                      />
                      <datalist id="patient-daira-options">
                        {dairas.map(d => <option key={d.name} value={d.name} />)}
                      </datalist>
                    </>
                  </Field>
                  <Field label="Commune" required>
                    <>
                      <input
                        required
                        list="patient-commune-options"
                        value={form.commune}
                        onChange={e => set('commune', e.target.value)}
                        placeholder="Rechercher une commune..."
                        style={{ ...inputStyle, opacity: !form.daira ? .5 : 1 }}
                        disabled={!form.daira}
                      />
                      <datalist id="patient-commune-options">
                        {communes.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </>
                  </Field>
                </div>
                <div style={{ display: 'none' }}>
                  <Field label="Wilaya" required>
                    <select required value={form.wilaya}
                      onChange={e => { set('wilaya', e.target.value); set('daira', ''); set('commune', ''); }}
                      style={inputStyle}>
                      <option value="">Sélectionner…</option>
                      {wilayas.map(w => <option key={w.id} value={w.name}>{w.id} - {w.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Daïra" required>
                    <select required value={form.daira}
                      onChange={e => { set('daira', e.target.value); set('commune', ''); }}
                      style={{ ...inputStyle, opacity: !form.wilaya ? .5 : 1 }} disabled={!form.wilaya}>
                      <option value="">Sélectionner…</option>
                      {dairas.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Commune" required>
                    <select required value={form.commune} onChange={e => set('commune', e.target.value)}
                      style={{ ...inputStyle, opacity: !form.daira ? .5 : 1 }} disabled={!form.daira}>
                      <option value="">Sélectionner…</option>
                      {communes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <Field label="Adresse précise (Rue, Quartier, N°)">
                  <input value={form.adressePrecise} onChange={e => set('adressePrecise', e.target.value)}
                    placeholder="Cité 500 logements, Bât. A…" style={inputStyle} />
                </Field>
              </div>

              {/* Situation pro */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <Field label="Poids (Kg)">
                  <input type="number" step="0.1" value={form.poids} onChange={e => set('poids', e.target.value)}
                    placeholder="70" style={inputStyle} />
                </Field>
                <Field label="Fonction">
                  <input value={form.fonction} onChange={e => set('fonction', e.target.value)}
                    placeholder="Infirmier…" style={inputStyle} />
                </Field>
                <Field label="Service">
                  <input value={form.service} onChange={e => set('service', e.target.value)}
                    placeholder="SEMEP…" style={inputStyle} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Profession">
                  <input value={form.profession} onChange={e => set('profession', e.target.value)}
                    placeholder="Enseignant…" style={inputStyle} />
                </Field>
                <Field label="Niveau d'instruction">
                  <select value={form.instruction} onChange={e => set('instruction', e.target.value)} style={inputStyle}>
                    <option value="">Sélectionner…</option>
                    {['Analphabète','Primaire','Moyen','Secondaire','Universitaire'].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ══ ÉTAPE 2 ══ */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '12px 16px', marginBottom: 4 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: form.sexe === 'M' ? '#ebf2ff' : '#fce7f3', color: form.sexe === 'M' ? '#0056ff' : '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0 }}>
                  {form.prenom?.[0]}{form.nom?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800, color: '#1d2129', fontSize: 14 }}>{form.prenom} {form.nom}</div>
                  <div style={{ fontSize: 11, color: '#8a94a6' }}>{ageBadge || 'Age non renseigne'} · {form.sexe === 'M' ? 'Homme' : 'Femme'}</div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 11, color: '#0056ff', fontWeight: 600 }}>Dossier médical</div>
              </div>

              <MedSection title="Antécédents & Allergies" icon="" defaultOpen={true}>
                <Field label="Antécédents médicaux">
                  <textarea value={form.antecedents} onChange={e => set('antecedents', e.target.value)}
                    placeholder="Chirurgies, hospitalisations, maladies passées…" style={textareaStyle} />
                </Field>
                <Field label="Allergies connues">
                  <textarea value={form.allergies} onChange={e => set('allergies', e.target.value)}
                    placeholder="Médicaments, aliments, substances…" style={{ ...textareaStyle, minHeight: 56 }} />
                </Field>
                <Field label="Contre-indications vaccinales">
                  <textarea value={form.contreIndications} onChange={e => set('contreIndications', e.target.value)}
                    placeholder="Vaccins contre-indiqués et raisons…" style={{ ...textareaStyle, minHeight: 56 }} />
                </Field>
              </MedSection>

              <MedSection title="Maladies chroniques & Traitements" icon="">
                <Field label="Maladies chroniques">
                  <textarea value={form.maladiesChroniques} onChange={e => set('maladiesChroniques', e.target.value)}
                    placeholder="Diabète, HTA, asthme, insuffisance rénale…" style={textareaStyle} />
                </Field>
                <Field label="Traitement en cours">
                  <textarea value={form.traitementEnCours} onChange={e => set('traitementEnCours', e.target.value)}
                    placeholder="Médicaments actuels, posologie…" style={textareaStyle} />
                </Field>
              </MedSection>

              <MedSection title="Informations administratives" icon="">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="N° CNAS / Sécurité sociale">
                    <input value={form.numeroCNAS} onChange={e => set('numeroCNAS', e.target.value)}
                      placeholder="Ex: 1234567890" style={inputStyle} />
                  </Field>
                  <Field label="Mutuelle / Assurance">
                    <input value={form.mutuelle} onChange={e => set('mutuelle', e.target.value)}
                      placeholder="Ex: CNEP, Mutuelle Générale…" style={inputStyle} />
                  </Field>
                  <Field label="Médecin traitant">
                    <input value={form.medecinTraitant} onChange={e => set('medecinTraitant', e.target.value)}
                      placeholder="Dr. Nom Prénom" style={inputStyle} />
                  </Field>
                </div>
              </MedSection>

              <MedSection title="Notes clinicien" icon="">
                <Field label="Observations libres">
                  <textarea value={form.notesClinicien} onChange={e => set('notesClinicien', e.target.value)}
                    placeholder="Remarques, observations particulières, contexte clinique…"
                    style={{ ...textareaStyle, minHeight: 80 }} />
                </Field>
              </MedSection>
            </div>
          )}
        </div>

        {/* ── Pied de page fixe ── */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white' }}>
          {step === 2 ? (
            <button onClick={() => setStep(1)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 50, border: '1px solid #eaebef', background: 'white', fontWeight: 600, fontSize: 13, color: '#8a94a6', cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Retour
            </button>
          ) : (
            <button onClick={onClose}
              style={{ padding: '10px 18px', borderRadius: 50, border: '1px solid #eaebef', background: 'white', fontWeight: 600, fontSize: 13, color: '#8a94a6', cursor: 'pointer' }}>
              Annuler
            </button>
          )}

          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2].map(n => (
              <div key={n} style={{ width: n === step ? 20 : 6, height: 6, borderRadius: 3, background: n === step ? '#0056ff' : n < step ? '#00c48c' : '#eaebef', transition: 'all .2s' }} />
            ))}
          </div>

          {step === 1 ? (
            <button
              onClick={() => step1Valid && setStep(2)}
              disabled={!step1Valid}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 22px', borderRadius: 50, border: 'none',
                background: step1Valid ? '#0056ff' : '#c5cfe8',
                fontWeight: 700, fontSize: 13, color: 'white',
                cursor: step1Valid ? 'pointer' : 'not-allowed', transition: 'background .15s',
              }}>
              Suivant — Dossier médical
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 22px', borderRadius: 50, border: 'none',
                background: saving ? '#c5cfe8' : '#0056ff',
                fontWeight: 700, fontSize: 13, color: 'white',
                cursor: saving ? 'not-allowed' : 'pointer', transition: 'background .15s',
              }}>
              {saving ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                    style={{ animation: 'spin .7s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Enregistrement…
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {isEditing ? 'Enregistrer' : 'Créer le patient'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Calcul âge ───────────────────────────────────────────────────────────────
function calcAge(dob) {
  if (!dob) return '?';
  return Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 365.25));
}

function getPatientAge(patient) {
  if (patient?.age !== null && patient?.age !== undefined && String(patient.age).trim() !== '') {
    return String(patient.age);
  }
  return calcAge(patient?.dateNaissance);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatDateShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR');
}

// ─── Badge de type vaccin ─────────────────────────────────────────────────────
function VaccinTypeBadge({ type }) {
  const config = {
    rage: { label: 'Anti-Rabique', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
    hepb: { label: 'Hépatite B',   bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    dt:   { label: 'DT',            bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
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

// ─── Ligne de vaccination dépliante ──────────────────────────────────────────
function VaccinRow({ v, index, isLast }) {
  const [open, setOpen] = useState(false);
  const hasProchain = v.dateProchaineDose && new Date(v.dateProchaineDose) > new Date();
  const isOverdue   = v.dateProchaineDose && new Date(v.dateProchaineDose) < new Date();

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #f0f1f5' }}>
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
          transition: 'background .15s',
        }}
        onMouseOver={e => { if (!open) e.currentTarget.style.background = '#fafbff'; }}
        onMouseOut={e => { if (!open) e.currentTarget.style.background = 'transparent'; }}
      >
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: '#f0f1f5', color: '#8a94a6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800,
        }}>
          {index + 1}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <VaccinTypeBadge type={v.type} />
            {v.dose && <span style={{ fontSize: 11, color: '#8a94a6', fontWeight: 600 }}>{v.dose}</span>}
          </div>
          <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 3 }}>{formatDate(v.createdAt)}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {v.dateProchaineDose ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 11, fontWeight: 700,
              color: isOverdue ? '#dc2626' : hasProchain ? '#059669' : '#8a94a6',
              background: isOverdue ? '#fef2f2' : hasProchain ? '#f0fdf4' : '#f8fafc',
              padding: '3px 8px', borderRadius: 6,
            }}>
              {isOverdue ? '⚠️' : '📅'} {formatDateShort(v.dateProchaineDose)}
            </span>
          ) : (
            <span style={{ fontSize: 11, color: '#cbd5e0' }}>Pas de rappel</span>
          )}
        </div>
        <div>
          {v.protocoleData?.erig && (
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9333ea', background: '#faf5ff', border: '1px solid #e9d5ff', padding: '2px 7px', borderRadius: 4 }}>
              ERIG ✓
            </span>
          )}
        </div>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s', flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>

      {open && (
        <div style={{
          padding: '0 20px 16px 68px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12,
          background: '#f8f9ff', borderTop: '1px solid #eef0ff',
        }}>
          {v.type === 'rage' && v.protocoleData?.grade && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 }}>Grade</div>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 600 }}>{v.protocoleData.grade}</div>
            </div>
          )}
          {v.type === 'hepb' && v.protocoleData?.schema && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 }}>Schéma</div>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 600 }}>{v.protocoleData.schema}</div>
            </div>
          )}
          {v.lot && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 }}>N° de lot</div>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 600 }}>{v.lot}</div>
            </div>
          )}
          {v.site && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 }}>Site d'injection</div>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 600 }}>{v.site}</div>
            </div>
          )}
          {v.notes && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
              <div style={{ fontSize: 13, color: '#1d2129', fontWeight: 600 }}>{v.notes}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat Card (détail patient) ───────────────────────────────────────────────
const StatCard = ({ num, label, color = '#0056ff', bg = '#ebf2ff', icon }) => (
  <div style={{
    background: 'white', borderRadius: 14, border: '1px solid #eaebef',
    padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: bg, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
      {icon}
    </div>
    <div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800, color: '#1d2129', lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</div>
    </div>
  </div>
);

// ─── Section Card (détail patient) ───────────────────────────────────────────
const SectionCard = ({ title, icon, children, accent = '#0056ff' }) => (
  <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eaebef', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
    <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5', display: 'flex', alignItems: 'center', gap: 10, background: '#fafbff' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>
        {icon}
      </div>
      <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>{title}</span>
    </div>
    <div style={{ padding: '20px' }}>{children}</div>
  </div>
);

// ─── Info Item (détail patient) ───────────────────────────────────────────────
const InfoItem = ({ label, value, full }) => (
  <div style={{ gridColumn: full ? '1 / -1' : undefined }}>
    <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 13, color: value ? '#1d2129' : '#cbd5e0', fontWeight: value ? 600 : 400 }}>
      {value || '—'}
    </div>
  </div>
);

// ─── Page Détail Patient ──────────────────────────────────────────────────────
function DetailPatient({ patient, onBack, onEdit, onVaccin, onOrdonnance }) {
  const currentYear = String(new Date().getFullYear());
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState('vaccins');

  const age         = getPatientAge(patient);
  const sexeCouleur = patient.sexe === 'M' ? '#0056ff' : '#ec4899';
  const sexeBg      = patient.sexe === 'M' ? '#ebf2ff' : '#fce7f3';
  const initiales   = `${patient.prenom?.[0] || ''}${patient.nom?.[0] || ''}`.toUpperCase();
  const hasMedical  = patient.antecedents || patient.allergies || patient.maladiesChroniques || patient.traitementEnCours;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { setVaccinations(await api.getVaccinations({ patientId: patient.id, year: currentYear })); } catch {}
      setLoading(false);
    })();
  }, [patient.id, currentYear]);

  const vaccsByType = {
    rage: vaccinations.filter(v => v.type === 'rage').length,
    hepb: vaccinations.filter(v => v.type === 'hepb').length,
    dt:   vaccinations.filter(v => v.type === 'dt').length,
  };

  const nextDose = vaccinations
    .filter(v => v.dateProchaineDose && new Date(v.dateProchaineDose) > new Date())
    .sort((a, b) => new Date(a.dateProchaineDose) - new Date(b.dateProchaineDose))[0];

  const TABS = [
    { id: 'vaccins',  label: 'Vaccinations',   count: vaccinations.length },
    { id: 'identite', label: 'Identité',        count: null },
    { id: 'medical',  label: 'Dossier Médical', count: null },
    { id: 'pro',      label: 'Situation Pro.',  count: null },
  ];

  return (
    <div>
      {/* ── Hero Header ── */}
      <div style={{
        background: 'white',
        borderBottom: '1px solid #eaebef',
        padding: '24px 0 0',
        marginBottom: 28,
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Breadcrumb + Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, padding: '0 28px' }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6', fontWeight: 600, fontSize: 13, padding: 0 }}
            onMouseOver={e => e.currentTarget.style.color = '#0056ff'}
            onMouseOut={e => e.currentTarget.style.color = '#8a94a6'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Dossiers Patients
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onVaccin && onVaccin(patient.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 50, border: 'none', background: '#ebf2ff', color: '#0056ff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2l-2 2 4 4 2-2-4-4z"/><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"/><line x1="14" y1="10" x2="4" y2="20"/>
              </svg>
              Nouveau Protocole
            </button>
            <button onClick={() => onOrdonnance && onOrdonnance(patient)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 50, border: 'none', background: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M9 12h6"/><path d="M9 16h6"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
              </svg>
              Ordonnance
            </button>
            <button onClick={() => printDossierVaccinal(patient)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 50, border: '1px solid #eaebef', background: 'white', color: '#64748b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimer
            </button>
            <button onClick={() => onEdit && onEdit(patient)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 50, border: 'none', background: '#0056ff', color: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,86,255,0.25)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
              Modifier
            </button>
          </div>
        </div>

        {/* Identité Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: '0 28px' }}>
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
            <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#1d2129', marginBottom: 6 }}>
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
                  · né{patient.sexe === 'F' ? 'e' : ''} le {formatDate(patient.dateNaissance)}
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
        <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #f0f1f5', padding: '0 16px' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 16px', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #0056ff' : '2px solid transparent',
                color: activeTab === tab.id ? '#0056ff' : '#8a94a6',
                fontWeight: activeTab === tab.id ? 700 : 600,
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                transition: 'all .15s', marginBottom: -1,
              }}>
              {tab.label}
              {tab.count !== null && (
                <span style={{
                  background: activeTab === tab.id ? '#0056ff' : '#eaebef',
                  color: activeTab === tab.id ? 'white' : '#8a94a6',
                  borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 7px', transition: 'all .15s',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenu onglets ── */}

      {/* ══ VACCINATIONS ══ */}
      {activeTab === 'vaccins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            <StatCard num={vaccinations.length} label="Total Certificats" color="#0056ff" bg="#ebf2ff" icon="💉" />
            <StatCard num={vaccsByType.rage}     label="Anti-Rabique"    color="#c2410c" bg="#fff7ed" icon="🐾" />
            <StatCard num={vaccsByType.hepb}     label="Hépatite B"      color="#16a34a" bg="#f0fdf4" icon="🔬" />
            <StatCard num={vaccsByType.dt}        label="DT"              color="#1d4ed8" bg="#eff6ff" icon="🛡️" />
          </div>

          {nextDose && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 28 }}>📅</div>
              <div>
                <div style={{ fontWeight: 800, color: '#166534', fontSize: 13 }}>Prochain rendez-vous vaccinal</div>
                <div style={{ fontSize: 12, color: '#16a34a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <VaccinTypeBadge type={nextDose.type} /> — {formatDate(nextDose.dateProchaineDose)}
                </div>
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #eaebef', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafbff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ebf2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>💉</div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 14, color: '#1d2129' }}>Historique des Vaccinations</span>
              </div>
              <span style={{ fontSize: 12, color: '#8a94a6', fontWeight: 600 }}>Cliquez sur une ligne pour les détails</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>Chargement…</div>
            ) : vaccinations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8a94a6' }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>💉</div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>Aucune vaccination enregistrée</div>
                <div style={{ fontSize: 12 }}>Démarrez un protocole vaccinal pour ce patient.</div>
              </div>
            ) : (
              vaccinations.map((v, i) => (
                <VaccinRow key={v.id || i} v={v} index={i} isLast={i === vaccinations.length - 1} />
              ))
            )}
          </div>
        </div>
      )}

      {/* ══ IDENTITÉ ══ */}
      {activeTab === 'identite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Informations Personnelles" icon="👤">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <InfoItem label="Nom" value={patient.nom} />
              <InfoItem label="Prénom" value={patient.prenom} />
              <InfoItem label="Date de naissance" value={formatDate(patient.dateNaissance)} />
              <InfoItem label="Âge" value={age !== '?' ? `${age} ans` : null} />
              <InfoItem label="Sexe" value={patient.sexe === 'M' ? 'Masculin' : 'Féminin'} />
              <InfoItem label="Poids" value={patient.poids ? `${patient.poids} Kg` : null} />
            </div>
          </SectionCard>
          <SectionCard title="Contact" icon="📞" accent="#059669">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
              <InfoItem label="Téléphone" value={patient.telephone} />
              <InfoItem label="Email" value={patient.email} />
            </div>
          </SectionCard>
          <SectionCard title="Résidence & Adresse" icon="📍" accent="#7c3aed">
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
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              ⚠️ Aucune information médicale renseignée pour ce patient.
            </div>
          )}
          <SectionCard title="Antécédents & Allergies" icon="🩺" accent="#dc2626">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <InfoItem label="Antécédents médicaux" value={patient.antecedents} full />
              <InfoItem label="Allergies connues" value={patient.allergies} full />
              <InfoItem label="Contre-indications vaccinales" value={patient.contreIndications} full />
            </div>
          </SectionCard>
          <SectionCard title="Maladies chroniques & Traitements" icon="💊" accent="#d97706">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <InfoItem label="Maladies chroniques" value={patient.maladiesChroniques} full />
              <InfoItem label="Traitement en cours" value={patient.traitementEnCours} full />
            </div>
          </SectionCard>
          <SectionCard title="Mode de Vie" icon="🌿" accent="#16a34a">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <InfoItem label="Tabagisme" value={
                patient.fumeur === 'non'    ? 'Non-fumeur' :
                patient.fumeur === 'ancien' ? 'Ancien fumeur' :
                patient.fumeur === 'oui'    ? 'Fumeur actif' : null
              } />
              <InfoItem label="Alcool" value={
                patient.alcool === 'non'         ? 'Non' :
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
          <SectionCard title="Informations Administratives" icon="📋" accent="#0891b2">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              <InfoItem label="N° CNAS" value={patient.numeroCNAS} />
              <InfoItem label="Mutuelle" value={patient.mutuelle} />
              <InfoItem label="Médecin traitant" value={patient.medecinTraitant} />
            </div>
          </SectionCard>
          {patient.notesClinicien && (
            <SectionCard title="Notes Clinicien" icon="📝" accent="#8b5cf6">
              <InfoItem label="Observations libres" value={patient.notesClinicien} full />
            </SectionCard>
          )}
        </div>
      )}

      {/* ══ SITUATION PRO ══ */}
      {activeTab === 'pro' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionCard title="Situation Professionnelle" icon="💼" accent="#0056ff">
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
  );
}

// ─── Page Patients (principale) ───────────────────────────────────────────────
export default function Patients({ setPage, setSelectedPatient }) {
  const currentYear = String(new Date().getFullYear());
  const [patients, setPatients]                         = useState([]);
  const [search, setSearch]                             = useState('');
  const [modal, setModal]                               = useState(null);
  const [detailPatient, setDetailPatient]               = useState(null);
  const [vaccinModalPatientId, setVaccinModalPatientId] = useState(null);
  const [ordonnancePatient, setOrdonnancePatient]       = useState(null);
  const [loading, setLoading]                           = useState(true);

  const load = async () => {
    setLoading(true);
    const hasSearch = search.trim().length > 0;
    const data = await api.getPatients(search, hasSearch ? {} : { year: currentYear });
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, currentYear]);

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce patient et l\'intégralité de son carnet vaccinal ?')) {
      await api.deletePatient(id);
      load();
    }
  };

  // ── Vue Détail ──
  if (detailPatient) {
    return (
      <>
        <DetailPatient
          patient={detailPatient}
          onBack={() => setDetailPatient(null)}
          onEdit={(p) => { setDetailPatient(null); setModal(p); }}
          onVaccin={(id) => setVaccinModalPatientId(id)}
          onOrdonnance={(p) => setOrdonnancePatient(p)}
        />

        {ordonnancePatient && (
          <OrdonnanceModal
            patient={ordonnancePatient}
            onClose={() => setOrdonnancePatient(null)}
          />
        )}

        {vaccinModalPatientId && (
          <VaccinModal
            initialPatientId={vaccinModalPatientId}
            patients={patients}
            onClose={() => setVaccinModalPatientId(null)}
            onSave={() => { setVaccinModalPatientId(null); setPage('vaccinations'); }}
          />
        )}
      </>
    );
  }

  // ── Vue Liste ──
  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>Dossiers Patients</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>Gérez les carnets vaccinaux et les informations démographiques détaillées.</p>
        </div>
        <button onClick={() => setModal('create')}
          style={{ background: '#0056ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
            <line x1="22" y1="12" x2="16" y2="12"/>
            <line x1="19" y1="9" x2="19" y2="15"/>
          </svg>
          Nouveau Patient
        </button>
      </div>

      <div className="card" style={{ border: 'none', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Annuaire Global ({patients.length})</h3>
          <div style={{ position: 'relative', width: '350px' }}>
            <svg style={{ position: 'absolute', left: 16, top: 10, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" placeholder="Rechercher par nom, téléphone ou email…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 42px', borderRadius: '50px', border: '1px solid #eaebef', background: '#f4f5f9', outline: 'none', fontSize: 13, width: '100%', color: '#1d2129' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>Chargement…</div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a94a6', background: '#f4f5f9', borderRadius: '12px' }}>
            Aucun dossier patient ne correspond à vos critères.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  {['Dossier','Démographie','Contact','Lieu','Actions Rapides'].map(h => (
                    <th key={h} style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: h === 'Actions Rapides' ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => {
                  const initiales   = `${p.prenom[0]}${p.nom[0]}`.toUpperCase();
                  const age         = `${getPatientAge(p)} ans`;
                  const sexeCouleur = p.sexe === 'M' ? '#0056ff' : '#ec4899';
                  const sexeBg      = p.sexe === 'M' ? '#ebf2ff' : '#fce7f3';
                  const hasMedical  = p.antecedents || p.allergies || p.maladiesChroniques || p.traitementEnCours;

                  return (
                    <tr key={p.id}
                      style={{ borderBottom: i < patients.length - 1 ? '1px solid #eaebef' : 'none', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#fcfcfd'}
                      onMouseOut={e => e.currentTarget.style.background = 'white'}>

                      {/* Dossier */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: sexeBg, color: sexeCouleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 15 }}>
                              {initiales}
                            </div>
                            {hasMedical && (
                              <div title="Dossier médical renseigné" style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: '50%', background: '#00c48c', border: '2px solid white' }} />
                            )}
                          </div>
                          <div>
                            {/* Nom cliquable → ouvre le détail */}
                            <div
                              onClick={() => setDetailPatient(p)}
                              style={{ fontWeight: 800, color: '#1d2129', fontSize: 14, cursor: 'pointer', transition: 'color .15s' }}
                              onMouseOver={e => e.currentTarget.style.color = '#0056ff'}
                              onMouseOut={e => e.currentTarget.style.color = '#1d2129'}
                            >
                              {p.nom} {p.prenom}
                            </div>
                            <div style={{ display: 'inline-block', fontSize: 10, color: '#0056ff', background: '#ebf2ff', padding: '2px 8px', borderRadius: '4px', marginTop: 4, fontFamily: 'monospace', fontWeight: 600 }}>
                              ID: {p.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Démographie */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ color: '#1d2129', fontWeight: 600, fontSize: 13 }}>{age}</div>
                        <div style={{ color: sexeCouleur, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{p.sexe === 'M' ? 'Homme' : 'Femme'}</div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ color: '#1d2129', fontSize: 13, fontWeight: 500 }}>{p.telephone || 'Non renseigné'}</div>
                        <div style={{ color: '#8a94a6', fontSize: 12, marginTop: 2 }}>{p.email || ''}</div>
                      </td>

                      {/* Lieu */}
                      <td style={{ padding: '16px 8px', color: '#8a94a6', fontSize: 13 }}>
                        {p.adresse || '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>

                          {/* Voir le dossier */}
                          <button onClick={() => setDetailPatient(p)}
                            style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Voir le dossier complet">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                          </button>

                          {/* Nouveau protocole */}
                          <button onClick={() => setVaccinModalPatientId(p.id)}
                            style={{ background: '#ebf2ff', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#0056ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Démarrer un Protocole">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 2l-2 2 4 4 2-2-4-4z"/><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"/><line x1="14" y1="10" x2="4" y2="20"/>
                            </svg>
                          </button>

                          {/* Ordonnance */}
                          <button onClick={() => setOrdonnancePatient(p)}
                            style={{ background: '#f0fdf4', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Ordonnance médicale">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h6"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
                            </svg>
                          </button>

                          {/* Imprimer carnet */}
                          <button onClick={() => printDossierVaccinal(p)}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Imprimer le carnet vaccinal">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                            </svg>
                          </button>

                          {/* Modifier */}
                          <button onClick={() => setModal(p)}
                            style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Modifier le dossier">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </button>

                          {/* Supprimer */}
                          <button onClick={() => handleDelete(p.id)}
                            style={{ background: 'transparent', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                            onMouseOut={e => e.currentTarget.style.color = '#cbd5e1'}
                            title="Supprimer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <PatientModal
          patient={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {ordonnancePatient && (
        <OrdonnanceModal
          patient={ordonnancePatient}
          onClose={() => setOrdonnancePatient(null)}
        />
      )}

      {vaccinModalPatientId && (
        <VaccinModal
          initialPatientId={vaccinModalPatientId}
          patients={patients}
          onClose={() => setVaccinModalPatientId(null)}
          onSave={() => { setVaccinModalPatientId(null); setPage('vaccinations'); }}
        />
      )}
    </div>
  );
}
