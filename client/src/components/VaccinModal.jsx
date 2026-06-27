import React, { useState, useEffect } from 'react';

import { API_BASE, api } from '../utils/api';
import { useI18n } from '../i18n';

export const PROTOCOLES = {
  rage: { label: 'Anti-Rabique', grades: ['Grade I', 'Grade II', 'Grade III'] },
  hepb: {
    label: 'Hepatite B',
    schemas: [
      { id: 'standard',   label: 'Standard',    desc: '0 - 1 - 6 mois',              doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J180)', 'Rappel'] },
      { id: 'renforce',   label: 'Renforce',    desc: '0 - 1 - 2 - 12 mois',         doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J60)', 'D4 (J360)', 'Rappel'] },
      { id: 'accelere',   label: 'Accelere',    desc: '0 - 7 - 21 jours',            doses: ['D1 (J0)', 'D2 (J7)', 'D3 (J21)', 'Rappel (12 mois)'] },
      { id: 'dialyse',    label: 'Dialyse',     desc: '0 - 1 - 2 - 6 mois (double)', doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J60)', 'D4 (J180)', 'Rappel'] },
      { id: 'nouveau_ne', label: 'Nouveau-ne',  desc: 'Des la naissance',             doses: ['D1 (Naissance)', 'D2 (J30)', 'D3 (J60)', 'Rappel'] },
    ]
  },
  dt: {
    label: 'dT',
    schemas: ['Primo-vaccination', 'Rappel 10 ans', 'Grossesse']
  },
  grippe: {
    label: 'Grippe Saisonniere',
    souches: ['Trivalent', 'Quadrivalent'],
  },
  pneumo: {
    label: 'Pneumocoque',
    types: ['PCV13 (Prevenar 13)', 'PCV15 (Vaxneuvance)', 'PCV20 (Apexxnar)', 'PPV23 (Pneumovax)'],
    schemas: ['Dose unique', '2 doses', '3 doses', 'Rattrapage', 'Rappel'],
  },
  meningo: {
    label: 'Meningocoque',
    types: ['MenACWY (Nimenrix / Menveo)', 'MenB (Bexsero / Trumenba)', 'Men C conjugue'],
    schemas: ['Dose unique', '2 doses', 'Rattrapage', 'Rappel'],
  },
};

const VOIES = ['Intra-musculaire', 'Sous-cutanee', 'Intra-dermique', 'Intra-nasale'];

const calcDoseSerum = (poids) => {
  const p = parseFloat(poids);
  if (!p || p <= 0) return '';
  return ((p * 40) / 200).toFixed(2);
};

const calcDoseSerumUI = (poids) => {
  const p = parseFloat(poids);
  if (!p || p <= 0) return '';
  return (p * 40).toFixed(0);
};

const toggleArrayValue = (list = [], value, checked) => {
  const current = Array.isArray(list) ? list : [];
  return checked ? [...current, value] : current.filter(item => item !== value);
};

const formatPatientLabel = (patient = {}) => {
  const identity = [patient.prenom, patient.nom].filter(Boolean).join(' ').trim() || 'Patient sans nom';
  const details = [];
  if (patient.age) details.push(`${patient.age} ans`);
  if (patient.sexe) details.push(patient.sexe);
  if (patient.telephone) details.push(patient.telephone);
  return details.length ? `${identity} - ${details.join(' - ')}` : identity;
};

const inputStyle = {
  width: '100%', padding: '10px 14px', borderRadius: '8px',
  border: '1px solid #eaebef', outline: 'none', fontSize: '13px',
  background: '#f8f9fb', color: '#1d2129', transition: 'border .15s',
  boxSizing: 'border-box',
};
const selectStyle   = { ...inputStyle, cursor: 'pointer' };
const textareaStyle = { ...inputStyle, resize: 'vertical', minHeight: 72, fontFamily: 'inherit' };
const labelStyle    = { fontSize: '11px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.4px' };

