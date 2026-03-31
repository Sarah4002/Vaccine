import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const COMMUNES = [
  { code: '01', name: 'Tlemcen' },
  { code: '02', name: 'Beni Mester' },
  { code: '03', name: 'Aïn Tallout' },
  { code: '04', name: 'Remchi' },
  { code: '05', name: 'El Fehoul' },
  { code: '06', name: 'Sabra' },
  { code: '07', name: 'Ghazaouet' },
  { code: '08', name: 'Souani' },
  { code: '09', name: 'Djebala' },
  { code: '10', name: 'El Gor' },
  { code: '11', name: 'Oued Lakhdar' },
  { code: '12', name: 'Aïn Fezza' },
  { code: '13', name: 'Ouled Mimoun' },
  { code: '14', name: 'Amieur' },
  { code: '15', name: 'Aïn Youcef' },
  { code: '16', name: 'Zenata' },
  { code: '17', name: 'Beni Snous' },
  { code: '18', name: 'Bab El Assa' },
  { code: '19', name: 'Dar Yaghmouracene' },
  { code: '20', name: 'Fellaoucene' },
  { code: '21', name: 'Azaïls' },
  { code: '22', name: 'Sebaa Chioukh' },
  { code: '23', name: 'Terny Beni Hdiel' },
  { code: '24', name: 'Bensekrane' },
  { code: '25', name: 'Aïn Nehala' },
  { code: '26', name: 'Hennaya' },
  { code: '27', name: 'Maghnia' },
  { code: '28', name: 'Hammam Boughrara' },
  { code: '29', name: 'Souahlia' },
  { code: '30', name: "M'Sirda Fouaga" },
  { code: '31', name: 'Aïn Fetah' },
  { code: '32', name: 'El Aricha' },
  { code: '33', name: 'Souk Tlata' },
  { code: '34', name: 'Sidi Abdelli' },
  { code: '35', name: 'Sebdou' },
  { code: '36', name: 'Beni Ouarsous' },
  { code: '37', name: 'Sidi Medjahed' },
  { code: '38', name: 'Beni Boussaid' },
  { code: '39', name: "Marsa Ben M'Hidi" },
  { code: '40', name: 'Nedroma' },
  { code: '41', name: 'Sidi Djillali' },
  { code: '42', name: 'Beni Bahdel' },
  { code: '43', name: 'El Bouihi' },
  { code: '44', name: 'Honaïne' },
  { code: '45', name: 'Tienet' },
  { code: '46', name: 'Ouled Riyah' },
  { code: '47', name: 'Bouhlou' },
  { code: '48', name: 'Beni Khellad' },
  { code: '49', name: 'Aïn Ghoraba' },
  { code: '50', name: 'Chetouane' },
  { code: '51', name: 'Mansourah' },
  { code: '52', name: 'Beni Semiel' },
  { code: '53', name: 'Aïn Kebira' }
];

