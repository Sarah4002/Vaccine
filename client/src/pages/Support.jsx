import React, { useState, useEffect } from 'react';
import '../styles/Support.css';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

const CATEGORIES = ['Bug', 'Feature Request', 'Question', 'Autre'];
const PRIORITIES = ['basse', 'normal', 'haute'];
const STATUTS = ['ouvert', 'en-cours', 'resolu', 'ferme'];

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatut, setFilterStatut] = useState('');

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: 'Question',
    priorite: 'normal'
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async (statusFilter = '') => {
    try {
      let url = `${API}/api/support-tickets`;
      if (statusFilter) url += `?statut=${statusFilter}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setLoading(false);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatut(status);
    fetchTickets(status);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || !formData.description.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    try {
      const res = await fetch(`${API}/api/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const newTicket = await res.json();
        setTickets([newTicket, ...tickets]);
        setFormData({ titre: '', description: '', categorie: 'Question', priorite: 'normal' });
        setShowForm(false);
        alert('✓ Ticket de support créé avec succès!');
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la création du ticket');
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${API}/api/support-tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatus })
      });

      if (res.ok) {
        const updatedTicket = await res.json();
        setTickets(tickets.map(t => t.id === ticketId ? updatedTicket : t));
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket(updatedTicket);
        }
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'haute': return '#e74c3c';
      case 'normal': return '#f39c12';
      case 'basse': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatutBadge = (statut) => {
    const badges = {
      'ouvert': <span className="status-badge status-open"></span>,
      'en-cours': <span className="status-badge status-progress"></span>,
      'resolu': <span className="status-badge status-resolved"></span>,
      'ferme': <span className="status-badge status-closed"></span>
    };
    return badges[statut] || <span className="status-badge status-unknown"></span>;
  };

  return (
    <div className="support-container">
      <div className="support-header">
        <h1><span className="icon-phone"></span> Support Client</h1>
        <p>Soumettre un ticket de support ou consulter les tickets existants</p>
      </div>

      <div className="support-controls">
        <button
          className={`btn btn-primary ${showForm ? 'active' : ''}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '✕ Fermer' : '➕ Nouveau Ticket'}
        </button>

        <div className="status-filters">
          <button
            className={`filter-btn ${filterStatut === '' ? 'active' : ''}`}
            onClick={() => handleFilterChange('')}
          >
            Tous
          </button>
          {STATUTS.map(status => (
            <button
              key={status}
              className={`filter-btn ${filterStatut === status ? 'active' : ''}`}
              onClick={() => handleFilterChange(status)}
            >
              {getStatutBadge(status)} {status}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire de création */}
      {showForm && (
        <div className="support-form">
          <h2>Créer un nouveau ticket</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Titre *</label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleFormChange}
                placeholder="Résumé du problème..."
                className="input-text"
              />
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Décrivez le problème en détail..."
                className="input-textarea"
                rows="5"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Catégorie</label>
                <select
                  name="categorie"
                  value={formData.categorie}
                  onChange={handleFormChange}
                  className="input-select"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Priorité</label>
                <select
                  name="priorite"
                  value={formData.priorite}
                  onChange={handleFormChange}
                  className="input-select"
                >
                  {PRIORITIES.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-success">
              ✓ Soumettre le ticket
            </button>
          </form>
        </div>
      )}

      {/* Liste des tickets */}
      {loading ? (
        <div className="loading">Chargement des tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="no-tickets">
          <p>✓ Aucun ticket. Tout va bien!</p>
        </div>
      ) : (
        <div className="tickets-content">
          <div className="tickets-list">
            {tickets.map(ticket => (
              <div
                key={ticket.id}
                className={`ticket-card ${selectedTicket?.id === ticket.id ? 'selected' : ''}`}
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="ticket-header">
                  <span className="ticket-badge">{getStatutBadge(ticket.statut)}</span>
                  <h3>{ticket.titre.substring(0, 50)}...</h3>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(ticket.priorite) }}
                  >
                    {ticket.priorite}
                  </span>
                </div>
                <div className="ticket-meta">
                  <span>{ticket.categorie}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Détails du ticket */}
          {selectedTicket && (
            <div className="ticket-details">
              <button className="close-btn" onClick={() => setSelectedTicket(null)}>✕</button>
              <h2>{selectedTicket.titre}</h2>
              <div className="ticket-status">
                <span className="badge">{getStatutBadge(selectedTicket.statut)}</span>
                <span className="badge">{selectedTicket.categorie}</span>
                <span
                  className="badge priority"
                  style={{ backgroundColor: getPriorityColor(selectedTicket.priorite) }}
                >
                  {selectedTicket.priorite}
                </span>
              </div>

              <div className="ticket-dates">
                <p>
                  <strong>Créé:</strong> {new Date(selectedTicket.createdAt).toLocaleDateString('fr-FR')}
                </p>
                <p>
                  <strong>Mis à jour:</strong>{' '}
                  {new Date(selectedTicket.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>

              <div className="ticket-description">
                <h3>Description</h3>
                <p>{selectedTicket.description}</p>
              </div>

              <div className="ticket-actions">
                <label>Changer le statut:</label>
                <select
                  value={selectedTicket.statut}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                  className="input-select"
                >
                  {STATUTS.map(status => (
                    <option key={status} value={status}>
                      {getStatutBadge(status)} {status}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
