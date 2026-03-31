import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '6px',
  border: '1px solid #d1d5db', outline: 'none', fontSize: '13px',
  background: '#f9fafb', color: '#1d2129', fontFamily: 'inherit'
};
const labelStyle = {
  fontSize: '11px', fontWeight: 700, color: '#6b7280', display: 'block',
  marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px'
};
const sectionTitleStyle = {
  fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase',
  letterSpacing: '0.8px', marginBottom: '12px', paddingBottom: '6px',
  borderBottom: '1px solid #e5e7eb'
};

export default function OrdonnanceModal({ patient, onClose }) {
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    medecin: '',
    medicaments: [{ nom: '', dosage: '', duree: '', instructions: '' }],
    observations: '',
    diagnostic: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getOrdonnances(patient.id);
      setOrdonnances(data);
    } catch {
      setOrdonnances([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [patient.id]);

  const addMedicament = () => {
    setForm(f => ({
      ...f,
      medicaments: [...f.medicaments, { nom: '', dosage: '', duree: '', instructions: '' }]
    }));
  };

  const removeMedicament = (idx) => {
    setForm(f => ({ ...f, medicaments: f.medicaments.filter((_, i) => i !== idx) }));
  };

  const updateMedicament = (idx, field, value) => {
    setForm(f => {
      const meds = [...f.medicaments];
      meds[idx] = { ...meds[idx], [field]: value };
      return { ...f, medicaments: meds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createOrdonnance({ ...form, patientId: patient.id });
      await load();
      setShowForm(false);
      setForm({
        date: new Date().toISOString().slice(0, 10),
        medecin: '',
        medicaments: [{ nom: '', dosage: '', duree: '', instructions: '' }],
        observations: '',
        diagnostic: ''
      });
    } catch {
      alert('Erreur lors de l\'enregistrement');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette ordonnance ?')) {
      await api.deleteOrdonnance(id);
      load();
    }
  };

  const printOrdonnance = (ord) => {
    const age = patient.dateNaissance
      ? Math.floor((Date.now() - new Date(patient.dateNaissance)) / (1000 * 60 * 60 * 24 * 365.25)) + ' ans'
      : '—';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Ordonnance Medicale - ${patient.prenom} ${patient.nom}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'DM Sans',sans-serif; color:#111827; background:#fff; font-size:13px; }
    .page { width:210mm; min-height:297mm; padding:18mm 20mm; margin:0 auto; background:white; }

    /* EN-TETE */
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; padding-bottom:14px; border-bottom:2px solid #1d2129; }
    .header-left h1 { font-family:'Syne',sans-serif; font-size:18px; font-weight:800; color:#1d2129; text-transform:uppercase; letter-spacing:1px; }
    .header-left .subtitle { font-size:11px; color:#6b7280; margin-top:3px; font-weight:500; }
    .header-right { text-align:right; }
    .header-right .doc-ref { font-size:10px; color:#6b7280; font-family:monospace; }
    .header-right .doc-date { font-size:12px; font-weight:700; color:#1d2129; margin-top:4px; }

    /* IDENTITE PATIENT */
    .patient-section { background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px; padding:12px 16px; margin-bottom:16px; display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .patient-section .field label { font-size:9px; font-weight:700; color:#9ca3af; text-transform:uppercase; letter-spacing:0.5px; display:block; }
    .patient-section .field span { font-size:12px; font-weight:600; color:#1d2129; }
    .patient-section .field.full { grid-column:span 2; }

    /* SECTIONS */
    .section { margin-bottom:16px; }
    .section-title { font-size:10px; font-weight:800; color:#374151; text-transform:uppercase; letter-spacing:0.8px; padding:5px 0; border-bottom:1px solid #e5e7eb; margin-bottom:10px; }

    /* DIAGNOSTIC */
    .diag-box { border-left:3px solid #374151; padding:8px 12px; background:#f9fafb; font-size:13px; font-weight:500; }

    /* TABLE MEDICAMENTS */
    .med-table { width:100%; border-collapse:collapse; }
    .med-table thead tr { background:#1d2129; color:white; }
    .med-table th { padding:8px 10px; text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
    .med-table td { padding:9px 10px; border-bottom:1px solid #e5e7eb; font-size:12px; vertical-align:top; }
    .med-table tbody tr:nth-child(even) { background:#f9fafb; }
    .med-num { font-weight:800; color:#374151; }
    .med-name { font-weight:700; color:#1d2129; }
    .med-dosage { font-weight:600; color:#374151; }
    .med-note { font-style:italic; color:#6b7280; font-size:11px; }

    /* OBSERVATIONS */
    .obs-box { background:#f9fafb; border:1px solid #e5e7eb; padding:10px 14px; border-radius:4px; font-size:12px; line-height:1.6; }

    /* SIGNATURE */
    .footer { margin-top:32px; display:flex; justify-content:space-between; align-items:flex-end; }
    .footer-note { font-size:10px; color:#9ca3af; max-width:200px; line-height:1.5; }
    .signature-area { text-align:center; }
    .stamp-box { border:1px solid #9ca3af; border-radius:4px; width:180px; height:50px; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:#6b7280; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; }
    .sign-line { border-top:1px solid #374151; width:180px; margin:0 auto; padding-top:6px; font-size:11px; color:#6b7280; text-align:center; }

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
      <h1>Ordonnance Medicale</h1>
      <div class="subtitle">Service de Medecine Preventive — SEMEP / VacciTrack</div>
    </div>
    <div class="header-right">
      <div class="doc-ref">Ref : ORD-${ord.id?.slice(0, 8).toUpperCase()}</div>
      <div class="doc-date">${new Date(ord.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
    </div>
  </div>

  <div class="patient-section">
    <div class="field">
      <label>Patient</label>
      <span>${patient.prenom} ${patient.nom}</span>
    </div>
    <div class="field">
      <label>N° Dossier</label>
      <span style="font-family:monospace; font-size:11px;">${patient.id}</span>
    </div>
    <div class="field">
      <label>Date de naissance</label>
      <span>${patient.dateNaissance ? new Date(patient.dateNaissance).toLocaleDateString('fr-FR') : '—'} (${age})</span>
    </div>
    <div class="field">
      <label>Sexe / Groupe sanguin</label>
      <span>${patient.sexe === 'M' ? 'Masculin' : 'Feminin'} / ${patient.groupeSanguin || '—'}</span>
    </div>
    <div class="field full">
      <label>Adresse</label>
      <span>${patient.adresse || '—'}</span>
    </div>
  </div>

  ${ord.diagnostic ? `
  <div class="section">
    <div class="section-title">Diagnostic / Motif de consultation</div>
    <div class="diag-box">${ord.diagnostic}</div>
  </div>` : ''}

  <div class="section">
    <div class="section-title">Medicaments Prescrits</div>
    <table class="med-table">
      <thead>
        <tr>
          <th style="width:30px;">N°</th>
          <th>Designation du Medicament</th>
          <th>Dosage / Posologie</th>
          <th>Duree</th>
          <th>Instructions</th>
        </tr>
      </thead>
      <tbody>
        ${(ord.medicaments || []).map((m, i) => `
        <tr>
          <td class="med-num">${i + 1}</td>
          <td><div class="med-name">${m.nom || '—'}</div></td>
          <td><div class="med-dosage">${m.dosage || '—'}</div></td>
          <td>${m.duree || '—'}</td>
          <td class="med-note">${m.instructions || '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>

  ${ord.observations ? `
  <div class="section">
    <div class="section-title">Observations et Recommandations</div>
    <div class="obs-box">${ord.observations}</div>
  </div>` : ''}

  <div class="footer">
    <div class="footer-note">
      Document confidentiel. Valable pour la date indiquee.<br/>
      Systeme de gestion vaccinale VacciTrack — SEMEP.
    </div>
    <div class="signature-area">
      <div class="stamp-box">Cachet du Medecin</div>
      <div class="sign-line">Dr. ${ord.medecin || '________________________________'}</div>
    </div>
  </div>

</div>
<script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(html);
    w.document.close();
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(17,24,39,0.5)', display: 'flex', alignItems: 'center',
      justifyContent: 'center', zIndex: 1100
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'white', borderRadius: '10px', padding: '28px',
        width: '100%', maxWidth: '720px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid #e5e7eb'
      }}>

        {/* EN-TETE MODAL */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <div>
            <h2 style={{ fontFamily: 'Syne', fontSize: '17px', fontWeight: 800, color: '#1d2129', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ordonnances
            </h2>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>
              {patient.prenom} {patient.nom} &mdash; {ordonnances.length} ordonnance(s) enregistree(s)
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={() => setShowForm(f => !f)}
              style={{
                background: showForm ? '#f3f4f6' : '#1d2129',
                color: showForm ? '#374151' : 'white',
                border: '1px solid ' + (showForm ? '#d1d5db' : '#1d2129'),
                padding: '8px 16px', borderRadius: '6px', fontWeight: 700,
                cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                {showForm
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>}
              </svg>
              {showForm ? 'Annuler' : 'Nouvelle Ordonnance'}
            </button>
            <button onClick={onClose} style={{
              background: 'none', border: '1px solid #d1d5db', borderRadius: '6px',
              width: '34px', height: '34px', cursor: 'pointer', color: '#6b7280',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* FORMULAIRE */}
        {showForm && (
          <form onSubmit={handleSubmit} style={{
            background: '#f9fafb', border: '1px solid #e5e7eb',
            borderRadius: '8px', padding: '20px', marginBottom: '20px'
          }}>
            <div style={{ ...sectionTitleStyle, marginBottom: '16px' }}>
              Saisie de l'ordonnance
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Medecin prescripteur</label>
                <input value={form.medecin} onChange={e => setForm(f => ({ ...f, medecin: e.target.value }))} placeholder="Dr. Nom Prenom" style={inputStyle} />
              </div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Diagnostic / Motif de consultation (facultatif)</label>
              <input value={form.diagnostic} onChange={e => setForm(f => ({ ...f, diagnostic: e.target.value }))} placeholder="Ex : Infection respiratoire, Hypertension..." style={inputStyle} />
            </div>

            {/* MEDICAMENTS */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Medicaments Prescrits</label>
                <button type="button" onClick={addMedicament} style={{
                  background: 'white', color: '#374151', border: '1px solid #d1d5db',
                  borderRadius: '5px', padding: '4px 12px', fontSize: '11px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.4px'
                }}>
                  + Ajouter un medicament
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {form.medicaments.map((m, idx) => (
                  <div key={idx} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        Medicament {idx + 1}
                      </span>
                      {form.medicaments.length > 1 && (
                        <button type="button" onClick={() => removeMedicament(idx)} style={{
                          background: 'none', color: '#ef4444', border: '1px solid #fca5a5',
                          borderRadius: '4px', padding: '2px 10px', fontSize: '11px', cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}>
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '10px' }}>Designation</label>
                        <input value={m.nom} onChange={e => updateMedicament(idx, 'nom', e.target.value)} placeholder="Amoxicilline 500mg..." style={{ ...inputStyle, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '10px' }}>Dosage / Posologie</label>
                        <input value={m.dosage} onChange={e => updateMedicament(idx, 'dosage', e.target.value)} placeholder="3x/jour" style={{ ...inputStyle, padding: '8px 12px' }} />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: '10px' }}>Duree</label>
                        <input value={m.duree} onChange={e => updateMedicament(idx, 'duree', e.target.value)} placeholder="7 jours" style={{ ...inputStyle, padding: '8px 12px' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ ...labelStyle, fontSize: '10px' }}>Instructions particulieres (facultatif)</label>
                      <input value={m.instructions} onChange={e => updateMedicament(idx, 'instructions', e.target.value)} placeholder="A prendre avec les repas, eviter l'alcool..." style={{ ...inputStyle, padding: '8px 12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Observations et recommandations (facultatif)</label>
              <textarea value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} placeholder="Repos conseille, prochain rendez-vous..." rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: '1.6' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
              <button type="button" onClick={() => setShowForm(false)} style={{
                padding: '9px 20px', borderRadius: '6px', border: '1px solid #d1d5db',
                background: 'white', fontWeight: 600, cursor: 'pointer', color: '#6b7280',
                fontSize: '12px', fontFamily: 'inherit'
              }}>
                Annuler
              </button>
              <button type="submit" disabled={saving} style={{
                padding: '9px 20px', borderRadius: '6px', border: 'none',
                background: '#1d2129', fontWeight: 700, cursor: 'pointer', color: 'white',
                fontSize: '12px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {saving ? 'Enregistrement...' : 'Enregistrer l\'ordonnance'}
              </button>
            </div>
          </form>
        )}

        {/* LISTE DES ORDONNANCES */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af', fontSize: '13px' }}>
            Chargement...
          </div>
        ) : ordonnances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9ca3af', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <svg style={{ color: '#d1d5db', marginBottom: '12px' }} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 12h6"/><path d="M9 16h6"/><path d="M9 8h6"/>
              <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/>
            </svg>
            <div style={{ fontWeight: 700, fontSize: '14px', color: '#374151', marginBottom: '4px' }}>Aucune ordonnance</div>
            <div style={{ fontSize: '12px' }}>Cliquez sur "Nouvelle Ordonnance" pour en creer une.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ordonnances.map(ord => (
              <div key={ord.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 16px', background: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#1d2129' }}>
                      {new Date(ord.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                    {ord.medecin && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                        Dr. {ord.medecin}
                      </div>
                    )}
                    {ord.diagnostic && (
                      <div style={{ fontSize: '11px', color: '#374151', background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '2px 10px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>
                        {ord.diagnostic}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => printOrdonnance(ord)} style={{
                      background: 'white', color: '#374151', border: '1px solid #d1d5db',
                      borderRadius: '5px', padding: '5px 12px', cursor: 'pointer',
                      fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center',
                      gap: '5px', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.4px'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="6 9 6 2 18 2 18 9"/>
                        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                        <rect x="6" y="14" width="12" height="8"/>
                      </svg>
                      Imprimer
                    </button>
                    <button onClick={() => handleDelete(ord.id)} style={{
                      background: 'none', color: '#9ca3af', border: '1px solid #e5e7eb',
                      borderRadius: '5px', padding: '5px 8px', cursor: 'pointer'
                    }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
                {(ord.medicaments || []).filter(m => m.nom).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '4px' }}>
                    {(ord.medicaments || []).filter(m => m.nom).map((m, i) => (
                      <span key={i} style={{
                        background: '#f3f4f6', color: '#374151', padding: '3px 10px',
                        borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        border: '1px solid #e5e7eb'
                      }}>
                        {m.nom}{m.dosage && ` — ${m.dosage}`}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
