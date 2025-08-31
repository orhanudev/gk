import React, { useState } from 'react';
import { Link, Play, Plus, Youtube } from 'lucide-react';
import { extractVideoIdFromUrl, createVideoFromUrl, isValidYouTubeUrl } from '../utils/videoUtils';
import { Video } from '../types';

interface VideoLinkInputProps {
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
  onAddToPlaylistModal: (video: Video) => void;
}

export function VideoLinkInput({ onPlayVideo, onAddToPlaylist, onAddToPlaylistModal }: VideoLinkInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVideoDetails = async (videoId: string): Promise<{ title: string; channelTitle: string } | null> => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('YouTube API key not available, using fallback title');
      return null;
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
      );
      
      if (!response.ok) {
        console.warn('Failed to fetch video details');
        return null;
      }
      
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return {
          title: data.items[0].snippet.title,
          channelTitle: data.items[0].snippet.channelTitle
        };
      }
    } catch (error) {
      console.warn('Error fetching video details:', error);
    }
    
    return null;
  };

  const createEnhancedVideoFromUrl = async (url: string): Promise<Video> => {
    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      throw new Error('Geçersiz YouTube URL');
    }

    // Try to fetch real video details
    const details = await fetchVideoDetails(videoId);
    
    return {
      kind: 'youtube#video',
      etag: '',
      id: {
        videoId: videoId
      },
      snippet: {
        title: details?.title || `YouTube Video`,
        channelTitle: details?.channelTitle || 'YouTube',
        duration: 'PT0S',
        uploadDate: new Date().toISOString(),
        thumbnails: {
          high: {
            url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
          }
        }
      }
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!url.trim()) {
      setError('Lütfen bir YouTube URL\'si girin');
      setLoading(false);
      return;
    }

    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      setError('Geçerli bir YouTube URL\'si girin');
      setLoading(false);
      return;
    }

    try {
      const video = await createEnhancedVideoFromUrl(url);
      onPlayVideo(video);
      setSuccess('Video oynatılıyor...');
      setUrl('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Video yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    if (!url.trim()) {
      setError('Lütfen bir YouTube URL\'si girin');
      setLoading(false);
      return;
    }

    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      setError('Geçerli bir YouTube URL\'si girin');
      setLoading(false);
      return;
    }

    try {
      const video = await createEnhancedVideoFromUrl(url);
      onAddToPlaylistModal(video);
      setSuccess('Video oynatma listesi seçimine eklendi');
      setUrl('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Video yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center mb-6">
          <Youtube className="w-6 h-6 text-red-500 mr-3" />
          <h2 className="text-xl font-bold text-white">YouTube Video Ekle</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="video-url" className="block text-sm font-medium text-gray-300 mb-2">
              YouTube Video URL'si
            </label>
            <input
              id="video-url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-400 text-sm bg-green-900/20 border border-green-500/30 rounded p-2">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              {loading ? 'Yükleniyor...' : 'Oynat'}
            </button>
            <button
              type="button"
              onClick={handleAddToPlaylist}
              disabled={loading}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              {loading ? 'Yükleniyor...' : 'Listeye Ekle'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="text-white font-medium mb-3">Desteklenen Formatlar:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
            <li>• https://youtu.be/VIDEO_ID</li>
            <li>• https://m.youtube.com/watch?v=VIDEO_ID</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-900/20 border border-blue-500/30 rounded">
            <p className="text-blue-200 text-xs">
              <strong>İpucu:</strong> YouTube linkini yapıştırın ve "Oynat" butonuna tıklayın. 
              Video kendi oynatıcımızda açılacak.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}