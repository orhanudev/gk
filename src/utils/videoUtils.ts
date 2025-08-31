// Utility functions for video manipulation

export function extractVideoIdFromUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3`;
}

export function formatDuration(duration: string): string {
  // Convert ISO 8601 duration (PT4M13S) to readable format (4:13)
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '0:00';

  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function createVideoFromUrl(url: string) {
  const videoId = extractVideoIdFromUrl(url);
  if (!videoId) {
    throw new Error('Geçersiz YouTube URL');
  }

  return {
    id: {
      videoId: videoId
    },
    snippet: {
      title: `YouTube Video`,
      channelTitle: 'YouTube',
      duration: 'PT0S',
      uploadDate: new Date().toISOString(),
      thumbnails: {
        high: {
          url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
        }
      }
    }
  };
}

export function getVideoThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' = 'medium'): string {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault'
  };
  
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
}

export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoIdFromUrl(url) !== null;
}

export function createGKShareUrl(video: Video): string {
  const videoId = video.id.videoId || String(video.id);
  const baseUrl = window.location.origin;
  return `${baseUrl}?v=${videoId}`;
}

export function extractVideoIdFromGKUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v');
  } catch {
    return null;
  }
}