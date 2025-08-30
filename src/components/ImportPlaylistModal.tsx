import React, { useState } from 'react';
import { X, Download, AlertCircle, Loader2, Youtube, Link } from 'lucide-react';
import { useYouTubePlaylist } from '../hooks/useYouTubePlaylist';

interface ImportPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (videos: any[], title: string) => void;
}

export function ImportPlaylistModal({ isOpen, onClose, onImport }: ImportPlaylistModalProps) {
  const [playlistUrl, setPlaylistUrl] = useState('');
  const { loading, error, importPlaylist } = useYouTubePlaylist();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;

    const result = await importPlaylist(playlistUrl.trim());
    if (result) {
      onImport(result.videos, result.title);
      setPlaylistUrl('');
      onClose();
    }
  };

  const handleClose = () => {
    setPlaylistUrl('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <Youtube className="w-6 h-6 text-red-500 mr-3" />
            <h3 className="text-white text-lg font-semibold">YouTube Listesi İçe Aktar</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="playlist-url" className="block text-gray-300 text-sm font-medium mb-2">
                YouTube Playlist URL'si
              </label>
              <div className="relative">
                <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="playlist-url"
                  type="url"
                  value={playlistUrl}
                  onChange={(e) => setPlaylistUrl(e.target.value)}
                  placeholder="YouTube playlist veya playlist'teki video linki..."
                  className="w-full bg-gray-700 text-white pl-12 pr-12 py-3 rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
                  disabled={loading}
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-900 border border-red-600 rounded-lg p-3">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-4 rounded-lg transition-colors"
                disabled={loading}
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={!playlistUrl.trim() || loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                {loading ? 'İçe Aktarılıyor...' : 'İçe Aktar'}
              </button>
            </div>
          </form>

          {/* Instructions */}
          <div className="mt-6 bg-gray-700 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-2 text-sm">Desteklenen URL Formatları</h4>
            <div className="space-y-2 text-gray-300 text-xs">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <div>
                  <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                    https://www.youtube.com/playlist?list=PLAYLIST_ID
                  </code>
                  <p className="text-gray-400 text-xs mt-1">Standart YouTube playlist linki</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <div>
                  <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                    https://www.youtube.com/watch?v=VIDEO_ID&list=PLAYLIST_ID
                  </code>
                  <p className="text-gray-400 text-xs mt-1">Playlist'teki herhangi bir video linki</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></div>
                <div>
                  <code className="bg-gray-600 px-2 py-1 rounded text-xs">
                    https://youtu.be/VIDEO_ID?list=PLAYLIST_ID
                  </code>
                  <p className="text-gray-400 text-xs mt-1">Kısa video linki ile playlist</p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 p-2 bg-red-900 bg-opacity-30 rounded">
              <p className="text-red-200 text-xs">
                <strong>Not:</strong> YouTube API anahtarı gereklidir. Playlist linki veya playlist'teki 
                herhangi bir video linki kullanabilirsiniz. Tüm playlist içe aktarılacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}