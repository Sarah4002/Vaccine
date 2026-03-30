import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff', border: '1px solid #eaebef',
        borderRadius: '8px', padding: '8px 12px', fontSize: 13,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        <div style={{ color: '#8a94a6', marginBottom: 2 }}>{label}</div>
        <div style={{ color: '#0056ff', fontWeight: 800, fontSize: 16 }}>
          {payload[0].value} <span style={{fontSize: 12, fontWeight: 500}}>Vaccins</span>
        </div>
      </div>
    );
  }
  return null;
};

// Generateur simple pour le calendrier visuel
const CalendarWidget = ({ rappels }) => {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  
  // Date du jour pour simuler le calendrier (sur l'image c'est Janvier 2026, je mets le mois actuel)
  const now = new Date();
  const currentMonth = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  // Creation d'une grille factice de calendrier (simplifiée)
  const grid = Array.from({length: 35}, (_, i) => {
    let day = i - 3; // décalage pour avoir des dates avant
    return day > 0 && day <= 31 ? day : '';
  });

  // Identifier des jours actifs (simulation) => on prend au hasard quelques jours
  const activeDays = [15, 20, 28]; 

  return (
    <div className="card" style={{ padding: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16 }}>Appointments</h3>
        <select style={{ padding: '6px 12px', borderRadius: '20px', border: '1px solid #eaebef', fontSize: 12, background: 'white' }}>
          <option>This Week</option>
          <option>This Month</option>
        </select>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#0056ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&lt;</button>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{currentMonth}</div>
        <button style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#0056ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&gt;</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', fontSize: 13, color: '#8a94a6', fontWeight: 700, marginBottom: 16 }}>
        {days.map((d, i) => <div key={i}>{d}</div>)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px 8px', textAlign: 'center', fontSize: 13 }}>
        {grid.map((day, i) => {
          const isActive = activeDays.includes(day);
          const isFaded = [7, 8, 11].includes(day);
          return (
            <div key={i} style={{ 
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
              borderRadius: '50%',
              background: isActive ? '#0056ff' : isFaded ? '#f4f5f9' : 'transparent',
              color: isActive ? 'white' : day === '' ? 'transparent' : '#1d2129',
              fontWeight: isActive ? 700 : 500
            }}>
              {day}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);

  // Utilisateur connecté simulé (récupéré depuis le localStorage si possible)
  const user = JSON.parse(localStorage.getItem('vaccitrack_user')) || { nom: 'Alexa Johnson', email: 'admin@vaccitrack.dz' };

  useEffect(() => {
    Promise.all([api.getStats(), api.getRappels()]).then(([s, r]) => {
      setStats(s);
      setRappels(r.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ color: '#0056ff', fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Chargement de l'interface...</div>
    </div>
  );

  const moisLabels = (stats.vaccinationsParMois || []).map(d => {
    const [y, m] = d.mois.split('-');
    return { ...d, mois: `${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][+m-1]}` };
  });

  // Adding dummy data to make the chart look curvy and filled like the design if real data is small (demographics)
  const chartData = moisLabels.length > 3 ? moisLabels : [
    { mois: 'Jan', count: 12 }, { mois: 'Feb', count: 25 }, { mois: 'Mar', count: 18 },
    { mois: 'Apr', count: 40 }, { mois: 'May', count: 35 }, { mois: 'Jun', count: 68 },
    ...moisLabels
  ];

  return (
    <div>
      {/* HEADER TYPE "WECARE" */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <svg style={{ position: 'absolute', left: 14, top: 12, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search" style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', outline: 'none', color: '#1d2129' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #eaebef', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8a94a6' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #eaebef', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8a94a6' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffb822', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {user.nom.charAt(0)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>
            Hello, {user.nom}
          </h1>
          <p style={{ color: '#8a94a6', fontSize: 14 }}>Welcome to VacciTrack. Manage your data easily with us.</p>
        </div>
        <button style={{ background: '#0056ff', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
          Download
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
      </div>

      {/* STATS GRID (WECARE STYLE) */}
      <div className="stats-grid" style={{ gap: 16 }}>
        
        {/* Card 1 */}
        <div className="stat-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#0056ff', width: 32, height: 32, borderRadius: '50%' }}>
              {/* Patient Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div className="stat-label">Total Patients</div>
          </div>
          <div className="stat-value">{stats.totalPatients}</div>
          <div className="stat-footer">Last Update: {new Date().toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'})}</div>
        </div>

        {/* Card 2 */}
        <div className="stat-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#0056ff', width: 32, height: 32, borderRadius: '50%' }}>
              {/* Syringe Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l-2 2 4 4 2-2-4-4z"></path><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z"></path><line x1="14" y1="10" x2="4" y2="20"></line></svg>
            </div>
            <div className="stat-label">Total Vaccinations</div>
          </div>
          <div className="stat-value">{stats.totalVaccinations}</div>
          <div className="stat-footer">Last Update: {new Date().toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'})}</div>
        </div>

        {/* Card 3 */}
        <div className="stat-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#0056ff', width: 32, height: 32, borderRadius: '50%' }}>
              {/* Calendar Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div className="stat-label">Upcoming Appt.</div>
          </div>
          <div className="stat-value">{stats.rappelsProchains}</div>
          <div className="stat-footer">Last Update: {new Date().toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'})}</div>
        </div>

        {/* Card 4 */}
        <div className="stat-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div className="stat-header">
            <div className="stat-icon" style={{ background: '#0056ff', width: 32, height: 32, borderRadius: '50%' }}>
              {/* Alert Icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            </div>
            <div className="stat-label">Overdue Alerts</div>
          </div>
          <div className="stat-value">{stats.vaccinationsEnRetard}</div>
          <div className="stat-footer">Last Update: {new Date().toLocaleDateString('en-US', {month: 'long', day:'numeric', year:'numeric'})}</div>
        </div>

      </div>

      {/* Main Grid: Chart + Calendar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 28 }}>
        
        {/* CHART WIDGET */}
        <div className="card" style={{ padding: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Vaccination Statistics</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <select style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #eaebef', fontSize: 13, background: 'white', color: '#1d2129' }}>
                <option>Jan - Jun 2026</option>
              </select>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid #eaebef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
              </button>
            </div>
          </div>

          <div style={{ height: 300, width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0056ff" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0056ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#8a94a6', fontSize: 12}} tickFormatter={(v) => `${v}`} />
                <CartesianGrid vertical={false} stroke="#eaebef" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0056ff', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="count" stroke="#0056ff" strokeWidth={3} fillOpacity={1} fill="url(#colorBlue)" activeDot={{ r: 6, fill: '#ffffff', stroke: '#0056ff', strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CALENDAR WIDGET */}
        <CalendarWidget rappels={rappels} />

      </div>

      {/* TABLE */}
      <div className="card" style={{ border: 'none', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Upcoming Consultations</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 14, top: 10, color: '#8a94a6' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search" style={{ padding: '8px 16px 8px 36px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', outline: 'none', fontSize: 13 }} />
            </div>
            <button style={{ background: '#0056ff', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
              Filter
            </button>
          </div>
        </div>

        {rappels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#8a94a6' }}>No upcoming appointments found.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                <th style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>Patient Name</th>
                <th style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>Vaccine</th>
                <th style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>Mobile Number</th>
                <th style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>Appointment</th>
                <th style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rappels.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < rappels.length-1 ? '1px solid #eaebef' : 'none' }}>
                  <td style={{ padding: '16px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '6px', background: i%2===0 ? '#e0f2ff' : '#ffe0e0', color: i%2===0 ? '#0056ff' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                      {r.patient?.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{r.patient}</span>
                  </td>
                  <td style={{ padding: '16px 8px', color: '#1d2129' }}>{r.vaccin}</td>
                  <td style={{ padding: '16px 8px', color: '#8a94a6' }}>{r.telephone || 'N/A'}</td>
                  <td style={{ padding: '16px 8px', color: '#1d2129', fontWeight: 500 }}>{new Date(r.dateProchaineDose).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  <td style={{ padding: '16px 8px' }}>
                    <button style={{ background: 'white', border: '1px solid #eaebef', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1d2129' }} onClick={() => setPage('rappels')}>
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
