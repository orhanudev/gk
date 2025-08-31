import React, { useState } from 'react';
import { Play, Trash2, Plus, Video, Clock, Check, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Video as VideoType } from '../types';
import { ImportPlaylistModal } from './ImportPlaylistModal';

interface Playlist {
  id: string;
  name: string;
  videos: VideoType[];
  createdAt: string;
  watchedVideos?: Set<string>;
}

interface PlaylistManagerProps {
  playlists: Playlist[];
  onPlayPlaylist: (playlist: Playlist) => void;
  onRemoveFromPlaylist: (playlistId: string, videoId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onAddVideoToPlaylist: (video: VideoType | null) => void;
  onCreatePlaylist: (name: string, videos?: VideoType[]) => void;
  onToggleWatched: (playlistId: string, videoId: string) => void;
  onImportPlaylist?: (videos: VideoType[], title: string) => void;
}

export function PlaylistManager({
  playlists,
  onPlayPlaylist,
  onRemoveFromPlaylist,
  onDeletePlaylist,
  onAddVideoToPlaylist,
  onCreatePlaylist,
  onToggleWatched,
  onImportPlaylist
}: PlaylistManagerProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());
  const [showImportModal, setShowImportModal] = useState(false);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
    }
  };

  const togglePlaylistExpansion = (playlistId: string) => {
    const newExpanded = new Set(expandedPlaylists);
    if (newExpanded.has(playlistId)) {
      newExpanded.delete(playlistId);
    } else {
      newExpanded.add(playlistId);
    }
    setExpandedPlaylists(newExpanded);
  };

  const handlePlayVideo = (video: VideoType) => {
    const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`;
    window.open(videoUrl, '_blank');
  };

  const handleImportPlaylist = (videos: VideoType[], title: string) => {
    if (onImportPlaylist) {
      onImportPlaylist(title, videos);
    } else {
      onCreatePlaylist(title, videos);
    }
    setShowImportModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Play className="w-8 h-8 mr-3 text-purple-400" />
          Oynatma Listelerim ({playlists.length})
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>YouTube'dan İçe Aktar</span>
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Yeni Liste</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <form onSubmit={handleCreatePlaylist} className="flex gap-2">
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Liste adı..."
              className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-purple-500 focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
            >
              Oluştur
            </button>
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                setNewPlaylistName('');
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded transition-colors"
            >
              İptal
            </button>
          </form>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Henüz oynatma listeniz yok</p>
            <p className="text-sm mt-2">Videolara tıklayarak oynatma listesi oluşturabilirsiniz</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => togglePlaylistExpansion(playlist.id)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {expandedPlaylists.has(playlist.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <Play className="w-5 h-5 text-purple-400" />
                  <div>
                    <h3 className="text-xl font-semibold text-white">{playlist.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {playlist.videos.length} video • {new Date(playlist.createdAt).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onPlayPlaylist(playlist)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    <span>Oynat</span>
                  </button>
                  <button
                    onClick={() => onDeletePlaylist(playlist.id)}
                    className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {playlist.videos.length > 0 && expandedPlaylists.has(playlist.id) && (
                <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                  {playlist.videos.map((video, index) => {
                    const videoId = video.id.videoId || String(video.id);
                    const isVideoWatched = playlist.watchedVideos?.has(videoId);
                    return (
                      <div
                        key={videoId}
                        className="group flex items-center bg-gray-700 rounded-lg p-3 hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => handlePlayVideo(video)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white text-sm font-medium line-clamp-2 group-hover:text-purple-300 transition-colors">
                              {video.snippet.title}
                            </h4>
                            <p className="text-gray-400 text-xs mt-1 truncate">
                              {video.snippet.channelTitle}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {isVideoWatched && (
                            <div className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
                              <Check className="w-3 h-3 mr-1" />
                              İzlendi
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatched(playlist.id, String(videoId));
                            }}
                            className={`p-1 rounded transition-colors ${
                              isVideoWatched 
                                ? 'bg-green-600 hover:bg-green-700 text-white' 
                                : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }`}
                            title={isVideoWatched ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveFromPlaylist(playlist.id, String(videoId));
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white p-1 rounded transition-colors"
                            title="Listeden kaldır"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Import Playlist Modal */}
      <ImportPlaylistModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportPlaylist}
      />
    </div>
  );
}