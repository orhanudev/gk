import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Playlist, Video } from '../types';

interface PlaylistModalProps {
  video: Video | null;
  playlists: Playlist[];
  onClose: () => void;
  onCreatePlaylist: (name: string) => void;
  onAddToPlaylist: (playlistId: string, video: Video) => void;
  onDeletePlaylist: (playlistId: string) => void;
}

export function PlaylistModal({
  video,
  playlists,
  onClose,
  onCreatePlaylist,
  onAddToPlaylist,
  onDeletePlaylist
}: PlaylistModalProps) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!video) return null;

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlaylistName.trim()) {
      onCreatePlaylist(newPlaylistName.trim());
      setNewPlaylistName('');
      setShowCreateForm(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] md:max-h-[80vh] overflow-hidden mx-2 md:mx-0">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-white text-lg font-semibold">Oynatma Listesine Ekle</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="bg-gray-700 p-3 rounded-lg mb-4">
            <h4 className="text-white text-sm font-medium truncate">
              {video.snippet.title}
            </h4>
            <p className="text-gray-400 text-xs mt-1">
              {video.snippet.channelTitle}
            </p>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {playlists.length === 0 ? (
              <p className="text-gray-400 text-center py-4">
                Henüz oynatma listesi yok
              </p>
            ) : (
              playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  className="flex items-center justify-between bg-gray-700 p-3 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="text-white text-sm font-medium">
                      {playlist.name}
                    </h4>
                    <p className="text-gray-400 text-xs">
                      {playlist.videos.length} video
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        onAddToPlaylist(playlist.id, video);
                        onClose();
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Ekle
                    </button>
                    <button
                      onClick={() => onDeletePlaylist(playlist.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center w-full bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Oynatma Listesi Oluştur
              </button>
            ) : (
              <form onSubmit={handleCreatePlaylist} className="space-y-3">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Oynatma listesi adı"
                  className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors"
                  >
                    Oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewPlaylistName('');
                    }}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}