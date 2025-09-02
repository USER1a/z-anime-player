import axios from 'axios';

const ANIMEWORLD_API_URL = "https://animeworlda.vercel.app";
const TANIME_API_URL = "https://tanime.tv/api";

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

  const { q: query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query parameter required' });
  }

  try {
    const results = {
      animeworld: null,
      tanime: null,
      combined: []
    };

    // Search AnimeWorld API
    try {
      const animeWorldResponse = await axios.get(`${ANIMEWORLD_API_URL}/api/search`, {
        params: { query },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      results.animeworld = animeWorldResponse.data;
      if (animeWorldResponse.data && Array.isArray(animeWorldResponse.data)) {
        results.combined.push(...animeWorldResponse.data.map(item => ({
          ...item,
          source: 'animeworld'
        })));
      }
    } catch (error) {
      console.error('AnimeWorld search error:', error.message);
    }

    // Search TAnime API (if available)
    try {
      const tanimeResponse = await axios.get(`${TANIME_API_URL}/search`, {
        params: { q: query },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      results.tanime = tanimeResponse.data;
      if (tanimeResponse.data && Array.isArray(tanimeResponse.data)) {
        results.combined.push(...tanimeResponse.data.map(item => ({
          ...item,
          source: 'tanime'
        })));
      }
    } catch (error) {
      console.error('TAnime search error:', error.message);
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
