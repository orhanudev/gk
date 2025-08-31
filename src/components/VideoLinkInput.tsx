import React, { useState } from 'react';
import { Link, Play, Plus, Youtube } from 'lucide-react';
import { extractVideoIdFromUrl, createVideoFromUrl } from '../utils/videoUtils';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!url.trim()) {
      setError('Lütfen bir YouTube URL\'si girin');
      return;
    }

    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      setError('Geçerli bir YouTube URL\'si girin');
      return;
    }

    const video = createVideoFromUrl(url);
    onPlayVideo(video);
    setSuccess('Video oynatılıyor...');
    setUrl('');
  };

  const handleAddToPlaylist = () => {
    setError('');
    setSuccess('');

    if (!url.trim()) {
      setError('Lütfen bir YouTube URL\'si girin');
      return;
    }

    const videoId = extractVideoIdFromUrl(url);
    if (!videoId) {
      setError('Geçerli bir YouTube URL\'si girin');
      return;
    }

    const video = createVideoFromUrl(url);
    onAddToPlaylistModal(video);
    setSuccess('Video oynatma listesi seçimine eklendi');
    setUrl('');
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
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Play className="w-5 h-5 mr-2" />
              Oynat
            </button>
            <button
              type="button"
              onClick={handleAddToPlaylist}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Listeye Ekle
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