import { useEffect } from 'react';
import { Video } from '../types';
import { extractVideoIdFromGKUrl } from '../utils/videoUtils';

interface UseDeepLinkProps {
  onPlayVideo: (video: Video) => void;
}

export function useDeepLink({ onPlayVideo }: UseDeepLinkProps) {
  useEffect(() => {
    const handleDeepLink = async () => {
      const currentUrl = window.location.href;
      const videoId = extractVideoIdFromGKUrl(currentUrl);
      
      if (videoId) {
        console.log('Deep link detected for video:', videoId);
        
        // Create a video object for the shared video
        const sharedVideo: Video = {
          id: { videoId },
          snippet: {
            title: 'Paylaşılan Video',
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

        // Try to fetch real video details if API key is available
        const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
        if (apiKey) {
          try {
            const response = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
            );
            
            if (response.ok) {
              const data = await response.json();
              if (data.items && data.items.length > 0) {
                const videoData = data.items[0];
                sharedVideo.snippet.title = videoData.snippet.title;
                sharedVideo.snippet.channelTitle = videoData.snippet.channelTitle;
                sharedVideo.snippet.uploadDate = videoData.snippet.publishedAt;
                
                if (videoData.snippet.thumbnails?.high?.url) {
                  sharedVideo.snippet.thumbnails.high.url = videoData.snippet.thumbnails.high.url;
                }
              }
            }
          } catch (error) {
            console.warn('Could not fetch video details for shared video:', error);
          }
        }

        // Play the video
        onPlayVideo(sharedVideo);
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleDeepLink();
  }, [onPlayVideo]);
}