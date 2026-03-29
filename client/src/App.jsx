import React, { useState } from 'react';
import './index.css';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Vaccinations from './pages/Vaccinations';
import Rappels from './pages/Rappels';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [selectedPatient, setSelectedPatient] = useState(null);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPage} />;
      case 'patients': return <Patients setPage={setPage} setSelectedPatient={setSelectedPatient} />;
      case 'vaccinations': return <Vaccinations selectedPatient={selectedPatient} setSelectedPatient={setSelectedPatient} />;
      case 'rappels': return <Rappels />;
      default: return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}
