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
      error: 'Invalid parameters. Expected: /api/player/[anilistId]/[episode]/[language]' 
    });
  }

  const [anilistId, episode, language] = params;
  const { autoplay = 'true', server = 'vidcloud' } = req.query;

  try {
    // Get streaming data from AnimeWorld API
    const streamUrl = `${ANIMEWORLD_API_URL}/api/anilist/${anilistId}/${episode}/server/${server}`;
    
    const response = await axios.get(streamUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    let streamData = response.data;

    // Language categories exactly as shown in your screenshot
    const categories = {
      "multi": [
        "SUB",
        "ENGLISH", 
        "HINDI",
        "JAPANESE",
        "TAMIL"
      ]
    };

    // Process sources through M3U8 proxy
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
    }

    // Response format matching your screenshot
    const playerResponse = {
      "anilistId": anilistId,
      "episode": parseInt(episode),
      "categories": categories,
      "cached": true,
      "language": language,
      "autoplay": autoplay === 'true',
      "server": server,
      "sources": streamData?.sources || [],
      "subtitles": streamData?.subtitles || [],
      "timestamp": new Date().toISOString()
    };

    // If this is a direct player request, return HTML player
    if (req.headers.accept?.includes('text/html')) {
      const playerHtml = generatePlayerHTML(playerResponse, anilistId, episode, language, autoplay);
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(playerHtml);
    }

    // Return JSON API response
    return res.status(200).json(playerResponse);

  } catch (error) {
    console.error('Player API error:', error.message);
    
    if (error.response?.status === 404) {
      return res.status(404).json({ 
        error: 'Content not found',
        anilistId,
        episode,
        language
      });
    }
    
    return res.status(500).json({ 
      error: 'Failed to load player data'
    });
  }
}

function generatePlayerHTML(data, anilistId, episode, language, autoplay) {
  const sources = data.sources || [];
  const primarySource = sources[0]?.file || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Z-Anime Player - Episode ${episode}</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #000; 
            font-family: 'Arial', sans-serif;
            overflow: hidden;
        }
        .player-container { 
            width: 100vw; 
            height: 100vh; 
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        video { 
            width: 100%; 
            height: 100%; 
            object-fit: contain;
            background: #000;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #00d4ff;
            font-size: 1.2rem;
            z-index: 10;
        }
        .error {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #ff6b9d;
            text-align: center;
            z-index: 10;
        }
    </style>
</head>
<body>
    <div class="player-container">
        <div class="loading" id="loading">Loading Z-Anime Player...</div>
        <video id="video" controls ${autoplay === 'true' ? 'autoplay' : ''} preload="auto"></video>
        <div class="error" id="error" style="display: none;">
            <h3>Failed to load video</h3>
            <p>Please check your connection and try again</p>
        </div>
    </div>

    <script>
        const video = document.getElementById('video');
        const loading = document.getElementById('loading');
        const error = document.getElementById('error');
        const sources = ${JSON.stringify(sources)};
        
        let hls = null;

        function loadVideo() {
            if (!sources.length) {
                showError('No video sources available');
                return;
            }

            const source = sources[0];
            const videoUrl = source.file || source.url;

            if (!videoUrl) {
                showError('Invalid video source');
                return;
            }

            if (videoUrl.includes('.m3u8')) {
                if (Hls.isSupported()) {
                    hls = new Hls({
                        enableWorker: true,
                        lowLatencyMode: true,
                        backBufferLength: 90
                    });
                    
                    hls.loadSource(videoUrl);
                    hls.attachMedia(video);
                    
                    hls.on(Hls.Events.MANIFEST_PARSED, () => {
                        hideLoading();
                        ${autoplay === 'true' ? 'video.play().catch(console.error);' : ''}
                    });

                    hls.on(Hls.Events.ERROR, (event, data) => {
                        console.error('HLS Error:', data);
                        if (data.fatal) {
                            showError('Video playback error');
                        }
                    });
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = videoUrl;
                    hideLoading();
                }
            } else {
                video.src = videoUrl;
                hideLoading();
            }

            video.addEventListener('loadstart', () => showLoading());
            video.addEventListener('canplay', () => hideLoading());
            video.addEventListener('error', () => showError('Video loading failed'));
        }

        function showLoading() {
            loading.style.display = 'block';
        }

        function hideLoading() {
            loading.style.display = 'none';
        }

        function showError(message) {
            loading.style.display = 'none';
            error.style.display = 'block';
            error.querySelector('p').textContent = message;
        }

        // Initialize player
        loadVideo();

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            if (hls) {
                hls.destroy();
            }
        });
    </script>
</body>
</html>`;
}