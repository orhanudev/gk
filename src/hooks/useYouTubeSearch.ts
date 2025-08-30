import { useState } from 'react';
import { Video } from '../types';

interface YouTubeSearchResponse {
  items: Array<{
    id: {
      videoId: string;
    };
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
    contentDetails?: {
      duration: string;
    };
  }>;
}

export function useYouTubeSearch() {
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchVideos = async (query: string, maxResults: number = 20) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      setError('YouTube API key not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, search for videos
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        throw new Error(`YouTube API error: ${searchResponse.status}`);
      }
      
      const searchData: YouTubeSearchResponse = await searchResponse.json();
      
      if (!searchData.items || searchData.items.length === 0) {
        setSearchResults([]);
        return;
      }

      // Get video IDs for duration lookup
      const videoIds = searchData.items.map(item => item.id.videoId).join(',');
      
      // Get video details including duration
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      
      if (!detailsResponse.ok) {
        throw new Error(`YouTube API error: ${detailsResponse.status}`);
      }
      
      const detailsData = await detailsResponse.json();
      
      // Combine search results with duration data
      const videos: Video[] = searchData.items.map((item, index) => {
        const details = detailsData.items?.[index];
        return {
          id: {
            videoId: item.id.videoId
          },
          snippet: {
            title: item.snippet.title,
            channelTitle: item.snippet.channelTitle,
            duration: details?.contentDetails?.duration || 'PT0S',
            uploadDate: item.snippet.publishedAt,
            thumbnails: {
              high: {
                url: item.snippet.thumbnails.high?.url || `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`
              }
            }
          }
        };
      });

      setSearchResults(videos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search videos');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchResults([]);
    setError(null);
  };

  return {
    searchResults,
    loading,
    error,
    searchVideos,
    clearSearch
  };
}