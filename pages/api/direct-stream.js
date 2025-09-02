import axios from 'axios';

const M3U8_PROXY_URL = "https://m38u.vercel.app";

// Alternative anime APIs that might work better
const ANIME_APIS = {
  consumet: "https://api.consumet.org/anime/gogoanime",
  aniwatch: "https://api-anime-rouge.vercel.app",
  jikan: "https://api.jikan.moe/v4"
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { anime_id, episode, server = 'vidcloud', audio = 'sub' } = req.query;

  if (!anime_id || !episode) {
    return res.status(400).json({ 
      error: 'anime_id and episode required',
      example: '/api/direct-stream?anime_id=666243&episode=1&server=vidcloud&audio=sub'
    });
  }

  try {
    // Try Consumet API first (more reliable)
    const streamData = await tryConsumetAPI(anime_id, episode, server, audio);
    
    if (streamData) {
      return res.status(200).json(streamData);
    }

    // If no stream found, return a working example with your proxy
    const fallbackStream = {
      anime_id,
      episode: parseInt(episode),
      server,
      audio,
      sources: [{
        file: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        label: `${server.toUpperCase()} - ${audio.toUpperCase()}`,
        type: 'hls',
        quality: '1080p',
        fallback: true
      }],
      subtitles: [],
      message: 'Using fallback stream - API temporarily unavailable',
      fallback: true,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(fallbackStream);

  } catch (error) {
    console.error('Direct stream error:', error.message);
    
    return res.status(500).json({
      error: 'Failed to get stream',
      anime_id,
      episode,
      server,
      audio,
      details: error.message,
      suggestion: 'Try different anime ID or check if the anime exists'
    });
  }
}

async function tryConsumetAPI(animeId, episode, server, audio) {
  try {
    // Search for anime first
    const searchUrl = `${ANIME_APIS.consumet}/search/${animeId}`;
    const searchResponse = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (searchResponse.data && searchResponse.data.results && searchResponse.data.results.length > 0) {
      const anime = searchResponse.data.results[0];
      
      // Get episode info
      const infoUrl = `${ANIME_APIS.consumet}/info/${anime.id}`;
      const infoResponse = await axios.get(infoUrl, { timeout: 10000 });
      
      if (infoResponse.data && infoResponse.data.episodes) {
        const targetEpisode = infoResponse.data.episodes.find(ep => 
          ep.number == episode || ep.id.includes(`episode-${episode}`)
        );
        
        if (targetEpisode) {
          // Get streaming links
          const streamUrl = `${ANIME_APIS.consumet}/watch/${targetEpisode.id}`;
          const streamResponse = await axios.get(streamUrl, { timeout: 10000 });
          
          if (streamResponse.data && streamResponse.data.sources) {
            return {
              anime_id: animeId,
              episode: parseInt(episode),
              server: 'consumet',
              audio,
              sources: streamResponse.data.sources.map(source => ({
                file: source.url,
                label: `${source.quality} - ${audio.toUpperCase()}`,
                type: source.isM3U8 ? 'hls' : 'mp4',
                quality: source.quality
              })),
              subtitles: streamResponse.data.subtitles || [],
              source: 'consumet-api',
              title: anime.title,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    }
  } catch (error) {
    console.error('Consumet API error:', error.message);
  }
  
  return null;
}