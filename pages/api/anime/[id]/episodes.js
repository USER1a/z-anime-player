import axios from 'axios';

const ANIMEWORLD_API_URL = "https://animeworlda.vercel.app";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { source = 'animeworld' } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Anime ID required' });
  }

  try {
    let episodesUrl;
    
    if (source === 'animeworld') {
      episodesUrl = `${ANIMEWORLD_API_URL}/api/series/${id}`;
    } else {
      return res.status(400).json({ error: 'Unsupported source' });
    }

    const response = await axios.get(episodesUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const data = response.data;

    // Format episodes data
    let episodes = [];
    
    if (data && data.episodes) {
      episodes = data.episodes.map((ep, index) => ({
        number: ep.number || index + 1,
        title: ep.title || `Episode ${ep.number || index + 1}`,
        id: ep.id,
        thumbnail: ep.thumbnail,
        description: ep.description
      }));
    } else if (data && data.totalEpisodes) {
      // If only total episodes count is provided, generate episode list
      episodes = Array.from({ length: data.totalEpisodes }, (_, i) => ({
        number: i + 1,
        title: `Episode ${i + 1}`,
        id: `${id}-ep-${i + 1}`
      }));
    }

    return res.status(200).json({
      animeId: id,
      title: data.title || 'Unknown Anime',
      totalEpisodes: episodes.length,
      episodes
    });
  } catch (error) {
    console.error('Episodes API error:', error.message);
    
    if (error.response && error.response.status === 404) {
      return res.status(404).json({ error: 'Anime not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch episodes' });
  }
}