export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { anilistId, episode } = req.query;

  if (!anilistId || !episode) {
    return res.status(400).json({ error: 'anilistId and episode parameters required' });
  }

  // Server IDs and endpoints as shown in your screenshot
  const serverResponse = {
    "anilistId": anilistId,
    "episode": parseInt(episode),
    "categories": {
      "multi": [
        "SUB", 
        "ENGLISH",
        "HINDI", 
        "JAPANESE",
        "TAMIL"
      ]
    },
    "cached": true,
    "servers": [
      {
        "name": "vidcloud",
        "endpoint": `/api/get-server-ids?anilistId=${anilistId}&episode=${episode}`,
        "languages": ["SUB", "ENGLISH", "HINDI", "JAPANESE", "TAMIL"]
      },
      {
        "name": "streamwish", 
        "endpoint": `/api/get-server-ids?anilistId=${anilistId}&episode=${episode}`,
        "languages": ["SUB", "ENGLISH", "HINDI"]
      },
      {
        "name": "mp4upload",
        "endpoint": `/api/get-server-ids?anilistId=${anilistId}&episode=${episode}`, 
        "languages": ["SUB", "ENGLISH"]
      }
    ],
    "endpoint_pattern": "/player/{AniList ID}/{EP}/{LANG}?autoplay=true",
    "example": `/player/${anilistId}/${episode}/dub?autoplay=true`,
    "timestamp": new Date().toISOString()
  };

  return res.status(200).json(serverResponse);
}