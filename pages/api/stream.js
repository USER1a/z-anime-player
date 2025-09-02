import axios from 'axios';

const ANIMEWORLD_API_URL = "https://animeworlda.vercel.app";
const M3U8_PROXY_URL = "https://m38u.vercel.app";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    anime_id, 
    episode, 
    server = 'vidcloud', 
    audio = 'sub', 
    source = 'animeworld',
    anilist_id 
  } = req.query;

  if (!anime_id && !anilist_id) {
    return res.status(400).json({ error: 'anime_id or anilist_id required' });
  }

  if (!episode) {
    return res.status(400).json({ error: 'episode number required' });
  }

  try {
    let streamUrl;
    let streamData;

    // Choose API endpoint based on parameters
    if (anilist_id) {
      streamUrl = `${ANIMEWORLD_API_URL}/api/anilist/${anilist_id}/${episode}/server/${server}`;
    } else {
      streamUrl = `${ANIMEWORLD_API_URL}/api/anime/${anime_id}/${episode}/server/${server}`;
    }

    // Fetch streaming data with better error handling
    const response = await axios.get(streamUrl, {
      timeout: 20000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      validateStatus: function (status) {
        return status < 500; // Accept any status code less than 500
      }
    });

    // Handle different response status codes
    if (response.status === 404) {
      return res.status(404).json({ 
        error: 'Anime or episode not found',
        anime_id,
        episode,
        server,
        suggestion: 'Check if the anime ID and episode number are correct'
      });
    }

    if (response.status !== 200) {
      return res.status(response.status).json({ 
        error: `API returned status ${response.status}`,
        anime_id,
        episode,
        server
      });
    }

    streamData = response.data;

    // Validate response data
    if (!streamData) {
      return res.status(404).json({ 
        error: 'No stream data received',
        anime_id,
        episode,
        server
      });
    }

    // Process streaming links through M3U8 proxy if needed
    if (streamData && streamData.sources) {
      streamData.sources = streamData.sources.map(source => {
        if (source.file && (source.file.includes('.m3u8') || source.file.includes('manifest'))) {
          // Proxy M3U8 streams through our proxy service
          const encodedUrl = encodeURIComponent(source.file);
          return {
            ...source,
            file: `${M3U8_PROXY_URL}/proxy?url=${encodedUrl}`,
            original: source.file
          };
        }
        return source;
      });
    }

    // If no sources found, try alternative servers
    if (!streamData || !streamData.sources || streamData.sources.length === 0) {
      const alternativeServers = ['streamwish', 'mp4upload', 'filelions'];
      
      for (const altServer of alternativeServers) {
        if (altServer === server) continue;
        
        try {
          let altUrl;
          if (anilist_id) {
            altUrl = `${ANIMEWORLD_API_URL}/api/anilist/${anilist_id}/${episode}/server/${altServer}`;
          } else {
            altUrl = `${ANIMEWORLD_API_URL}/api/anime/${anime_id}/${episode}/server/${altServer}`;
          }
          
          const altResponse = await axios.get(altUrl, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (altResponse.data && altResponse.data.sources && altResponse.data.sources.length > 0) {
            streamData = altResponse.data;
            streamData.server = altServer;
            break;
          }
        } catch (error) {
          console.error(`Alternative server ${altServer} failed:`, error.message);
        }
      }
    }

    if (!streamData || !streamData.sources || streamData.sources.length === 0) {
      return res.status(404).json({ error: 'Stream not found' });
    }

    return res.status(200).json(streamData);
  } catch (error) {
    console.error('Stream API error:', error.message);
    
    // Handle different types of errors
    if (error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: 'Anime service temporarily unavailable',
        details: 'Cannot connect to anime API'
      });
    }
    
    if (error.code === 'ETIMEDOUT') {
      return res.status(504).json({ 
        error: 'Request timeout',
        details: 'Anime API is taking too long to respond'
      });
    }
    
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;
      
      if (status === 404) {
        return res.status(404).json({ 
          error: 'Anime or episode not found',
          anime_id,
          episode,
          server,
          suggestion: 'Try a different server or check the anime ID'
        });
      }
      
      if (status === 403) {
        return res.status(403).json({ 
          error: 'Access denied',
          details: 'The anime API blocked this request'
        });
      }
      
      return res.status(status).json({ 
        error: `Anime API error: ${statusText}`,
        status,
        anime_id,
        episode
      });
    }
    
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Please try again later',
      anime_id,
      episode,
      server
    });
  }
}
