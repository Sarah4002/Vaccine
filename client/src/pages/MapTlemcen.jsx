import React, { useEffect, useState, useMemo } from 'react';
import { useI18n } from '../i18n';
import { api } from '../utils/api';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, useMap, Tooltip, Popup } from 'react-leaflet';
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

// ─── Fonction principale : cercle avec effet radar ──────────────────────────
const createExtremeIcon = (count, isSelected, isHovered) => {
  const baseRadius = count > 500 ? 70
    : count > 300 ? 60
    : count > 200 ? 52
    : count > 100 ? 42
    : count > 50  ? 32
    : count > 20  ? 24
    : count > 10  ? 18
    : 12;

  const color = count > 200 ? '#ef4444'
    : count > 50  ? '#ffb822'
    : count > 10  ? '#0056ff'
    : '#22c55e';

  const rings = count > 500 ? 6 : count > 300 ? 5 : count > 200 ? 5 : count > 100 ? 4 : count > 50 ? 3 : count > 10 ? 2 : 1;
  const totalSize = baseRadius * 2 + rings * 30 + (isSelected ? 24 : 0);
  const center = totalSize / 2;
  const radarRadius = baseRadius + rings * 16 + 22;

  let ringsSVG = '';
  for (let i = 1; i <= rings; i++) {
    const r = baseRadius + i * 16;
    const opacity = Math.max(0.1, 0.42 - i * 0.055);
    ringsSVG += `<circle cx="${center}" cy="${center}" r="${r}"
      fill="none"
      stroke="${color}"
      stroke-width="${isSelected ? 3.5 : 2.2}"
      opacity="${opacity}"
      stroke-dasharray="${i > 1 ? '4,4' : 'none'}"
      style="transform-origin:center; transform-box:fill-box; animation: radar-ring ${2.2 + i * 0.25}s ease-out infinite; animation-delay:${i * 0.16}s;"
    />`;
  }

  const glowRadius = baseRadius + rings * 18 + 14;
  const glowHTML = `
    <div style="
      position: absolute;
      left: ${center - glowRadius}px;
      top: ${center - glowRadius}px;
      width: ${glowRadius * 2}px;
      height: ${glowRadius * 2}px;
      border-radius: 50%;
      background: radial-gradient(circle, ${color}40 0%, ${color}16 52%, transparent 100%);
      pointer-events: none;
      filter: blur(2px);
      animation: radar-breathe 2.4s ease-in-out infinite;
    "></div>`;

  const sweepHTML = `
    <div style="
      position: absolute;
      left: ${center - radarRadius}px;
      top: ${center - radarRadius}px;
      width: ${radarRadius * 2}px;
      height: ${radarRadius * 2}px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 0deg, transparent 22deg, ${color}60 40deg, ${color}1a 56deg, transparent 74deg, transparent 360deg);
      opacity: ${count > 10 ? (isSelected ? 1 : 0.75) : 0};
      pointer-events: none;
      animation: radar-rotate ${count > 10 ? '2.8s' : '0s'} linear infinite;
      filter: blur(1px);
      mix-blend-mode: screen;
    "></div>`;

  const pulseHTML = `
    <div style="
      position: absolute;
      left: ${center - baseRadius - 5}px;
      top: ${center - baseRadius - 5}px;
      width: ${(baseRadius + 5) * 2}px;
      height: ${(baseRadius + 5) * 2}px;
      border-radius: 50%;
      border: 2px solid ${color};
      opacity: ${isSelected ? 0.95 : 0.55};
      animation: radar-pulse ${isSelected ? '1.2s' : '1.8s'} ease-out infinite;
      pointer-events: none;
    "></div>`;

  const fontSize = count > 999 ? 18 : count > 99 ? 17 : 16;
  const labelText = count > 0 ? count : '';

  const html = `
    <style>
      @keyframes radar-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes radar-pulse {
        0% { transform: scale(0.9); opacity: 0.8; }
        70% { transform: scale(1.72); opacity: 0; }
        100% { transform: scale(1.72); opacity: 0; }
      }
      @keyframes radar-breathe {
        0%, 100% { transform: scale(1); opacity: 0.45; }
        50% { transform: scale(1.12); opacity: 0.2; }
      }
    </style>
    <div style="
      position: relative;
      width: ${totalSize}px;
      height: ${totalSize}px;
    ">
      ${glowHTML}
      ${sweepHTML}
      ${pulseHTML}
      <svg
        width="${totalSize}"
        height="${totalSize}"
        style="position:absolute;top:0;left:0;overflow:visible;"
        xmlns="http://www.w3.org/2000/svg"
      >
        ${ringsSVG}
        <circle cx="${center}" cy="${center}" r="${baseRadius + 2}"
          fill="${color}" opacity="0.34" />
        <circle cx="${center}" cy="${center}" r="${baseRadius}"
          fill="${color}"
          stroke="white"
          stroke-width="${isSelected ? 4 : isHovered ? 3 : 2.8}"
          opacity="${isHovered ? 1 : 0.96}"
        />
        <circle cx="${center - baseRadius * 0.25}" cy="${center - baseRadius * 0.3}"
          r="${baseRadius * 0.38}"
          fill="white" opacity="0.24" />
        <text
          x="${center}" y="${center + fontSize * 0.36}"
          text-anchor="middle"
          font-size="${fontSize}"
          font-weight="900"
          fill="white"
          font-family="system-ui, -apple-system, sans-serif"
          style="text-shadow: 0 1px 2px rgba(0,0,0,0.4)"
        >${labelText}</text>
      </svg>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [totalSize, totalSize],
    iconAnchor: [center, center],
    tooltipAnchor: [0, -(baseRadius + rings * 12 + 14)],
  });
};

// ─────────────────────────────────────────────────────────────────────────────

function MapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10, { animate: true, duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

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
  const defaultZoom = 9.5;
  const selectedCenter = selectedCommune ? (COMMUNE_COORDS[selectedCommune] || defaultCenter) : defaultCenter;
  const selectedZoom = selectedCommune ? 12 : defaultZoom;

  

  return (
    <div className="animate-fade-in">
      <div className="grid grid-1" style={{ marginBottom: '24px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden', border: 'none', borderRadius: '20px' }}>
          <div className="sig-map-wrapper" style={{ position: 'relative', minHeight: '640px', height: '640px' }}>
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              minZoom={8}
              maxZoom={13}
              minNativeZoom={8}
              maxNativeZoom={16}
              maxBounds={[[34.3, -2.1], [35.4, -0.7]]}
              maxBoundsViscosity={0.8}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
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
                      mouseout: () => setHoveredCommune(null),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                      <div style={{ padding: '4px' }}>
                        <div style={{ fontWeight: 800 }}>{commune.name}</div>
                        <div style={{ color: 'var(--accent)', fontWeight: 700 }}>
                          {count} {t('map_patients')}
                        </div>
                      </div>
                    </Tooltip>
                    {isSelected && (
                      <Popup>
                        <div style={{ minWidth: '180px' }}>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{commune.name}</h4>
                          <p style={{ margin: '0 0 12px 0', fontSize: '13px' }}>
                            <strong>{count}</strong> patients identifiés.
                          </p>
                          <button
                            className="btn btn-sm btn-primary"
                            style={{ width: '100%', borderRadius: '50px' }}
                            onClick={() => document.getElementById(`commune-details-${commune.name}`)?.scrollIntoView({ behavior: 'smooth' })}
                          >
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
              <div style={{ fontWeight: 900, marginBottom: '12px', fontSize: '10px', letterSpacing: '1px' }}>
                {t('map_density')}
              </div>
              <div className="sig-legend-item">
                <div className="sig-legend-color" style={{ background: '#ef4444' }}></div>
                <span>{t('map_critical')} (&gt;200)</span>
              </div>
              <div className="sig-legend-item">
                <div className="sig-legend-color" style={{ background: '#ffb822' }}></div>
                <span>{t('map_alert')} (51-200)</span>
              </div>
              <div className="sig-legend-item">
                <div className="sig-legend-color" style={{ background: '#0056ff' }}></div>
                <span>{t('map_active')} (11-50)</span>
              </div>
              <div className="sig-legend-item">
                <div className="sig-legend-color" style={{ background: '#22c55e' }}></div>
                <span>{t('map_stable')} (0-10)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card sig-index-card" style={{ marginBottom: '24px' }}>
        <div className="sig-index-header">
          <h3 className="sig-chart-title" style={{ marginBottom: 8 }}>{t('map_index')}</h3>
        </div>
        <div className="sig-search-wrapper sig-index-search">
          <span className="sig-search-icon" aria-hidden="true"></span>
          <input
            className="sig-search-input"
            value={searchCommune}
            onChange={e => setSearchCommune(e.target.value)}
            placeholder={t('map_filter')}
          />
        </div>
        <div className="sig-index-list">
          {filteredCommunes.map(commune => (
            <button
              key={commune.code}
              type="button"
              className={`sig-index-item ${selectedCommune === commune.name ? 'active' : ''}`}
              onClick={() => setSelectedCommune(commune.name === selectedCommune ? null : commune.name)}
              onMouseEnter={() => setHoveredCommune(commune.name)}
              onMouseLeave={() => setHoveredCommune(null)}
            >
              <span className="sig-index-name">{commune.name}</span>
              <span className="sig-index-code">{commune.code}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-2" style={{ marginBottom: '24px' }}>
        <div className="sig-chart-card">
          <h3 className="sig-chart-title">{t('map_top')}</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.topCommunes} layout="vertical" margin={{ left: 30, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fontWeight: 700 }} width={100} />
                <RechartsTooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statsData.topCommunes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="sig-chart-card">
          <h3 className="sig-chart-title">{t('map_gender')}</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statsData.genderData}
                  cx="50%" cy="50%"
                  innerRadius={70} outerRadius={100}
                  paddingAngle={8}
                  dataKey="value"
                >
                  <Cell fill="#0056ff" />
                  <Cell fill="#ef4444" />
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {selectedCommune && (
        <div id={`commune-details-${selectedCommune}`} className="sig-detail-card animate-slide-up">
          <div className="sig-detail-header">
            <div>
              <div className="sig-detail-tag">{t('map_dossier')}</div>
              <h2>{selectedCommune}</h2>
            </div>
            <button className="btn btn-outline" onClick={() => setSelectedCommune(null)}>
              {t('map_close')}
            </button>
          </div>
          <div className="sig-detail-content">
            {(patientsByCommune[selectedCommune.toUpperCase()] || []).map(p => (
              <div key={p.id} className="sig-patient-item">
                <div
                  className="avatar"
                  style={{ background: p.sexe === 'M' ? 'var(--accent)' : 'var(--danger)' }}
                >
                  {p.prenom?.[0]}{p.nom?.[0]}
                </div>
                <div>
                  <div style={{ fontWeight: 800 }}>{p.prenom} {p.nom}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {p.dateNaissance ? new Date(p.dateNaissance).toLocaleDateString() : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
