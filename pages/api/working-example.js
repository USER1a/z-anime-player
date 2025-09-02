// Working example API that returns proper anime data structure
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { anime_id = '666243', episode = '1', server = 'vidcloud', audio = 'sub' } = req.query;

  // Return a working example that matches the expected format
  const exampleData = {
    "anilistId": anime_id,
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
    "server": server,
    "audio": audio,
    "sources": [
      {
        "file": "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
        "label": `${server.toUpperCase()} - ${audio.toUpperCase()}`,
        "type": "hls",
        "quality": "1080p"
      },
      {
        "file": "https://multiplatform-f.akamaihd.net/i/multi/will/bunny/big_buck_bunny_,640x360_400,640x360_700,640x360_1000,950x540_1500,.f4v.csmil/master.m3u8", 
        "label": `BACKUP - ${audio.toUpperCase()}`,
        "type": "hls",
        "quality": "720p"
      }
    ],
    "subtitles": [
      {
        "file": "https://example.com/subtitles/english.vtt",
        "label": "English",
        "kind": "captions"
      }
    ],
    "intro": {
      "start": 90,
      "end": 180
    },
    "outro": {
      "start": 1350,
      "end": 1440
    },
    "timestamp": new Date().toISOString(),
    "message": "Example working response - replace with real API when available"
  };

  return res.status(200).json(exampleData);
}