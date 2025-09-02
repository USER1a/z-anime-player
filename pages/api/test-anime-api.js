import axios from 'axios';

const ANIMEWORLD_API_URL = "https://animeworlda.vercel.app";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { anime_id = '666243', episode = '1', server = 'vidcloud' } = req.query;

  const testResults = {
    timestamp: new Date().toISOString(),
    anime_id,
    episode,
    server,
    tests: []
  };

  // Test different endpoint formats
  const endpoints = [
    `${ANIMEWORLD_API_URL}/`,
    `${ANIMEWORLD_API_URL}/api`,
    `${ANIMEWORLD_API_URL}/api/search?query=naruto`,
    `${ANIMEWORLD_API_URL}/api/anime/${anime_id}/${episode}/server/${server}`,
    `${ANIMEWORLD_API_URL}/api/series/${anime_id}`,
    `${ANIMEWORLD_API_URL}/api/player/${anime_id}`,
    `${ANIMEWORLD_API_URL}/api/source/${anime_id}?server=1`,
    `${ANIMEWORLD_API_URL}/api/anilist/${anime_id}/${episode}/server/${server}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: () => true // Accept any status
      });

      testResults.tests.push({
        endpoint,
        status: response.status,
        success: response.status < 400,
        dataSize: JSON.stringify(response.data).length,
        hasVideo: response.data?.sources ? response.data.sources.length > 0 : false,
        responseTime: new Date().toISOString()
      });

    } catch (error) {
      testResults.tests.push({
        endpoint,
        status: 'ERROR',
        success: false,
        error: error.message,
        errorCode: error.code
      });
    }
  }

  // Check if any endpoints are working
  const workingEndpoints = testResults.tests.filter(test => test.success);
  
  testResults.summary = {
    totalTests: endpoints.length,
    workingEndpoints: workingEndpoints.length,
    apiStatus: workingEndpoints.length > 0 ? 'PARTIALLY_WORKING' : 'DOWN',
    recommendedEndpoint: workingEndpoints[0]?.endpoint || null
  };

  return res.status(200).json(testResults);
}