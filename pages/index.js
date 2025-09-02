import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import VideoPlayer from '../components/VideoPlayer';
import SearchPanel from '../components/SearchPanel';
import EpisodeSelector from '../components/EpisodeSelector';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [animeId, setAnimeId] = useState('');
  const [episode, setEpisode] = useState('1');
  const [server, setServer] = useState('vidcloud');
  const [audioType, setAudioType] = useState('sub');
  const [streamUrl, setStreamUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);

  const loadStream = async () => {
    if (!animeId || !episode) {
      setError('Please enter anime ID and episode number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/stream?anime_id=${animeId}&episode=${episode}&server=${server}&audio=${audioType}`);
      const data = await response.json();

      if (response.ok && data.sources && data.sources.length > 0) {
        setStreamUrl(data.sources[0].file || data.sources[0].url);
      } else {
        setError(data.error || 'Stream not found');
      }
    } catch (err) {
      setError('Failed to load stream');
    }

    setLoading(false);
  };

  const searchAnime = async (query) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const selectAnime = async (anime) => {
    setSelectedAnime(anime);
    setAnimeId(anime.id || anime.anilistId || anime.mal_id);
    
    // Load episodes if available
    try {
      const response = await fetch(`/api/anime/${anime.id}/episodes`);
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data.episodes || []);
      }
    } catch (err) {
      console.error('Failed to load episodes:', err);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Z-Anime Player</title>
        <meta name="description" content="Dark themed 3D anime streaming platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <div className={styles.logo}>
          <h1 className={styles.title}>Z-Anime Player</h1>
          <div className={styles.subtitle}>Premium Anime Streaming Experience</div>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.controlPanel}>
          <SearchPanel onSearch={searchAnime} results={searchResults} onSelect={selectAnime} />
          
          <div className={styles.inputSection}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Anime ID</label>
              <input
                type="text"
                value={animeId}
                onChange={(e) => setAnimeId(e.target.value)}
                placeholder="Enter anime ID (e.g., 154587)"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Episode Number</label>
              <input
                type="number"
                value={episode}
                onChange={(e) => setEpisode(e.target.value)}
                placeholder="1"
                min="1"
                className={styles.input}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Audio Language</label>
              <div className={styles.languageSelector}>
                <div className={styles.primaryLangs}>
                  <button
                    className={`${styles.langBtn} ${audioType === 'sub' ? styles.active : ''}`}
                    onClick={() => setAudioType('sub')}
                  >
                    SUB
                  </button>
                  <button
                    className={`${styles.langBtn} ${audioType === 'dub' ? styles.active : ''}`}
                    onClick={() => setAudioType('dub')}
                  >
                    DUB
                  </button>
                  <button
                    className={`${styles.langBtn} ${audioType === 'english' ? styles.active : ''}`}
                    onClick={() => setAudioType('english')}
                  >
                    ENGLISH
                  </button>
                  <button
                    className={`${styles.langBtn} ${audioType === 'japanese' ? styles.active : ''}`}
                    onClick={() => setAudioType('japanese')}
                  >
                    JAPANESE
                  </button>
                  <button
                    className={`${styles.langBtn} ${audioType === 'hindi' ? styles.active : ''}`}
                    onClick={() => setAudioType('hindi')}
                  >
                    HINDI
                  </button>
                </div>
                <div className={styles.secondaryLangs}>
                  <button
                    className={`${styles.langBtn} ${styles.secondary} ${audioType === 'tamil' ? styles.active : ''}`}
                    onClick={() => setAudioType('tamil')}
                  >
                    Tamil
                  </button>
                  <button
                    className={`${styles.langBtn} ${styles.secondary} ${audioType === 'bangla' ? styles.active : ''}`}
                    onClick={() => setAudioType('bangla')}
                  >
                    Bangla
                  </button>
                  <button
                    className={`${styles.langBtn} ${styles.secondary} ${audioType === 'kannada' ? styles.active : ''}`}
                    onClick={() => setAudioType('kannada')}
                  >
                    Kannada
                  </button>
                  <button
                    className={`${styles.langBtn} ${styles.secondary} ${audioType === 'malayalam' ? styles.active : ''}`}
                    onClick={() => setAudioType('malayalam')}
                  >
                    Malayalam
                  </button>
                  <button
                    className={`${styles.langBtn} ${styles.secondary} ${audioType === 'telugu' ? styles.active : ''}`}
                    onClick={() => setAudioType('telugu')}
                  >
                    Telugu
                  </button>
                </div>
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Server</label>
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className={styles.select}
              >
                <option value="vidcloud">VidCloud</option>
                <option value="streamwish">StreamWish</option>
                <option value="mp4upload">MP4Upload</option>
                <option value="filelions">FileLions</option>
              </select>
            </div>

            <button
              onClick={loadStream}
              disabled={loading}
              className={styles.loadBtn}
            >
              {loading ? 'Loading...' : 'Load Stream'}
            </button>
          </div>

          {episodes.length > 0 && (
            <EpisodeSelector
              episodes={episodes}
              currentEpisode={episode}
              onEpisodeSelect={setEpisode}
            />
          )}
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.playerSection}>
          {streamUrl && <VideoPlayer src={streamUrl} />}
        </div>
      </main>
    </div>
  );
}