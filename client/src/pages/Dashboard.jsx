import React, { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

// ─── Palette cohérente ────────────────────────────────────────────────────────
const COLORS = {
  blue:   '#0056ff',
  pink:   '#ff6b9d',
  green:  '#00c48c',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#7c5cbf',
  teal:   '#0ea5e9',
  gray:   '#8a94a6',
};

const CHART_COLORS = [
  COLORS.blue, COLORS.pink, COLORS.green, COLORS.amber,
  COLORS.purple, COLORS.teal, COLORS.red, '#f97316',
];

// ─── Filter Panel ─────────────────────────────────────────────────────────────
const FILTER_TYPES = [
  { key: 'annee', label: 'Année', type: 'select', options: [
    { value: '2023', label: '2023' },
    { value: '2024', label: '2024' },
    { value: '2025', label: '2025' },
    { value: '2026', label: '2026' },
  ]},
  { key: 'mois', label: 'Mois', type: 'select', options: [
    { value: '01', label: 'Janvier' }, { value: '02', label: 'Février' }, { value: '03', label: 'Mars' },
    { value: '04', label: 'Avril' },   { value: '05', label: 'Mai' },     { value: '06', label: 'Juin' },
    { value: '07', label: 'Juillet' }, { value: '08', label: 'Août' },    { value: '09', label: 'Septembre' },
    { value: '10', label: 'Octobre' }, { value: '11', label: 'Novembre'}, { value: '12', label: 'Décembre' },
  ]},
  { key: 'sexe',   label: 'Sexe',    type: 'select', options: [{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }] },
  { key: 'ageMin', label: 'Âge min', type: 'number' },
  { key: 'ageMax', label: 'Âge max', type: 'number' },
];

const FilterPanel = ({ filters, setFilters }) => {
  const [open, setOpen]           = useState(false);
  const [draft, setDraft]         = useState(filters);
  const [activeKey, setActiveKey] = useState(null);
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = e => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setDraft(filters); }, [filters]);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const handleApply = () => {
    setFilters(draft);
    setOpen(false);
    setActiveKey(null);
  };

  const handleReset = () => {
    const empty = { annee: '', mois: '', jour: '', sexe: '', ageMin: '', ageMax: '' };
    setDraft(empty);
    setFilters(empty);
    setOpen(false);
    setActiveKey(null);
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', borderRadius: 50,
          border: open || activeCount > 0 ? `1.5px solid ${COLORS.blue}` : '1.5px solid #eaebef',
          background: open || activeCount > 0 ? COLORS.blue + '08' : 'white',
          color: activeCount > 0 ? COLORS.blue : '#1d2129',
          fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke={activeCount > 0 ? COLORS.blue : '#8a94a6'} strokeWidth="2">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
        Filtres
        {activeCount > 0 && (
          <span style={{
            background: COLORS.blue, color: 'white', borderRadius: '50%',
            width: 18, height: 18, fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{activeCount}</span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 999,
          background: 'white', borderRadius: 16, border: '1px solid #eaebef',
          boxShadow: '0 8px 32px rgba(0,0,0,0.10)', width: 320, overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid #f0f1f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, fontSize: 13, color: '#1d2129' }}>Filtrer par</span>
            {activeCount > 0 && (
              <button onClick={handleReset} style={{ background: 'none', border: 'none', fontSize: 11, color: COLORS.red, fontWeight: 600, cursor: 'pointer', padding: '2px 6px' }}>
                Tout effacer
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {FILTER_TYPES.map(f => {
              const hasValue = Boolean(draft[f.key]);
              const isActive = activeKey === f.key;
              return (
                <div key={f.key}>
                  <div
                    onClick={() => setActiveKey(isActive ? null : f.key)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '11px 16px', cursor: 'pointer',
                      background: isActive ? COLORS.blue + '06' : 'white',
                      borderBottom: '1px solid #f0f1f5', transition: 'background .1s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: hasValue ? COLORS.blue : '#e2e4ea' }} />
                      <span style={{ fontSize: 13, color: '#1d2129', fontWeight: hasValue ? 700 : 500 }}>{f.label}</span>
                      {hasValue && (
                        <span style={{ fontSize: 11, background: COLORS.blue + '15', color: COLORS.blue, padding: '1px 8px', borderRadius: 20, fontWeight: 600 }}>
                          {f.type === 'select' ? f.options.find(o => o.value === draft[f.key])?.label || draft[f.key] : draft[f.key]}
                        </span>
                      )}
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke={isActive ? COLORS.blue : '#8a94a6'} strokeWidth="2.5"
                      style={{ transform: isActive ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>

                  {isActive && (
                    <div style={{ padding: '10px 16px 12px', background: '#fafbfc', borderBottom: '1px solid #f0f1f5' }}>
                      {f.type === 'select' ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          <button
                            onClick={() => setDraft(d => ({ ...d, [f.key]: '' }))}
                            style={{
                              padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                              border: !draft[f.key] ? `1.5px solid ${COLORS.blue}` : '1.5px solid #eaebef',
                              background: !draft[f.key] ? COLORS.blue : 'white',
                              color: !draft[f.key] ? 'white' : '#8a94a6', transition: 'all .1s',
                            }}
                          >Tous</button>
                          {f.options.map(opt => (
                            <button key={opt.value}
                              onClick={() => setDraft(d => ({ ...d, [f.key]: opt.value }))}
                              style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                                border: draft[f.key] === opt.value ? `1.5px solid ${COLORS.blue}` : '1.5px solid #eaebef',
                                background: draft[f.key] === opt.value ? COLORS.blue : 'white',
                                color: draft[f.key] === opt.value ? 'white' : '#1d2129', transition: 'all .1s',
                              }}
                            >{opt.label}</button>
                          ))}
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={draft[f.key] || ''}
                          placeholder={`Entrer ${f.label.toLowerCase()}...`}
                          onChange={e => setDraft(d => ({ ...d, [f.key]: e.target.value }))}
                          style={{
                            width: '100%', padding: '8px 12px', borderRadius: 8,
                            border: '1px solid #eaebef', fontSize: 13, outline: 'none',
                            background: 'white', color: '#1d2129',
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{ padding: '12px 16px', display: 'flex', gap: 8, borderTop: '1px solid #f0f1f5' }}>
            <button onClick={() => { setOpen(false); setActiveKey(null); }}
              style={{ flex: 1, padding: '9px', borderRadius: 10, border: '1px solid #eaebef', background: 'white', fontSize: 13, fontWeight: 600, color: '#8a94a6', cursor: 'pointer' }}>
              Annuler
            </button>
            <button onClick={handleApply}
              style={{ flex: 2, padding: '9px', borderRadius: 10, border: 'none', background: COLORS.blue, fontSize: 13, fontWeight: 700, color: 'white', cursor: 'pointer' }}>
              Appliquer les filtres
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tooltip graphique vaccinations ──────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: '#ffffff', border: '1px solid #eaebef',
        borderRadius: '8px', padding: '8px 12px', fontSize: 13,
        boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
      }}>
        <div style={{ color: '#8a94a6', marginBottom: 2 }}>{label}</div>
        <div style={{ color: COLORS.blue, fontWeight: 800, fontSize: 16 }}>
          {payload[0].value} <span style={{ fontSize: 12, fontWeight: 500 }}>Vaccins</span>
        </div>
      </div>
    );
  }
  return null;
};

// ─── Mini stat card ───────────────────────────────────────────────────────────
const MiniCard = ({ label, value, color = COLORS.blue, sub }) => (
  <div style={{ flex: 1, background: color + '10', borderRadius: 10, padding: '10px 14px', minWidth: 80 }}>
    <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 1 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color, marginTop: 2, fontWeight: 600 }}>{sub}</div>}
  </div>
);

// ─── Barre de progression ─────────────────────────────────────────────────────
const ProgressBar = ({ label, value, max, color = COLORS.blue, rank }) => {
  const pct = Math.round((value / (max || 1)) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {rank && (
            <span style={{
              width: 18, height: 18, borderRadius: '50%',
              background: rank <= 3 ? color : '#eaebef',
              color: rank <= 3 ? 'white' : '#8a94a6',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>{rank}</span>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1d2129' }}>{label}</span>
        </div>
        <span style={{ fontSize: 11, color: '#8a94a6' }}>{value}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: '#f0f1f5' }}>
        <div style={{ height: '100%', borderRadius: 3, background: color, width: `${pct}%`, transition: 'width .5s ease' }} />
      </div>
    </div>
  );
};

// ─── Section card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children, action }) => (
  <div className="card" style={{ padding: '18px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
      <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 14, color: '#1d2129', margin: 0 }}>{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

// ─── Calendrier complet avec rappels réels ────────────────────────────────────
const CalendarWidget = ({ rappels, onDayClick }) => {
  const today           = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(today.getDate());
  const [scope, setScope]             = useState('month');
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalRappels, setModalRappels] = useState([]);
  const [modalTitle, setModalTitle]   = useState('');

  const year       = currentDate.getFullYear();
  const month      = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset    = (firstDayOfWeek + 6) % 7;
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Indexer les rappels par jour du mois courant
  const rappelsByDay = {};
  rappels.forEach(r => {
    if (!r.dateProchaineDose) return;
    const d = new Date(r.dateProchaineDose);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!rappelsByDay[day]) rappelsByDay[day] = [];
      rappelsByDay[day].push(r);
    }
  });

  // Semaine courante (Lun → Dim)
  const getWeekDays = () => {
    const now = new Date();
    const dow = (now.getDay() + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - dow);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  };
  const weekDays = getWeekDays();

  const changeMonth = (dir) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
    setSelectedDay(null);
  };

  const statusColor = (r) => r.enRetard ? COLORS.red : r.urgent ? COLORS.amber : COLORS.blue;
  const statusLabel = (r) => r.enRetard ? 'En retard' : r.urgent ? 'Urgent' : 'À venir';

  // Ouvrir le modal ou le panneau inline selon la source
  const openDayDetail = (day, source = 'calendar') => {
    const list = rappelsByDay[day] || [];
    if (list.length === 0) return;
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const label   = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    setModalTitle(label);
    setModalRappels(list);
    setSelectedDay(day);
    if (source === 'week') setModalOpen(true);
  };

  const totalThisMonth = Object.values(rappelsByDay).flat().length;

  return (
    <>
      {/* ── WIDGET ── */}
      <div className="card" style={{ padding: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: '#1d2129', margin: 0 }}>Rappels</h3>
          <select value={scope} onChange={e => { setScope(e.target.value); setSelectedDay(null); }}
            style={{ padding: '5px 10px', borderRadius: 20, border: '1px solid #eaebef', fontSize: 12, background: 'white', cursor: 'pointer' }}>
            <option value="month">Ce mois</option>
            <option value="week">Cette semaine</option>
          </select>
        </div>

        {/* Navigation mois */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <button onClick={() => changeMonth(-1)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: COLORS.blue, color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#1d2129', textTransform: 'capitalize' }}>{monthLabel}</span>
          <button onClick={() => changeMonth(1)} style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: COLORS.blue, color: 'white', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
        </div>

        {/* ── VUE MOIS ── */}
        {scope === 'month' && (
          <>
            {/* En-têtes jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, textAlign: 'center', marginBottom: 4 }}>
              {dayNames.map(d => <div key={d} style={{ fontSize: 10, color: '#8a94a6', fontWeight: 700, padding: '2px 0' }}>{d}</div>)}
            </div>

            {/* Grille jours */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px 2px' }}>
              {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dayRappels = rappelsByDay[day] || [];
                const hasRappel  = dayRappels.length > 0;
                const dateStr    = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                const isToday    = dateStr === todayStr;
                const isSelected = selectedDay === day;
                const hasOverdue = dayRappels.some(r => r.enRetard);
                const hasUrgent  = dayRappels.some(r => r.urgent);
                const dotColor   = hasOverdue ? COLORS.red : hasUrgent ? COLORS.amber : COLORS.blue;
                return (
                  <div
                    key={day}
                    onClick={() => {
                      if (hasRappel) {
                        setSelectedDay(prev => prev === day ? null : day);
                      }
                    }}
                    title={hasRappel ? `${dayRappels.length} rappel(s)` : ''}
                    style={{
                      width: '100%', aspectRatio: '1',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%', fontSize: 11,
                      cursor: hasRappel ? 'pointer' : 'default',
                      background: isSelected ? COLORS.blue : isToday ? '#e8f0ff' : 'transparent',
                      color: isSelected ? 'white' : isToday ? COLORS.blue : '#1d2129',
                      fontWeight: isToday || isSelected ? 700 : 500,
                      border: isToday && !isSelected ? `1.5px solid ${COLORS.blue}` : '1.5px solid transparent',
                      position: 'relative',
                      transition: 'background .15s',
                    }}
                  >
                    {day}
                    {hasRappel && (
                      <span style={{
                        position: 'absolute', bottom: 2,
                        left: '50%', transform: 'translateX(-50%)',
                        width: dayRappels.length > 1 ? 14 : 5, height: 5,
                        borderRadius: 3,
                        background: isSelected ? 'white' : dotColor,
                        fontSize: 8, color: isSelected ? dotColor : 'white',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, lineHeight: 1,
                      }}>
                        {dayRappels.length > 1 ? dayRappels.length : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Légende */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 10, color: '#8a94a6', flexWrap: 'wrap' }}>
              {[[COLORS.blue,'À venir'],[COLORS.amber,'Urgent'],[COLORS.red,'En retard']].map(([c,l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: c, display: 'inline-block' }} />{l}
                </span>
              ))}
            </div>

            {/* Panneau détail jour sélectionné */}
            {selectedDay && rappelsByDay[selectedDay] && (
              <div style={{ marginTop: 12, borderTop: '1px solid #eaebef', paddingTop: 10, maxHeight: 200, overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8a94a6', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                    {selectedDay} {monthLabel} — {rappelsByDay[selectedDay].length} rappel(s)
                  </div>
                  <button
                    onClick={() => setSelectedDay(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a94a6', fontSize: 16, lineHeight: 1, padding: 0 }}
                  >×</button>
                </div>
                {rappelsByDay[selectedDay].map((r, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 8px', borderRadius: 8, background: '#f8f9fb', marginBottom: 4,
                    cursor: 'pointer', transition: 'background .1s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8f9fb'}
                    onClick={() => onDayClick && onDayClick(r)}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor(r), flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1d2129', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.patient}</div>
                      <div style={{ fontSize: 11, color: '#8a94a6' }}>{r.vaccin}</div>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 10, background: statusColor(r) + '20', color: statusColor(r), flexShrink: 0 }}>
                      {statusLabel(r)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── VUE SEMAINE ── */}
        {scope === 'week' && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#8a94a6', marginBottom: 8, fontWeight: 600 }}>
              Semaine du {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            </div>
            {weekDays.map((d, i) => {
              const dayNum = d.getDate(), dayMonth = d.getMonth(), dayYear = d.getFullYear();
              const dayRappels = rappels.filter(r => {
                if (!r.dateProchaineDose) return false;
                const rd = new Date(r.dateProchaineDose);
                return rd.getDate() === dayNum && rd.getMonth() === dayMonth && rd.getFullYear() === dayYear;
              });
              const isToday = d.toDateString() === today.toDateString();
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: i < 6 ? '1px solid #f0f1f5' : 'none' }}>
                  <div style={{ minWidth: 36, textAlign: 'center', background: isToday ? COLORS.blue : 'transparent', borderRadius: 8, padding: '3px 4px', flexShrink: 0 }}>
                    <div style={{ fontSize: 9, color: isToday ? 'rgba(255,255,255,.7)' : '#8a94a6', fontWeight: 700 }}>{dayNames[i]}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isToday ? 'white' : '#1d2129' }}>{dayNum}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    {dayRappels.length === 0
                      ? <div style={{ fontSize: 11, color: '#c5c9d6', paddingTop: 6 }}>—</div>
                      : dayRappels.map((r, j) => (
                        <div
                          key={j}
                          onClick={() => { openDayDetail(dayNum, 'week'); setModalRappels([r]); setModalTitle(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })); setModalOpen(true); }}
                          style={{
                            fontSize: 11, padding: '4px 8px', borderRadius: 6, marginBottom: 3,
                            background: statusColor(r) + '18', color: statusColor(r),
                            fontWeight: 600, display: 'flex', justifyContent: 'space-between',
                            cursor: 'pointer', transition: 'opacity .1s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = '.75'}
                          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{r.patient}</span>
                          <span style={{ opacity: .7, fontSize: 10 }}>{r.vaccin?.split(' ')[0]}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── COMPTEURS BAS ── */}
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          {[
            { label: 'Ce mois',   count: totalThisMonth,                            color: COLORS.blue  },
            { label: 'Urgents',   count: rappels.filter(r => r.urgent).length,      color: COLORS.amber },
            { label: 'En retard', count: rappels.filter(r => r.enRetard).length,    color: COLORS.red   },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, textAlign: 'center', background: s.color + '12', borderRadius: 8, padding: '6px 4px', cursor: 'default' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color }}>{s.count}</div>
              <div style={{ fontSize: 10, color: '#8a94a6' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── MODAL DÉTAIL (vue semaine) ── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 18, padding: '22px 24px',
              width: 360, maxHeight: '80vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#1d2129', textTransform: 'capitalize' }}>{modalTitle}</div>
                <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>{modalRappels.length} rappel(s)</div>
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: '#f0f1f5', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a94a6' }}>×</button>
            </div>
            {modalRappels.map((r, i) => (
              <div key={i} style={{
                display: 'flex', gap: 12, padding: '12px', borderRadius: 12,
                background: '#f8f9fb', marginBottom: 8,
                border: `1px solid ${statusColor(r)}30`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: statusColor(r) + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: statusColor(r) }}>{r.patient?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1d2129' }}>{r.patient}</div>
                  <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 2 }}>{r.vaccin}</div>
                  {r.telephone && <div style={{ fontSize: 11, color: '#8a94a6', marginTop: 2 }}>📞 {r.telephone}</div>}
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10, background: statusColor(r) + '20', color: statusColor(r) }}>
                      {statusLabel(r)}
                    </span>
                    {r.joursRestants !== undefined && (
                      <span style={{ fontSize: 10, color: '#8a94a6' }}>
                        {r.joursRestants < 0 ? `${Math.abs(r.joursRestants)}j de retard` : r.joursRestants === 0 ? "Aujourd'hui" : `Dans ${r.joursRestants}j`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard({ setPage }) {
  const currentYear = String(new Date().getFullYear());
  const calendarSectionRef = useRef(null);

  const [stats, setStats]               = useState(null);
  const [rappels, setRappels]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
 
  const [search, setSearch]             = useState('');
  const [filters, setFilters]           = useState({ annee: currentYear, mois: '', jour: '', sexe: '', ageMin: '', ageMax: '' });
  const [tableStatusFilter, setTableStatusFilter] = useState('all');
  const [tableFilterOpen, setTableFilterOpen]     = useState(false);
  const [notificationOpen, setNotificationOpen]   = useState(false);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  });

  const user = JSON.parse(localStorage.getItem('vaccitrack_user')) || { nom: 'Alexa Johnson', email: 'admin@vaccitrack.dz' };

  const normalizeRappels = (items) => {
    const now = new Date();
    return items.map(v => {
      const jours = Math.ceil((new Date(v.dateProchaineDose) - now) / 86400000);
      return { ...v, joursRestants: jours, urgent: jours <= 7 && jours >= 0, enRetard: jours < 0 };
    });
  };

  const loadDashboardData = async (activeFilters = {}) => {
    const [s, r] = await Promise.all([api.getStats(activeFilters), api.getRappels()]);
    setStats(s);
    setRappels(normalizeRappels(r));
  };

  // Chargement initial avec année courante
  useEffect(() => {
    loadDashboardData({ annee: currentYear })
      .finally(() => setLoading(false));
  }, []);

  // Rechargement stats à chaque changement de filtres (hors montage)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setStatsLoading(true);
    api.getStats(filters).then(s => {
      setStats(s);
      setStatsLoading(false);
    });
  }, [filters]);

  useEffect(() => {
    const closeFilterMenu = () => setTableFilterOpen(false);
    document.addEventListener('click', closeFilterMenu);
    return () => document.removeEventListener('click', closeFilterMenu);
  }, []);

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const todaysAppointments = rappels.filter(r => r.dateProchaineDose && r.dateProchaineDose.slice(0, 10) === todayKey);
  const urgentNotificationCount = rappels.filter(r => r.urgent || r.enRetard).length;
  const notificationBadgeCount = todaysAppointments.length > 0 ? todaysAppointments.length : urgentNotificationCount;

  useEffect(() => {
    setNotificationOpen(todaysAppointments.length > 0);
  }, [todaysAppointments.length]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('app_theme', next);
  };

  const openCalendarSection = () => {
    setNotificationOpen(false);
    calendarSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
      <div style={{ color: COLORS.blue, fontFamily: 'Syne', fontSize: 18, fontWeight: 700 }}>Chargement de l'interface...</div>
    </div>
  );

  const moisLabels = (stats.vaccinationsParMois || []).map(d => {
    const [, m] = d.mois.split('-');
    return { ...d, mois: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][+m - 1] };
  });

  const searchTerm = search.trim().toLowerCase();
  const tableRappels = rappels
    .filter(r =>
      !searchTerm ||
      r.patient?.toLowerCase().includes(searchTerm) ||
      r.vaccin?.toLowerCase().includes(searchTerm) ||
      r.telephone?.toLowerCase().includes(searchTerm)
    )
    .filter(r => {
      if (tableStatusFilter === 'urgent')   return r.urgent;
      if (tableStatusFilter === 'overdue')  return r.enRetard;
      if (tableStatusFilter === 'upcoming') return !r.urgent && !r.enRetard;
      return true;
    })
    .slice(0, 5);

  const sexeData     = (stats.parSexe || []).map(s => ({ name: s.sexe === 'M' ? 'Hommes' : s.sexe === 'F' ? 'Femmes' : s.sexe, value: s.count }));
  const topVaccins   = (stats.vaccinationsParVaccin || []).slice(0, 6);
  const maxVaccin    = topVaccins[0]?.count || 1;
  const topWilayas   = (stats.parWilaya || []).slice(0, 6);
  const maxWilaya    = topWilayas[0]?.count || 1;
  const topFonctions = (stats.parFonction || []).slice(0, 5);
  const maxFonction  = topFonctions[0]?.count || 1;
  const ageData      = stats.parAge || [];
  const typeData     = (stats.vaccinationsParType || []).slice(0, 5);
  const statutData   = stats.vaccinationsParStatut || [];
  const gradeData    = stats.vaccinationsParGrade || [];
  const totalSexe    = sexeData.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ position: 'relative', width: '350px' }}>
          <svg style={{ position: 'absolute', left: 14, top: 12, color: '#8a94a6' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', outline: 'none', color: '#1d2129' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Cloche rappels */}
          <div style={{ position: 'relative' }}>
            <div
              style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: 'white', border: '1px solid #eaebef', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: notificationOpen ? COLORS.blue : '#8a94a6' }}
              onClick={() => {
                if (todaysAppointments.length > 0) {
                  setNotificationOpen(open => !open);
                  return;
                }
                setPage('rappels');
              }}
              title={todaysAppointments.length > 0 ? 'Notifications du jour' : 'Voir les rappels'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {notificationBadgeCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, minWidth: todaysAppointments.length > 0 ? 18 : 8, height: todaysAppointments.length > 0 ? 18 : 8, padding: todaysAppointments.length > 0 ? '0 5px' : 0, borderRadius: '999px', background: todaysAppointments.length > 0 ? COLORS.blue : COLORS.red, border: '1.5px solid white', color: 'white', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {todaysAppointments.length > 0 ? todaysAppointments.length : ''}
                </span>
              )}
            </div>

            {notificationOpen && todaysAppointments.length > 0 && (
              <div style={{ position: 'absolute', top: 50, right: 0, width: 300, background: 'white', border: `1px solid ${COLORS.blue}22`, borderRadius: 16, boxShadow: '0 18px 40px rgba(0,0,0,0.12)', padding: 16, zIndex: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS.blue + '14', color: COLORS.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#1d2129', marginBottom: 4 }}>
                      Nouveau rendez-vous aujourd'hui
                    </div>
                    <div style={{ fontSize: 12, lineHeight: 1.5, color: '#5b6474' }}>
                      Il y a {todaysAppointments.length} nouveau{todaysAppointments.length > 1 ? 'x' : ''}  rendez-vous est prévu aujourd'hui. Consultez votre calendrier.

Voir le calendrier
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={openCalendarSection}
                    style={{ flex: 1, border: 'none', borderRadius: 10, background: COLORS.blue, color: 'white', fontWeight: 700, fontSize: 12, padding: '10px 12px', cursor: 'pointer' }}
                  >
                    Voir le calendrier
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    style={{ border: '1px solid #eaebef', borderRadius: 10, background: 'white', color: '#8a94a6', fontWeight: 700, fontSize: 12, padding: '10px 12px', cursor: 'pointer' }}
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Toggle thème */}
          <button type="button" onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px', borderRadius: 999, background: 'white', border: '1px solid #eaebef', cursor: 'pointer' }}>
            {[
              { mode: 'dark',  icon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /> },
              { mode: 'light', icon: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2m-7.07-14.07 1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2m-4.34 5.66-1.41 1.41M6.34 6.34 4.93 4.93" /></> },
            ].map(({ mode, icon }) => (
              <span key={mode} style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: theme === mode ? COLORS.blue : 'transparent', color: theme === mode ? 'white' : '#8a94a6', transition: 'all .2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{icon}</svg>
              </span>
            ))}
          </button>

          {/* Avatar */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#ffb822', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
            {user.nom.charAt(0)}
          </div>
        </div>
      </div>

     

      {/* ── FILTRES ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <FilterPanel filters={filters} setFilters={setFilters} />
        {Object.entries(filters).filter(([, v]) => v).map(([k, v]) => {
          const def = FILTER_TYPES.find(f => f.key === k);
          const label = def?.type === 'select'
            ? def.options.find(o => o.value === v)?.label || v
            : `${def?.label} : ${v}`;
          return (
            <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px 5px 12px', borderRadius: 20, background: COLORS.blue + '12', border: `1px solid ${COLORS.blue}30`, fontSize: 11, fontWeight: 600, color: COLORS.blue }}>
              {label}
              <button onClick={() => setFilters(prev => ({ ...prev, [k]: '' }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: COLORS.blue, opacity: .6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </span>
          );
        })}
        {statsLoading && (
          <span style={{ fontSize: 12, color: COLORS.blue, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={COLORS.blue} strokeWidth="2.5" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Mise à jour…
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </span>
        )}
      </div>

      {/* ── KPI CARDS ── */}
      <div className="stats-grid" style={{ gap: 16 }}>
        {[
          { icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>, label: 'Total Patients',     val: stats.totalPatients,         page: 'patients' },
          { icon: <><path d="M12 2l-2 2 4 4 2-2-4-4z" /><path d="M10 4L2 12l2 2-2 2 2 2 2-2 2 2 8-8-8-8z" /><line x1="14" y1="10" x2="4" y2="20" /></>,  label: 'Total Vaccinations', val: stats.totalVaccinations,     page: 'vaccinations' },
          { icon: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>, label: 'Upcoming Appt.',     val: stats.rappelsProchains,      page: 'rappels' },
          { icon: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,                 label: 'Overdue Alerts',    val: stats.vaccinationsEnRetard, page: 'rappels', danger: true },
        ].map((c, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px', position: 'relative', overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', cursor: 'pointer' }} onClick={() => setPage(c.page)}>
            <div className="stat-header">
              <div className="stat-icon" style={{ background: c.danger ? COLORS.red : COLORS.blue, width: 32, height: 32, borderRadius: '50%' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{c.icon}</svg>
              </div>
              <div className="stat-label">{c.label}</div>
            </div>
            <div className="stat-value" style={{ color: c.danger && stats.vaccinationsEnRetard > 0 ? COLORS.red : undefined }}>{c.val}</div>
            <div className="stat-footer">Last Update : {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
        ))}
      </div>

      {/* ── CHART + CALENDAR ── */}
      <div ref={calendarSectionRef} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginTop: 20, marginBottom: 28 }}>
        {/* Graphique vaccinations */}
        <div className="card" style={{ padding: '16px', border: 'none', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Vaccination Statistics</h3>
            <div style={{ display: 'flex', gap: 12 }}>
              <select style={{ padding: '6px 16px', borderRadius: '20px', border: '1px solid #eaebef', fontSize: 13, background: 'white', color: '#1d2129' }}>
                <option>Jan - Déc</option>
              </select>
              <button style={{ width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid #eaebef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a94a6" strokeWidth="2"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
              </button>
            </div>
          </div>
          <div style={{ height: 300, width: '100%', marginLeft: '-20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={moisLabels} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={COLORS.blue} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.blue} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="mois" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 12 }} />
                <CartesianGrid vertical={false} stroke="#eaebef" strokeDasharray="3 3" />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: COLORS.blue, strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Area type="monotone" dataKey="count" stroke={COLORS.blue} strokeWidth={3} fillOpacity={1} fill="url(#colorBlue)" activeDot={{ r: 6, fill: '#ffffff', stroke: COLORS.blue, strokeWidth: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendrier rappels */}
        <CalendarWidget
          rappels={rappels}
          onDayClick={(r) => setPage('rappels')}
        />
      </div>

      {/* ── LIGNE 1 : Sexe + Âge + Types ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1.4fr', gap: 16, marginTop: 20 }}>

        {/* Répartition par sexe */}
        <SectionCard title="Répartition par sexe">
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <PieChart width={160} height={160}>
              <Pie data={sexeData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                {sexeData.map((s, i) => (
                  <Cell key={i} fill={s.name.toLowerCase().startsWith('homme') ? COLORS.blue : COLORS.pink} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, 'patients']} />
            </PieChart>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {sexeData.map((s, i) => {
              const color = s.name.toLowerCase().startsWith('homme') ? COLORS.blue : COLORS.pink;
              return (
                <div key={i} style={{ flex: 1, textAlign: 'center', background: color + '12', borderRadius: 8, padding: '6px 4px' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#8a94a6' }}>{s.name}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color }}>{totalSexe > 0 ? Math.round((s.value / totalSexe) * 100) : 0}%</div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        {/* Tranches d'âge */}
        <SectionCard title="Patients par tranche d'âge">
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={ageData} margin={{ left: -20, right: 4, bottom: 0 }}>
              <XAxis dataKey="tranche" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 10 }} />
              <CartesianGrid vertical={false} stroke="#eaebef" strokeDasharray="3 3" />
              <Tooltip formatter={(v) => [v, 'patients']} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {ageData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>

        {/* Types de vaccination */}
        <SectionCard title="Types de vaccination">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {typeData.length === 0
              ? <div style={{ textAlign: 'center', color: '#8a94a6', fontSize: 12, padding: '40px 0' }}>Aucune donnée</div>
              : typeData.map((t, i) => {
                const max = typeData[0]?.count || 1;
                return (
                  <div key={i} style={{ padding: '7px 0', borderBottom: i < typeData.length - 1 ? '1px solid #f0f1f5' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: '#1d2129', fontWeight: 600, maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.type}</span>
                      <span style={{ fontSize: 11, color: '#8a94a6' }}>{t.count}</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#f0f1f5' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: CHART_COLORS[i], width: `${Math.round((t.count / max) * 100)}%` }} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </SectionCard>
      </div>

      {/* ── LIGNE 2 : Top vaccins + Top wilayas + Statuts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr', gap: 16, marginTop: 16 }}>

        <SectionCard title="Top vaccins administrés">
          {topVaccins.length === 0
            ? <div style={{ textAlign: 'center', color: '#8a94a6', fontSize: 12, padding: '40px 0' }}>Aucune donnée</div>
            : topVaccins.map((v, i) => <ProgressBar key={i} label={v.vaccin} value={v.count} max={maxVaccin} color={CHART_COLORS[i % CHART_COLORS.length]} rank={i + 1} />)
          }
        </SectionCard>

        <SectionCard title="Patients par wilaya">
          {topWilayas.length === 0
            ? <div style={{ textAlign: 'center', color: '#8a94a6', fontSize: 12, padding: '40px 0' }}>Aucune donnée</div>
            : topWilayas.map((w, i) => <ProgressBar key={i} label={w.wilaya} value={w.count} max={maxWilaya} color={COLORS.teal} rank={i + 1} />)
          }
        </SectionCard>

        <SectionCard title="Statuts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {statutData.map((s, i) => {
              const color = s.statut === 'complete' ? COLORS.green : s.statut === 'en_cours' ? COLORS.blue : COLORS.amber;
              const label = s.statut === 'complete' ? 'Complet' : s.statut === 'en_cours' ? 'En cours' : s.statut;
              const total = statutData.reduce((a, b) => a + b.count, 0);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#1d2129', flex: 1 }}>{label}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{s.count}</span>
                  <span style={{ fontSize: 10, color: '#8a94a6', minWidth: 28, textAlign: 'right' }}>
                    {total > 0 ? Math.round((s.count / total) * 100) : 0}%
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* ── LIGNE 3 : Fonctions + Grades (si dispo) ── */}
      {(topFonctions.length > 0 || gradeData.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: gradeData.length > 0 ? '1fr 1fr' : '1fr', gap: 16, marginTop: 16 }}>
          {topFonctions.length > 0 && (
            <SectionCard title="Répartition par fonction">
              {topFonctions.map((f, i) => <ProgressBar key={i} label={f.fonction} value={f.count} max={maxFonction} color={COLORS.purple} rank={i + 1} />)}
            </SectionCard>
          )}
          {gradeData.length > 0 && (
            <SectionCard title="Grades anti-rabiques">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={gradeData} margin={{ left: -20, right: 4 }}>
                  <XAxis dataKey="grade" axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8a94a6', fontSize: 11 }} />
                  <CartesianGrid vertical={false} stroke="#eaebef" strokeDasharray="3 3" />
                  <Tooltip formatter={(v) => [v, 'vaccinations']} />
                  <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          )}
        </div>
      )}

      {/* ── TABLE UPCOMING ── */}
      <div className="card" style={{ border: 'none', padding: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18 }}>Upcoming Consultations</h3>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <svg style={{ position: 'absolute', left: 14, top: 10, color: '#8a94a6' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 16px 8px 36px', borderRadius: '50px', border: '1px solid #eaebef', background: 'white', outline: 'none', fontSize: 13 }} />
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={e => { e.stopPropagation(); setTableFilterOpen(o => !o); }}
                style={{ background: COLORS.blue, color: 'white', border: 'none', padding: '8px 20px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                {tableStatusFilter === 'all' ? 'Filter' : tableStatusFilter === 'urgent' ? 'Urgent' : tableStatusFilter === 'overdue' ? 'En retard' : 'À venir'}
              </button>
              {tableFilterOpen && (
                <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 180, background: 'white', border: '1px solid #eaebef', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.10)', overflow: 'hidden', zIndex: 10 }}>
                  {[{ id: 'all', label: 'Tous' }, { id: 'upcoming', label: 'À venir' }, { id: 'urgent', label: 'Urgent' }, { id: 'overdue', label: 'En retard' }].map(opt => (
                    <button key={opt.id} onClick={() => { setTableStatusFilter(opt.id); setTableFilterOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', background: tableStatusFilter === opt.id ? COLORS.blue + '12' : 'white', color: tableStatusFilter === opt.id ? COLORS.blue : '#1d2129', fontSize: 12, fontWeight: tableStatusFilter === opt.id ? 700 : 500, cursor: 'pointer' }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {tableRappels.length === 0
          ? <div style={{ textAlign: 'center', padding: '40px', color: '#8a94a6' }}>No upcoming appointments found.</div>
          : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#8a94a6', borderBottom: '1px solid #eaebef' }}>
                  {['Patient Name', 'Vaccine', 'Mobile Number', 'Appointment', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '16px 8px', textAlign: 'left', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRappels.map((r, i) => {
                  const sColor = r.enRetard ? COLORS.red : r.urgent ? COLORS.amber : COLORS.blue;
                  const sLabel = r.enRetard ? 'En retard' : r.urgent ? 'Urgent' : 'À venir';
                  return (
                    <tr key={r.id} style={{ borderBottom: i < tableRappels.length - 1 ? '1px solid #eaebef' : 'none' }}>
                      <td style={{ padding: '16px 8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 32, height: 32, borderRadius: '6px', background: i % 2 === 0 ? '#e0f2ff' : '#ffe0e0', color: i % 2 === 0 ? COLORS.blue : COLORS.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                            {r.patient?.charAt(0)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{r.patient}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 8px', color: '#1d2129' }}>{r.vaccin}</td>
                      <td style={{ padding: '16px 8px', color: '#8a94a6' }}>{r.telephone || 'N/A'}</td>
                      <td style={{ padding: '16px 8px', color: '#1d2129', fontWeight: 500 }}>
                        {new Date(r.dateProchaineDose).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ background: sColor + '20', color: sColor, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{sLabel}</span>
                      </td>
                      <td style={{ padding: '16px 8px' }}>
                        <button onClick={() => setPage('rappels')} style={{ background: 'white', border: '1px solid #eaebef', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#1d2129' }}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        }
      </div>
    </div>
  );
}