const COMMUNE_COORDS = {
  'Tlemcen': [34.8781, -1.3160],
  'Beni Mester': [34.7858, -1.3269],
  'Aïn Tallout': [34.8281, -1.6798],
  'Remchi': [35.1539, -1.5962],
  'El Fehoul': [34.9573, -1.7058],
  'Sabra': [34.9681, -1.6753],
  'Ghazaouet': [35.1307, -1.7802],
  'Souani': [35.0891, -1.5208],
  'Djebala': [34.8548, -1.1906],
  'El Gor': [35.3598, -1.5141],
  'Oued Lakhdar': [34.8723, -1.4120],
  'Aïn Fezza': [34.8804, -1.3202],
  'Ouled Mimoun': [34.8400, -1.3950],
  'Amieur': [34.9500, -1.4200],
  'Aïn Youcef': [34.9670, -1.5200],
  'Zenata': [35.0415, -1.3619],
  'Beni Snous': [34.9055, -1.7677],
  'Bab El Assa': [35.1252, -1.7196],
  'Dar Yaghmouracene': [35.2000, -1.7000],
  'Fellaoucene': [35.2200, -1.8600],
  'Azaïls': [35.0289, -1.2385],
  'Sebaa Chioukh': [34.9255, -1.4819],
  'Terny Beni Hdiel': [34.8400, -1.3200],
  'Bensekrane': [34.9800, -1.6400],
  'Aïn Nehala': [35.0000, -1.7500],
  'Hennaya': [35.0900, -1.9700],
  'Maghnia': [35.1896, -1.8300],
  'Hammam Boughrara': [34.9170, -1.6300],
  'Souahlia': [35.0340, -1.4740],
  "M'Sirda Fouaga": [34.9100, -1.4300],
  'Aïn Fetah': [35.0850, -1.4410],
  'El Aricha': [35.0520, -1.5516],
  'Souk Tlata': [35.0980, -1.6510],
  'Sidi Abdelli': [35.0620, -1.5970],
  'Sebdou': [34.8600, -1.5200],
  'Beni Ouarsous': [35.1650, -1.4000],
  'Sidi Medjahed': [35.0300, -1.4500],
  'Beni Boussaid': [35.1000, -1.5700],
  "Marsa Ben M'Hidi": [35.3000, -1.9500],
  'Nedroma': [35.1900, -1.4300],
  'Sidi Djillali': [35.1300, -1.4800],
  'Beni Bahdel': [35.0700, -1.3900],
  'El Bouihi': [35.0100, -1.3500],
  'Honaïne': [35.3628, -1.8641],
  'Tienet': [35.0700, -1.5500],
  'Ouled Riyah': [35.1400, -1.3900],
  'Bouhlou': [35.1240, -1.3600],
  'Beni Khellad': [35.1400, -1.4200],
  'Aïn Ghoraba': [35.1200, -1.3250],
  'Chetouane': [35.0700, -1.8100],
  'Mansourah': [34.9020, -1.3300],
  'Beni Semiel': [34.9200, -1.2800],
  'Aïn Kebira': [34.9300, -1.3000]
};

