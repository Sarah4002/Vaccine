import React, { useEffect, useState, useMemo } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';
import { MapContainer, TileLayer, Marker, useMap, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import 'leaflet/dist/leaflet.css';

const COMMUNES = [
  { code: '01', name: 'Tlemcen' }, { code: '02', name: 'Beni Mester' }, { code: '03', name: 'Aïn Tallout' },
  { code: '04', name: 'Remchi' }, { code: '05', name: 'El Fehoul' }, { code: '06', name: 'Sabra' },
  { code: '07', name: 'Ghazaouet' }, { code: '08', name: 'Souani' }, { code: '09', name: 'Djebala' },
  { code: '10', name: 'El Gor' }, { code: '11', name: 'Oued Lakhdar' }, { code: '12', name: 'Aïn Fezza' },
  { code: '13', name: 'Ouled Mimoun' }, { code: '14', name: 'Amieur' }, { code: '15', name: 'Aïn Youcef' },
  { code: '16', name: 'Zenata' }, { code: '17', name: 'Beni Snous' }, { code: '18', name: 'Bab El Assa' },
  { code: '19', name: 'Dar Yaghmouracene' }, { code: '20', name: 'Fellaoucene' }, { code: '21', name: 'Azaïls' },
  { code: '22', name: 'Sebaa Chioukh' }, { code: '23', name: 'Terny Beni Hdiel' }, { code: '24', name: 'Bensekrane' },
  { code: '25', name: 'Aïn Nehala' }, { code: '26', name: 'Hennaya' }, { code: '27', name: 'Maghnia' },
  { code: '28', name: 'Hammam Boughrara' }, { code: '29', name: 'Souahlia' }, { code: '30', name: "M'Sirda Fouaga" },
  { code: '31', name: 'Aïn Fetah' }, { code: '32', name: 'El Aricha' }, { code: '33', name: 'Souk Tlata' },
  { code: '34', name: 'Sidi Abdelli' }, { code: '35', name: 'Sebdou' }, { code: '36', name: 'Beni Ouarsous' },
  { code: '37', name: 'Sidi Medjahed' }, { code: '38', name: 'Beni Boussaid' }, { code: '39', name: "Marsa Ben M'Hidi" },
  { code: '40', name: 'Nedroma' }, { code: '41', name: 'Sidi Djillali' }, { code: '42', name: 'Beni Bahdel' },
  { code: '43', name: 'El Bouihi' }, { code: '44', name: 'Honaïne' }, { code: '45', name: 'Tienet' },
  { code: '46', name: 'Ouled Riyah' }, { code: '47', name: 'Bouhlou' }, { code: '48', name: 'Beni Khellad' },
  { code: '49', name: 'Aïn Ghoraba' }, { code: '50', name: 'Chetouane' }, { code: '51', name: 'Mansourah' },
  { code: '52', name: 'Beni Semiel' }, { code: '53', name: 'Aïn Kebira' }
];

const COMMUNE_COORDS = {
  'Tlemcen': [34.8781, -1.3160], 'Beni Mester': [34.7858, -1.3269], 'Aïn Tallout': [34.8281, -1.6798],
  'Remchi': [35.1539, -1.5962], 'El Fehoul': [34.9573, -1.7058], 'Sabra': [34.9681, -1.6753],
  'Ghazaouet': [35.1307, -1.7802], 'Souani': [35.0891, -1.5208], 'Djebala': [34.8548, -1.1906],
  'El Gor': [34.3598, -1.1141], 'Oued Lakhdar': [34.8723, -1.4120], 'Aïn Fezza': [34.8804, -1.2202],
  'Ouled Mimoun': [34.9037, -1.0343], 'Amieur': [35.0415, -1.3619], 'Aïn Youcef': [35.0115, -1.4619],
  'Zenata': [35.0415, -1.3619], 'Beni Snous': [34.7042, -1.5647], 'Bab El Assa': [35.0252, -1.7196],
  'Dar Yaghmouracene': [35.0340, -1.7740], 'Fellaoucene': [35.0440, -1.6740], 'Azaïls': [34.6289, -1.4385],
  'Sebaa Chioukh': [35.1055, -1.2819], 'Terny Beni Hdiel': [34.7936, -1.3275], 'Bensekrane': [35.1841, -1.2063],
  'Aïn Nehala': [35.1000, -1.1500], 'Hennaya': [34.9392, -1.3601], 'Maghnia': [34.8436, -1.7303],
  'Hammam Boughrara': [34.8427, -1.6033], 'Souahlia': [35.0340, -1.7740], "M'Sirda Fouaga": [35.0400, -1.8300],
  'Aïn Fetah': [34.8850, -1.6410], 'El Aricha': [34.2520, -1.3516], 'Souk Tlata': [35.1180, -1.6510],
  'Sidi Abdelli': [35.1620, -1.1970], 'Sebdou': [34.6400, -1.3200], 'Beni Ouarsous': [35.1650, -1.4000],
  'Sidi Medjahed': [34.8300, -1.7500], 'Beni Boussaid': [34.8100, -1.8400], "Marsa Ben M'Hidi": [35.0800, -1.8900],
  'Nedroma': [35.0134, -1.7479], 'Sidi Djillali': [34.4231, -1.4886], 'Beni Bahdel': [34.7214, -1.4960],
  'El Bouihi': [34.4100, -1.6500], 'Honaïne': [35.1728, -1.6541], 'Tienet': [35.0700, -1.7500],
  'Ouled Riyah': [35.0400, -1.4900], 'Bouhlou': [34.8240, -1.6600], 'Beni Khellad': [35.0400, -1.7200],
  'Aïn Ghoraba': [34.8200, -1.4250], 'Chetouane': [34.9224, -1.2917], 'Mansourah': [34.8715, -1.3361],
  'Beni Semiel': [34.8200, -1.2800], 'Aïn Kebira': [35.0300, -1.2000]
};

const COLORS = ['#0056ff', '#4385f5', '#22c55e', '#ffb822', '#ef4444', '#8b5cf6'];

function MapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

const createExtremeIcon = (count, isSelected, isHovered) => {
  let color = '#22c55e';
  let tier = 1;

  if (count > 200) { color = '#ef4444'; tier = 3; }
  else if (count > 50) { color = '#ffb822'; tier = 2; }
  else if (count > 10) { color = '#0056ff'; tier = 1; }

  // Cercle proportionnel au nombre de patients (beaucoup plus grand si le nombre est élevé)
  const baseSize = isSelected || isHovered ? 70 : Math.max(25, Math.min(250, count > 0 ? 30 + Math.pow(count, 0.65) * 4 : 20));
  const size = baseSize;

  const pulseRings = tier === 3 ? `
    <div class="sig-marker-pulse-1" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
    <div class="sig-marker-pulse-2" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
    <div class="sig-marker-pulse-3" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
    <div class="sig-marker-ring-complex" style="color: ${color}; width: ${size * 1.2}px; height: ${size * 1.2}px;"></div>
  ` : tier === 2 ? `
    <div class="sig-marker-pulse-1" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
    <div class="sig-marker-pulse-2" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
  ` : isSelected || isHovered ? `
    <div class="sig-marker-pulse-1" style="color: ${color}; width: ${size}px; height: ${size}px;"></div>
  ` : '';

  const svg = `
    <div class="sig-marker-pin-wrapper" style="width: ${size}px; height: ${size}px;">
      <div class="sig-marker-content ${tier === 3 ? 'sig-marker-rotate' : ''}">
        <div class="sig-marker-glow" style="width: ${size}px; height: ${size}px; background: ${color}; box-shadow: 0 0 ${size}px ${color};"></div>
        ${pulseRings}
        <div class="sig-marker-dot" style="width: ${size / 2}px; height: ${size / 2}px; background: ${color}; border: 3px solid white; border-radius: 50%; z-index: 5; box-shadow: 0 4px 10px rgba(0,0,0,0.3);"></div>
        ${(tier >= 2 || isSelected) ? `<div class="sig-marker-label-extreme" style="color: ${color}; border-color: ${color};">${count} Patients</div>` : ''}
      </div>
    </div>
  `;

  return L.divIcon({
    html: svg,
    className: 'sig-extreme-div-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

export default function MapTlemcen() {
  const { t } = useI18n();
  const [patientsByCommune, setPatientsByCommune] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [searchCommune, setSearchCommune] = useState('');
  const [hoveredCommune, setHoveredCommune] = useState(null);

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const patients = await api.getPatients();
        const grouped = patients.reduce((acc, patient) => {
          const commune = (patient.commune || 'Non spécifiée').trim().toUpperCase();
          if (!acc[commune]) acc[commune] = [];
          acc[commune].push(patient);
          return acc;
        }, {});
        setPatientsByCommune(grouped);
      } catch (error) {
        console.error('Erreur data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientsData();
  }, []);

  const statsData = useMemo(() => {
    const communes = COMMUNES.map(c => ({
      ...c,
      count: (patientsByCommune[c.name.toUpperCase()] || []).length,
    }));

    const topCommunes = [...communes]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .filter(c => c.count > 0);

    const genderData = [
      { name: 'Hommes', value: 0 },
      { name: 'Femmes', value: 0 }
    ];

    Object.values(patientsByCommune).flat().forEach(p => {
      if (p.sexe === 'M') genderData[0].value++;
      else genderData[1].value++;
    });

    return { communes, topCommunes, genderData };
  }, [patientsByCommune]);

  const filteredCommunes = statsData.communes.filter(c =>
    c.name.toLowerCase().includes(searchCommune.toLowerCase())
  );

  const totalPatients = Object.values(patientsByCommune).flat().length;
  const defaultCenter = [34.8781, -1.3160];
  const selectedCenter = selectedCommune ? (COMMUNE_COORDS[selectedCommune] || defaultCenter) : defaultCenter;
  const selectedZoom = selectedCommune ? 13 : 9.5;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('map_title')}</h1>
          <p className="page-subtitle">{t('map_subtitle')}</p>
        </div>
        <div className="stats-mini">
          <div className="sig-badge-total">
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{t('map_monitoring')}: </span>
            <span style={{ fontWeight: 900, fontSize: '18px' }}>{totalPatients}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="card col-span-2" style={{ padding: 0, overflow: 'hidden', border: 'none' }}>
          <div className="sig-map-wrapper">
            <MapContainer center={defaultCenter} zoom={9.5} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
              <MapView center={selectedCenter} zoom={selectedZoom} />

              {filteredCommunes.map(commune => {
                const coord = COMMUNE_COORDS[commune.name];
                if (!coord) return null;
                const isSelected = commune.name === selectedCommune;
                const isHovered = commune.name === hoveredCommune;
                const count = commune.count || 0;

                return (
                  <Marker
                    key={commune.code}
                    position={coord}
                    icon={createExtremeIcon(count, isSelected, isHovered)}
                    eventHandlers={{
                      click: () => setSelectedCommune(commune.name === selectedCommune ? null : commune.name),
                      mouseover: () => setHoveredCommune(commune.name),
                      mouseout: () => setHoveredCommune(null)
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                      <div style={{ padding: '4px' }}>
                        <div style={{ fontWeight: 800 }}>{commune.name}</div>
                        <div style={{ color: 'var(--accent)', fontWeight: 700 }}>{count} {t('map_patients')}</div>
                      </div>
                    </Tooltip>
                    {isSelected && (
                      <Popup>
                        <div style={{ minWidth: '180px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{commune.name}</h4>
                          <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}><strong>{count}</strong> patients identifiés. Alerte de densité activée.</p>
                          <button className="btn btn-sm btn-primary" style={{ width: '100%', borderRadius: '50px' }} onClick={() => document.getElementById(`commune-details-${commune.name}`).scrollIntoView({ behavior: 'smooth' })}>
                            {t('map_view_zone')}
                          </button>
                        </div>
                      </Popup>
                    )}
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="sig-legend">
              <div style={{ fontWeight: 900, marginBottom: '12px', fontSize: '10px', letterSpacing: '1px' }}>{t('map_density')}</div>
              <div className="sig-legend-item"><div className="sig-legend-color" style={{ background: '#ef4444' }}></div><span>{t('map_critical')} (&gt;200)</span></div>
              <div className="sig-legend-item"><div className="sig-legend-color" style={{ background: '#ffb822' }}></div><span>{t('map_alert')} (51-200)</span></div>
              <div className="sig-legend-item"><div className="sig-legend-color" style={{ background: '#0056ff' }}></div><span>{t('map_active')} (11-50)</span></div>
              <div className="sig-legend-item"><div className="sig-legend-color" style={{ background: '#22c55e' }}></div><span>{t('map_stable')} (0-10)</span></div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ padding: '16px' }}>
            <h3 className="sig-chart-title">{t('map_index')}</h3>
            <div className="sig-search-wrapper">
              <span className="sig-search-icon" aria-hidden="true"></span>
              <input className="sig-search-input" value={searchCommune} onChange={e => setSearchCommune(e.target.value)} placeholder={t('map_filter')} />
            </div>
          </div>
          <div className="sig-scroll-list">
            <div className="sig-commune-grid">
              {filteredCommunes.map(commune => (
                <div key={commune.code} className={`sig-commune-item ${selectedCommune === commune.name ? 'active' : ''}`} onClick={() => setSelectedCommune(commune.name === selectedCommune ? null : commune.name)} onMouseEnter={() => setHoveredCommune(commune.name)} onMouseLeave={() => setHoveredCommune(null)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="sig-commune-name">{commune.name}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{commune.code}</div>
                  </div>
                  <div className="sig-commune-stats">{commune.count} Patients</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="sig-chart-card"><h3 className="sig-chart-title">{t('map_top')}</h3><div style={{ height: '300px' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={statsData.topCommunes} layout="vertical" margin={{ left: 30, right: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" /><XAxis type="number" hide /><YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={100} /><RechartsTooltip /><Bar dataKey="count" radius={[0, 4, 4, 0]}>{statsData.topCommunes.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div></div>
        <div className="sig-chart-card"><h3 className="sig-chart-title">{t('map_gender')}</h3><div style={{ height: '300px' }}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statsData.genderData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"><Cell fill="#0056ff" /><Cell fill="#ef4444" /></Pie><RechartsTooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
      </div>

      {selectedCommune && (
        <div id={`commune-details-${selectedCommune}`} className="sig-detail-card animate-slide-up">
          <div className="sig-detail-header">
            <div><div className="sig-detail-tag">{t('map_dossier')}</div><h2>{selectedCommune}</h2></div>
            <button className="btn btn-outline" onClick={() => setSelectedCommune(null)}>{t('map_close')}</button>
          </div>
          <div className="sig-detail-content">{(patientsByCommune[selectedCommune.toUpperCase()] || []).map(p => <div key={p.id} className="sig-patient-item"><div className="avatar" style={{ background: p.sexe === 'M' ? 'var(--accent)' : 'var(--danger)' }}>{p.prenom[0]}{p.nom[0]}</div><div><div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div><div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(p.dateNaissance).toLocaleDateString()}</div></div></div>)}</div>
        </div>
      )}
    </div>
  );
}
