import React, { useState, useEffect } from 'react';

// ── Protocoles officiels ──────────────────────────────────────────────────────
export const PROTOCOLES = {
  rage: { label: 'Anti-Rabique', grades: ['Grade I', 'Grade II', 'Grade III'] },
  hepb: {
    label: 'Hépatite B',
    schemas: [
      { id: 'standard',   label: 'Standard',    desc: '0 – 1 – 6 mois',              doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J180)', 'Rappel'] },
      { id: 'renforce',   label: 'Renforcé',    desc: '0 – 1 – 2 – 12 mois',         doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J60)', 'D4 (J360)', 'Rappel'] },
      { id: 'accelere',   label: 'Accéléré',    desc: '0 – 7 – 21 jours',            doses: ['D1 (J0)', 'D2 (J7)', 'D3 (J21)', 'Rappel (12 mois)'] },
      { id: 'dialyse',    label: 'Dialysé',     desc: '0 – 1 – 2 – 6 mois (double)', doses: ['D1 (J0)', 'D2 (J30)', 'D3 (J60)', 'D4 (J180)', 'Rappel'] },
      { id: 'nouveau_ne', label: 'Nouveau-né',  desc: 'Dès la naissance',             doses: ['D1 (Naissance)', 'D2 (J30)', 'D3 (J60)', 'Rappel'] },
    ]
  },
  dt: {
    label: 'DT',
    schemas: ['Primo-vaccination', 'Rappel 1 an', 'Rappel 10 ans', 'Vaccination plaie', 'Grossesse']
  },
  grippe: {
    label: 'Grippe Saisonnière',
    souches: ['Trivalent', 'Quadrivalent'],
  },
  pneumo: {
    label: 'Pneumocoque',
    types: ['PCV13 (Prévenar 13)', 'PCV15 (Vaxneuvance)', 'PCV20 (Apexxnar)', 'PPV23 (Pneumovax)'],
    schemas: ['Dose unique', '2 doses', '3 doses', 'Rattrapage', 'Rappel'],
  },
  meningo: {
    label: 'Méningocoque',
    types: ['MenACWY (Nimenrix / Menveo)', 'MenB (Bexsero / Trumenba)', 'Men C conjugué'],
    schemas: ['Dose unique', '2 doses', 'Rattrapage', 'Rappel'],
  },
};

const VOIES = ['Intra-musculaire', 'Sous-cutanée', 'Intra-dermique', 'Intra-nasale'];

const calcDoseSerum = (poids) => {
  const p = parseFloat(poids);
  if (!p || p <= 0) return '';
  return ((p * 40) / 200).toFixed(2);
};

// ══════════════════════════════════════════════════════════════════════════════
// STYLES
// ══════════════════════════════════════════════════════════════════════════════
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

const SectionBox = ({ title, icon, color = '#0056ff', children }) => (
  <div style={{ border: '1px solid #eaebef', borderRadius: 14, overflow: 'hidden', marginBottom: 2 }}>
    <div style={{ background: `${color}0d`, borderBottom: '1px solid #eaebef', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
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
      {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : num}
    </div>
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: active ? '#0056ff' : '#8a94a6' }}>Etape {num}</div>
      <div style={{ fontSize: 11, color: '#8a94a6' }}>{label}</div>
    </div>
  </div>
);

