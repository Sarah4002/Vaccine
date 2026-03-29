import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#00d4aa', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#111827', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8, padding: '10px 14px', fontSize: 13
      }}>
        <div style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#00d4aa', fontWeight: 700 }}>{payload[0].value} vaccination(s)</div>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [rappels, setRappels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getStats(), api.getRappels()]).then(([s, r]) => {
      setStats(s);
      setRappels(r.slice(0, 5));
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ color: '#00d4aa', fontFamily: 'Syne', fontSize: 18 }}>Chargement...</div>
    </div>
  );

  const moisLabels = (stats.vaccinationsParMois || []).map(d => {
    const [y, m] = d.mois.split('-');
    return { ...d, mois: `${['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][+m-1]} ${y}` };
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tableau de bord</h1>
          <p className="page-subtitle">Vue d'ensemble du système de suivi vaccinal</p>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card green">
          <div className="stat-icon"></div>
          <div className="stat-value">{stats.totalPatients}</div>
          <div className="stat-label">Patients enregistrés</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon"></div>
          <div className="stat-value">{stats.totalVaccinations}</div>
          <div className="stat-label">Vaccinations effectuées</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-icon"></div>
          <div className="stat-value">{stats.rappelsProchains}</div>
          <div className="stat-label">Rappels dans 30 jours</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon"></div>
          <div className="stat-value">{stats.vaccinationsEnRetard}</div>
          <div className="stat-label">Vaccinations en retard</div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
            Vaccinations par mois
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moisLabels} barSize={28}>
              <XAxis dataKey="mois" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" fill="#00d4aa" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: 20, fontSize: 16 }}>
            Répartition par vaccin
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={stats.vaccinationsParVaccin} dataKey="count" nameKey="vaccin"
                cx="50%" cy="50%" outerRadius={80} label={({ vaccin, percent }) =>
                  `${vaccin} (${(percent * 100).toFixed(0)}%)`
                } labelLine={false}>
                {(stats.vaccinationsParVaccin || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, name]} contentStyle={{
                background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8
              }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Rappels à venir */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16 }}>Prochains rappels</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setPage('rappels')}>Voir tous →</button>
        </div>

        {rappels.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"></div>
            <div className="empty-title">Aucun rappel imminent</div>
            <p>Tous les vaccins sont à jour.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Patient</th>
                <th>Vaccin</th>
                <th>Date rappel</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {rappels.map(r => (
                <tr key={r.id}>
                  <td>
                    <div className="patient-cell">
                      <div className="avatar">{r.patient?.split(' ').map(n => n[0]).join('').slice(0,2)}</div>
                      {r.patient}
                    </div>
                  </td>
                  <td>{r.vaccin}</td>
                  <td>{new Date(r.dateProchaineDose).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`badge ${r.enRetard ? 'badge-danger' : r.urgent ? 'badge-warning' : 'badge-info'}`}>
                      {r.enRetard ? 'En retard' : r.urgent ? `${r.joursRestants}j` : `${r.joursRestants}j`}
                    </span>
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
