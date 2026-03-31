import React, { useState, useEffect } from 'react';
import '../styles/HelpCenter.css';

const API = process.env.REACT_APP_API || 'http://localhost:3001';

export default function HelpCenter() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);

  const categories = ['Patients', 'Vaccinations', 'Pharmacie', 'Rappels', 'Carte'];

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async (searchTerm = '', category = '') => {
    try {
      let url = `${API}/api/help-articles`;
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('categorie', category);
      if (params.toString()) url += '?' + params.toString();

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
      setLoading(false);
    } catch (err) {
      console.error('Erreur:', err);
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchArticles(value, selectedCategory);
  };

  const handleCategoryFilter = (category) => {
    const newCategory = selectedCategory === category ? '' : category;
    setSelectedCategory(newCategory);
    fetchArticles(search, newCategory);
  };

  return (
    <div className="help-center-container">
      <div className="help-header">
        <h1><span className="icon-help"></span> Centre d'aide</h1>
        <p>Trouvez les réponses à vos questions</p>
      </div>

      <div className="help-search-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher dans la base de connaissances..."
            value={search}
            onChange={handleSearch}
            className="input-search"
          />
          <span className="search-icon icon-search-content"></span>
        </div>

        <div className="category-filters">
          <button
            className={`filter-btn ${selectedCategory === '' ? 'active' : ''}`}
            onClick={() => handleCategoryFilter('')}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => handleCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement des articles...</div>
      ) : articles.length === 0 ? (
        <div className="no-results">
          <p>❌ Aucun article trouvé. Essayez une autre recherche.</p>
        </div>
      ) : (
        <div className="help-content">
          <div className="articles-list">
            {articles.map(article => (
              <div
                key={article.id}
                className={`article-card ${selectedArticle?.id === article.id ? 'selected' : ''}`}
                onClick={() => setSelectedArticle(article)}
              >
                <div className="article-title">{article.titre}</div>
                <div className="article-category">{article.categorie}</div>
              </div>
            ))}
          </div>

          {selectedArticle && (
            <div className="article-details">
              <button className="close-btn" onClick={() => setSelectedArticle(null)}>✕</button>
              <h2>{selectedArticle.titre}</h2>
              <div className="article-meta">
                <span className="badge">{selectedArticle.categorie}</span>
                <span className="date">
                  {new Date(selectedArticle.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="article-content">
                {selectedArticle.contenu}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="help-footer">
        <div className="faq-section">
          <h3><span className="icon-book"></span> Questions fréquemment posées</h3>
          <ul>
            <li>Comment créer un compte?</li>
            <li>Comment modifier les informations d'un patient?</li>
            <li>Comment générer un rapport?</li>
            <li>Quelles sont les exigences techniques?</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