// ══════════════════════════════════════════════════════════════════════════════
// MPVI — Manifestations Post-Vaccinales Indesirables (commun a tous les vaccins)
// ══════════════════════════════════════════════════════════════════════════════
function MpviSection({ data = {}, onChange }) {
  const u = (k, v) => onChange({ ...data, [k]: v });

  const typesMineures = [
    "Douleur au site d'injection", 'Rougeur / erytheme', 'Oedeme local',
    'Fievre legere (< 38,5C)', 'Cephalees', 'Fatigue / malaise',
    'Myalgies', 'Frissons', 'Nausees',
  ];
  const typesMajeures = [
    'Fievre elevee (> 39C)', 'Reaction anaphylactique', 'Urticaire generalisee',
    'Oedeme de Quincke', 'Convulsions', 'Paralysie / paresie',
    'Syndrome de Guillain-Barre', 'Choc anaphylactique', 'Hospitalisation requise',
  ];

  return (
    <div style={{ border: '1px solid #fde68a', borderRadius: 14, overflow: 'hidden', marginBottom: 2 }}>
      <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>⚠️</span>
        <span style={{ fontWeight: 800, fontSize: 12, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          MPVI — Manifestations Post-Vaccinales Indesirables
        </span>
      </div>
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ─ Effets mineurs ─ */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#374151', marginBottom: 10 }}>
            Effets indesirables <span style={{ color: '#f59e0b', fontWeight: 800 }}>MINEURS</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {[['oui', 'Oui', '#f59e0b', '#fffbeb', '#92400e'], ['non', 'Non', '#10b981', '#f0fdf4', '#065f46']].map(([val, lbl, bord, bg, col]) => (
              <button key={val} type="button" onClick={() => u('mpviMineur', val)} style={{
                padding: '8px 24px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${data.mpviMineur === val ? bord : '#e2e8f0'}`,
                background: data.mpviMineur === val ? bg : 'white',
                color: data.mpviMineur === val ? col : '#8a94a6',
              }}>{lbl}</button>
            ))}
          </div>

          {data.mpviMineur === 'oui' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '14px' }}>
              <div>
                <label style={labelStyle}>Type(s) d'effet mineur</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {typesMineures.map(t => (
                    <CheckRow key={t}
                      checked={(data.mpviMineurTypes || []).includes(t)}
                      onChange={checked => {
                        const arr = data.mpviMineurTypes || [];
                        u('mpviMineurTypes', checked ? [...arr, t] : arr.filter(x => x !== t));
                      }}
                      label={t} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Autre / Precision</label>
                <input style={inputStyle} placeholder="Decrire si non liste ci-dessus…"
                  value={data.mpviMineurAutre || ''} onChange={e => u('mpviMineurAutre', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Delai d'apparition</label>
                  <select style={selectStyle} value={data.mpviMineurDelai || ''} onChange={e => u('mpviMineurDelai', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    <option>Immediat (0-30 min)</option>
                    <option>Precoce (30 min - 4h)</option>
                    <option>Retarde (4h - 24h)</option>
                    <option>Tardif (plus de 24h)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Duree</label>
                  <select style={selectStyle} value={data.mpviMineurDuree || ''} onChange={e => u('mpviMineurDuree', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    <option>Moins de 24h</option>
                    <option>1 a 3 jours</option>
                    <option>3 a 7 jours</option>
                    <option>Plus d'une semaine</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description / Observations</label>
                <textarea style={{ ...textareaStyle, minHeight: 56 }}
                  placeholder="Intensite, evolution, mesures prises…"
                  value={data.mpviMineurDetail || ''} onChange={e => u('mpviMineurDetail', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* ─ Effets majeurs ─ */}
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#374151', marginBottom: 10 }}>
            Effets indesirables <span style={{ color: '#ef4444', fontWeight: 800 }}>MAJEURS</span>
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            {[['oui', 'Oui', '#ef4444', '#fef2f2', '#991b1b'], ['non', 'Non', '#10b981', '#f0fdf4', '#065f46']].map(([val, lbl, bord, bg, col]) => (
              <button key={val} type="button" onClick={() => u('mpviMajeur', val)} style={{
                padding: '8px 24px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${data.mpviMajeur === val ? bord : '#e2e8f0'}`,
                background: data.mpviMajeur === val ? bg : 'white',
                color: data.mpviMajeur === val ? col : '#8a94a6',
              }}>{lbl}</button>
            ))}
          </div>

          {data.mpviMajeur === 'oui' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '14px' }}>
              <div style={{ padding: '8px 12px', background: '#fee2e2', borderRadius: 8, fontSize: 11, color: '#991b1b', fontWeight: 700 }}>
                🚨 Effet majeur — Notification obligatoire au centre de pharmacovigilance
              </div>
              <div>
                <label style={labelStyle}>Type(s) d'effet majeur</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {typesMajeures.map(t => (
                    <CheckRow key={t}
                      checked={(data.mpviMajeurTypes || []).includes(t)}
                      onChange={checked => {
                        const arr = data.mpviMajeurTypes || [];
                        u('mpviMajeurTypes', checked ? [...arr, t] : arr.filter(x => x !== t));
                      }}
                      label={t} />
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Autre / Precision</label>
                <input style={inputStyle} placeholder="Decrire si non liste ci-dessus…"
                  value={data.mpviMajeurAutre || ''} onChange={e => u('mpviMajeurAutre', e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Description detaillee *</label>
                <textarea style={{ ...textareaStyle, minHeight: 80 }}
                  placeholder="Description complete, evolution, mesures prises en urgence…"
                  value={data.mpviMajeurDetail || ''} onChange={e => u('mpviMajeurDetail', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={labelStyle}>Prise en charge</label>
                  <select style={selectStyle} value={data.mpviPriseEnCharge || ''} onChange={e => u('mpviPriseEnCharge', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    <option>Traitement symptomatique</option>
                    <option>Adrenaline administree</option>
                    <option>Hospitalisation</option>
                    <option>Reanimation</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Issue</label>
                  <select style={selectStyle} value={data.mpviIssue || ''} onChange={e => u('mpviIssue', e.target.value)}>
                    <option value="">-- Choisir --</option>
                    <option>Guerison complete</option>
                    <option>Guerison avec sequelles</option>
                    <option>En cours d'evolution</option>
                    <option>Deces</option>
                  </select>
                </div>
              </div>
              <CheckRow
                checked={!!data.mpviNotifie}
                onChange={v => u('mpviNotifie', v)}
                label="Cas notifie au centre de pharmacovigilance" />
              <div>
                <label style={labelStyle}>Date de notification</label>
                <input style={inputStyle} type="date"
                  value={data.mpviDateNotif || ''} onChange={e => u('mpviDateNotif', e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// GRIPPE SECTION
// ══════════════════════════════════════════════════════════════════════════════
function GrippeSection({ grippe, setGrippe }) {
  const uG = (k, v) => setGrippe(p => ({ ...p, [k]: v }));
  const currentYear = new Date().getFullYear();
  const nextYear    = currentYear + 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Antigrippal Saisonnier" icon="" color="#0891b2">
        <Field label="Saison vaccinale" required span={2}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[`${currentYear-1}-${currentYear}`, `${currentYear}-${nextYear}`, `${nextYear}-${nextYear+1}`].map(s => (
              <button key={s} type="button" onClick={() => uG('saison', s)} style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                border: `1.5px solid ${grippe.saison === s ? '#0891b2' : '#e2e8f0'}`,
                background: grippe.saison === s ? '#ecfeff' : 'white',
                color: grippe.saison === s ? '#0e7490' : '#8a94a6',
              }}>{s}</button>
            ))}
          </div>
        </Field>

        <Field label="Type de vaccin" required span={2}>
          <RadioGroup options={PROTOCOLES.grippe.souches} value={grippe.souche || ''} onChange={v => uG('souche', v)} color="#0891b2" />
        </Field>

        <Field label="Marque / DCI">
          <input style={inputStyle} placeholder="Vaxigrip, Influvac, Fluzone…" value={grippe.marque || ''} onChange={e => uG('marque', e.target.value)} />
        </Field>
        <Field label="N° de Lot">
          <input style={inputStyle} value={grippe.lot || ''} onChange={e => uG('lot', e.target.value)} />
        </Field>
        <Field label="Date de Peremption">
          <input style={inputStyle} type="date" value={grippe.peremption || ''} onChange={e => uG('peremption', e.target.value)} />
        </Field>
        <Field label="Dose (ml)">
          <input style={inputStyle} placeholder="0.5 ml" value={grippe.dose || '0.5'} onChange={e => uG('dose', e.target.value)} />
        </Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={grippe.voie || 'Intra-musculaire'} onChange={e => uG('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Site d'injection">
          <select style={selectStyle} value={grippe.site || ''} onChange={e => uG('site', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>Deltoide droit</option>
            <option>Deltoide gauche</option>
            <option>Face anterolatérale cuisse droite</option>
            <option>Face anterolatérale cuisse gauche</option>
          </select>
        </Field>

        <Field label="Indication / Population cible" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Personnel de sante', 'Sujet age >= 65 ans', 'Maladie chronique', 'Immunodeprime',
              'Femme enceinte', 'Enfant 6-59 mois', 'Entourage nourrisson', 'Pelerins (Hadj/Omra)'].map(ind => (
              <CheckRow key={ind}
                checked={(grippe.indications || []).includes(ind)}
                onChange={checked => { const arr = grippe.indications || []; uG('indications', checked ? [...arr, ind] : arr.filter(x => x !== ind)); }}
                label={ind} />
            ))}
          </div>
        </Field>

        <Field label="1ere vaccination antigrippale ?" span={2}>
          <RadioGroup
            options={[{ id: 'oui', label: 'Oui (1ere fois)' }, { id: 'non', label: 'Non (deja vaccine)' }]}
            value={grippe.premiereVaccination || ''} onChange={v => uG('premiereVaccination', v)} color="#0891b2" />
        </Field>
        {grippe.premiereVaccination === 'non' && (
          <Field label="Annee de la derniere vaccination" span={2}>
            <input style={inputStyle} placeholder={`Ex: ${currentYear - 1}`}
              value={grippe.derniereVaccination || ''} onChange={e => uG('derniereVaccination', e.target.value)} />
          </Field>
        )}

        <Field label="Medecin">
          <input style={inputStyle} value={grippe.medecin || ''} onChange={e => uG('medecin', e.target.value)} />
        </Field>
        <Field label="Observations">
          <textarea style={{ ...textareaStyle, minHeight: 56 }} value={grippe.observations || ''} onChange={e => uG('observations', e.target.value)} />
        </Field>
      </SectionBox>

      {/* Prevision annuelle */}
      <div style={{ border: '1px solid #e9d5ff', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>📅</span>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Guide de Prevision — Campagne Annuelle {nextYear}-{nextYear+1}
          </span>
        </div>
        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: '10px 14px', background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, fontSize: 11, color: '#7c3aed', fontWeight: 600 }}>
            Rappel annuel recommande — Chaque automne (Octobre - Novembre). Le vaccin change chaque annee selon les souches OMS.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelStyle}>Date prevue rappel</label>
              <input style={inputStyle} type="date" value={grippe.previsionRappelDate || ''} onChange={e => uG('previsionRappelDate', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Souche prevue (si connue)</label>
              <input style={inputStyle} placeholder="A(H1N1), A(H3N2), B/Victoria…"
                value={grippe.previsionSouche || ''} onChange={e => uG('previsionSouche', e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Notes pour la prochaine campagne</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }}
              placeholder="Recommandations OMS, disponibilite vaccin, notes medecin, population cible annee suivante…"
              value={grippe.previsionNotes || ''} onChange={e => uG('previsionNotes', e.target.value)} />
          </div>
        </div>
      </div>

      <MpviSection data={grippe.mpvi || {}} onChange={mpvi => uG('mpvi', mpvi)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PNEUMOCOQUE SECTION
// ══════════════════════════════════════════════════════════════════════════════
function PneumoSection({ pneumo, setPneumo }) {
  const uP = (k, v) => setPneumo(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Anti-Pneumococcique" icon="" color="#dc2626">
        <Field label="Type de vaccin" required span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {PROTOCOLES.pneumo.types.map(t => (
              <button key={t} type="button" onClick={() => uP('typeVaccin', t)} style={{
                padding: '9px 12px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${pneumo.typeVaccin === t ? '#dc2626' : '#e2e8f0'}`,
                background: pneumo.typeVaccin === t ? '#fef2f2' : 'white',
                fontSize: 12, fontWeight: 700, color: pneumo.typeVaccin === t ? '#dc2626' : '#374151',
              }}>{t}</button>
            ))}
          </div>
        </Field>

        <Field label="Schema vaccinal" span={2}>
          <RadioGroup options={PROTOCOLES.pneumo.schemas} value={pneumo.schema || ''} onChange={v => uP('schema', v)} color="#dc2626" />
        </Field>
        <Field label="Numero de dose">
          <select style={selectStyle} value={pneumo.numeroDose || ''} onChange={e => uP('numeroDose', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>1ere dose</option><option>2eme dose</option><option>3eme dose</option><option>Rappel</option>
          </select>
        </Field>
        <Field label="N° de Lot">
          <input style={inputStyle} value={pneumo.lot || ''} onChange={e => uP('lot', e.target.value)} />
        </Field>
        <Field label="Date de Peremption">
          <input style={inputStyle} type="date" value={pneumo.peremption || ''} onChange={e => uP('peremption', e.target.value)} />
        </Field>
        <Field label="Dose (ml)">
          <input style={inputStyle} placeholder="0.5 ml" value={pneumo.dose || '0.5'} onChange={e => uP('dose', e.target.value)} />
        </Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={pneumo.voie || 'Intra-musculaire'} onChange={e => uP('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Site d'injection">
          <select style={selectStyle} value={pneumo.site || ''} onChange={e => uP('site', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>Deltoide droit</option><option>Deltoide gauche</option>
            <option>Face anterolatérale cuisse droite</option><option>Face anterolatérale cuisse gauche</option>
          </select>
        </Field>

        <Field label="Indication" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Nourrisson (programme)', 'Sujet age >= 65 ans', 'Asplenie / splenectomie',
              'Immunodepression', 'Insuffisance renale chronique', 'Diabete',
              'Insuffisance respiratoire', 'Drepanocytose'].map(ind => (
              <CheckRow key={ind}
                checked={(pneumo.indications || []).includes(ind)}
                onChange={checked => { const arr = pneumo.indications || []; uP('indications', checked ? [...arr, ind] : arr.filter(x => x !== ind)); }}
                label={ind} />
            ))}
          </div>
        </Field>

        <Field label="Calendrier des doses" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['D1', 'D2', 'D3', 'Rappel (12 mois)', 'Rappel (5 ans)'].map(d => (
              <div key={d}>
                <label style={{ ...labelStyle, color: '#dc2626', marginBottom: 4 }}>{d}</label>
                <input style={inputStyle} type="date" value={pneumo.dates?.[d] || ''} onChange={e => uP('dates', { ...pneumo.dates, [d]: e.target.value })} />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Medecin">
          <input style={inputStyle} value={pneumo.medecin || ''} onChange={e => uP('medecin', e.target.value)} />
        </Field>
        <Field label="Observations">
          <textarea style={{ ...textareaStyle, minHeight: 56 }} value={pneumo.observations || ''} onChange={e => uP('observations', e.target.value)} />
        </Field>
      </SectionBox>

      <div style={{ border: '1px solid #e9d5ff', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}></span>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Prevision de Rappel</span>
        </div>
        <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Date de rappel prevue</label>
            <input style={inputStyle} type="date" value={pneumo.previsionRappelDate || ''} onChange={e => uP('previsionRappelDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Type de vaccin prevu</label>
            <input style={inputStyle} placeholder="PCV13, PPV23, PCV20…" value={pneumo.previsionTypeVaccin || ''} onChange={e => uP('previsionTypeVaccin', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Notes prevision</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={pneumo.previsionNotes || ''} onChange={e => uP('previsionNotes', e.target.value)} />
          </div>
        </div>
      </div>

      <MpviSection data={pneumo.mpvi || {}} onChange={mpvi => uP('mpvi', mpvi)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MENINGOCOQUE SECTION
// ══════════════════════════════════════════════════════════════════════════════
function MeningoSection({ meningo, setMeningo }) {
  const uM = (k, v) => setMeningo(p => ({ ...p, [k]: v }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Vaccin Anti-Meningococcique" icon="" color="#7c3aed">
        <Field label="Type de vaccin" required span={2}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROTOCOLES.meningo.types.map(t => (
              <button key={t} type="button" onClick={() => uM('typeVaccin', t)} style={{
                padding: '9px 14px', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                border: `1.5px solid ${meningo.typeVaccin === t ? '#7c3aed' : '#e2e8f0'}`,
                background: meningo.typeVaccin === t ? '#faf5ff' : 'white',
                fontSize: 12, fontWeight: 700, color: meningo.typeVaccin === t ? '#7c3aed' : '#374151',
              }}>{t}</button>
            ))}
          </div>
        </Field>

        <Field label="Schema vaccinal" span={2}>
          <RadioGroup options={PROTOCOLES.meningo.schemas} value={meningo.schema || ''} onChange={v => uM('schema', v)} color="#7c3aed" />
        </Field>
        <Field label="Marque / DCI">
          <input style={inputStyle} placeholder="Nimenrix, Menveo, Bexsero…" value={meningo.marque || ''} onChange={e => uM('marque', e.target.value)} />
        </Field>
        <Field label="N° de Lot">
          <input style={inputStyle} value={meningo.lot || ''} onChange={e => uM('lot', e.target.value)} />
        </Field>
        <Field label="Date de Peremption">
          <input style={inputStyle} type="date" value={meningo.peremption || ''} onChange={e => uM('peremption', e.target.value)} />
        </Field>
        <Field label="Dose (ml)">
          <input style={inputStyle} placeholder="0.5 ml" value={meningo.dose || '0.5'} onChange={e => uM('dose', e.target.value)} />
        </Field>
        <Field label="Voie d'Administration">
          <select style={selectStyle} value={meningo.voie || 'Intra-musculaire'} onChange={e => uM('voie', e.target.value)}>
            {VOIES.map(v => <option key={v}>{v}</option>)}
          </select>
        </Field>
        <Field label="Numero de dose">
          <select style={selectStyle} value={meningo.numeroDose || ''} onChange={e => uM('numeroDose', e.target.value)}>
            <option value="">-- Choisir --</option>
            <option>1ere dose</option><option>2eme dose</option><option>Rappel</option>
          </select>
        </Field>

        <Field label="Indication" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {['Programme national nourrisson', 'Asplenie', 'Immunodepression',
              'Pelerins Hadj / Omra', 'Voyage en zone endemique', 'Contact cas confirme',
              'Etudiant (primo-arrivant)', 'Adolescent (rappel)'].map(ind => (
              <CheckRow key={ind}
                checked={(meningo.indications || []).includes(ind)}
                onChange={checked => { const arr = meningo.indications || []; uM('indications', checked ? [...arr, ind] : arr.filter(x => x !== ind)); }}
                label={ind} />
            ))}
          </div>
        </Field>

        <Field label="Calendrier des doses" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {['D1', 'D2', 'Rappel'].map(d => (
              <div key={d}>
                <label style={{ ...labelStyle, color: '#7c3aed', marginBottom: 4 }}>{d}</label>
                <input style={inputStyle} type="date" value={meningo.dates?.[d] || ''} onChange={e => uM('dates', { ...meningo.dates, [d]: e.target.value })} />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Medecin">
          <input style={inputStyle} value={meningo.medecin || ''} onChange={e => uM('medecin', e.target.value)} />
        </Field>
        <Field label="Observations">
          <textarea style={{ ...textareaStyle, minHeight: 56 }} value={meningo.observations || ''} onChange={e => uM('observations', e.target.value)} />
        </Field>
      </SectionBox>

      <div style={{ border: '1px solid #e9d5ff', borderRadius: 14, overflow: 'hidden' }}>
        <div style={{ background: '#faf5ff', borderBottom: '1px solid #e9d5ff', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}></span>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Prevision de Rappel</span>
        </div>
        <div style={{ padding: '18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <label style={labelStyle}>Date de rappel prevue</label>
            <input style={inputStyle} type="date" value={meningo.previsionRappelDate || ''} onChange={e => uM('previsionRappelDate', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Type de vaccin prevu</label>
            <input style={inputStyle} placeholder="MenACWY, MenB…" value={meningo.previsionTypeVaccin || ''} onChange={e => uM('previsionTypeVaccin', e.target.value)} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Notes prevision</label>
            <textarea style={{ ...textareaStyle, minHeight: 56 }} value={meningo.previsionNotes || ''} onChange={e => uM('previsionNotes', e.target.value)} />
          </div>
        </div>
      </div>

      <MpviSection data={meningo.mpvi || {}} onChange={mpvi => uM('mpvi', mpvi)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// RAGE SECTION (avec MPVI)
// ══════════════════════════════════════════════════════════════════════════════
function RageSection({ rage, setRage, patient }) {
  const uR = (k, v) => setRage(p => ({ ...p, [k]: v }));
  useEffect(() => {
    const poids = rage.erigPoidsPatient || patient?.poids;
    if (poids) uR('erigDoseCalculee', calcDoseSerum(poids));
  }, [rage.erigPoidsPatient, patient?.poids]);

  const doseLabelsGradeII  = ['J0','J3','J7','J14','J30'];
  const doseLabelsGradeIII = ['J0','J3','J7','J14','J30','J90'];
  const doseLabelsZagreb   = ['J0 (2 sites)','J7','J21','Rappel (J90)'];
  const doseLabelsEssen    = ['J0','J3','J7','J14','J28'];
  const cellDoses = rage.cellulProtocole === 'ZAGREB' ? doseLabelsZagreb : doseLabelsEssen;
  const tissDoses = rage.grade === 'Grade III' ? doseLabelsGradeIII : doseLabelsGradeII;
  const doseDates = rage.varType === 'cellulaire' ? cellDoses : tissDoses;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Exposition & Grade" icon="" color="#c2410c">
        <Field label="Grade d'Exposition" required span={2}>
          <RadioGroup options={['Grade I','Grade II','Grade III']} value={rage.grade} onChange={v => uR('grade', v)} color="#c2410c" />
          <div style={{ marginTop: 8, padding: '8px 12px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, fontSize: 11, color: '#92400e' }}>
            {rage.grade === 'Grade I' && 'Contact cutane, lechage sur peau intacte — Pas de traitement'}
            {rage.grade === 'Grade II' && 'Morsure legere, griffure — VAR recommande'}
            {rage.grade === 'Grade III' && 'Morsure profonde, muqueuse — VAR + ERIG obligatoire'}
          </div>
        </Field>
        <Field label="Date d'Exposition"><input style={inputStyle} type="date" value={rage.dateExposition || ''} onChange={e => uR('dateExposition', e.target.value)} /></Field>
        <Field label="Espece animale" required>
          <RadioGroup options={[{id:'chien',label:'Chien'},{id:'chat',label:'Chat'},{id:'autre',label:'Autre'}]} value={rage.especeAnimale} onChange={v => uR('especeAnimale', v)} color="#c2410c" />
          {rage.especeAnimale === 'autre' && <input style={{ ...inputStyle, marginTop: 8 }} placeholder="Preciser…" value={rage.especeAnimalePrecise || ''} onChange={e => uR('especeAnimalePrecise', e.target.value)} />}
        </Field>
        <Field label="Statut de l'animal">
          <CheckRow checked={rage.animalVaccine === true}  onChange={() => uR('animalVaccine', true)}  label="Animal vaccine (carte a l'appui)" />
          <CheckRow checked={rage.animalVaccine === false} onChange={() => uR('animalVaccine', false)} label="Non vaccine / Inconnu" />
        </Field>
        <Field label="Etat de l'animal">
          <select style={selectStyle} value={rage.statutAnimal || ''} onChange={e => uR('statutAnimal', e.target.value)}>
            <option value="">-- Choisir --</option><option>Vivant / Sous surveillance</option><option>Mort / Fugue</option><option>Enrage confirme</option><option>Inconnu</option>
          </select>
        </Field>
        <Field label="Circonstances"><input style={inputStyle} placeholder="Provoquee, non provoquee…" value={rage.circonstancesMorsure || ''} onChange={e => uR('circonstancesMorsure', e.target.value)} /></Field>
        <Field label="Localisation des plaies" span={2}>
          <select style={selectStyle} value={rage.localisationPlaies || ''} onChange={e => uR('localisationPlaies', e.target.value)}>
            <option value="">-- Choisir --</option><option>tete</option><option>face</option><option>cou</option><option>organes genitaux externes</option><option>membre(s) superieur(s)</option><option>membre(s) inferieur(s)</option>
          </select>
        </Field>
      </SectionBox>

      <SectionBox title="Soins Locaux de la Plaie" icon="" color="#059669">
        <Field label="Soins effectues" span={2}><CheckRow checked={!!rage.soinsLocaux} onChange={v => uR('soinsLocaux', v)} label="Oui, soins locaux effectues" /></Field>
        {rage.soinsLocaux && (<>
          <Field label="Type de lavage">
            <CheckRow checked={!!rage.lavageEau} onChange={v => uR('lavageEau', v)} label="Lavage a l'eau" />
            <CheckRow checked={!!rage.lavageEauSavon} onChange={v => uR('lavageEauSavon', v)} label="Lavage eau + savon" />
          </Field>
          <Field label="Produit antiseptique"><input style={inputStyle} placeholder="Alcool, Betadine…" value={rage.applicationProduit || ''} onChange={e => uR('applicationProduit', e.target.value)} /></Field>
          <Field label="Suture" span={2}>
            <CheckRow checked={!!rage.suture} onChange={v => uR('suture', v)} label="Suture effectuee" />
            {rage.suture && <RadioGroup options={['Avant ERIG','Apres ERIG']} value={rage.sutureDetail} onChange={v => uR('sutureDetail', v)} color="#059669" />}
          </Field>
        </>)}
      </SectionBox>

      <SectionBox title="Type de Vaccin Antirabique (VAR)" icon="" color="#0056ff">
        <Field label="Type" span={2}>
          <RadioGroup options={[{id:'tissulaire',label:'Tissulaire'},{id:'cellulaire',label:'Cellulaire'}]} value={rage.varType || 'tissulaire'} onChange={v => uR('varType', v)} />
        </Field>
        {rage.varType === 'cellulaire' && (
          <Field label="Protocole" span={2}>
            <RadioGroup options={[{id:'ESSEN',label:'ESSEN (5 doses)'},{id:'ZAGREB',label:'ZAGREB (4 doses)'}]} value={rage.cellulProtocole || 'ESSEN'} onChange={v => uR('cellulProtocole', v)} color="#7c3aed" />
          </Field>
        )}
        <Field label="DCI / Marque"><input style={inputStyle} placeholder="Verorab, Rabipur…" value={rage.varDCI || ''} onChange={e => uR('varDCI', e.target.value)} /></Field>
        <Field label="N° de Lot"><input style={inputStyle} value={rage.varLot || ''} onChange={e => uR('varLot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={rage.varPeremption || ''} onChange={e => uR('varPeremption', e.target.value)} /></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="0.5 ml" value={rage.varDose || '0.5'} onChange={e => uR('varDose', e.target.value)} /></Field>
        <Field label="Voie d'Administration" span={2}><select style={selectStyle} value={rage.varVoie || 'Intra-musculaire'} onChange={e => uR('varVoie', e.target.value)}>{VOIES.map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Calendrier VAR" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginTop: 4 }}>
            {doseDates.map(j => (<div key={j}><label style={{ ...labelStyle, color: '#0056ff', marginBottom: 4 }}>{j}</label><input style={inputStyle} type="date" value={rage.datesVAR?.[j] || ''} onChange={e => uR('datesVAR', { ...rage.datesVAR, [j]: e.target.value })} /></div>))}
          </div>
        </Field>
      </SectionBox>

      {rage.grade === 'Grade III' && (
        <SectionBox title="Immunoglobulines Equines (ERIG)" icon="" color="#9333ea">
          <Field label="ERIG administre" span={2}><CheckRow checked={!!rage.erig} onChange={v => uR('erig', v)} label="Oui, ERIG administre" /></Field>
          {rage.erig && (<>
            <Field label="Date et Heure"><input style={inputStyle} type="datetime-local" value={rage.erigDate || ''} onChange={e => uR('erigDate', e.target.value)} /></Field>
            <Field label="N° de Lot"><input style={inputStyle} value={rage.erigLot || ''} onChange={e => uR('erigLot', e.target.value)} /></Field>
            <Field label="Date Peremption"><input style={inputStyle} type="date" value={rage.erigPeremption || ''} onChange={e => uR('erigPeremption', e.target.value)} /></Field>
            <Field label="Poids (Kg)"><input style={inputStyle} type="number" step="0.1" value={rage.erigPoidsPatient || ''} onChange={e => uR('erigPoidsPatient', e.target.value)} /></Field>
            <Field label="Dose Calculee">
              <div style={{ position: 'relative' }}>
                <input style={{ ...inputStyle, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', fontWeight: 700 }} readOnly value={rage.erigDoseCalculee ? `${rage.erigDoseCalculee} ml` : '— (entrer le poids)'} />
                <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#16a34a', fontWeight: 700 }}>Poids x 40 / 200</div>
              </div>
            </Field>
            <Field label="Quantite Totale (ml)"><input style={inputStyle} value={rage.erigQuantiteTotale || ''} onChange={e => uR('erigQuantiteTotale', e.target.value)} /></Field>
            <Field label="Quantite IM (ml)"><input style={inputStyle} value={rage.erigQuantiteIM || ''} onChange={e => uR('erigQuantiteIM', e.target.value)} /></Field>
          </>)}
        </SectionBox>
      )}

      <SectionBox title="Informations Complementaires" icon="" color="#64748b">
        <Field label="Medecin"><input style={inputStyle} value={rage.medecin || ''} onChange={e => uR('medecin', e.target.value)} /></Field>
        <Field label="SEMEP / Etablissement"><input style={inputStyle} value={rage.semep || ''} onChange={e => uR('semep', e.target.value)} /></Field>
        <Field label="Observations" span={2}><textarea style={textareaStyle} value={rage.observations || ''} onChange={e => uR('observations', e.target.value)} /></Field>
      </SectionBox>

      <MpviSection data={rage.mpvi || {}} onChange={mpvi => uR('mpvi', mpvi)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// HEPATITE B & DT (avec MPVI)
// ══════════════════════════════════════════════════════════════════════════════
function HepbSection({ hepb, setHepb }) {
  const uH = (k, v) => setHepb(p => ({ ...p, [k]: v }));
  const schema = PROTOCOLES.hepb.schemas.find(s => s.id === (hepb.schema || 'standard'));
  const doses = schema?.doses || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Schema de Vaccination Hepatite B" icon="" color="#16a34a">
        <Field label="Schema" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
            {PROTOCOLES.hepb.schemas.map(s => (
              <button key={s.id} type="button" onClick={() => uH('schema', s.id)} style={{ padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${hepb.schema === s.id ? '#16a34a' : '#e2e8f0'}`, background: hepb.schema === s.id ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ fontWeight: 800, fontSize: 12, color: hepb.schema === s.id ? '#16a34a' : '#374151' }}>{s.label}</div>
                <div style={{ fontSize: 10, color: '#8a94a6', marginTop: 2 }}>{s.desc}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Marque"><input style={inputStyle} placeholder="Engerix B, HB Vax Pro…" value={hepb.marque || ''} onChange={e => uH('marque', e.target.value)} /></Field>
        <Field label="N° de Lot"><input style={inputStyle} value={hepb.lot || ''} onChange={e => uH('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={hepb.peremption || ''} onChange={e => uH('peremption', e.target.value)} /></Field>
        <Field label="Voie"><select style={selectStyle} value={hepb.voie || 'Intra-musculaire'} onChange={e => uH('voie', e.target.value)}>{VOIES.map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="1 ml" value={hepb.doseML || '1'} onChange={e => uH('doseML', e.target.value)} /></Field>
        <Field label="Serologie"><select style={selectStyle} value={hepb.serologie || ''} onChange={e => uH('serologie', e.target.value)}><option value="">Non effectuee</option><option>Ag HBs negatif</option><option>Ag HBs positif</option><option>Anti-HBs positif</option></select></Field>
        <Field label="Calendrier" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginTop: 4 }}>
            {doses.map(d => (<div key={d}><label style={{ ...labelStyle, color: '#16a34a', marginBottom: 4 }}>{d}</label><input style={inputStyle} type="date" value={hepb.dates?.[d] || ''} onChange={e => uH('dates', { ...hepb.dates, [d]: e.target.value })} /></div>))}
          </div>
        </Field>
        <Field label="Medecin"><input style={inputStyle} value={hepb.medecin || ''} onChange={e => uH('medecin', e.target.value)} /></Field>
        <Field label="Observations" span={2}><textarea style={textareaStyle} value={hepb.observations || ''} onChange={e => uH('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={hepb.mpvi || {}} onChange={mpvi => uH('mpvi', mpvi)} />
    </div>
  );
}

function DtSection({ dt, setDt }) {
  const uD = (k, v) => setDt(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionBox title="Protocole DT" icon="" color="#1d4ed8">
        <Field label="Schema" span={2}><RadioGroup options={PROTOCOLES.dt.schemas} value={dt.schema || 'Primo-vaccination'} onChange={v => uD('schema', v)} color="#1d4ed8" /></Field>
        <Field label="Marque"><input style={inputStyle} value={dt.marque || ''} onChange={e => uD('marque', e.target.value)} /></Field>
        <Field label="N° de Lot"><input style={inputStyle} value={dt.lot || ''} onChange={e => uD('lot', e.target.value)} /></Field>
        <Field label="Date de Peremption"><input style={inputStyle} type="date" value={dt.peremption || ''} onChange={e => uD('peremption', e.target.value)} /></Field>
        <Field label="Voie"><select style={selectStyle} value={dt.voie || 'Intra-musculaire'} onChange={e => uD('voie', e.target.value)}>{VOIES.map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Dose (ml)"><input style={inputStyle} placeholder="0.5 ml" value={dt.doseML || '0.5'} onChange={e => uD('doseML', e.target.value)} /></Field>
        <Field label="Derniere vaccination DT"><input style={inputStyle} type="date" value={dt.derniereVaccination || ''} onChange={e => uD('derniereVaccination', e.target.value)} /></Field>
        <Field label="Contexte de plaie" span={2}>
          <CheckRow checked={!!dt.plaie} onChange={v => uD('plaie', v)} label="Vaccination en contexte de plaie" />
          {dt.plaie && <input style={{ ...inputStyle, marginTop: 8 }} placeholder="Plaie souillée, brulure…" value={dt.typePlaie || ''} onChange={e => uD('typePlaie', e.target.value)} />}
        </Field>
        <Field label="Calendrier" span={2}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 4 }}>
            {['D1','D2','D3','Rappel'].map(d => (<div key={d}><label style={{ ...labelStyle, color: '#1d4ed8', marginBottom: 4 }}>{d}</label><input style={inputStyle} type="date" value={dt.dates?.[d] || ''} onChange={e => uD('dates', { ...dt.dates, [d]: e.target.value })} /></div>))}
          </div>
        </Field>
        <Field label="Medecin"><input style={inputStyle} value={dt.medecin || ''} onChange={e => uD('medecin', e.target.value)} /></Field>
        <Field label="Observations" span={2}><textarea style={textareaStyle} value={dt.observations || ''} onChange={e => uD('observations', e.target.value)} /></Field>
      </SectionBox>
      <MpviSection data={dt.mpvi || {}} onChange={mpvi => uD('mpvi', mpvi)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function VaccinModal({ vaccination, patients = [], initialPatientId, onClose, onSave }) {
  const isEdit = !!vaccination;
  const [step, setStep]             = useState(1);
  const [saving, setSaving]         = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [form, setForm] = useState({
    patientId:          vaccination?.patientId          || initialPatientId || '',
    type:               vaccination?.type               || 'rage',
    statut:             vaccination?.statut             || 'complete',
    dateAdministration: vaccination?.dateAdministration?.slice(0,10) || new Date().toISOString().slice(0,10),
    dateProchaineDose:  vaccination?.dateProchaineDose?.slice(0,10)  || '',
  });

  const proto0 = vaccination?.protocoleData || {};
  const [rage,    setRage]    = useState({ grade:'Grade II', varType:'tissulaire', cellulProtocole:'ESSEN', especeAnimale:'', animalVaccine:null, ...proto0 });
  const [hepb,    setHepb]    = useState({ schema:'standard', voie:'Intra-musculaire', doseML:'1', ...proto0 });
  const [dt,      setDt]      = useState({ schema:'Primo-vaccination', voie:'Intra-musculaire', doseML:'0.5', ...proto0 });
  const [grippe,  setGrippe]  = useState({ voie:'Intra-musculaire', dose:'0.5', ...proto0 });
  const [pneumo,  setPneumo]  = useState({ voie:'Intra-musculaire', dose:'0.5', ...proto0 });
  const [meningo, setMeningo] = useState({ voie:'Intra-musculaire', dose:'0.5', ...proto0 });

  const selectedPatient = patients.find(p => p.id === form.patientId);
  const buildProto = () => ({ rage, hepb, dt, grippe, pneumo, meningo }[form.type] || rage);
  const step1Valid = form.patientId && form.type && form.dateAdministration;

  const typeConfig = {
    rage:    { color:'#c2410c', bg:'#fff7ed', icon:'', label:'Anti-Rabique' },
    hepb:    { color:'#16a34a', bg:'#f0fdf4', icon:'', label:'Hepatite B' },
    dt:      { color:'#1d4ed8', bg:'#eff6ff', icon:'', label:'DT' },
    grippe:  { color:'#0891b2', bg:'#ecfeff', icon:'', label:'Grippe' },
    pneumo:  { color:'#dc2626', bg:'#fef2f2', icon:'', label:'Pneumocoque' },
    meningo: { color:'#7c3aed', bg:'#faf5ff', icon:'', label:'Meningocoque' },
  };
  const tc = typeConfig[form.type] || typeConfig.rage;
  const STEPS = [{ label:'Patient & Type' },{ label:'Protocole Medical' },{ label:'Rappel & Resume' }];

  const downloadPDF = async (patientData, vaccinationData, protocoleData, type) => {
    const res = await fetch('http://localhost:3001/api/generate-pdf', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ patient:patientData, vaccination:vaccinationData, protocoleData, type }),
    });
    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        message = err.detail || err.error || message;
      } catch {
        message = await res.text();
      }
      throw new Error(message);
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `carte_${type}_${patientData?.nom||'patient'}.pdf`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!form.patientId) { alert('Selectionnez un patient'); return; }
    setSaving(true);
    const vaccinLabel = { rage: rage.varType==='cellulaire'?'Anti-Rabique Cellulaire':'Anti-Rabique Tissulaire', hepb:'Hepatite B', dt:'DT', grippe:'Grippe Saisonniere', pneumo:'Pneumocoque', meningo:'Meningocoque' };
    const payload = { ...form, vaccin: vaccinLabel[form.type]||form.type, protocoleData: buildProto() };
    try {
      const url = isEdit ? `http://localhost:3001/api/vaccinations/${vaccination.id}` : 'http://localhost:3001/api/vaccinations';
      await fetch(url, { method: isEdit?'PUT':'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      try { await downloadPDF(selectedPatient, payload, buildProto(), form.type); } catch(e) { console.warn('PDF:', e.message); }
      onSave();
    } finally { setSaving(false); }
  };

  const handleDownloadPDF = async () => {
    if (!selectedPatient) { alert('Selectionnez un patient'); return; }
    setPdfLoading(true);
    try { await downloadPDF(selectedPatient, { ...form }, buildProto(), form.type); }
    catch(e) { alert('Erreur PDF : '+e.message); }
    finally { setPdfLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(17,24,41,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(2px)', padding:16 }}
      onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ background:'white', borderRadius:20, width:'100%', maxWidth:800, boxShadow:'0 20px 60px rgba(0,0,0,0.18)', maxHeight:'94vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* En-tete */}
        <div style={{ padding:'24px 28px 0', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
            <div>
              <h2 style={{ fontFamily:'Syne, sans-serif', fontSize:18, fontWeight:800, color:'#1d2129', marginBottom:4 }}>
                {isEdit ? 'Modifier le Registre' : 'Nouveau Registre Vaccinal'}
              </h2>
              {selectedPatient && (
                <span style={{ background:'#ebf2ff', color:'#0056ff', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                  {selectedPatient.prenom} {selectedPatient.nom}
                </span>
              )}
            </div>
            <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'#8a94a6', padding:4 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:24 }}>
            {STEPS.map((s,i) => (
              <React.Fragment key={i}>
                <StepBadge num={i+1} label={s.label} active={step===i+1} done={step>i+1} onClick={() => step>i+1 && setStep(i+1)} />
                {i < STEPS.length-1 && <div style={{ flex:1, height:2, margin:'0 12px', borderRadius:1, background:step>i+1?'#8a94a6':'#eaebef', transition:'background .3s' }} />}
              </React.Fragment>
            ))}
          </div>
          <div style={{ height:1, background:'#f0f1f5', marginLeft:-28, marginRight:-28 }} />
        </div>

        {/* Corps */}
        <div style={{ overflowY:'auto', padding:'24px 28px', flex:1 }}>

          {/* ETAPE 1 */}
          {step === 1 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ border:'1px solid #eaebef', borderRadius:14, padding:'18px', position:'relative' }}>
                <span style={{ position:'absolute', top:-10, left:14, background:'white', padding:'0 6px', fontSize:10, fontWeight:800, color:'#0056ff', textTransform:'uppercase', letterSpacing:'.4px' }}>Patient</span>
                <Field label="Patient" required>
                  <select style={selectStyle} value={form.patientId} onChange={e => setForm(p => ({...p, patientId:e.target.value}))}>
                    <option value="">-- Selectionner un patient --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}{p.dateNaissance?` — ${new Date().getFullYear()-new Date(p.dateNaissance).getFullYear()} ans`:''}</option>)}
                  </select>
                </Field>
                {selectedPatient && (
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginTop:14, background:'#f8f9ff', border:'1px solid #e0e7ff', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', fontWeight:800, fontSize:16, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:selectedPatient.sexe==='M'?'#ebf2ff':'#fce7f3', color:selectedPatient.sexe==='M'?'#0056ff':'#ec4899' }}>
                      {selectedPatient.prenom?.[0]}{selectedPatient.nom?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:800, color:'#1d2129', fontSize:14 }}>{selectedPatient.prenom} {selectedPatient.nom}</div>
                      <div style={{ fontSize:11, color:'#8a94a6', marginTop:2 }}>{selectedPatient.poids&&`${selectedPatient.poids} Kg · `}{selectedPatient.telephone||'Pas de telephone'}{selectedPatient.wilaya&&` · ${selectedPatient.wilaya}`}</div>
                    </div>
                    {selectedPatient.poids && (
                      <div style={{ marginLeft:'auto', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
                        <div style={{ fontSize:10, color:'#16a34a', fontWeight:700 }}>DOSE ERIG</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'#16a34a' }}>{calcDoseSerum(selectedPatient.poids)} ml</div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 6 types de vaccins */}
              <div style={{ border:'1px solid #eaebef', borderRadius:14, padding:'18px', position:'relative' }}>
                <span style={{ position:'absolute', top:-10, left:14, background:'white', padding:'0 6px', fontSize:10, fontWeight:800, color:'#0056ff', textTransform:'uppercase', letterSpacing:'.4px' }}>Type de Vaccin</span>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                  {Object.entries(typeConfig).map(([k,{color,bg,icon,label}]) => (
                    <button key={k} type="button" onClick={() => setForm(p => ({...p,type:k}))} style={{
                      padding:'14px 10px', borderRadius:12, cursor:'pointer', transition:'all .15s',
                      border:`2px solid ${form.type===k?color:'#eaebef'}`,
                      background:form.type===k?bg:'white',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                    }}>
                      <span style={{ fontSize:22 }}>{icon}</span>
                      <span style={{ fontWeight:800, fontSize:12, color:form.type===k?color:'#374151' }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14 }}>
                <Field label="Date d'Administration" required>
                  <input style={inputStyle} type="date" value={form.dateAdministration} onChange={e => setForm(p => ({...p,dateAdministration:e.target.value}))} />
                </Field>
                <Field label="Statut">
                  <select style={selectStyle} value={form.statut} onChange={e => setForm(p => ({...p,statut:e.target.value}))}>
                    <option value="complete">Complet</option><option value="en_cours">En cours</option><option value="incomplet">Incomplet</option>
                  </select>
                </Field>
                <Field label="Prochaine Dose">
                  <input style={inputStyle} type="date" value={form.dateProchaineDose} onChange={e => setForm(p => ({...p,dateProchaineDose:e.target.value}))} />
                </Field>
              </div>
            </div>
          )}

          {/* ETAPE 2 */}
          {step === 2 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, background:tc.bg, border:`1px solid ${tc.color}33`, borderRadius:12, padding:'12px 16px', marginBottom:18 }}>
                <div style={{ fontSize:28 }}>{tc.icon}</div>
                <div>
                  <div style={{ fontWeight:800, color:tc.color, fontSize:14 }}>{tc.label}</div>
                  <div style={{ fontSize:11, color:'#8a94a6', marginTop:2 }}>{selectedPatient?.prenom} {selectedPatient?.nom} · {form.dateAdministration}</div>
                </div>
              </div>
              {form.type==='rage'    && <RageSection    rage={rage}       setRage={setRage}       patient={selectedPatient} />}
              {form.type==='hepb'    && <HepbSection    hepb={hepb}       setHepb={setHepb} />}
              {form.type==='dt'      && <DtSection      dt={dt}           setDt={setDt} />}
              {form.type==='grippe'  && <GrippeSection  grippe={grippe}   setGrippe={setGrippe} />}
              {form.type==='pneumo'  && <PneumoSection  pneumo={pneumo}   setPneumo={setPneumo} />}
              {form.type==='meningo' && <MeningoSection meningo={meningo} setMeningo={setMeningo} />}
            </div>
          )}

          {/* ETAPE 3 */}
          {step === 3 && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'#f8f9ff', border:'1px solid #e0e7ff', borderRadius:14, padding:'18px' }}>
                <div style={{ fontWeight:800, color:'#0056ff', fontSize:13, marginBottom:12, textTransform:'uppercase', letterSpacing:'0.5px' }}>Resume du Protocole</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    ['Patient', `${selectedPatient?.prenom||'—'} ${selectedPatient?.nom||''}`],
                    ['Type', tc.label],
                    ['Date', form.dateAdministration],
                    ['Statut', form.statut],
                    form.type==='rage'    ? ['Grade', rage.grade] : null,
                    form.type==='hepb'    ? ['Schema', hepb.schema] : null,
                    form.type==='grippe'  ? ['Saison', grippe.saison||'—'] : null,
                    form.type==='pneumo'  ? ['Vaccin', pneumo.typeVaccin||'—'] : null,
                    form.type==='meningo' ? ['Vaccin', meningo.typeVaccin||'—'] : null,
                  ].filter(Boolean).map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontSize:10, fontWeight:700, color:'#a0aec0', textTransform:'uppercase' }}>{k}</div>
                      <div style={{ fontSize:13, fontWeight:700, color:'#1d2129', marginTop:2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Alerte MPVI si presente */}
              {(() => {
                const proto = buildProto();
                const hasMaj = proto?.mpvi?.mpviMajeur === 'oui';
                const hasMin = proto?.mpvi?.mpviMineur === 'oui';
                if (!hasMaj && !hasMin) return null;
                return (
                  <div style={{ background:hasMaj?'#fef2f2':'#fffbeb', border:`1px solid ${hasMaj?'#fecaca':'#fde68a'}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ fontSize:22, flexShrink:0 }}>{hasMaj?'':''}</div>
                    <div>
                      <div style={{ fontWeight:700, color:hasMaj?'#991b1b':'#92400e', fontSize:12 }}>
                        {hasMaj ? 'MPVI Majeur — Notification pharmacovigilance requise' : 'MPVI Mineur enregistre'}
                      </div>
                      <div style={{ fontSize:11, color:hasMaj?'#b91c1c':'#b45309', marginTop:3 }}>
                        {hasMaj
                          ? `Types: ${(proto.mpvi.mpviMajeurTypes||[]).join(', ')||'Non precise'} | Prise en charge: ${proto.mpvi.mpviPriseEnCharge||'—'}`
                          : `Types: ${(proto.mpvi.mpviMineurTypes||[]).join(', ')||'Non precise'} | Duree: ${proto.mpvi.mpviMineurDuree||'—'}`}
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ border:'1px solid #eaebef', borderRadius:14, padding:'18px' }}>
                <div style={{ fontWeight:800, color:'#1d2129', fontSize:13, marginBottom:12 }}>Prochain Rendez-vous</div>
                <Field label="Date de la prochaine dose">
                  <input style={inputStyle} type="date" value={form.dateProchaineDose} onChange={e => setForm(p => ({...p,dateProchaineDose:e.target.value}))} />
                </Field>
                {form.dateProchaineDose && (
                  <div style={{ marginTop:10, padding:'10px 14px', background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:8, fontSize:12, color:'#166534', fontWeight:600 }}>
                    {new Date(form.dateProchaineDose).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
                  </div>
                )}
              </div>

              <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ fontSize:22 }}></div>
                <div>
                  <div style={{ fontWeight:700, color:'#92400e', fontSize:12 }}>Carte PDF generee automatiquement a l'enregistrement</div>
                  <div style={{ fontSize:11, color:'#b45309', marginTop:2 }}>Utilisez le bouton PDF pour la generer maintenant.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pied de page */}
        <div style={{ padding:'16px 28px', borderTop:'1px solid #f0f1f5', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, background:'white' }}>
          {step > 1
            ? <button onClick={() => setStep(s => s-1)} style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 18px', borderRadius:50, border:'1px solid #eaebef', background:'white', fontWeight:600, fontSize:13, color:'#8a94a6', cursor:'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>Retour
              </button>
            : <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:50, border:'1px solid #eaebef', background:'white', fontWeight:600, fontSize:13, color:'#8a94a6', cursor:'pointer' }}>Annuler</button>
          }

          <div style={{ display:'flex', gap:6 }}>
            {[1,2,3].map(n => <div key={n} style={{ width:n===step?20:6, height:6, borderRadius:3, background:n===step?'#0056ff':n<step?'#00c48c':'#eaebef', transition:'all .2s' }} />)}
          </div>

          <div style={{ display:'flex', gap:8 }}>
            {step===3 && form.patientId && (
              <button onClick={handleDownloadPDF} disabled={pdfLoading} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:50, border:'none', background:'#f0fdf4', color:'#16a34a', fontWeight:700, fontSize:12, cursor:pdfLoading?'not-allowed':'pointer', opacity:pdfLoading?.7:1 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                {pdfLoading?'Generation…':'PDF'}
              </button>
            )}
            {step < 3
              ? <button onClick={() => step===1&&step1Valid?setStep(2):step===2?setStep(3):null} disabled={step===1&&!step1Valid}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 22px', borderRadius:50, border:'none', background:(step===1&&!step1Valid)?'#c5cfe8':'#0056ff', fontWeight:700, fontSize:13, color:'white', cursor:(step===1&&!step1Valid)?'not-allowed':'pointer', transition:'background .15s' }}>
                  {step===1?'Suivant — Protocole':'Suivant — Rappel'}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              : <button onClick={handleSave} disabled={saving}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 22px', borderRadius:50, border:'none', background:saving?'#c5cfe8':'#0056ff', fontWeight:700, fontSize:13, color:'white', cursor:saving?'not-allowed':'pointer' }}>
                  {saving
                    ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ animation:'spin .7s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Enregistrement…<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></>
                    : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>{isEdit?'Enregistrer':'Creer le Registre'}</>
                  }
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}