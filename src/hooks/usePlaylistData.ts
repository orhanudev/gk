import { useState, useEffect } from 'react';
import { Playlist, Video } from '../types';
import { useLocalStorage } from './useLocalStorage';

export function usePlaylistData() {
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('video-playlists', []);

  const createPlaylist = (name: string, videos: Video[] = []) => {
    const newPlaylist: Playlist = {
      id: Date.now().toString(),
      name,
      videos,
      createdAt: new Date().toISOString(),
      watchedVideos: new Set(),
      currentVideoIndex: 0
    };

    setPlaylists(prev => [...prev, newPlaylist]);
  };

  const addToPlaylist = (playlistId: string, video: Video) => {
    setPlaylists(prev => 
      prev.map(playlist => 
        playlist.id === playlistId
          ? { ...playlist, videos: [...playlist.videos, video] }
          : playlist
      )
    );
  };

  const removeFromPlaylist = (playlistId: string, videoId: string) => {
    setPlaylists(prev =>
      prev.map(playlist =>
        playlist.id === playlistId
          ? { ...playlist, videos: playlist.videos.filter(v => v.id.videoId !== videoId) }
          : playlist
      )
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists(prev => prev.filter(playlist => playlist.id !== playlistId));
  };

  const markAsWatched = (playlistId: string, videoId: string, watched: boolean = true) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          const newWatchedVideos = new Set(playlist.watchedVideos);
          if (watched) {
            newWatchedVideos.add(videoId);
          } else {
            newWatchedVideos.delete(videoId);
          }
          return { ...playlist, watchedVideos: newWatchedVideos };
        }
        return playlist;
      })
    );
  };

  const toggleWatched = (playlistId: string, videoId: string) => {
    setPlaylists(prev =>
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          const newWatchedVideos = new Set(playlist.watchedVideos);
          if (newWatchedVideos.has(videoId)) {
            newWatchedVideos.delete(videoId);
          } else {
            newWatchedVideos.add(videoId);
          }
          return { ...playlist, watchedVideos: newWatchedVideos };
        }
        return playlist;
      })
    );
  };

  return {
    playlists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    markAsWatched,
    toggleWatched,
    updatePlaylist,
    refreshPlaylists: () => {} // No-op since we're using localStorage
  };
}