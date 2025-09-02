import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, type = 'anime' } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    // Basic web scraping for anime sites
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://google.com',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    let scrapedData = {
      url,
      title: null,
      description: null,
      episodes: [],
      streamLinks: [],
      metadata: {}
    };

    const html = response.data;
    
    // Extract basic information using regex patterns
    // Title extraction
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      scrapedData.title = titleMatch[1].trim();
    }

    // Description extraction
    const descMatch = html.match(/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"']+)["\'][^>]*>/i);
    if (descMatch) {
      scrapedData.description = descMatch[1].trim();
    }

    // Look for video/stream links
    const streamPatterns = [
      /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/gi,
      /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/gi,
      /https?:\/\/[^"'\s]*stream[^"'\s]*\.(m3u8|mp4)[^"'\s]*/gi
    ];

    streamPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        scrapedData.streamLinks.push(...matches);
      }
    });

    // Look for episode information
    const episodePattern = /episode[^>]*>([^<]+)</gi;
    let episodeMatch;
    while ((episodeMatch = episodePattern.exec(html)) !== null) {
      scrapedData.episodes.push({
        title: episodeMatch[1].trim(),
        number: scrapedData.episodes.length + 1
      });
    }

    // Extract JSON-LD structured data if available
    const jsonLdMatch = html.match(/<script[^>]*type=["\']application\/ld\+json["\'][^>]*>([^<]+)<\/script>/gi);
    if (jsonLdMatch) {
      try {
        const jsonData = JSON.parse(jsonLdMatch[0].replace(/<script[^>]*>|<\/script>/gi, ''));
        scrapedData.metadata.structuredData = jsonData;
      } catch (e) {
        // Ignore JSON parsing errors
      }
    }

    // Remove duplicates from stream links
    scrapedData.streamLinks = [...new Set(scrapedData.streamLinks)];

    return res.status(200).json({
      success: true,
      data: scrapedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Scraping error:', error.message);
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(404).json({ error: 'Website not accessible' });
    }
    
    if (error.response && error.response.status === 403) {
      return res.status(403).json({ error: 'Access denied by target website' });
    }
    
    return res.status(500).json({ 
      error: 'Failed to scrape content',
      details: error.message 
    });
  }
}