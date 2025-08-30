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
    kind: 'youtube#video',
    etag: '',
    id: {
      kind: 'youtube#video',
      videoId: videoId
    },
    snippet: {
      publishedAt: new Date().toISOString(),
      channelId: '',
      title: 'YouTube Video',
      description: '',
      thumbnails: {
        default: { url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
        medium: { url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
        high: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` }
      },
      channelTitle: 'YouTube',
      tags: [],
      categoryId: '',
      liveBroadcastContent: 'none',
      defaultLanguage: '',
      localized: {
        title: 'YouTube Video',
        description: ''
      },
      defaultAudioLanguage: ''
    },
    statistics: {
      viewCount: '0',
      likeCount: '0',
      dislikeCount: '0',
      favoriteCount: '0',
      commentCount: '0'
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