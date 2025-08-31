import React, { useState, useMemo } from 'react';
import { List, Search, Play, Folder, Video as VideoIcon, AlertCircle } from 'lucide-react';
import { useYouTubeSearch } from '../hooks/useYouTubeSearch';
import { VideoGrid } from './VideoGrid';
import { Video } from '../types';

interface YouTubeSearchProps {
  onAddToPlaylist: (video: Video) => void;
}

export function YouTubeSearch({ onAddToPlaylist }: YouTubeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults, loading, error, searchVideos } = useYouTubeSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Starting search for:', searchQuery);
      searchVideos(searchQuery);
    }
  };

  const handlePlayVideo = (video: Video) => {
    // Open video in new tab
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`;
    window.open(videoUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
          <Search className="w-8 h-8 mr-3 text-red-500" />
          YouTube'da Ara
        </h2>
        <p className="text-gray-400 mb-6">
          YouTube'da video arayın ve oynatma listelerinize ekleyin
        </p>
      </div>

      <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Video ara... (örn: 'React tutorial')"
            className="w-full bg-gray-800 text-white pl-12 pr-4 py-4 rounded-xl border border-gray-700 focus:border-red-500 focus:outline-none text-lg"
          />
          <button
            type="submit"
            disabled={!searchQuery.trim() || loading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {loading ? 'Arıyor...' : 'Ara'}
          </button>
        </div>
      </form>

      {error && (
        <div className="max-w-2xl mx-auto bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-400">{error}</p>
              <p className="text-red-300 text-sm mt-1">
                API anahtarını kontrol edin ve tekrar deneyin.
              </p>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-400">
            <Search className="w-16 h-16 mx-auto mb-4 animate-pulse" />
            <p className="text-lg">"{searchQuery}" aranıyor...</p>
          </div>
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <VideoIcon className="w-6 h-6 mr-2 text-blue-400" />
              Arama Sonuçları ({searchResults.length})
            </h3>
          </div>
          <VideoGrid
            videos={searchResults}
            onPlayVideo={handlePlayVideo}
            onAddToPlaylist={onAddToPlaylist}
          />
        </div>
      )}

      {searchResults && searchResults.length === 0 && searchQuery && !loading && !error && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">"{searchQuery}" için sonuç bulunamadı</p>
          <p className="text-gray-500 text-sm mt-2">Farklı anahtar kelimeler deneyin</p>
        </div>
      )}

      {!searchResults && !loading && !searchQuery && (
        <div className="text-center py-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">YouTube'da video aramak için yukarıdaki arama kutusunu kullanın</p>
          <p className="text-gray-500 text-sm mt-2">Sonuçları oynatma listelerinize ekleyebilirsiniz</p>
        </div>
      )}
    </div>
  );
}