import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import VaccinModal from '../components/VaccinModal';
import OrdonnanceModal from '../components/OrdonnanceModal';
import algeriaData from '../data/algeria.json';

// ─── Impression : Dossier Patient ────────────────────────────────────────────
function printDossierPatient(patient) {
  const age = patient.dateNaissance
    ? Math.floor((Date.now() - new Date(patient.dateNaissance)) / (1000 * 60 * 60 * 24 * 365.25))
    : '?';

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

    @media print {
      .page { padding:12mm 16mm; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
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
        ${patient.groupeSanguin ? `<span class="badge">Gr. ${patient.groupeSanguin}</span>` : ''}
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
      <div class="info-item"><label>Groupe sanguin</label><span>${patient.groupeSanguin || '—'}</span></div>
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
  try {
    vaccinations = await api.getVaccinations({ patientId: patient.id });
  } catch {}

  const age = patient.dateNaissance
    ? Math.floor((Date.now() - new Date(patient.dateNaissance)) / (1000 * 60 * 60 * 24 * 365.25))
    : '?';

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
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
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

    @media print {
      .page { padding:10mm 14mm; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-left">
      <h1>Carnet Vaccinal Officiel</h1>
      <div class="sub">Service de Medecine Preventive — SEMEP / VacciTrack</div>
    </div>
    <div class="header-right">
      <strong>Imprime le ${new Date().toLocaleDateString('fr-FR', { day:'2-digit', month:'long', year:'numeric' })}</strong>
      Document confidentiel — usage medical
    </div>
  </div>

  <div class="patient-block">
    <div>
      <h2>${patient.prenom} ${patient.nom}</h2>
      <div class="meta">N° Dossier : ${patient.id}</div>
      <div class="tags">
        <span class="tag">${patient.sexe === 'M' ? 'Masculin' : 'Feminin'}</span>
        <span class="tag">${age} ans</span>
        ${patient.groupeSanguin ? `<span class="tag">Gr. ${patient.groupeSanguin}</span>` : ''}
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
    : `<table>
    <thead>
      <tr>
        <th style="width:28px;">N°</th>
        <th>Date</th>
        <th>Type de Vaccin</th>
        <th>Dose</th>
        <th>Details</th>
        <th>Prochaine Dose</th>
        <th>Serum (ERIG)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`}

  <div class="footer">
    <div>VacciTrack — Systeme de Gestion Vaccinale | Document genere automatiquement. SEMEP.</div>
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

  const w = window.open('', '_blank', 'width=950,height=750');
  w.document.write(html);
  w.document.close();
}

// ─── Fin des Fonctions d'Impression ──────────────────────────────────────────

const EMPTY = {
  nom: '', prenom: '', dateNaissance: '', sexe: 'M',
  telephone: '', email: '', 
  wilaya: '', daira: '', commune: '', adressePrecise: '',
  groupeSanguin: 'A+', poids: '', fonction: '', service: '',
  profession: '', instruction: ''
};


const GROUPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function PatientModal({ patient, onClose, onSave }) {
  const [form, setForm] = useState(patient || EMPTY);
  const [age, setAge] = useState('');

  const wilayas = algeriaData.wilayas;
  const selectedWilaya = wilayas.find(w => w.name === form.wilaya);
  const dairas = selectedWilaya?.dairas || [];
  const selectedDaira = dairas.find(d => d.name === form.daira);
  const communes = selectedDaira?.communes || [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Calcul automatique de l'âge
  useEffect(() => {
    if (form.dateNaissance) {
      const birthDate = new Date(form.dateNaissance);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      setAge(calculatedAge >= 0 ? `${calculatedAge} ans` : '');
    } else {
      setAge('');
    }
  }, [form.dateNaissance]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Génération de l'ID structuré pour un nouveau patient
    // Format: DOB(YYYYMMDD)-RegDate(YYYYMMDD)-RAND
    if (!patient?.id) {
      const dob = form.dateNaissance.replace(/-/g, '');
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      form.id = `${dob}-${today}-${rand}`;
      
      // Stockage de l'adresse concaténée pour la compatibilité affichage
      form.adresse = `${form.commune}, ${form.daira}, ${form.wilaya} (${form.adressePrecise})`;
    }

    if (patient?.id) {
      await api.updatePatient(patient.id, form);
    } else {
      await api.createPatient(form);
    }
    onSave();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(29, 33, 41, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '650px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1d2129' }}>{patient?.id ? 'Modifier un Patient' : 'Nouveau Patient'}</h2>
            {age && <span style={{ background: '#ebf2ff', color: '#0056ff', padding: '4px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: 800 }}>Âge calculé : {age}</span>}
          </div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6' }} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Prénom *</label>
              <input required value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Ex: Ahmed" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Nom *</label>
              <input required value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Ex: Benali" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Date de naissance *</label>
              <input type="date" required value={form.dateNaissance} onChange={e => set('dateNaissance', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Sexe</label>
              <select value={form.sexe} onChange={e => set('sexe', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Téléphone</label>
              <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="05XXXXXXXX" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Groupe sanguin</label>
              <select value={form.groupeSanguin} onChange={e => set('groupeSanguin', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }}>
                {GROUPES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Email (facultatif)</label>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@exemple.com" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
          </div>

          <div style={{ border: '1px solid #eaebef', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-10px', left: '16px', background: 'white', padding: '0 8px', fontSize: '11px', fontWeight: 800, color: '#0056ff' }}>RÉSIDENCE & ADRESSE</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '4px' }}>Wilaya *</label>
                <select required value={form.wilaya} onChange={e => { set('wilaya', e.target.value); set('daira', ''); set('commune', ''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '13px' }}>
                  <option value="">Sélectionner...</option>
                  {wilayas.map(w => <option key={w.id} value={w.name}>{w.id} - {w.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '4px' }}>Daïra *</label>
                <select required value={form.daira} onChange={e => { set('daira', e.target.value); set('commune', ''); }} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '13px' }} disabled={!form.wilaya}>
                  <option value="">Sélectionner...</option>
                  {dairas.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '4px' }}>Commune *</label>
                <select required value={form.commune} onChange={e => set('commune', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '13px' }} disabled={!form.daira}>
                  <option value="">Sélectionner...</option>
                  {communes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '4px' }}>Adresse précise (Rue, Quartier, N°)</label>
              <input value={form.adressePrecise} onChange={e => set('adressePrecise', e.target.value)} placeholder="Ex: Cité 500 logements, Batiment A..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '13px', background: '#f4f5f9' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Poids (Kg)</label>
              <input type="number" step="0.1" value={form.poids} onChange={e => set('poids', e.target.value)} placeholder="Ex: 70" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Fonction</label>
              <input value={form.fonction} onChange={e => set('fonction', e.target.value)} placeholder="Infirmier, etc." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Service</label>
              <input value={form.service} onChange={e => set('service', e.target.value)} placeholder="SEMEP, Urgences..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Profession</label>
              <input value={form.profession} onChange={e => set('profession', e.target.value)} placeholder="Enseignant, Commerçant..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' }}>Niveau d'instruction</label>
              <select value={form.instruction} onChange={e => set('instruction', e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' }}>
                <option value="">Sélectionner...</option>
                <option value="Analphabète">Analphabète</option>
                <option value="Primaire">Primaire</option>
                <option value="Moyen">Moyen</option>
                <option value="Secondaire">Secondaire</option>
                <option value="Universitaire">Universitaire</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#8a94a6' }}>Annuler</button>
            <button type="submit" style={{ padding: '12px 24px', borderRadius: '50px', border: 'none', background: '#0056ff', fontWeight: 700, cursor: 'pointer', color: 'white' }}>
              {patient?.id ? 'Enregistrer les modifications' : 'Créer le patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function calcAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export default function Patients({ setPage, setSelectedPatient }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | patient obj
  const [vaccinModalPatientId, setVaccinModalPatientId] = useState(null);
  const [ordonnancePatient, setOrdonnancePatient] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = await api.getPatients(search);
    setPatients(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce patient et l\'intégralité de son carnet vaccinal ?')) {
      await api.deletePatient(id);
      load();
    }
  };

  return (
    <div>
      {/* HEADER TYPE WECARE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>Dossiers Patients</h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>Gérez les carnets vaccinaux et les informations démographiques détaillées.</p>
        </div>
        <button onClick={() => setModal('create')} style={{ background: '#0056ff', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '50px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,86,255,0.2)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle><line x1="22" y1="12" x2="16" y2="12"></line><line x1="19" y1="9" x2="19" y2="15"></line></svg>
          Nouveau Patient
        </button>
      </div>

      <div className="card" style={{ border: 'none', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {/* Barre de recherche intégrée dans la carte, style "Appointments" */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Annuaire Global ({patients.length})</h3>
          <div style={{ position: 'relative', width: '350px' }}>
            <svg style={{ position: 'absolute', left: 16, top: 10, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Rechercher par nom, téléphone ou email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '10px 16px 10px 42px', borderRadius: '50px', border: '1px solid #eaebef', background: '#f4f5f9', outline: 'none', fontSize: 13, width: '100%', color: '#1d2129' }} 
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#8a94a6' }}>Chargement...</div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#8a94a6', background: '#f4f5f9', borderRadius: '12px' }}>
            Aucun dossier patient ne correspond à vos critères.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dossier</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Démographie</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sang</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lieu</th>
                  <th style={{ padding: '16px 8px', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions Rapides</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((p, i) => {
                  const initiales = `${p.prenom[0]}${p.nom[0]}`.toUpperCase();
                  const age = p.dateNaissance ? `${calcAge(p.dateNaissance)} ans` : '?';
                  const sexeCouleur = p.sexe === 'M' ? '#0056ff' : '#ec4899';
                  const sexeBg = p.sexe === 'M' ? '#ebf2ff' : '#fce7f3';
                  
                  return (
                    <tr key={p.id} style={{ borderBottom: i < patients.length-1 ? '1px solid #eaebef' : 'none', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#fcfcfd'} onMouseOut={e=>e.currentTarget.style.background='white'}>
                      {/* Name / Avatar */}
                      <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: sexeBg, color: sexeCouleur, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 15 }}>
                          {initiales}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#1d2129', fontSize: 14 }}>{p.nom} {p.prenom}</div>
                          <div style={{ display: 'inline-block', fontSize: 10, color: '#0056ff', background: '#ebf2ff', padding: '2px 8px', borderRadius: '4px', marginTop: 4, fontFamily: 'monospace', fontWeight: 600 }}>ID: {p.id}</div>
                        </div>
                      </td>
                      
                      {/* Age / Sex */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ color: '#1d2129', fontWeight: 600, fontSize: 13 }}>{age}</div>
                        <div style={{ color: sexeCouleur, fontSize: 11, fontWeight: 700, marginTop: 4 }}>{p.sexe === 'M' ? 'Homme' : 'Femme'}</div>
                      </td>

                      {/* Blood type */}
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ background: '#f4f5f9', color: '#1d2129', padding: '4px 10px', borderRadius: '6px', fontSize: 12, fontWeight: 800 }}>
                          {p.groupeSanguin}
                        </span>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ color: '#1d2129', fontSize: 13, fontWeight: 500 }}>{p.telephone || 'Non renseigné'}</div>
                        <div style={{ color: '#8a94a6', fontSize: 12, marginTop: 2 }}>{p.email || ''}</div>
                      </td>

                      {/* Address */}
                      <td style={{ padding: '16px 8px', color: '#8a94a6', fontSize: 13 }}>
                        {p.adresse || '—'}
                      </td>

                      {/* Actions */}

                      <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                          
                          {/* VACCINER - Action Principale */}
                          <button onClick={() => setVaccinModalPatientId(p.id)} style={{ background: '#ebf2ff', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#0056ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Démarrer un Protocole">
                             <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l-2 2 4 4 2-2-4-4z"></path><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"></path><line x1="14" y1="10" x2="4" y2="20"></line></svg>
                          </button>

                          {/* ORDONNANCE */}
                          <button onClick={() => setOrdonnancePatient(p)} style={{ background: '#f0fdf4', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Ordonnance médicale">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h6"/><path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>
                          </button>

                          {/* IMPRIMER (Menu unique) */}
                          <button onClick={() => printDossierVaccinal(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Imprimer le carnet officiel">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                          </button>
                          
                          {/* DOSSIER / MODIFIER */}
                          <button onClick={() => setModal(p)} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Dossier & Modification">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                          </button>

                          {/* SUPPRIMER (Discret) */}
                          <button onClick={() => handleDelete(p.id)} style={{ background: 'transparent', border: 'none', borderRadius: '8px', width: '34px', height: '34px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#ef4444'} onMouseOut={e=>e.currentTarget.style.color='#cbd5e1'} title="Supprimer">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

