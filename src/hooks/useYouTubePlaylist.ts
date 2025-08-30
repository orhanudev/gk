import { useState } from 'react';
import { Video } from '../types';

interface YouTubePlaylistResponse {
  items: Array<{
    snippet: {
      resourceId: {
        videoId: string;
      };
      title: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
    };
  }>;
  nextPageToken?: string;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails: {
        high: {
          url: string;
        };
      };
    };
    contentDetails: {
      duration: string;
    };
  }>;
}

export function useYouTubePlaylist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractPlaylistId = (url: string): string | null => {
    const patterns = [
      /[?&]list=([^&\n?#]+)/,
      /youtube\.com\/playlist\?list=([^&\n?#]+)/,
      /youtube\.com\/watch\?.*list=([^&\n?#]+)/,
      /youtu\.be\/.*\?.*list=([^&\n?#]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const importPlaylist = async (playlistUrl: string): Promise<{ videos: Video[]; title: string } | null> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      setError('YouTube API anahtarı gerekli. Lütfen VITE_YOUTUBE_API_KEY ortam değişkenini ayarlayın.');
      return null;
    }

    const playlistId = extractPlaylistId(playlistUrl);
    if (!playlistId) {
      setError('Geçersiz YouTube playlist URL\'si. Lütfen geçerli bir playlist linki girin.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Get playlist details
      const playlistDetailsUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${playlistId}&key=${apiKey}`;
      const playlistResponse = await fetch(playlistDetailsUrl);
      
      if (!playlistResponse.ok) {
        throw new Error(`YouTube API error: ${playlistResponse.status}`);
      }
      
      const playlistData = await playlistResponse.json();
      
      if (!playlistData.items || playlistData.items.length === 0) {
        throw new Error('Playlist bulunamadı veya erişilemiyor.');
      }

      const playlistTitle = playlistData.items[0].snippet.title;

      // Get playlist items (videos)
      let allVideos: Video[] = [];
      let nextPageToken = '';
      const maxResults = 50;

      do {
        const playlistItemsUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
        const itemsResponse = await fetch(playlistItemsUrl);
        
        if (!itemsResponse.ok) {
          throw new Error(`YouTube API error: ${itemsResponse.status}`);
        }
        
        const itemsData: YouTubePlaylistResponse = await itemsResponse.json();
        
        if (itemsData.items && itemsData.items.length > 0) {
          // Get video IDs for duration lookup
          const videoIds = itemsData.items
            .map(item => item.snippet.resourceId.videoId)
            .filter(Boolean)
            .join(',');
          
          if (videoIds) {
            // Get video details including duration
            const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
            const detailsResponse = await fetch(detailsUrl);
            
            if (detailsResponse.ok) {
              const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json();
              
              // Combine playlist items with video details
              const videos: Video[] = itemsData.items
                .map(item => {
                  const videoId = item.snippet.resourceId.videoId;
                  const details = detailsData.items?.find(detail => detail.id === videoId);
                  
                  return {
                    id: { videoId },
                    snippet: {
                      title: details?.snippet.title || item.snippet.title,
                      channelTitle: details?.snippet.channelTitle || item.snippet.channelTitle,
                      duration: details?.contentDetails.duration || 'PT0S',
                      uploadDate: details?.snippet.publishedAt || item.snippet.publishedAt,
                      thumbnails: {
                        high: {
                          url: details?.snippet.thumbnails.high?.url || 
                               item.snippet.thumbnails.high?.url || 
                               `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
                        }
                      }
                    }
                  };
                })
                .filter(video => video.id.videoId); // Filter out any invalid videos
              
              allVideos = [...allVideos, ...videos];
            }
          }
        }
        
        nextPageToken = itemsData.nextPageToken || '';
      } while (nextPageToken && allVideos.length < 200); // Limit to 200 videos max

      return {
        videos: allVideos,
        title: playlistTitle
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Playlist import edilirken hata oluştu');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    importPlaylist,
    extractPlaylistId
  };
}