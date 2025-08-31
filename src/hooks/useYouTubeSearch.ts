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
        default?: { url: string };
        medium?: { url: string };
        high?: { url: string };
      };
    };
  }>;
}

interface YouTubeVideoDetailsResponse {
  items: Array<{
    id: string;
    contentDetails: {
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
      console.log('Searching for:', query);
      
      // First, search for videos
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&maxResults=${maxResults}&key=${apiKey}`;
      console.log('Search URL:', searchUrl);
      
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('Search API error:', searchResponse.status, errorText);
        throw new Error(`YouTube API error: ${searchResponse.status} - ${errorText}`);
      }
      
      const searchData: YouTubeSearchResponse = await searchResponse.json();
      console.log('Search response:', searchData);
      
      if (!searchData.items || searchData.items.length === 0) {
        console.log('No videos found for query:', query);
        setSearchResults([]);
        return;
      }

      // Get video IDs for duration lookup
      const videoIds = searchData.items.map(item => item.id.videoId).join(',');
      console.log('Getting details for video IDs:', videoIds);
      
      // Get video details including duration
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      
      let detailsData: YouTubeVideoDetailsResponse = { items: [] };
      if (detailsResponse.ok) {
        detailsData = await detailsResponse.json();
        console.log('Details response:', detailsData);
      } else {
        console.warn('Failed to get video details, proceeding without duration');
      }
      
      // Combine search results with duration data
      const videos: Video[] = searchData.items.map((item, index) => {
        const details = detailsData.items?.find(detail => detail.id === item.id.videoId);
        const thumbnailUrl = item.snippet.thumbnails.high?.url || 
                            item.snippet.thumbnails.medium?.url || 
                            item.snippet.thumbnails.default?.url ||
                            `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`;
        
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
                url: thumbnailUrl
              },
              medium: {
                url: thumbnailUrl
              },
              default: {
                url: thumbnailUrl
              }
            }
          }
        };
      });

      console.log('Processed videos:', videos);
      setSearchResults(videos);
    } catch (err) {
      console.error('Search error:', err);
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