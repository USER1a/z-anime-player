import { useState } from 'react';
import styles from '../styles/SearchPanel.module.css';

export default function SearchPanel({ onSearch, results, onSelect }) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setShowResults(true);
    }
  };

  const handleSelectAnime = (anime) => {
    onSelect(anime);
    setShowResults(false);
    setQuery(anime.title || anime.name || '');
  };

  return (
    <div className={styles.searchPanel}>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for anime..."
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchBtn}>
            🔍
          </button>
        </div>
      </form>

      {showResults && results && (
        <div className={styles.resultsContainer}>
          <div className={styles.resultsHeader}>
            <h3>Search Results</h3>
            <button onClick={() => setShowResults(false)} className={styles.closeBtn}>
              ✕
            </button>
          </div>

          <div className={styles.resultsList}>
            {results.combined && results.combined.length > 0 ? (
              results.combined.map((anime, index) => (
                <div
                  key={`${anime.source}-${anime.id || anime.anilistId || index}`}
                  className={styles.resultItem}
                  onClick={() => handleSelectAnime(anime)}
                >
                  <div className={styles.animeInfo}>
                    <img
                      src={anime.image || anime.poster || anime.thumbnail || '/placeholder-anime.jpg'}
                      alt={anime.title || anime.name}
                      className={styles.animePoster}
                      onError={(e) => {
                        e.target.src = '/placeholder-anime.jpg';
                      }}
                    />
                    <div className={styles.animeDetails}>
                      <h4 className={styles.animeTitle}>
                        {anime.title || anime.name || 'Unknown Title'}
                      </h4>
                      <p className={styles.animeYear}>
                        {anime.releaseDate || anime.year || 'Unknown Year'}
                      </p>
                      <p className={styles.animeType}>
                        {anime.type || anime.format || 'TV'}
                      </p>
                      <div className={styles.animeSource}>
                        Source: {anime.source}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <p>No anime found. Try a different search term.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}