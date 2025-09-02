import { useState } from 'react';
import styles from '../styles/EpisodeSelector.module.css';

export default function EpisodeSelector({ episodes, currentEpisode, onEpisodeSelect }) {
  const [showAll, setShowAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const episodesPerPage = 20;
  const totalPages = Math.ceil(episodes.length / episodesPerPage);
  
  const displayedEpisodes = showAll 
    ? episodes.slice(currentPage * episodesPerPage, (currentPage + 1) * episodesPerPage)
    : episodes.slice(0, 12);

  const handleEpisodeClick = (episodeNumber) => {
    onEpisodeSelect(episodeNumber.toString());
  };

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (!episodes || episodes.length === 0) {
    return null;
  }

  return (
    <div className={styles.episodeSelector}>
      <div className={styles.header}>
        <h3>Episodes ({episodes.length})</h3>
        <button 
          onClick={() => setShowAll(!showAll)}
          className={styles.toggleBtn}
        >
          {showAll ? 'Show Less' : 'Show All'}
        </button>
      </div>

      <div className={styles.episodeGrid}>
        {displayedEpisodes.map((episode) => (
          <button
            key={episode.number}
            onClick={() => handleEpisodeClick(episode.number)}
            className={`${styles.episodeBtn} ${
              currentEpisode == episode.number ? styles.active : ''
            }`}
            title={episode.title}
          >
            <div className={styles.episodeNumber}>
              {episode.number}
            </div>
            <div className={styles.episodeTitle}>
              {episode.title || `Episode ${episode.number}`}
            </div>
          </button>
        ))}
      </div>

      {showAll && totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            onClick={prevPage} 
            disabled={currentPage === 0}
            className={styles.pageBtn}
          >
            ‹ Previous
          </button>
          <span className={styles.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </span>
          <button 
            onClick={nextPage} 
            disabled={currentPage === totalPages - 1}
            className={styles.pageBtn}
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}