const Field = ({ label, required, children, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
    <label style={labelStyle}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
    {children}
  </div>
);

const StepCard = ({ label, color = '#0056ff', children }) => (
  <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px', position: 'relative', background: 'white' }}>
    <span style={{
      position: 'absolute', top: -10, left: 14, background: 'white',
      padding: '0 6px', fontSize: 10, fontWeight: 800, color,
      textTransform: 'uppercase', letterSpacing: '.4px'
    }}>{label}</span>
    {children}
  </div>
);

const SectionBox = ({ title, icon, color = '#0056ff', children }) => (
  <div style={{ border: '1px solid #eaebef', borderRadius: 14, overflow: 'hidden', marginBottom: 2, background: 'white' }}>
    <div style={{ background: `${color}0d`, borderBottom: '1px solid #eaebef', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
      {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
      <span style={{ fontWeight: 800, fontSize: 12, color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>{title}</span>
    </div>
    <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      {children}
    </div>
  </div>
);

const CheckRow = ({ checked, onChange, label }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer', marginBottom: 4 }}>
    <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      style={{ width: 15, height: 15, accentColor: '#0056ff', cursor: 'pointer' }} />
    {label}
  </label>
);

const RadioGroup = ({ options, value, onChange, color = '#0056ff' }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {options.map(opt => {
      const v = typeof opt === 'string' ? opt : opt.id;
      const l = typeof opt === 'string' ? opt : opt.label;
      const active = value === v;
      return (
        <button key={v} type="button" onClick={() => onChange(v)} style={{
          padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          border: `1.5px solid ${active ? color : '#e2e8f0'}`,
          background: active ? color + '18' : 'white',
          color: active ? color : '#8a94a6', transition: 'all .15s',
        }}>{l}</button>
      );
    })}
  </div>
);

const StepBadge = ({ num, label, active, done, onClick }) => (
  <div onClick={done ? onClick : undefined} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: done ? 'pointer' : 'default' }}>
    <div style={{
      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800,
      background: done ? '#8a94a6' : active ? '#0056ff' : '#eaebef',
      color: done || active ? 'white' : '#8a94a6', transition: 'all .2s',
    }}>
      {done ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ) : num}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#0056ff' : '#8a94a6' }}>Etape {num}</div>
      <div style={{ fontSize: 11, color: '#8a94a6' }}>{label}</div>
    </div>
  </div>
);

// -- Utilitaire: ajouter N jours � une date ISO -----------------------------
function addDays(isoDate, n) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// -- Calcul automatique des dates VAR depuis J0 -----------------------------
function computeAutoVARDates(j0, varType, cellulProtocole, grade, existingManuel = {}) {
  const dates = {};

  if (varType === 'cellulaire') {
    if (cellulProtocole === 'ZAGREB') {
      const labels = ['J0 (2 Doses)', 'J7', 'J21'];
      const offsets = { 'J0 (2 Doses)': 0, 'J7': 7, 'J21': 21 };
      labels.forEach(l => {
        dates[l] = existingManuel[l] ? undefined : addDays(j0, offsets[l]);
      });
    } else {
      // ESSEN
      const base = { 'J0': 0, 'J3': 3, 'J7': 7, 'J14': 14 };
      const extra = grade === 'Grade III'
        ? { 'J24': 24, 'J34': 34, 'J90': 90 }
        : { 'J29': 29, 'J90': 90 };
      const all = { ...base, ...extra };
      Object.entries(all).forEach(([l, n]) => {
        dates[l] = existingManuel[l] ? undefined : addDays(j0, n);
      });
    }
  } else {
    // Tissulaire
    const base = { 'J0': 0, 'J1': 1, 'J2': 2, 'J3': 3, 'J4': 4, 'J5': 5, 'J6': 6, 'J10': 10, 'J14': 14, 'J90': 90 };
    const extra = grade === 'Grade III'
      ? { 'J24': 24, 'J34': 34 }
      : { 'J29': 29 };
    const all = { ...base, ...extra };
    Object.entries(all).forEach(([l, n]) => {
      dates[l] = existingManuel[l] ? undefined : addDays(j0, n);
    });
  }

  return dates;
}

function getNextRageDoseDate(dateAdministration, datesVAR = {}) {
  const baseDate = String(dateAdministration || '').slice(0, 10);
  if (!baseDate) return '';

  return Object.values(datesVAR)
    .map(value => String(value || '').slice(0, 10))
    .filter(Boolean)
    .filter(value => value > baseDate)
    .sort()[0] || '';
}

// -- MPVI ---------------------------------------------------------------------
function MpviSection({ data = {}, onChange }) {
  const u = (k, v) => onChange({ ...data, [k]: v });
  return (
    <div style={{ border: '1px solid #e0e7ff', borderRadius: 14, overflow: 'hidden', marginBottom: 2 }}>
      <div style={{ background: '#ebf2ff', borderBottom: '1px solid #e0e7ff', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 800, fontSize: 12, color: '#0056ff', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          MPVI - Manifestations Post-Vaccinales Indesirables
        </span>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0056ff', marginBottom: 10 }}>Effets indesirables MINEURS</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {['oui','non'].map(val => (
              <button key={val} type="button" onClick={() => u('mpviMineur', val)} style={{
                padding: '8px 24px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${data.mpviMineur === val ? '#0056ff' : '#e2e8f0'}`,
                background: data.mpviMineur === val ? '#ebf2ff' : 'white',
                color: data.mpviMineur === val ? '#0056ff' : '#8a94a6',
              }}>{val === 'oui' ? 'Oui' : 'Non'}</button>
            ))}
          </div>
          {data.mpviMineur === 'oui' && (
            <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 10, padding: '14px' }}>
              <label style={labelStyle}>Type(s) d'effet mineur</label>
              <input style={inputStyle} placeholder="Saisir le ou les types mineurs"
                value={Array.isArray(data.mpviMineurTypes) ? data.mpviMineurTypes.join(', ') : (data.mpviMineurTypes || '')}
                onChange={e => u('mpviMineurTypes', e.target.value)} />
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0056ff', marginBottom: 10 }}>Effets indesirables MAJEURS</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {['oui','non'].map(val => (
              <button key={val} type="button" onClick={() => u('mpviMajeur', val)} style={{
                padding: '8px 24px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${data.mpviMajeur === val ? '#0056ff' : '#e2e8f0'}`,
                background: data.mpviMajeur === val ? '#ebf2ff' : 'white',
                color: data.mpviMajeur === val ? '#0056ff' : '#8a94a6',
              }}>{val === 'oui' ? 'Oui' : 'Non'}</button>
            ))}
          </div>
          {data.mpviMajeur === 'oui' && (
            <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 10, padding: '14px' }}>
              <label style={labelStyle}>Type(s) d'effet majeur</label>
              <input style={inputStyle} placeholder="Saisir le ou les types majeurs"
                value={Array.isArray(data.mpviMajeurTypes) ? data.mpviMajeurTypes.join(', ') : (data.mpviMajeurTypes || '')}
                onChange={e => u('mpviMajeurTypes', e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- GRIPPE --------------------------------------------------------------------
function GrippeSection({ grippe, setGrippe }) {
  const uG = (k, v) => setGrippe(p => ({ ...p, [k]: v }));
  const currentYear = new Date().getFullYear();
  const nextYear    = currentYear + 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Antigrippal Saisonnier" color="#0056ff">
        <Field label="Saison vaccinale" required span={2}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[`${currentYear-1}-${currentYear}`, `${currentYear}-${nextYear}`, `${nextYear}-${nextYear+1}`].map(s => (
              <button key={s} type="button" onClick={() => uG('saison', s)} style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${grippe.saison === s ? '#0056ff' : '#e2e8f0'}`,
                background: grippe.saison === s ? '#ebf2ff' : 'white',
                color: grippe.saison === s ? '#0056ff' : '#8a94a6',
              }}>{s}</button>
            ))}
          </div>
        </Field>
        <Field label="Type de vaccin" required span={2}>
          <RadioGroup options={PROTOCOLES.grippe.souches} value={grippe.souche || ''} onChange={v => uG('souche', v)} color="#0056ff" />
        </Field>
        <Field label="Marque / DCI"><input style={inputStyle} placeholder="Vaxigrip, Influvac..." value={grippe.marque || ''} onChange={e => uG('marque', e.target.value)} /></Field>
        <Field label="N de Lot"><input style={inputStyle} value={grippe.lot || ''} onChange={e => uG('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={grippe.peremption || ''} onChange={e => uG('peremption', e.target.value)} /></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="0.5 ml" value={grippe.dose || '0.5'} onChange={e => uG('dose', e.target.value)} /></Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={grippe.voie || 'Intra-musculaire'} onChange={e => uG('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Site d'injection">
          <select style={selectStyle} value={grippe.site || ''} onChange={e => uG('site', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>Deltoide droit</option><option>Deltoide gauche</option>
            <option>Face anterolaterale cuisse droite</option><option>Face anterolaterale cuisse gauche</option>
          </select>
        </Field>
        <Field label="Indication / Population cible" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Personnel de sante','Sujet age >= 65 ans','Maladie chronique','Immunodeprime','Femme enceinte','Enfant 6-59 mois','Entourage nourrisson','Pelerins (Hadj/Omra)','Autre'].map(ind => (
              <CheckRow key={ind} checked={(grippe.indications||[]).includes(ind)}
                onChange={checked => { const arr = grippe.indications||[]; uG('indications', checked ? [...arr,ind] : arr.filter(x=>x!==ind)); }} label={ind} />
            ))}
          </div>
        </Field>
        <Field label="1ere vaccination antigrippale ?" span={2}>
          <RadioGroup options={[{id:'oui',label:'Oui (1ere fois)'},{id:'non',label:'Non (deja vaccine)'}]}
            value={grippe.premiereVaccination||''} onChange={v => uG('premiereVaccination', v)} color="#0056ff" />
        </Field>
        {grippe.premiereVaccination === 'non' && (
          <Field label="Annee de la derniere vaccination" span={2}>
            <input style={inputStyle} placeholder={`Ex: ${currentYear - 1}`} value={grippe.derniereVaccination||''} onChange={e => uG('derniereVaccination', e.target.value)} />
          </Field>
        )}
        <Field label="Medecin"><input style={inputStyle} value={grippe.medecin||''} onChange={e => uG('medecin', e.target.value)} /></Field>
        <Field label="Observations"><textarea style={{...textareaStyle,minHeight:56}} value={grippe.observations||''} onChange={e => uG('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={grippe.mpvi||{}} onChange={mpvi => uG('mpvi', mpvi)} />
    </div>
  );
}

// -- PNEUMOCOQUE ---------------------------------------------------------------
function PneumoSection({ pneumo, setPneumo }) {
  const uP = (k, v) => setPneumo(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Anti-Pneumococcique" color="#0056ff">
        <Field label="Type de vaccin" required span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROTOCOLES.pneumo.types.map(t => (
              <button key={t} type="button" onClick={() => uP('typeVaccin', t)} style={{
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${pneumo.typeVaccin === t ? '#0056ff' : '#e2e8f0'}`,
                background: pneumo.typeVaccin === t ? '#ebf2ff' : 'white',
                fontSize: 12, fontWeight: 700, color: pneumo.typeVaccin === t ? '#0056ff' : '#374151',
              }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Schema vaccinal" span={2}>
          <RadioGroup options={PROTOCOLES.pneumo.schemas} value={pneumo.schema||''} onChange={v => uP('schema', v)} color="#0056ff" />
        </Field>
        <Field label="Numero de dose">
          <select style={selectStyle} value={pneumo.numeroDose||''} onChange={e => uP('numeroDose', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>1ere dose</option><option>2eme dose</option><option>3eme dose</option><option>Rappel</option>
          </select>
        </Field>
        <Field label="N de Lot"><input style={inputStyle} value={pneumo.lot||''} onChange={e => uP('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={pneumo.peremption||''} onChange={e => uP('peremption', e.target.value)} /></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="0.5 ml" value={pneumo.dose||'0.5'} onChange={e => uP('dose', e.target.value)} /></Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={pneumo.voie||'Intra-musculaire'} onChange={e => uP('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Site d'injection">
          <select style={selectStyle} value={pneumo.site||''} onChange={e => uP('site', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>Deltoide droit</option><option>Deltoide gauche</option>
            <option>Face anterolatrale cuisse droite</option><option>Face anterolatrale cuisse gauche</option>
          </select>
        </Field>
        <Field label="Indication" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Nourrisson (programme)','Sujet age >= 65 ans','Asplenie / splenectomie','Immunodepression','Insuffisance renale chronique','Diabete','Insuffisance respiratoire','Drepanocytose','Autre'].map(ind => (
              <CheckRow key={ind} checked={(pneumo.indications||[]).includes(ind)}
                onChange={checked => { const arr = pneumo.indications||[]; uP('indications', checked ? [...arr,ind] : arr.filter(x=>x!==ind)); }} label={ind} />
            ))}
          </div>
        </Field>
        <Field label="Calendrier des doses" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['D1','D2','D3','Rappel (12 mois)','Rappel (5 ans)'].map(d => (
              <div key={d}>
                <label style={{...labelStyle,color:'#0056ff',marginBottom:4}}>{d}</label>
                <input style={inputStyle} type="date" value={pneumo.dates?.[d]||''} onChange={e => uP('dates', {...pneumo.dates,[d]:e.target.value})} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Medecin"><input style={inputStyle} value={pneumo.medecin||''} onChange={e => uP('medecin', e.target.value)} /></Field>
        <Field label="Observations"><textarea style={{...textareaStyle,minHeight:56}} value={pneumo.observations||''} onChange={e => uP('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={pneumo.mpvi||{}} onChange={mpvi => uP('mpvi', mpvi)} />
    </div>
  );
}

// -- MENINGOCOQUE --------------------------------------------------------------
function MeningoSection({ meningo, setMeningo }) {
  const uM = (k, v) => setMeningo(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Anti-Meningococcique" color="#0056ff">
        <Field label="Type de vaccin" required span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROTOCOLES.meningo.types.map(t => (
              <button key={t} type="button" onClick={() => uM('typeVaccin', t)} style={{
                padding: '9px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${meningo.typeVaccin === t ? '#0056ff' : '#e2e8f0'}`,
                background: meningo.typeVaccin === t ? '#ebf2ff' : 'white',
                fontSize: 12, fontWeight: 700, color: meningo.typeVaccin === t ? '#0056ff' : '#374151',
              }}>{t}</button>
            ))}
          </div>
        </Field>
        <Field label="Schema vaccinal" span={2}>
          <RadioGroup options={PROTOCOLES.meningo.schemas} value={meningo.schema||''} onChange={v => uM('schema', v)} color="#0056ff" />
        </Field>
        <Field label="Marque / DCI"><input style={inputStyle} placeholder="Nimenrix, Menveo, Bexsero..." value={meningo.marque||''} onChange={e => uM('marque', e.target.value)} /></Field>
        <Field label="N de Lot"><input style={inputStyle} value={meningo.lot||''} onChange={e => uM('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={meningo.peremption||''} onChange={e => uM('peremption', e.target.value)} /></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="0.5 ml" value={meningo.dose||'0.5'} onChange={e => uM('dose', e.target.value)} /></Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={meningo.voie||'Intra-musculaire'} onChange={e => uM('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Numero de dose">
          <select style={selectStyle} value={meningo.numeroDose||''} onChange={e => uM('numeroDose', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>1ere dose</option><option>2eme dose</option><option>Rappel</option>
          </select>
        </Field>
        <Field label="Indication" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Programme national nourrisson','Asplenie','Immunodepression','Pelerins Hadj / Omra','Voyage en zone endemique','Contact cas confirme','Etudiant (primo-arrivant)','Adolescent (rappel)','Autre'].map(ind => (
              <CheckRow key={ind} checked={(meningo.indications||[]).includes(ind)}
                onChange={checked => { const arr = meningo.indications||[]; uM('indications', checked ? [...arr,ind] : arr.filter(x=>x!==ind)); }} label={ind} />
            ))}
          </div>
        </Field>
        <Field label="Calendrier des doses" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['D1','D2','Rappel'].map(d => (
              <div key={d}>
                <label style={{...labelStyle,color:'#0056ff',marginBottom:4}}>{d}</label>
                <input style={inputStyle} type="date" value={meningo.dates?.[d]||''} onChange={e => uM('dates', {...meningo.dates,[d]:e.target.value})} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Medecin"><input style={inputStyle} value={meningo.medecin||''} onChange={e => uM('medecin', e.target.value)} /></Field>
        <Field label="Observations"><textarea style={{...textareaStyle,minHeight:56}} value={meningo.observations||''} onChange={e => uM('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={meningo.mpvi||{}} onChange={mpvi => uM('mpvi', mpvi)} />
    </div>
  );
}

// -- RAGE SECTION --------------------------------------------------------------
function RageSection({ rage, setRage, patient }) {
  const uR = (k, v) => setRage(p => ({ ...p, [k]: v }));

  useEffect(() => {
    const poids = rage.erigPoidsPatient || patient?.poids;
    if (!poids) return;
    const doseCalculee     = calcDoseSerum(poids);
    const doseTheoriqueUI  = calcDoseSerumUI(poids);
    setRage(prev => (
      prev.erigDoseCalculee === doseCalculee && prev.erigDoseTheoriqueUI === doseTheoriqueUI
        ? prev
        : { ...prev, erigDoseCalculee: doseCalculee, erigDoseTheoriqueUI: doseTheoriqueUI }
    ));
  }, [rage.erigPoidsPatient, patient?.poids]);

  const doseLabelsGradeII  = ['J0','J1','J2','J3','J4','J5','J6','J10','J14','J29','J90'];
  const doseLabelsGradeIII = ['J0','J1','J2','J3','J4','J5','J6','J10','J14','J24','J34','J90'];
  const doseLabelsZagreb   = ['J0 (2 Doses)','J7','J21'];
  const doseLabelsEssen    = ['J0','J3','J7','J14'];
  const cellDoses = rage.cellulProtocole === 'ZAGREB' ? doseLabelsZagreb : doseLabelsEssen;
  const tissDoses = rage.grade === 'Grade III' ? doseLabelsGradeIII : doseLabelsGradeII;
  const doseDates = rage.varType === 'cellulaire' ? cellDoses : tissDoses;

  const handleVARDateChange = (label, value, isJ0) => {
    const currentDates  = { ...(rage.datesVAR    || {}) };
    const currentManuel = { ...(rage.datesVARManuel || {}) };

    if (isJ0) {
      currentDates[label] = value;
      if (value) {
        const auto = computeAutoVARDates(value, rage.varType, rage.cellulProtocole, rage.grade, currentManuel);
        Object.entries(auto).forEach(([l, d]) => {
          if (d !== undefined) currentDates[l] = d;
        });
      }
      setRage(p => ({ ...p, datesVAR: currentDates, datesVARManuel: currentManuel }));
    } else {
      currentDates[label] = value;
      setRage(p => ({ ...p, datesVAR: currentDates }));
    }
  };

  const toggleManuel = (label) => {
    const currentManuel = { ...(rage.datesVARManuel || {}) };
    const isNowManuel   = !currentManuel[label];
    currentManuel[label] = isNowManuel;

    if (!isNowManuel) {
      const j0Label = rage.varType === 'cellulaire' && rage.cellulProtocole === 'ZAGREB'
        ? 'J0 (2 Doses)' : 'J0';
      const j0Val = rage.datesVAR?.[j0Label];
      if (j0Val) {
        const auto = computeAutoVARDates(j0Val, rage.varType, rage.cellulProtocole, rage.grade, currentManuel);
        const newDates = { ...(rage.datesVAR || {}) };
        Object.entries(auto).forEach(([l, d]) => {
          if (d !== undefined && l === label) newDates[l] = d;
        });
        setRage(p => ({ ...p, datesVARManuel: currentManuel, datesVAR: newDates }));
        return;
      }
    }
    setRage(p => ({ ...p, datesVARManuel: currentManuel }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* EXPOSITION & GRADE */}
      <SectionBox title="Exposition et Grade" color="#0056ff">
        <Field label="Grade d'Exposition" required span={2}>
          <RadioGroup options={['Grade I','Grade II','Grade III']} value={rage.grade} onChange={v => uR('grade', v)} color="#0056ff" />
        </Field>
        <Field label="Date d'Exposition">
          <input style={inputStyle} type="date" value={rage.dateExposition||''} onChange={e => uR('dateExposition', e.target.value)} />
        </Field>
        <Field label="Espece animale" required>
          <RadioGroup options={[{id:'chien',label:'Chien'},{id:'chat',label:'Chat'},{id:'autre',label:'Autre'}]}
            value={rage.especeAnimale} onChange={v => uR('especeAnimale', v)} color="#0056ff" />
          {rage.especeAnimale === 'autre' && (
            <input style={{...inputStyle,marginTop:8}} placeholder="Preciser..." value={rage.especeAnimalePrecise||''} onChange={e => uR('especeAnimalePrecise', e.target.value)} />
          )}
        </Field>
        <Field label="Statut de l'animal">
          <CheckRow checked={rage.animalVaccine === true}  onChange={() => uR('animalVaccine', true)}  label="Animal vaccine (carte a l'appui)" />
          <CheckRow checked={rage.animalVaccine === false} onChange={() => uR('animalVaccine', false)} label="Non vaccine / Inconnu" />
        </Field>
        <Field label="Etat de l'animal">
          <select style={selectStyle} value={rage.statutAnimal||''} onChange={e => uR('statutAnimal', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>Vivant / Sous surveillance</option><option>Mort / Fugue</option>
            <option>Enrage confirme</option><option>Inconnu</option>
          </select>
        </Field>
        <Field label="Circonstances">
          <input style={inputStyle} placeholder="Provoquee, non provoquee..." value={rage.circonstancesMorsure||''} onChange={e => uR('circonstancesMorsure', e.target.value)} />
        </Field>
        <Field label="Localisation des plaies" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, padding: '12px 14px', border: '1px solid #eaebef', borderRadius: 8, background: '#f8f9fb' }}>
            {[
              ['tete','Tete'],['face','Face'],['cou','Cou'],['main','Main'],['pied','Pied'],
              ['organes genitaux externes','Organes Genitaux Externes'],
              ['membre(s) superieur(s)','Membre(s) Superieur(s)'],
              ['membre(s) inferieur(s)','Membre(s) Inferieur(s)'],
              ['tronc','Tronc'],
              ['non precise','Non precise']
            ].map(([value, label]) => (
              <CheckRow key={value}
                checked={(rage.localisationPlaies||[]).includes(value)}
                onChange={checked => uR('localisationPlaies', toggleArrayValue(rage.localisationPlaies, value, checked))}
                label={label} />
            ))}
          </div>
          <div style={{ marginTop: 6, fontSize: 11, color: '#8a94a6' }}>Plusieurs localisations peuvent etre selectionnees.</div>
        </Field>
      </SectionBox>

      {/* III.1 SOINS LOCAUX */}
      <SectionBox title="III.1 - Soins Locaux de la Plaie" color="#0056ff">
        <Field label="Soins effectues" span={2}>
          <RadioGroup
            options={[{id:'non',label:'Non'},{id:'oui',label:'Oui, soins locaux effectues'}]}
            value={rage.soinsLocaux ? 'oui' : (rage.soinsLocaux === false ? 'non' : '')}
            onChange={v => uR('soinsLocaux', v === 'oui')}
            color="#0056ff" />
        </Field>
        {rage.soinsLocaux && (
          <>
            <Field label="Type de lavage">
              <CheckRow checked={!!rage.lavageEau}     onChange={v => uR('lavageEau', v)}     label="Lavage a l'eau" />
              <CheckRow checked={!!rage.lavageEauSavon} onChange={v => uR('lavageEauSavon', v)} label="Lavage eau + savon" />
            </Field>
            <Field label="Application de produit(s) - preciser">
              <textarea style={{...textareaStyle, minHeight: 60}}
                placeholder="Ex: Alcool 70, Betadine, Eau oxygenee, Dakin..."
                value={rage.applicationProduit||''} onChange={e => uR('applicationProduit', e.target.value)} />
            </Field>
          </>
        )}
      </SectionBox>

      {/* III.2 ERIG */}
      {rage.grade === 'Grade III' && (
        <SectionBox title="III.2 - Immunoglobulines Anti-Rabiques Equines (ERIG)" color="#0056ff">
          <Field label="ERIG administre" span={2}>
            <RadioGroup
              options={[{id:'non',label:'Non'},{id:'oui',label:'Oui, preciser'}]}
              value={rage.erig ? 'oui' : (rage.erig === false ? 'non' : '')}
              onChange={v => uR('erig', v === 'oui')}
              color="#0056ff" />
          </Field>
          {rage.erig && (
            <>
              <Field label="Date et Heure">
                <input style={inputStyle} type="datetime-local" value={rage.erigDate||''} onChange={e => uR('erigDate', e.target.value)} />
              </Field>
              <Field label="N de Lot">
                <input style={inputStyle} value={rage.erigLot||''} onChange={e => uR('erigLot', e.target.value)} />
              </Field>
              <Field label="Date Peremption">
                <input style={inputStyle} type="date" value={rage.erigPeremption||''} onChange={e => uR('erigPeremption', e.target.value)} />
              </Field>
              <Field label="Titre (IU/ml)">
                <input style={inputStyle} type="number" step="1" value={rage.erigTitre||'200'} onChange={e => uR('erigTitre', e.target.value)} />
              </Field>
              <Field label="Poids du patient (Kg)">
                <input style={inputStyle} type="number" step="0.1" value={rage.erigPoidsPatient||''} onChange={e => uR('erigPoidsPatient', e.target.value)} />
              </Field>
              <Field label="Dose Theorique (IU)">
                <input style={{...inputStyle, background:'#f8f9ff'}} readOnly value={rage.erigDoseTheoriqueUI||'-'} />
              </Field>
              <Field label="Dose Calculee (ml)" span={2}>
                <div style={{ position: 'relative' }}>
                  <input style={{...inputStyle, background:'#ebf2ff', border:'1px solid #e0e7ff', color:'#0056ff', fontWeight:700}} readOnly
                    value={rage.erigDoseCalculee ? `${rage.erigDoseCalculee} ml` : '-- (entrer le poids)'} />
                  <div style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'#0056ff', fontWeight:700 }}>Poids x 40 / 200</div>
                </div>
              </Field>
              <Field label="Quantite Totale (ml)">
                <input style={inputStyle} value={rage.erigQuantiteTotale||''} onChange={e => uR('erigQuantiteTotale', e.target.value)} />
              </Field>
              <Field label="Quantite en Inj IM (ml)">
                <input style={inputStyle} value={rage.erigQuantiteIM||''} onChange={e => uR('erigQuantiteIM', e.target.value)} />
              </Field>
              <Field label="Voies d'Administration des ERIG" span={2}>
                <div style={{ padding: '12px 14px', border: '1px solid #eaebef', borderRadius: 8, background: '#f8f9fb' }}>
                  {[
                    ['Infiltration lesionnelle','Infiltration lesionnelle'],
                    ['Infiltration peri lesion','Infiltration peri lesion'],
                    ['Injection intra musculaire','Injection intra musculaire']
                  ].map(([value, label]) => (
                    <CheckRow key={value}
                      checked={(rage.voiesAdminErig||[]).includes(value)}
                      onChange={checked => uR('voiesAdminErig', toggleArrayValue(rage.voiesAdminErig, value, checked))}
                      label={label} />
                  ))}
                </div>
              </Field>
              <Field label="Nombre de Lesions Infiltrees">
                <input style={inputStyle} type="number" min="0" value={rage.erigNombreLesionsInfiltrees||''} onChange={e => uR('erigNombreLesionsInfiltrees', e.target.value)} />
              </Field>
              <Field label="Methode de Besredka">
                <RadioGroup options={[{id:'non',label:'Non'},{id:'oui',label:'Oui'}]} value={rage.erigBesredka||'non'} onChange={v => uR('erigBesredka', v)} color="#0056ff" />
              </Field>
              <Field label="Dilution des ERIG" span={2}>
                <RadioGroup options={[{id:'non',label:'Non'},{id:'oui',label:'Oui, dilution effectuee'}]} value={rage.erigDilution ? 'oui' : 'non'} onChange={v => uR('erigDilution', v === 'oui')} color="#0056ff" />
              </Field>
              {rage.erigDilution && (
                <>
                  <Field label="Quantite serum physiologique utilisee (ml)">
                    <input style={inputStyle} placeholder="ml" value={rage.erigDilutionSerumQty||''} onChange={e => uR('erigDilutionSerumQty', e.target.value)} />
                  </Field>
                  <Field label="Quantite ERIG diluee et infiltree (ml)">
                    <input style={inputStyle} placeholder="ml" value={rage.erigDilueeInfiltreeTotal||''} onChange={e => uR('erigDilueeInfiltreeTotal', e.target.value)} />
                  </Field>
                </>
              )}
              <Field label="Reaction post ERIG" span={2}>
                <RadioGroup options={[{id:'non',label:'Non'},{id:'oui',label:'Oui'}]} value={rage.erigReaction||'non'} onChange={v => uR('erigReaction', v)} color="#0056ff" />
              </Field>
              {rage.erigReaction === 'oui' && (
                <>
                  <Field label="Si oui, type de reaction" span={2}>
                    <div style={{ padding: '12px 14px', border: '1px solid #eaebef', borderRadius: 8, background: '#f8f9fb' }}>
                      <CheckRow checked={!!rage.erigReactionChoc}    onChange={v => uR('erigReactionChoc', v)}    label="Choc anaphylactique" />
                      <CheckRow checked={!!rage.erigReactionBenigne} onChange={v => uR('erigReactionBenigne', v)} label="Reaction benigne" />
                    </div>
                  </Field>
                  <Field label="Mesures prises vis-a-vis de ces reactions" span={2}>
                    <textarea style={textareaStyle} placeholder="Decrire les mesures prises..." value={rage.erigReactionMesures||''} onChange={e => uR('erigReactionMesures', e.target.value)} />
                  </Field>
                </>
              )}
            </>
          )}
        </SectionBox>
      )}

      {/* Doses dans autre service */}
      <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Doses precedentes administrees dans un autre service ?" span={2}>
          <RadioGroup
            options={[{id:'non',label:'Non'},{id:'oui',label:'Oui'}]}
            value={rage.doseAutreService || 'non'}
            onChange={v => uR('doseAutreService', v)}
            color="#0056ff" />
        </Field>
        {rage.doseAutreService === 'oui' && (
          <Field label="Lieu (service / hopital)" span={2}>
            <input style={inputStyle} placeholder="Ex: CHU Oran - Service infectiologie"
              value={rage.doseAutreServiceLieu || ''} onChange={e => uR('doseAutreServiceLieu', e.target.value)} />
          </Field>
        )}
      </div>

      {/* III.4 SUTURE */}
      <SectionBox title="III.4 - Suture de la / des Plaies" color="#0056ff">
        <Field label="Suture effectuee" span={2}>
          <RadioGroup options={[{id:'non',label:'Non'},{id:'oui',label:'Oui, preciser'}]} value={rage.suture ? 'oui' : (rage.suture === false ? 'non' : '')} onChange={v => uR('suture', v === 'oui')} color="#0056ff" />
        </Field>
        {rage.suture && (
          <Field label="Moment de la suture" span={2}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {["Avant l'infiltration d'ERIG", "Apres l'infiltration d'ERIG"].map(opt => (
                <button key={opt} type="button" onClick={() => uR('sutureDetail', opt)} style={{
                  padding: '8px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  border: `1.5px solid ${rage.sutureDetail === opt ? '#0056ff' : '#e2e8f0'}`,
                  background: rage.sutureDetail === opt ? '#ebf2ff' : 'white',
                  color: rage.sutureDetail === opt ? '#0056ff' : '#8a94a6',
                }}>{opt}</button>
              ))}
            </div>
          </Field>
        )}
      </SectionBox>

      {/* ATD et Antibiotique */}
      <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Vaccin antitetanique et antidipht�rique" span={2}>
          <RadioGroup
            options={[{id:'non',label:'Non'},{id:'oui',label:'Oui'}]}
            value={rage.vaccinATD || 'non'}
            onChange={v => uR('vaccinATD', v)}
            color="#0056ff" />
        </Field>
        <Field label="Antibiotique" span={2}>
          <RadioGroup
            options={[{id:'non',label:'Non'},{id:'oui',label:'Oui'}]}
            value={rage.antibiotique || 'non'}
            onChange={v => uR('antibiotique', v)}
            color="#0056ff" />
        </Field>
        {rage.antibiotique === 'oui' && (
          <Field label="Preciser l'antibiotique" span={2}>
            <input style={inputStyle} placeholder="Ex: Amoxicilline, Augmentin..."
              value={rage.antibiotiqueDetail || ''} onChange={e => uR('antibiotiqueDetail', e.target.value)} />
          </Field>
        )}
      </div>

      {/* III.5 VACCINATION ANTIRABIQUE VAR */}
      <SectionBox title="III.5 - Vaccination Antirabique (VAR)" color="#0056ff">
        <Field label="Type de vaccin" span={2}>
          <RadioGroup
            options={[{id:'tissulaire',label:'Vaccin Tissulaire'},{id:'cellulaire',label:'Vaccin Cellulaire'}]}
            value={rage.varType||'tissulaire'} onChange={v => uR('varType', v)} color="#0056ff" />
        </Field>
        {rage.varType === 'cellulaire' && (
          <Field label="Protocole" span={2}>
            <RadioGroup options={[{id:'ESSEN',label:'ESSEN (5 doses)'},{id:'ZAGREB',label:'ZAGREB (4 doses)'},{id:'INTRADERMIQUE',label:'Intradermique'}]}
              value={rage.cellulProtocole||'ESSEN'} onChange={v => uR('cellulProtocole', v)} color="#0056ff" />
          </Field>
        )}

        <Field label="DCI / Marque">
          <input style={inputStyle} placeholder="Verorab, Rabipur, Imovax..." value={rage.varDCI||''} onChange={e => uR('varDCI', e.target.value)} />
        </Field>
        <Field label="N de Lot">
          <input style={inputStyle} value={rage.varLot||''} onChange={e => uR('varLot', e.target.value)} />
        </Field>
        <Field label="Date de Peremption">
          <input style={inputStyle} type="date" value={rage.varPeremption||''} onChange={e => uR('varPeremption', e.target.value)} />
        </Field>
        <Field label="Dose (ml)">
          <input style={inputStyle} placeholder="0.5 ml" value={rage.varDose||'0.5'} onChange={e => uR('varDose', e.target.value)} />
        </Field>

        <Field label="Voie d'Administration" span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', border: '1px solid #eaebef', borderRadius: 8, background: '#f8f9fb' }}>
            {['Sous cutanees', 'Intradermique', 'Intra musculaire'].map(voie => (
              <CheckRow key={voie}
                checked={rage.varVoieAdmin === voie}
                onChange={checked => uR('varVoieAdmin', checked ? voie : '')}
                label={voie} />
            ))}
          </div>
        </Field>

        {rage.varType === 'tissulaire' && (
          <Field label="Dose de Base (VAR tissulaire)" span={2}>
            <input style={inputStyle} placeholder="Ex: 2 ml, 5 ml..." value={rage.varDoseBase||''} onChange={e => uR('varDoseBase', e.target.value)} />
          </Field>
        )}

        {/* -- Dates d'Administration VAR avec calcul automatique -- */}
        <Field label="Dates d'Administration VAR" span={2}>
          <div style={{ marginBottom: 8, padding: '8px 12px', background: '#f0f4ff', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 11, color: '#0056ff', fontWeight: 600 }}>
            Saisissez J0 pour calculer automatiquement les dates suivantes. Utilisez le bouton Modifier pour ajuster une date manuellement.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 4 }}>
            {doseDates.map((j, idx) => {
              const isJ0      = idx === 0;
              const isManuel  = !isJ0 && !!(rage.datesVARManuel?.[j]);
              const hasValue  = !!(rage.datesVAR?.[j]);
              const isAutoFilled = !isJ0 && !isManuel && hasValue;

              return (
                <div key={j}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{
                      fontSize: '11px', fontWeight: 700,
                      color: isJ0 ? '#1d2129' : isManuel ? '#0056ff' : isAutoFilled ? '#059669' : '#8a94a6',
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                    }}>
                      {j}
                      {isJ0 && (
                        <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, color: '#0056ff', background: '#ebf2ff', padding: '1px 5px', borderRadius: 3 }}>
                          BASE
                        </span>
                      )}
                    </label>

                    {!isJ0 && (
                      <button
                        type="button"
                        onClick={() => toggleManuel(j)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: `1px solid ${isManuel ? '#0056ff' : '#e2e8f0'}`,
                          background: isManuel ? '#ebf2ff' : 'white',
                          color: isManuel ? '#0056ff' : '#8a94a6',
                          fontSize: 10, fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {isManuel ? 'Verrouiller' : 'Modifier'}
                      </button>
                    )}
                  </div>

                  <input
                    type="date"
                    value={rage.datesVAR?.[j] || ''}
                    readOnly={!isJ0 && !isManuel}
                    onChange={e => handleVARDateChange(j, e.target.value, isJ0)}
                    style={{
                      ...inputStyle,
                      background: isJ0
                        ? '#f8f9fb'
                        : isManuel
                          ? '#fff8f0'
                          : isAutoFilled
                            ? '#f0fdf4'
                            : '#f8f9fb',
                      border: isJ0
                        ? '1.5px solid #0056ff'
                        : isManuel
                          ? '1.5px solid #f59e0b'
                          : isAutoFilled
                            ? '1px solid #bbf7d0'
                            : '1px solid #eaebef',
                      color: isJ0 ? '#1d2129' : isManuel ? '#92400e' : isAutoFilled ? '#166534' : '#9ca3af',
                      cursor: (!isJ0 && !isManuel) ? 'default' : 'pointer',
                    }}
                  />

                  {!isJ0 && (
                    <div style={{
                      marginTop: 3, fontSize: 10, fontWeight: 700,
                      color: isManuel ? '#f59e0b' : isAutoFilled ? '#059669' : '#d1d5db',
                    }}>
                      {isManuel ? 'Modifie manuellement' : isAutoFilled ? 'Calcule automatiquement' : 'En attente de J0'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Field>
      </SectionBox>

      {/* INFORMATIONS COMPLEMENTAIRES */}
      <SectionBox title="Informations Complementaires" color="#0056ff">
        <Field label="Medecin">
          <input style={inputStyle} value={rage.medecin||''} onChange={e => uR('medecin', e.target.value)} />
        </Field>
        <Field label="SEMEP / Etablissement">
          <input style={inputStyle} value={rage.semep||''} onChange={e => uR('semep', e.target.value)} />
        </Field>
        <Field label="Observations" span={2}>
          <textarea style={textareaStyle} value={rage.observations||''} onChange={e => uR('observations', e.target.value)} />
        </Field>
      </SectionBox>

      <MpviSection data={rage.mpvi||{}} onChange={mpvi => uR('mpvi', mpvi)} />
    </div>
  );
}

// -- HEPATITE B ----------------------------------------------------------------
function HepbSection({ hepb, setHepb }) {
  const uH = (k, v) => setHepb(p => ({ ...p, [k]: v }));
  const schema = PROTOCOLES.hepb.schemas.find(s => s.id === (hepb.schema||'standard'));
  const doses  = schema?.doses || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Schema de Vaccination Hepatite B" color="#0056ff">
        <Field label="Schema" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {PROTOCOLES.hepb.schemas.map(s => (
              <button key={s.id} type="button" onClick={() => uH('schema', s.id)} style={{
                padding: '10px 12px', borderRadius: 10,
                border: `1.5px solid ${hepb.schema === s.id ? '#0056ff' : '#e2e8f0'}`,
                background: hepb.schema === s.id ? '#ebf2ff' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: hepb.schema === s.id ? '#0056ff' : '#374151' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#8a94a6', marginTop: 2 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Marque"><input style={inputStyle} placeholder="Engerix B, HB Vax Pro..." value={hepb.marque||''} onChange={e => uH('marque', e.target.value)} /></Field>
        <Field label="N de Lot"><input style={inputStyle} value={hepb.lot||''} onChange={e => uH('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={hepb.peremption||''} onChange={e => uH('peremption', e.target.value)} /></Field>
        <Field label="Voie"><select style={selectStyle} value={hepb.voie||'Intra-musculaire'} onChange={e => uH('voie', e.target.value)}>{VOIES.map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="1 ml" value={hepb.doseML||'1'} onChange={e => uH('doseML', e.target.value)} /></Field>
        <Field label="Serologie">
          <select style={selectStyle} value={hepb.serologie||''} onChange={e => uH('serologie', e.target.value)}>
            <option value="">Non effectuee</option>
            <option>Ag HBs negatif</option><option>Ag HBs positif</option><option>Anti-HBs positif</option>
          </select>
        </Field>
        <Field label="Calendrier" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 4 }}>
            {doses.map(d => (
              <div key={d}>
                <label style={{...labelStyle, color:'#0056ff', marginBottom:4}}>{d}</label>
                <input style={inputStyle} type="date" value={hepb.dates?.[d]||''} onChange={e => uH('dates', {...hepb.dates,[d]:e.target.value})} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Medecin"><input style={inputStyle} value={hepb.medecin||''} onChange={e => uH('medecin', e.target.value)} /></Field>
        <Field label="Observations" span={2}><textarea style={textareaStyle} value={hepb.observations||''} onChange={e => uH('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={hepb.mpvi||{}} onChange={mpvi => uH('mpvi', mpvi)} />
    </div>
  );
}

// -- Utilitaire : ajouter N mois � une date ISO ----------------------------
function addMonthsDT(isoDate, months) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
}

// -- Utilitaire : ajouter N ans � une date ISO -----------------------------
function addYearsDT(isoDate, years) {
  if (!isoDate) return '';
  try {
    const d = new Date(isoDate);
    d.setFullYear(d.getFullYear() + years);
    return d.toISOString().slice(0, 10);
  } catch { return ''; }
}

// -- DT SECTION � m�me design de grille que les dates VAR anti-rabiques -------
function DtSection({ dt, setDt }) {
  const uD = (k, v) => setDt(p => ({ ...p, [k]: v }));

  // D�finition des doses avec leur offset de calcul
  const dtDoses = [
    { key: 'D1',     label: '1ere dose',     sublabel: 'Date de debut',  isBase: true,  manualFlag: null },
    { key: 'D2',     label: 'D2',            sublabel: 'D1 + 2 mois',    isBase: false, manualFlag: '_d2Manuel' },
    { key: 'D3',     label: 'D3',            sublabel: 'D1 + 1 an',      isBase: false, manualFlag: '_d3Manuel' },
    { key: 'Rappel', label: 'Rappel',        sublabel: 'D1 + 10 ans',    isBase: false, manualFlag: '_rappelManuel' },
  ];

  // Calcul depuis D1
  const handleD1Change = (value) => {
    const newDates = { ...(dt.dates || {}) };
    newDates.D1 = value;
    if (value) {
      if (!dt._d2Manuel)     newDates.D2     = addMonthsDT(value, 2);
      if (!dt._d3Manuel)     newDates.D3     = addYearsDT(value, 1);
      if (!dt._rappelManuel) newDates.Rappel = addYearsDT(value, 10);
    }
    setDt(p => ({ ...p, dates: newDates }));
  };

  const handleManualChange = (key, value, manualFlag) => {
    setDt(p => ({
      ...p,
      dates: { ...(p.dates || {}), [key]: value },
      [manualFlag]: true,
    }));
  };

  // Basculer entre auto et manuel (m�me logique que VAR: Modifier / Verrouiller)
  const toggleManuelDT = (key, manualFlag) => {
    const isNowManuel = !dt[manualFlag];
    if (!isNowManuel) {
      // Repasser en auto: recalculer depuis D1
      const d1 = dt.dates?.D1 || '';
      const autoVal =
        key === 'D2'     ? addMonthsDT(d1, 2) :
        key === 'D3'     ? addYearsDT(d1, 1)  :
        key === 'Rappel' ? addYearsDT(d1, 10) : '';
      setDt(p => ({
        ...p,
        dates: { ...(p.dates || {}), [key]: autoVal },
        [manualFlag]: false,
      }));
    } else {
      setDt(p => ({ ...p, [manualFlag]: true }));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Protocole DT (Antidipht�rique et Antit�tanique)" color="#0056ff">

        <Field label="Schema" span={2}>
          <RadioGroup
            options={PROTOCOLES.dt.schemas}
            value={dt.schema || 'Primo-vaccination'}
            onChange={v => uD('schema', v)}
            color="#0056ff"
          />
        </Field>

        <Field label="Marque / DCI">
          <input style={inputStyle} placeholder="Ex: Td Vaccin, Revaxis..." value={dt.marque || ''} onChange={e => uD('marque', e.target.value)} />
        </Field>
        <Field label="N de Lot">
          <input style={inputStyle} value={dt.lot || ''} onChange={e => uD('lot', e.target.value)} />
        </Field>
        <Field label="Date de Peremption">
          <input style={inputStyle} type="date" value={dt.peremption || ''} onChange={e => uD('peremption', e.target.value)} />
        </Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={dt.voie || 'Intra-musculaire'} onChange={e => uD('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Dose (ml)">
          <input style={inputStyle} placeholder="0.5 ml" value={dt.doseML || '0.5'} onChange={e => uD('doseML', e.target.value)} />
        </Field>
        <Field label="Derniere vaccination DT">
          <input style={inputStyle} type="date" value={dt.derniereVaccination || ''} onChange={e => uD('derniereVaccination', e.target.value)} />
        </Field>

        <Field label="Contexte de plaie" span={2}>
          <CheckRow checked={!!dt.plaie} onChange={v => uD('plaie', v)} label="Vaccination en contexte de plaie" />
          {dt.plaie && (
            <input
              style={{ ...inputStyle, marginTop: 8 }}
              placeholder="Plaie souill�e, br�lure..."
              value={dt.typePlaie || ''}
              onChange={e => uD('typePlaie', e.target.value)}
            />
          )}
        </Field>
      </SectionBox>

      {/* -- Calendrier vaccinal DT � m�me design que dates VAR -- */}
      <div style={{ border: '1px solid #eaebef', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#ebf2ff', borderBottom: '1px solid #e0e7ff', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#0056ff', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Calendrier Vaccinal dT
          </span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: '#0056ff', fontWeight: 600 }}>
            Saisir D1 pour calculer automatiquement les dates suivantes
          </span>
        </div>

        <div style={{ padding: '18px' }}>
          <div style={{ marginBottom: 10, padding: '8px 12px', background: '#f0f4ff', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 11, color: '#0056ff', fontWeight: 600 }}>
            Saisissez D1 pour calculer automatiquement les dates suivantes. Utilisez le bouton Modifier pour ajuster une date manuellement.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginTop: 4 }}>
            {dtDoses.map(({ key, label, sublabel, isBase, manualFlag }) => {
              const isManuel    = !isBase && !!dt[manualFlag];
              const hasValue    = !!(dt.dates?.[key]);
              const isAutoFilled = !isBase && !isManuel && hasValue;

              return (
                <div key={key}>
                  {/* Entete label + bouton Modifier/Verrouiller */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <label style={{
                      fontSize: '11px', fontWeight: 700,
                      color: isBase ? '#1d2129' : isManuel ? '#0056ff' : isAutoFilled ? '#059669' : '#8a94a6',
                      textTransform: 'uppercase', letterSpacing: '0.4px',
                    }}>
                      {label}
                      {isBase && (
                        <span style={{ marginLeft: 4, fontSize: 9, fontWeight: 700, color: '#0056ff', background: '#ebf2ff', padding: '1px 5px', borderRadius: 3 }}>
                          BASE
                        </span>
                      )}
                    </label>

                    {!isBase && (
                      <button
                        type="button"
                        onClick={() => toggleManuelDT(key, manualFlag)}
                        style={{
                          padding: '2px 8px',
                          borderRadius: 4,
                          border: `1px solid ${isManuel ? '#0056ff' : '#e2e8f0'}`,
                          background: isManuel ? '#ebf2ff' : 'white',
                          color: isManuel ? '#0056ff' : '#8a94a6',
                          fontSize: 10, fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all .15s',
                        }}
                      >
                        {isManuel ? 'Verrouiller' : 'Modifier'}
                      </button>
                    )}
                  </div>

                  {/* Sous-label */}
                  <div style={{ fontSize: 10, color: '#8a94a6', marginBottom: 6 }}>{sublabel}</div>

                  {/* Champ date */}
                  <input
                    type="date"
                    value={dt.dates?.[key] || ''}
                    readOnly={!isBase && !isManuel}
                    onChange={e => {
                      if (isBase) {
                        handleD1Change(e.target.value);
                      } else {
                        handleManualChange(key, e.target.value, manualFlag);
                      }
                    }}
                    style={{
                      ...inputStyle,
                      background: isBase
                        ? '#f8f9fb'
                        : isManuel
                          ? '#fff8f0'
                          : isAutoFilled
                            ? '#f0fdf4'
                            : '#f8f9fb',
                      border: isBase
                        ? '1.5px solid #0056ff'
                        : isManuel
                          ? '1.5px solid #f59e0b'
                          : isAutoFilled
                            ? '1px solid #bbf7d0'
                            : '1px solid #eaebef',
                      color: isBase ? '#1d2129' : isManuel ? '#92400e' : isAutoFilled ? '#166534' : '#9ca3af',
                      cursor: (!isBase && !isManuel) ? 'default' : 'pointer',
                    }}
                  />

                  {/* Indicateur statut (identique VAR) */}
                  {!isBase && (
                    <div style={{
                      marginTop: 3, fontSize: 10, fontWeight: 700,
                      color: isManuel ? '#f59e0b' : isAutoFilled ? '#059669' : '#d1d5db',
                    }}>
                      {isManuel ? 'Modifie manuellement' : isAutoFilled ? 'Calcule automatiquement' : 'En attente de D1'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Medecin & observations */}
      <SectionBox title="Informations complementaires" color="#0056ff">
        <Field label="Medecin">
          <input style={inputStyle} value={dt.medecin || ''} onChange={e => uD('medecin', e.target.value)} placeholder="Nom du medecin prescripteur..." />
        </Field>
        <Field label="Observations">
          <textarea style={{ ...textareaStyle, minHeight: 56 }} value={dt.observations || ''} onChange={e => uD('observations', e.target.value)} />
        </Field>
      </SectionBox>

      <MpviSection data={dt.mpvi || {}} onChange={mpvi => uD('mpvi', mpvi)} />
    </div>
  );
}

// -- COMPOSANT PRINCIPAL -------------------------------------------------------
export default function VaccinModal({ vaccination, patients = [], initialPatientId, onClose, onSave }) {
  const { langue } = useI18n();
  const isEdit = !!vaccination;
  const [step,       setStep]       = useState(1);
  const [saving,     setSaving]     = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [importing,  setImporting]  = useState(false);
  const importInputRef              = React.useRef(null);
  const nextDoseManuelRef           = React.useRef(Boolean(vaccination?.dateProchaineDose));
  const patientSearchRef            = React.useRef(null);

  const [form, setForm] = useState({
    patientId:          vaccination?.patientId          || initialPatientId || '',
    type:               vaccination?.type               || 'rage',
    statut:             vaccination?.statut             || 'complete',
    dateAdministration: vaccination?.dateAdministration?.slice(0,10) || new Date().toISOString().slice(0,10),
    dateProchaineDose:  vaccination?.dateProchaineDose?.slice(0,10)  || '',
  });

  const proto0 = vaccination?.protocoleData || {};
  const [rage,    setRage]    = useState({
    grade: 'Grade II', varType: 'tissulaire', cellulProtocole: 'ESSEN',
    especeAnimale: '', animalVaccine: null,
    localisationPlaies: Array.isArray(proto0.localisationPlaies) ? proto0.localisationPlaies : [],
    voiesAdminErig:     Array.isArray(proto0.voiesAdminErig)     ? proto0.voiesAdminErig     : [],
    erigTitre: '200', erigBesredka: 'non', erigReaction: 'non', chirurgie: 'non',
    suture: false, sutureDetail: '',
    varVoieAdmin: 'Intra musculaire',
    datesVAR: {},
    datesVARManuel: {},
    ...proto0,
  });
  const [hepb,    setHepb]    = useState({ schema: 'standard', voie: 'Intra-musculaire', doseML: '1',   ...proto0 });
  const [dt,      setDt]      = useState({ schema: 'Primo-vaccination', voie: 'Intra-musculaire', doseML: '0.5', ...proto0 });
  const [grippe,  setGrippe]  = useState({ voie: 'Intra-musculaire', dose: '0.5', ...proto0 });
  const [pneumo,  setPneumo]  = useState({ voie: 'Intra-musculaire', dose: '0.5', ...proto0 });
  const [meningo, setMeningo] = useState({ voie: 'Intra-musculaire', dose: '0.5', ...proto0 });

  const [patientQuery, setPatientQuery] = useState('');
  const [patientOptions, setPatientOptions] = useState([]);
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const buildProto = () => ({ rage, hepb, dt, grippe, pneumo, meningo }[form.type] || rage);
  const step1Valid = form.patientId && form.type && form.dateAdministration;
  const selectedPatient = patientOptions.find(p => p.id === form.patientId);
  const normalizedPatientQuery = patientQuery.trim();

  useEffect(() => {
    let cancelled = false;
    setPatientSearchLoading(true);
    api.getPatients('')
      .then((data) => {
        if (!cancelled) setPatientOptions(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setPatientOptions([]);
      })
      .finally(() => {
        if (!cancelled) setPatientSearchLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!form.patientId || selectedPatient || !API_BASE) return;
    let cancelled = false;
    api.getPatient(form.patientId)
      .then(patient => {
        if (!cancelled && patient?.id) {
          setPatientOptions(prev => {
            const exists = prev.some(item => item.id === patient.id);
            return exists ? prev : [patient, ...prev];
          });
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [form.patientId, selectedPatient]);

  useEffect(() => {
    if (!selectedPatient) return;
    const label = formatPatientLabel(selectedPatient);
    setPatientQuery(prev => prev === label ? prev : label);
  }, [selectedPatient]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!patientSearchRef.current?.contains(event.target)) {
        setPatientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setPatientSearchLoading(true);
      try {
        const data = await api.getPatients(normalizedPatientQuery);
        if (!cancelled) setPatientOptions(Array.isArray(data) ? data : []);
      } catch (error) {
        if (!cancelled) setPatientOptions([]);
      } finally {
        if (!cancelled) setPatientSearchLoading(false);
      }
    };
    const timeout = setTimeout(run, normalizedPatientQuery ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [normalizedPatientQuery]);

  useEffect(() => {
    if (form.type !== 'rage') return;
    if (nextDoseManuelRef.current && form.dateProchaineDose) return;

    const nextDate = getNextRageDoseDate(form.dateAdministration, rage.datesVAR);
    setForm(prev => {
      if (prev.type !== 'rage') return prev;
      if ((prev.dateProchaineDose || '') === nextDate) return prev;
      return { ...prev, dateProchaineDose: nextDate };
    });
  }, [form.type, form.dateAdministration, form.dateProchaineDose, rage.datesVAR]);

  const typeConfig = {
    rage:    { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'Anti-Rabique' },
    hepb:    { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'Hepatite B' },
    dt:      { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'DT' },
    grippe:  { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'Grippe' },
    pneumo:  { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'Pneumocoque' },
    meningo: { color: '#0056ff', bg: '#ebf2ff', icon: '', label: 'Meningocoque' },
  };
  const tc    = typeConfig[form.type] || typeConfig.rage;
  const STEPS = [{ label: 'Patient et Type' }, { label: 'Protocole Medical' }, { label: 'Rappel et Resume' }];

  const downloadPDF = async (patientData, vaccinationData, protocoleData, type) => {
    const endpoint = type === 'dt'
      ? `${API_BASE}/api/generate-dt-pdf`
      : `${API_BASE}/api/generate-pdf`;
    const res = await fetch(endpoint, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patient: patientData, vaccination: vaccinationData, protocoleData, type }),
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try { const err = await res.json(); message = err.detail || err.error || message; } catch { message = await res.text(); }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = type === 'dt'
      ? `carte_DT_${patientData?.nom || 'patient'}.pdf`
      : `carte_${type}_${patientData?.nom || 'patient'}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!form.patientId) { alert(langue === 'en' ? 'Select a patient' : 'Selectionnez un patient'); return; }
    setSaving(true);
    const vaccinLabel = {
      rage:    rage.varType === 'cellulaire' ? 'Anti-Rabique Cellulaire' : 'Anti-Rabique Tissulaire',
      hepb:    'Hepatite B', dt: 'DT', grippe: 'Grippe Saisonniere',
      pneumo:  'Pneumocoque', meningo: 'Meningocoque',
    };
    const payload = { ...form, vaccin: vaccinLabel[form.type] || form.type, protocoleData: buildProto() };
    try {
      const url = isEdit
        ? `${API_BASE}/api/vaccinations/${vaccination.id}`
        : `${API_BASE}/api/vaccinations`;
      await fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (form.type === 'dt' && selectedPatient) {
        try {
          await downloadPDF(selectedPatient, payload, buildProto(), form.type);
        } catch (pdfError) {
          console.warn('Erreur lors de la generation automatique du PDF DT:', pdfError.message);
        }
      }
      
      onSave();
    } finally { setSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) { alert(langue === 'en' ? 'Select a patient' : 'Selectionnez un patient'); return; }
    if (form.type !== 'rage' && form.type !== 'dt') { alert(langue === 'en' ? 'PDF card is available only for anti-rabies and DT protocols.' : 'La carte PDF est disponible uniquement pour les protocoles anti-rabique et DT.'); return; }
    setPdfLoading(true);
    try { await downloadPDF(selectedPatient, { ...form }, buildProto(), form.type); }
    catch(e) { alert((langue === 'en' ? 'PDF error: ' : 'Erreur PDF : ') + e.message); }
    finally { setPdfLoading(false); }
  };

  const handleImportFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/import-antirab-upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const result = await res.json();
      alert(
        `Import termine avec succes !\n\n` +
        `Lignes lues       : ${result.totalRows}\n` +
        `Patients importes : ${result.importedPatients}\n` +
        `Vaccinations      : ${result.importedVaccinations}\n` +
        `Lignes ignorees   : ${result.skippedRows}`
      );
      onSave();
    } catch (err) {
      alert(`Erreur import : ${err.message}`);
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,41,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(2px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 800, boxShadow: '0 20px 60px rgba(0,0,0,0.18)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* En-tete */}
        <div style={{ padding: '24px 28px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>
                {isEdit ? (langue === 'en' ? 'Edit Record' : 'Modifier le Registre') : (langue === 'en' ? 'New Vaccination Record' : 'Nouveau Registre Vaccinal')}
              </h2>
              {selectedPatient && (
                <span style={{ background: '#ebf2ff', color: '#0056ff', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {selectedPatient.prenom} {selectedPatient.nom}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input ref={importInputRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={handleImportFileChange} />
              <button
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
                title="Importer une base de donnees Excel (.xlsx)"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 50,
                  border: '1.5px solid #0056ff', background: importing ? '#c5cfe8' : '#ebf2ff',
                  color: '#0056ff', fontWeight: 700, fontSize: 11,
                  cursor: importing ? 'not-allowed' : 'pointer',
                  opacity: importing ? 0.7 : 1,
                  transition: 'all .15s',
                }}
              >
                {importing ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin .7s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Import...
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Importer Excel
                  </>
                )}
              </button>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6', padding: 4 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <StepBadge num={i+1} label={s.label} active={step === i+1} done={step > i+1} onClick={() => step > i+1 && setStep(i+1)} />
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 2, margin: '0 12px', borderRadius: 1, background: step > i+1 ? '#8a94a6' : '#eaebef', transition: 'background .3s' }} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div style={{ height: 1, background: '#f0f1f5', marginLeft: -28, marginRight: -28 }} />
        </div>

        {/* Corps */}
        <div style={{ overflowY: 'auto', padding: '24px 28px', flex: 1 }}>

          {/* ETAPE 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -10, left: 14, background: 'white', padding: '0 6px', fontSize: 10, fontWeight: 800, color: '#0056ff', textTransform: 'uppercase', letterSpacing: '.4px' }}>Patient</span>
                <Field label="Patient" required>
                  <div ref={patientSearchRef} style={{ display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
                    <input
                      style={inputStyle}
                      value={patientQuery}
                      placeholder={langue === 'en' ? 'Search for an existing patient...' : 'Rechercher un patient existant...'}
                      onFocus={() => setPatientDropdownOpen(true)}
                      onChange={e => {
                        setPatientQuery(e.target.value);
                        setPatientDropdownOpen(true);
                        setForm(prev => ({ ...prev, patientId: '' }));
                      }}
                    />
                    {patientDropdownOpen && (
                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% - 2px)',
                        left: 0,
                        right: 0,
                        zIndex: 20,
                        background: 'white',
                        border: '1px solid #dbe3f0',
                        borderRadius: 12,
                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                        maxHeight: 260,
                        overflowY: 'auto',
                      }}>
                        {patientSearchLoading ? (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: '#8a94a6' }}>{langue === 'en' ? 'Searching...' : 'Recherche en cours...'}</div>
                        ) : patientOptions.length === 0 ? (
                          <div style={{ padding: '12px 14px', fontSize: 12, color: '#8a94a6' }}>{langue === 'en' ? 'No patient found in the database' : 'Aucun patient trouve dans la base'}</div>
                        ) : (
                          patientOptions.slice(0, 100).map(patient => (
                            <button
                              key={patient.id}
                              type="button"
                              onClick={() => {
                                setForm(prev => ({ ...prev, patientId: patient.id }));
                                setPatientQuery(formatPatientLabel(patient));
                                setPatientDropdownOpen(false);
                              }}
                              style={{
                                width: '100%',
                                textAlign: 'left',
                                padding: '11px 14px',
                                border: 'none',
                                borderBottom: '1px solid #eef2f7',
                                background: form.patientId === patient.id ? '#ebf2ff' : 'white',
                                cursor: 'pointer',
                                color: '#1d2129',
                                fontSize: 13,
                              }}
                            >
                              {formatPatientLabel(patient)}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: 11, color: '#8a94a6' }}>
                      {patientSearchLoading
                        ? (langue === 'en' ? 'Searching the full database...' : 'Recherche dans toute la base de donnees...')
                        : `${patientOptions.length} patient(s) charge(s) depuis la base`}
                    </div>
                    
                  </div>
                </Field>
              </div>

              <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -10, left: 14, background: 'white', padding: '0 6px', fontSize: 10, fontWeight: 800, color: '#0056ff', textTransform: 'uppercase', letterSpacing: '.4px' }}>Type de Vaccin</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {Object.entries(typeConfig).map(([k, { color, bg, icon, label }]) => (
                    <button key={k} type="button" onClick={() => setForm(p => ({ ...p, type: k }))} style={{
                      padding: '14px 10px', borderRadius: 12, cursor: 'pointer', transition: 'all .15s',
                      border: `2px solid ${form.type === k ? color : '#eaebef'}`,
                      background: form.type === k ? bg : 'white',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    }}>
                      <span style={{ fontSize: 22 }}>{icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 12, color: form.type === k ? color : '#374151' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Field label="Date d'Administration" required>
                  <input style={inputStyle} type="date" value={form.dateAdministration} onChange={e => setForm(p => ({ ...p, dateAdministration: e.target.value }))} />
                </Field>
                <Field label="Statut">
                  <select style={selectStyle} value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}>
                    <option value="complete">Complet</option>
                    <option value="en_cours">En cours</option>
                    <option value="incomplet">Incomplet</option>
                  </select>
                </Field>
              </div>
            </div>
          )}

          {/* ETAPE 2 */}
          {step === 2 && (
            <StepCard label="Protocole medical" color={tc.color}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {form.type === 'rage'    && <RageSection    rage={rage}       setRage={setRage}       patient={selectedPatient} />}
                {form.type === 'hepb'    && <HepbSection    hepb={hepb}       setHepb={setHepb} />}
                {form.type === 'dt'      && <DtSection      dt={dt}           setDt={setDt} />}
                {form.type === 'grippe'  && <GrippeSection  grippe={grippe}   setGrippe={setGrippe} />}
                {form.type === 'pneumo'  && <PneumoSection  pneumo={pneumo}   setPneumo={setPneumo} />}
                {form.type === 'meningo' && <MeningoSection meningo={meningo} setMeningo={setMeningo} />}
              </div>
            </StepCard>
          )}

          {/* ETAPE 3 */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <StepCard label="Resume du protocole" color={tc.color}>
                <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 14, padding: '18px' }}>
                  <div style={{ fontWeight: 800, color: '#0056ff', fontSize: 13, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resume</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      ['Patient', `${selectedPatient?.prenom||'-'} ${selectedPatient?.nom||''}`],
                      ['Type',    tc.label],
                      ['Date',    form.dateAdministration],
                      ['Statut',  form.statut],
                      form.type === 'rage'    ? ['Grade',  rage.grade] : null,
                      form.type === 'rage'    ? ['VAR',    rage.varType === 'cellulaire' ? `Cellulaire / ${rage.cellulProtocole||'ESSEN'}` : 'Tissulaire'] : null,
                      form.type === 'rage'    ? ['Suture', rage.suture ? (rage.sutureDetail || 'Oui') : 'Non'] : null,
                      form.type === 'hepb'    ? ['Schema',  hepb.schema] : null,
                      form.type === 'grippe'  ? ['Saison',  grippe.saison||'-'] : null,
                      form.type === 'pneumo'  ? ['Vaccin',  pneumo.typeVaccin||'-'] : null,
                      form.type === 'meningo' ? ['Vaccin',  meningo.typeVaccin||'-'] : null,
                    ].filter(Boolean).map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#a0aec0', textTransform: 'uppercase' }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2129', marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Resume des dates VAR */}
                  {form.type === 'rage' && Object.keys(rage.datesVAR || {}).length > 0 && (
                    <div style={{ marginTop: 14, borderTop: '1px solid #e0e7ff', paddingTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#0056ff', textTransform: 'uppercase', marginBottom: 8 }}>Calendrier VAR</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                        {Object.entries(rage.datesVAR).filter(([, d]) => d).map(([label, date]) => (
                          <div key={label} style={{ background: rage.datesVARManuel?.[label] ? '#fff8f0' : '#f0fdf4', border: `1px solid ${rage.datesVARManuel?.[label] ? '#fde68a' : '#bbf7d0'}`, borderRadius: 6, padding: '6px 8px' }}>
                            <div style={{ fontSize: 9, fontWeight: 800, color: rage.datesVARManuel?.[label] ? '#92400e' : '#166534', textTransform: 'uppercase' }}>{label}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#1d2129', marginTop: 2 }}>{new Date(date).toLocaleDateString('fr-FR')}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Resume des dates DT */}
                  {form.type === 'dt' && Object.keys(dt.dates || {}).length > 0 && (
                    <div style={{ marginTop: 14, borderTop: '1px solid #e0e7ff', paddingTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#0056ff', textTransform: 'uppercase', marginBottom: 8 }}>Calendrier DT</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                        {Object.entries(dt.dates).filter(([, d]) => d).map(([label, date]) => {
                          const manualKey = label === 'D2' ? '_d2Manuel' : label === 'D3' ? '_d3Manuel' : label === 'Rappel' ? '_rappelManuel' : null;
                          const isManuel = manualKey ? !!dt[manualKey] : false;
                          return (
                            <div key={label} style={{ background: isManuel ? '#fff8f0' : '#f0fdf4', border: `1px solid ${isManuel ? '#fde68a' : '#bbf7d0'}`, borderRadius: 6, padding: '6px 8px' }}>
                              <div style={{ fontSize: 9, fontWeight: 800, color: isManuel ? '#92400e' : '#166534', textTransform: 'uppercase' }}>{label}</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#1d2129', marginTop: 2 }}>{new Date(date).toLocaleDateString('fr-FR')}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </StepCard>

              <StepCard label="Effets indesirables" color="#0056ff">
                {(() => {
                  const proto  = buildProto();
                  const hasMaj = proto?.mpvi?.mpviMajeur === 'oui';
                  const hasMin = proto?.mpvi?.mpviMineur === 'oui';
                  if (!hasMaj && !hasMin) return (
                    <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '16px', fontSize: 12, color: '#0056ff', fontWeight: 600 }}>
                      Aucun effet indesirable renseigne.
                    </div>
                  );
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {hasMin && (
                        <div style={{ background: '#f8f9ff', border: '1px solid #e0e7ff', borderRadius: 12, padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#0056ff', fontSize: 12 }}>MPVI Mineur</div>
                          <div style={{ fontSize: 11, color: '#0056ff', marginTop: 3 }}>Types: {Array.isArray(proto.mpvi.mpviMineurTypes) ? proto.mpvi.mpviMineurTypes.join(', ') : (proto.mpvi.mpviMineurTypes||'Non precise')}</div>
                        </div>
                      )}
                      {hasMaj && (
                        <div style={{ background: '#fff0f0', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 12 }}>MPVI Majeur</div>
                          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 3 }}>Types: {Array.isArray(proto.mpvi.mpviMajeurTypes) ? proto.mpvi.mpviMajeurTypes.join(', ') : (proto.mpvi.mpviMajeurTypes||'Non precise')}</div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </StepCard>

              <StepCard label="Rappel" color="#0056ff">
                <div style={{ border: '1px solid #eaebef', borderRadius: 14, padding: '18px' }}>
                  <div style={{ fontWeight: 800, color: '#1d2129', fontSize: 13, marginBottom: 12 }}>Prochain Rendez-vous</div>
                  <Field label="Date de la prochaine dose">
                    <input
                      style={inputStyle}
                      type="date"
                      value={form.dateProchaineDose}
                      onChange={e => {
                        nextDoseManuelRef.current = true;
                        setForm(p => ({ ...p, dateProchaineDose: e.target.value }));
                      }}
                    />
                  </Field>
                  {form.type === 'rage' && (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#8a94a6' }}>
                      Remplissage automatique depuis la prochaine date VAR. Vous pouvez la modifier manuellement.
                    </div>
                  )}
                  {form.dateProchaineDose && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: '#ebf2ff', border: '1px solid #e0e7ff', borderRadius: 8, fontSize: 12, color: '#0056ff', fontWeight: 600 }}>
                      {new Date(form.dateProchaineDose).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </StepCard>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div style={{ padding: '16px 28px', borderTop: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white' }}>
          {step > 1
            ? (
              <button onClick={() => setStep(s => s - 1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 50, border: '1px solid #eaebef', background: 'white', fontWeight: 600, fontSize: 13, color: '#8a94a6', cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                Retour
              </button>
            )
            : (
              <button onClick={onClose} style={{ padding: '10px 18px', borderRadius: 50, border: '1px solid #eaebef', background: 'white', fontWeight: 600, fontSize: 13, color: '#8a94a6', cursor: 'pointer' }}>
                Annuler
              </button>
            )
          }

          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ width: n === step ? 20 : 6, height: 6, borderRadius: 3, background: n === step ? '#0056ff' : n < step ? '#00c48c' : '#eaebef', transition: 'all .2s' }} />
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {step === 3 && form.patientId && (form.type === 'rage' || form.type === 'dt') && (
              <button onClick={handleDownloadPDF} disabled={pdfLoading} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 50, border: 'none', background: '#ebf2ff', color: '#0056ff', fontWeight: 700, fontSize: 12, cursor: pdfLoading ? 'not-allowed' : 'pointer', opacity: pdfLoading ? 0.7 : 1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                {pdfLoading ? (langue === 'en' ? 'Generating...' : 'Generation...') : 'PDF'}
              </button>
            )}
            {step < 3
              ? (
                <button
                  onClick={() => step === 1 && step1Valid ? setStep(2) : step === 2 ? setStep(3) : null}
                  disabled={step === 1 && !step1Valid}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 50, border: 'none', background: (step === 1 && !step1Valid) ? '#c5cfe8' : '#0056ff', fontWeight: 700, fontSize: 13, color: 'white', cursor: (step === 1 && !step1Valid) ? 'not-allowed' : 'pointer', transition: 'background .15s' }}>
                  Suivant
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              )
              : (
                <button onClick={handleSave} disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 50, border: 'none', background: saving ? '#c5cfe8' : '#0056ff', fontWeight: 700, fontSize: 13, color: 'white', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation: 'spin .7s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                      {langue === 'en' ? 'Saving...' : 'Enregistrement...'}
                      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    </>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      {isEdit ? (langue === 'en' ? 'Save' : 'Enregistrer') : (langue === 'en' ? 'Create record' : 'Creer le Registre')}
                    </>
                  )}
                </button>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}