function MapView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 10, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function MapTlemcen() {
  const [patientsByCommune, setPatientsByCommune] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCommune, setSelectedCommune] = useState(null);
  const [searchCommune, setSearchCommune] = useState('');

  const communesWithCounts = COMMUNES.map(c => ({

    ...c,
    count: (patientsByCommune[c.name] || []).length,
  }));

  const selectedCommunePatients = selectedCommune ? (patientsByCommune[selectedCommune] || []) : [];
  const filteredCommunes = communesWithCounts.filter(c => c.name.toLowerCase().includes(searchCommune.toLowerCase()));

  useEffect(() => {
    const fetchPatientsData = async () => {
      try {
        const patients = await api.getPatients();
        // Grouper les patients par commune
        const grouped = patients.reduce((acc, patient) => {
          const commune = patient.commune || 'Non spécifiée';
          if (!acc[commune]) {
            acc[commune] = [];
          }
          acc[commune].push(patient);
          return acc;
        }, {});
        setPatientsByCommune(grouped);
      } catch (error) {
        console.error('Erreur lors du chargement des patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsData();
  }, []);

  const totalPatients = Object.values(patientsByCommune).reduce((sum, patients) => sum + patients.length, 0);
  const communesCount = Object.keys(patientsByCommune).length;

  const defaultCenter = [34.8781, -1.3160];
  const selectedCenter = selectedCommune ? (COMMUNE_COORDS[selectedCommune] || defaultCenter) : defaultCenter;
  const selectedZoom = selectedCommune ? 11 : 9;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Carte SIG Tlemcen</h1>
          <p className="page-subtitle">Système d'information géographique de la wilaya de Tlemcen</p>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Carte Leaflet Tlemcen</h3>
          <a href="https://commons.wikimedia.org/wiki/File:DZ-13-00_-_Wilaya_Tlemcen_-_numbers.svg?uselang=fr" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--accent)' }}>
            Source Wikimedia (communes numérotées)
          </a>
        </div>

        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={searchCommune}
            onChange={e => setSearchCommune(e.target.value)}
            placeholder="Chercher une commune..."
            style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}
          />
          <span style={{ fontSize: '14px' }}>{filteredCommunes.length} communes filtrées</span>
        </div>

        {selectedCommune && (
          <div style={{ marginBottom: '8px', padding: '8px', background: 'rgba(0,86,255,0.08)', border: '1px solid rgba(0,86,255,0.25)', borderRadius: '8px' }}>
            <strong>{selectedCommune}</strong> sélectionnée : {selectedCommunePatients.length} patient(s).
          </div>
        )}

        <MapContainer center={selectedCenter} zoom={selectedZoom} style={{ height: '600px', width: '100%', borderRadius: '10px' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapView center={selectedCenter} zoom={selectedZoom} />
          {filteredCommunes.map(commune => {
            const coord = COMMUNE_COORDS[commune.name] || defaultCenter;
            const isSelected = commune.name === selectedCommune;
            const count = commune.count || 0;
            return (
              <CircleMarker
                key={commune.code}
                center={coord}
                radius={isSelected ? 12 : 8}
                pathOptions={{
                  color: isSelected ? '#0056ff' : '#22c55e',
                  fillColor: isSelected ? '#0056ff' : '#22c55e',
                  fillOpacity: 0.6,
                  weight: 2
                }}
                eventHandlers={{
                  click: () => setSelectedCommune(commune.name)
                }}
                title={`${commune.name} (${count} patients)`}
              />
            );
          })}
        </MapContainer>

        <div style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: '999px', border: '1px solid var(--border)', zIndex: 1000, fontSize: '12px' }}>
          Patients totaux : {totalPatients} ({communesCount} communes)
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Liste des communes Tlemcen (code ONS)</h3>
        </div>
        <div className="card-content" style={{ maxHeight: '210px', overflowY: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
            {filteredCommunes.map(commune => (
              <button
                key={commune.code}
                onClick={() => setSelectedCommune(commune.name)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: commune.name === selectedCommune ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: commune.name === selectedCommune ? 'rgba(0,86,255,0.12)' : 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{commune.code}</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{commune.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{commune.count} patients</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-3" style={{ marginTop: '24px' }}>
        <div className="card">
          <div className="card-header">
            <h3>Statistiques générales</h3>
          </div>
          <div className="card-content">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>TOTAL PATIENTS</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--accent)' }}>{totalPatients}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>COMMUNES COUVERTES</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>{communesCount}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>TAUX DE COUVERTURE</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--success)' }}>
                  {communesCount > 0 ? ((totalPatients / (communesCount * 10)) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Répartition par commune</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Chargement des données...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(patientsByCommune)
                  .sort(([,a], [,b]) => b.length - a.length)
                  .map(([commune, patients]) => (
                  <div key={commune} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: patients.length > 10 ? 'var(--success)' : patients.length > 5 ? 'var(--accent)' : 'var(--accent3)'
                      }}></div>
                      <span style={{ fontSize: '14px' }}>{commune}</span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{patients.length}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top communes</h3>
          </div>
          <div className="card-content">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Chargement...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(patientsByCommune)
                  .sort(([,a], [,b]) => b.length - a.length)
                  .slice(0, 3)
                  .map(([commune, patients], index) => (
                  <div key={commune}>
                    <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '12px' }}>
                      #{index + 1} {commune.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--accent)' }}>
                      {patients.length} patients
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section détaillée par commune */}
      <div className="card" style={{ marginTop: '24px' }}>
        <div className="card-header">
          <h3>Détail des patients par commune</h3>
        </div>
        <div className="card-content">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Chargement des données des patients...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(patientsByCommune)
                .sort(([,a], [,b]) => b.length - a.length)
                .map(([commune, patients]) => (
                <div key={commune} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button
                    onClick={() => setSelectedCommune(selectedCommune === commune ? null : commune)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '16px',
                      fontWeight: 600
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: patients.length > 10 ? 'var(--success)' : patients.length > 5 ? 'var(--accent)' : 'var(--accent3)'
                      }}></div>
                      <span>{commune}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>
                        ({patients.length} patient{patients.length > 1 ? 's' : ''})
                      </span>
                    </div>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: selectedCommune === commune ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }}
                    >
                      <polyline points="6,9 12,15 18,9"></polyline>
                    </svg>
                  </button>

                  {selectedCommune === commune && (
                    <div style={{ padding: '16px', background: 'var(--bg-card2)', borderTop: '1px solid var(--border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                        {patients.map(patient => (
                          <div key={patient.id} style={{
                            padding: '12px',
                            background: 'white',
                            borderRadius: '6px',
                            border: '1px solid var(--border)',
                            fontSize: '14px'
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                              {patient.prenom} {patient.nom}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>
                              Né(e) le {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                              {patient.sexe === 'M' ? 'Homme' : 'Femme'} • {patient.groupeSanguin}
                            </div>
                            {patient.telephone && (
                              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px' }}>
                                <span className="icon-phone-small"></span> {patient.telephone}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}