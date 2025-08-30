import { useState, useEffect } from 'react';
import { Playlist, Video } from '../types';
import { videoDatabase } from '../database/database';

export function usePlaylistData() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const loadPlaylists = async () => {
    try {
      await videoDatabase.initialize();
      const dbPlaylists = await videoDatabase.getUserPlaylists();
      setPlaylists(dbPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const createPlaylist = async (name: string, videos: Video[] = []) => {
    try {
      await videoDatabase.initialize();
      const playlistId = await videoDatabase.createPlaylist(name);
      
      // Add videos to playlist if provided
      for (const video of videos) {
        await videoDatabase.addVideoToPlaylist(playlistId, video.id.videoId);
      }
      
      await loadPlaylists(); // Refresh the list
    } catch (error) {
      console.error('Error creating playlist:', error);
    }
  };

  const addToPlaylist = async (playlistId: string, video: Video) => {
    try {
      await videoDatabase.initialize();
      await videoDatabase.addVideoToPlaylist(parseInt(playlistId), video.id.videoId);
      await loadPlaylists(); // Refresh the list
    } catch (error) {
      console.error('Error adding video to playlist:', error);
    }
  };

  const removeFromPlaylist = async (playlistId: string, videoId: string) => {
    try {
      await videoDatabase.initialize();
      await videoDatabase.removeVideoFromPlaylist(parseInt(playlistId), videoId);
      await loadPlaylists(); // Refresh the list
    } catch (error) {
      console.error('Error removing video from playlist:', error);
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      await videoDatabase.initialize();
      await videoDatabase.deletePlaylist(parseInt(playlistId));
      await loadPlaylists(); // Refresh the list
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const markAsWatched = async (playlistId: string, videoId: string, watched: boolean = true) => {
    try {
      await videoDatabase.initialize();
      await videoDatabase.markVideoAsWatched(parseInt(playlistId), videoId, watched);
      await loadPlaylists(); // Refresh the list
    } catch (error) {
      console.error('Error marking video as watched:', error);
    }
  };

  return {
    playlists,
    createPlaylist,
    addToPlaylist,
    removeFromPlaylist,
    deletePlaylist,
    markAsWatched,
    refreshPlaylists: loadPlaylists
  };
}