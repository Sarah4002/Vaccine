import React, { useState } from 'react';
import { api } from '../utils/api';

export const PROTOCOLES = [
  { id: 'rage', label: 'Anti-Rabique Tissulaire' },
  { id: 'hepb', label: 'Hépatite B' },
  { id: 'dt', label: 'Anti-Diphtérique et Antitéitanique (DT)' }
];

const inputStyle = { width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #eaebef', outline: 'none', fontSize: '14px', background: '#f4f5f9' };
const labelStyle = { fontSize: '12px', fontWeight: 700, color: '#8a94a6', display: 'block', marginBottom: '6px', textTransform: 'uppercase' };

// --- SOUS-FORMULAIRES ---

function ProtocoleRage({ data, set }) {
  const [tab, setTab] = useState('accueil');
  const sections = [
    { id: 'accueil', label: '1. Accueil & Exposition' },
    { id: 'animal', label: '2. Animal en Cause' },
    { id: 'traitement', label: '3. Traitement & VAR' }
  ];

  const update = (field, value) => set({ ...data, [field]: value });
  
  const TabButton = ({ id, label }) => (
    <button type="button" onClick={() => setTab(id)} style={{ flex: 1, padding: '10px', border: 'none', borderBottom: tab === id ? '3px solid #0056ff' : '1px solid #eaebef', background: tab === id ? '#f0f4ff' : 'white', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: tab === id ? '#0056ff' : '#8a94a6', transition: '0.2s' }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', gap: '4px', background: '#f8f9fc', borderRadius: '8px', overflow: 'hidden' }}>
        {sections.map(s => <TabButton key={s.id} {...s} />)}
      </div>

      {tab === 'accueil' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Heure d'arrivée à l'UAR</label>
                <input type="time" value={data.heureArrivee || ''} onChange={e => update('heureArrivee', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Structure d'orientation</label>
                <input value={data.orientation || ''} onChange={e => update('orientation', e.target.value)} placeholder="Direct, CPM, etc." style={inputStyle} />
              </div>
           </div>

           <div style={{ border: '1px solid #eaebef', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 16px', color: '#1d2129' }}>I. EXPOSITION AU RISQUE</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Date & Heure Incident</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" value={data.dateExposition || ''} onChange={e => update('dateExposition', e.target.value)} style={inputStyle} required />
                    <input type="time" value={data.heureExposition || ''} onChange={e => update('heureExposition', e.target.value)} style={{...inputStyle, width: '120px'}} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Lieu de l'incident</label>
                  <select value={data.lieuIncident || 'domicile'} onChange={e => update('lieuIncident', e.target.value)} style={inputStyle}>
                    <option value="domicile">Domicile</option>
                    <option value="hors_domicile">Hors Domicile</option>
                  </select>
                </div>
              </div>
           </div>

           <div style={{ border: '1px solid #eaebef', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 16px', color: '#1d2129' }}>II. SIÈGES ET NATURE DES LÉSIONS</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                   <label style={labelStyle}>Sièges des lésions</label>
                   <input value={data.siegesLesions || ''} onChange={e => update('siegesLesions', e.target.value)} placeholder="Main, Visage, Membres..." style={inputStyle} />
                </div>
                <div>
                   <label style={labelStyle}>Nature des lésions</label>
                   <select value={data.natureLesions || ''} onChange={e => update('natureLesions', e.target.value)} style={inputStyle}>
                     <option value="">Sélectionner...</option>
                     <option value="morsure">Morsure</option>
                     <option value="griffure">Griffure</option>
                     <option value="lechage">Léchage</option>
                   </select>
                </div>
              </div>
              <div style={{ marginTop: '16px', display: 'flex', gap: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="checkbox" checked={data.saignement || false} onChange={e => update('saignement', e.target.checked)} /> Avec saignement
                </label>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Nombre de lésions</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['Lésion unique', 'Lésions multiples'].map(n => (
                      <button key={n} type="button" onClick={() => update('nombreLesions', n)} style={{ flex: 1, padding: '8px', border: data.nombreLesions === n ? '2px solid #0056ff' : '1px solid #eaebef', borderRadius: '8px', background: data.nombreLesions === n ? '#ebf2ff' : 'white', color: data.nombreLesions === n ? '#0056ff' : '#8a94a6', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}>{n}</button>
                    ))}
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {tab === 'animal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                 <label style={labelStyle}>Espèce de l'animal</label>
                 <select value={data.especeAnimal || 'chien'} onChange={e => update('especeAnimal', e.target.value)} style={inputStyle}>
                   <option value="chien">Chien</option>
                   <option value="chat">Chat</option>
                   <option value="autre">Autre</option>
                 </select>
              </div>
              <div>
                 <label style={labelStyle}>Statut de l'animal</label>
                 <select value={data.statutAnimal || 'errant'} onChange={e => update('statutAnimal', e.target.value)} style={inputStyle}>
                   <option value="errant">Errant</option>
                   <option value="domestique">Ayant un propriétaire</option>
                   <option value="sauvage">Sauvage</option>
                 </select>
              </div>
           </div>

           <div style={{ border: '1px solid #eaebef', padding: '16px', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 16px', color: '#1d2129' }}>SORTE DE L'ANIMAL</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['Abattu', 'Mort', 'En fuite', 'En observation'].map(s => (
                  <button key={s} type="button" onClick={() => update('sortAnimal', s)} style={{ padding: '10px 16px', border: data.sortAnimal === s ? '2px solid #0056ff' : '1px solid #eaebef', borderRadius: '50px', background: data.sortAnimal === s ? '#ebf2ff' : 'white', color: data.sortAnimal === s ? '#0056ff' : '#8a94a6', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>{s}</button>
                ))}
              </div>
           </div>

           <div style={{ background: '#fffbeb', padding: '16px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <label style={labelStyle}>Résultats du laboratoire / Vétérinaire</label>
              <input value={data.resultatLabo || ''} onChange={e => update('resultatLabo', e.target.value)} placeholder="Positif, Enragé, Négatif..." style={{...inputStyle, background: 'white'}} />
           </div>
        </div>
      )}

      {tab === 'traitement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
             <div>
                <label style={labelStyle}>Classification du Risque (Grade) *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['I', 'II', 'III'].map(g => (
                    <button key={g} type="button" onClick={() => update('grade', `Grade ${g}`)} style={{ flex: 1, padding: '10px', border: data.grade === `Grade ${g}` ? '2px solid #0056ff' : '1px solid #eaebef', borderRadius: '8px', background: data.grade === `Grade ${g}` ? '#ebf2ff' : 'white', color: data.grade === `Grade ${g}` ? '#0056ff' : '#1d2129', fontWeight: 800, cursor: 'pointer' }}>G{g}</button>
                  ))}
                </div>
             </div>
             <div>
                <label style={labelStyle}>Sérum (ERIG/SAR) Utilisé ?</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => update('erig', true)} style={{ flex: 1, padding: '10px', border: data.erig ? '2px solid #0056ff' : '1px solid #eaebef', borderRadius: '8px', background: data.erig ? '#ebf2ff' : 'white', color: data.erig ? '#0056ff' : '#1d2129', fontWeight: 800, cursor: 'pointer' }}>OUI</button>
                  <button type="button" onClick={() => update('erig', false)} style={{ flex: 1, padding: '10px', border: !data.erig ? '2px solid #ec4899' : '1px solid #eaebef', borderRadius: '8px', background: !data.erig ? '#fff1f2' : 'white', color: !data.erig ? '#ec4899' : '#1d2129', fontWeight: 800, cursor: 'pointer' }}>NON</button>
                </div>
             </div>
           </div>

           {data.erig && (
             <div style={{ background: '#f4f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #eaebef' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px' }}>💉 DÉTAILS DE L'IMMUNOGLOBULINE</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                   <div>
                      <label style={labelStyle}>Lot du Sérum</label>
                      <input value={data.lotSerum || ''} onChange={e => update('lotSerum', e.target.value)} placeholder="Lot N°" style={{...inputStyle, background: 'white'}} />
                   </div>
                   <div>
                      <label style={labelStyle}>Dose théorique (UI)</label>
                      <input type="number" value={data.doseErigUI || ''} onChange={e => update('doseErigUI', e.target.value)} style={{...inputStyle, background: 'white'}} />
                   </div>
                   <div>
                      <label style={labelStyle}>Besredka effectuée ?</label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '13px', fontWeight: 600 }}>
                        <input type="checkbox" checked={data.besredka || false} onChange={e => update('besredka', e.target.checked)} /> OUI
                      </label>
                   </div>
                </div>
             </div>
           )}

           <div style={{ border: '1px solid #eaebef', borderRadius: '12px', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
               <thead style={{ background: '#f4f5f9' }}>
                 <tr>
                   <th style={{ padding: '12px', borderBottom: '1px solid #eaebef' }}>VAR (Jour)</th>
                   <th style={{ padding: '12px', borderBottom: '1px solid #eaebef' }}>Date Administrée</th>
                   <th style={{ padding: '12px', borderBottom: '1px solid #eaebef' }}>Type de Dose</th>
                 </tr>
               </thead>
               <tbody>
                 {['J0', 'J3', 'J7', 'J14', 'J28', 'J90'].map((j) => {
                   const row = data.doses?.[j] || { date: '', type: 'VAR' };
                   return (
                     <tr key={j} style={{ borderBottom: '1px solid #eaebef' }}>
                       <td style={{ padding: '8px', fontWeight: 800 }}>{j}</td>
                       <td><input type="date" value={row.date} onChange={e => update('doses', { ...data.doses, [j]: { ...row, date: e.target.value } })} style={{...inputStyle, padding: '6px', fontSize: '13px', width: '90%'}} /></td>
                       <td>
                          <select value={row.type} onChange={e => update('doses', { ...data.doses, [j]: { ...row, type: e.target.value } })} style={{...inputStyle, padding: '6px', fontSize: '13px', width: '90%'}}>
                            <option value="VAR">VAR</option>
                            <option value="SAR+VAR">SAR+VAR</option>
                          </select>
                       </td>
                     </tr>
                   );
                 })}
               </tbody>
             </table>
           </div>

           <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Observations Médicales</label>
                <input value={data.observations || ''} onChange={e => update('observations', e.target.value)} placeholder="Méthode d'administration, terrain..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Médecin Traitant</label>
                <input value={data.medecin || ''} onChange={e => update('medecin', e.target.value)} placeholder="Dr. XYZ" style={inputStyle} />
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function ProtocoleHepB({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label style={labelStyle}>Schéma *</label>
        <input value={data.schema || ''} onChange={e => set({ ...data, schema: e.target.value })} placeholder="Ex: Standard (0, 1, 6)" style={inputStyle} required />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ background: '#f4f5f9', padding: '16px', borderRadius: '8px' }}>
          <label style={{ ...labelStyle, color: '#1d2129' }}>1ère Dose</label>
          <input type="date" value={data.dose1 || ''} onChange={e => set({ ...data, dose1: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
        </div>
        <div style={{ background: '#f4f5f9', padding: '16px', borderRadius: '8px' }}>
          <label style={{ ...labelStyle, color: '#1d2129' }}>Après 1 mois</label>
          <input type="date" value={data.dose2 || ''} onChange={e => set({ ...data, dose2: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
        </div>
        <div style={{ background: '#f4f5f9', padding: '16px', borderRadius: '8px' }}>
          <label style={{ ...labelStyle, color: '#1d2129' }}>Après 6 mois</label>
          <input type="date" value={data.dose3 || ''} onChange={e => set({ ...data, dose3: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
        </div>
        <div style={{ background: '#f4f5f9', padding: '16px', borderRadius: '8px' }}>
          <label style={{ ...labelStyle, color: '#1d2129' }}>Tous les 10 ans</label>
          <input type="date" value={data.rappel10 || ''} onChange={e => set({ ...data, rappel10: e.target.value })} style={{ ...inputStyle, background: 'white' }} />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Le Médecin</label>
        <input value={data.medecin || ''} onChange={e => set({ ...data, medecin: e.target.value })} placeholder="Dr. XYZ" style={inputStyle} />
      </div>
    </div>
  );
}

function ProtocoleDT({ data, set }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[1, 2, 3, 4].map(num => (
        <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid #eaebef', padding: '12px', borderRadius: '8px' }}>
          <div style={{ width: '80px', fontWeight: 800, color: '#0056ff' }}>{num}° Dose</div>
          <div style={{ flex: 1 }}>
            {num > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#8a94a6', fontWeight: 600 }}>Après</span>
                <input type="number" value={data[`apresMois${num}`] || ''} onChange={e => set({ ...data, [`apresMois${num}`]: e.target.value })} placeholder="X" style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #eaebef', outline: 'none' }} />
                <span style={{ fontSize: '13px', color: '#8a94a6', fontWeight: 600 }}>mois</span>
              </div>
            )}
            <input type="date" value={data[`dose${num}`] || ''} onChange={e => set({ ...data, [`dose${num}`]: e.target.value })} style={{ ...inputStyle, padding: '8px 12px' }} />
          </div>
        </div>
      ))}
      <div>
        <label style={labelStyle}>Le Médecin</label>
        <input value={data.medecin || ''} onChange={e => set({ ...data, medecin: e.target.value })} placeholder="Dr. XYZ" style={inputStyle} />
      </div>
    </div>
  );
}

export default function VaccinModal({ vaccination, patients, onClose, onSave, initialPatientId }) {
  const [form, setForm] = useState(vaccination || { patientId: initialPatientId || '', type: 'rage', protocoleData: { grade: 'Grade II' } });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setProtocole = (data) => set('protocoleData', data);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // --- Algorithme de calcul du prochain rappel ---
    let prochaineDose = null;
    let nomDose = '';

    if (form.type === 'rage') {
      const { dateExposition, doses } = form.protocoleData;
      if (dateExposition) {
        const jArr = [ {k: 'J0', d: 0}, {k: 'J3', d: 3}, {k: 'J7', d: 7}, {k: 'J14', d: 14}, {k: 'J28', d: 28}, {k: 'J90', d: 90} ];
        for (let idx=0; idx<jArr.length; idx++) {
          if (!doses?.[jArr[idx].k]?.date) {
            let exp = new Date(dateExposition);
            exp.setDate(exp.getDate() + jArr[idx].d);
            prochaineDose = exp.toISOString().slice(0, 10);
            nomDose = jArr[idx].k;
            break;
          }
        }
      }
    } else if (form.type === 'hepb') {
      const data = form.protocoleData;
      if (data.dose1 && !data.dose2) {
        let d = new Date(data.dose1); d.setMonth(d.getMonth() + 1); prochaineDose = d.toISOString().slice(0,10); nomDose = 'Après 1 mois';
      } else if (data.dose2 && !data.dose3) {
        let d = new Date(data.dose2); d.setMonth(d.getMonth() + 5); prochaineDose = d.toISOString().slice(0,10); nomDose = 'Après 6 mois';
      } else if (data.dose3 && !data.rappel10) {
        let d = new Date(data.dose3); d.setFullYear(d.getFullYear() + 10); prochaineDose = d.toISOString().slice(0,10); nomDose = 'Rappel 10 ans';
      }
    } else if (form.type === 'dt') {
      const data = form.protocoleData;
      if (data.dose1 && !data.dose2 && data.apresMois2) {
        let d = new Date(data.dose1); d.setMonth(d.getMonth() + parseInt(data.apresMois2)); prochaineDose = d.toISOString().slice(0,10); nomDose = '2° Dose';
      } else if (data.dose2 && !data.dose3 && data.apresMois3) {
        let d = new Date(data.dose2); d.setMonth(d.getMonth() + parseInt(data.apresMois3)); prochaineDose = d.toISOString().slice(0,10); nomDose = '3° Dose';
      } else if (data.dose3 && !data.dose4 && data.apresMois4) {
        let d = new Date(data.dose3); d.setMonth(d.getMonth() + parseInt(data.apresMois4)); prochaineDose = d.toISOString().slice(0,10); nomDose = '4° Dose';
      }
    }

    const payload = { 
      ...form, 
      statut: 'complete', 
      vaccin: PROTOCOLES.find(p=>p.id === form.type)?.label,
      dose: nomDose || 'Terminé',
      dateAdministration: new Date().toISOString(),
      dateProchaineDose: prochaineDose
    };

    if (vaccination?.id) {
      await api.updateVaccination(vaccination.id, payload);
    } else {
      await api.createVaccination(payload);
    }
    onSave();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(29, 33, 41, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '700px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1d2129' }}>{vaccination?.id ? 'Modifier le protocole' : 'Saisir un protocole officiel'}</h2>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6' }} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Patient *</label>
              <select required value={form.patientId} onChange={e => set('patientId', e.target.value)} style={inputStyle}>
                <option value="" disabled>-- Sélectionner le patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.nom} {p.prenom}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type de Certificat (Protocole) *</label>
              <select required value={form.type} onChange={e => set('type', e.target.value)} style={{...inputStyle, background: '#ebf2ff', color: '#0056ff', fontWeight: 700, border: '1px solid #d4e3ff'}}>
                {PROTOCOLES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ borderTop: '2px solid #f4f5f9', paddingTop: '24px' }}>
             {form.type === 'rage' && <ProtocoleRage data={form.protocoleData} set={setProtocole} />}
             {form.type === 'hepb' && <ProtocoleHepB data={form.protocoleData} set={setProtocole} />}
             {form.type === 'dt'   && <ProtocoleDT   data={form.protocoleData} set={setProtocole} />}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 24px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', fontWeight: 700, cursor: 'pointer', color: '#8a94a6' }}>Annuler</button>
            <button type="submit" style={{ padding: '12px 24px', borderRadius: '50px', border: 'none', background: '#0056ff', fontWeight: 700, cursor: 'pointer', color: 'white' }}>
              Enregistrer le Certificat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
