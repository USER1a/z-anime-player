import axios from 'axios';

const ANIMEWORLD_API_URL = "https://animeworlda.vercel.app";
const M3U8_PROXY_URL = "https://m38u.vercel.app";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { params } = req.query;
  
  if (!params || params.length < 3) {
    return res.status(400).json({ 
      error: 'Invalid parameters. Expected: /api/anilist/[anilistId]/[episode]/[server]' 
    });
  }

  const [anilistId, episode, serverName] = params;
  const { autoplay = 'true', lang = 'english' } = req.query;

  try {
    // Construct the API URL for AniList ID based streaming
    const streamUrl = `${ANIMEWORLD_API_URL}/api/anilist/${anilistId}/${episode}/server/${serverName}`;
    
    const response = await axios.get(streamUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://animeworld.tv/',
        'Origin': 'https://animeworld.tv'
      }
    });

    let streamData = response.data;

    // Process multiple language support
    const languageCategories = {
      english: ["SUB", "ENGLISH"],
      japanese: ["SUB", "JAPANESE"],
      hindi: ["HINDI", "DUB"],
      bangla: ["BANGLA", "BENGALI"],
      tamil: ["TAMIL"],
      kannada: ["KANNADA"],
      malayalam: ["MALAYALAM"],
      telugu: ["TELUGU"]
    };

    // Filter sources by language if specified
    if (streamData && streamData.sources && lang !== 'english') {
      const langCategories = languageCategories[lang.toLowerCase()];
      if (langCategories) {
        streamData.sources = streamData.sources.filter(source => 
          langCategories.some(cat => 
            source.label?.toUpperCase().includes(cat) ||
            source.lang?.toUpperCase().includes(cat)
          )
        );
      }
    }

    // Process streaming links through M3U8 proxy
    if (streamData && streamData.sources) {
      streamData.sources = streamData.sources.map(source => {
        const originalUrl = source.file || source.url;
        
        if (originalUrl && (originalUrl.includes('.m3u8') || originalUrl.includes('manifest'))) {
          return {
            ...source,
            file: `${M3U8_PROXY_URL}/proxy?url=${encodeURIComponent(originalUrl)}`,
            originalUrl,
            proxied: true
          };
        }
        return source;
      });

      // Add categories for multi-language support
      streamData.categories = languageCategories;
      streamData.selectedLanguage = lang;
    }

    // Generate player embed URL pattern as shown in screenshot
    const playerPattern = `/player/{AniList ID}/{EP}/{LANG}?autoplay=${autoplay}`;
    const exampleUrl = `/player/${anilistId}/${episode}/${lang}?autoplay=${autoplay}`;

    const responseData = {
      anilistId,
      episode: parseInt(episode),
      categories: languageCategories,
      cached: true,
      server: serverName,
      language: lang,
      autoplay: autoplay === 'true',
      endpoint_pattern: playerPattern,
      example: exampleUrl,
      sources: streamData?.sources || [],
      subtitles: streamData?.subtitles || [],
      intro: streamData?.intro || null,
      outro: streamData?.outro || null,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(responseData);

  } catch (error) {
    console.error('AniList API error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Anime episode not found',
        anilistId,
        episode,
        server: serverName
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch stream data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}