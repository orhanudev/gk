import React, { useState, useEffect } from 'react';
import { X, Play, SkipBack, SkipForward, Check, List, Maximize2, Minimize2 } from 'lucide-react';
import { Playlist, Video } from '../types';

interface PlaylistPlayerProps {
  playlist: Playlist | null;
  onClose: () => void;
  onUpdatePlaylist: (playlist: Playlist) => void;
}

export function PlaylistPlayer({ playlist, onClose, onUpdatePlaylist }: PlaylistPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (playlist) {
      setWatchedVideos(new Set(playlist.watchedVideos || []));
      setCurrentVideoIndex(playlist.currentVideoIndex || 0);
      
      // Mark the initial video as watched when playlist opens
      const initialVideo = playlist.videos[playlist.currentVideoIndex || 0];
      if (initialVideo) {
        const initialVideoId = getVideoId(initialVideo);
        const newWatchedVideos = new Set(playlist.watchedVideos || []);
        newWatchedVideos.add(initialVideoId);
        setWatchedVideos(newWatchedVideos);
        
        // Update the playlist with the watched status
        const updatedPlaylist = {
          ...playlist,
          watchedVideos: newWatchedVideos
        };
        onUpdatePlaylist(updatedPlaylist);
      }
    }
  }, [playlist]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onClose();
        }
      }
    };

    if (playlist) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [playlist, onClose, isFullscreen]);

  if (!playlist || !playlist.videos.length) return null;

  const getVideoId = (video: Video): string => {
    return video.id.videoId || video.id || '';
  };

  const currentVideo = playlist.videos[currentVideoIndex];
  const currentVideoId = getVideoId(currentVideo);
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1`;

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      updatePlaylist(newIndex);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(newIndex);
      updatePlaylist(newIndex);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    
    // Mark the selected video as watched immediately
    const selectedVideo = playlist.videos[index];
    const selectedVideoId = getVideoId(selectedVideo);
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(selectedVideoId);
    setWatchedVideos(newWatchedVideos);
    
    updatePlaylist(index);
  };

  const updatePlaylist = (newIndex: number) => {
    // Mark current video as watched when updating playlist
    const currentVideoId = getVideoId(playlist.videos[newIndex]);
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(currentVideoId);
    setWatchedVideos(newWatchedVideos);
    
    const updatedPlaylist = {
      ...playlist,
      currentVideoIndex: newIndex,
      watchedVideos: newWatchedVideos
    };
    onUpdatePlaylist(updatedPlaylist);
  };

  const toggleWatched = (videoId: string) => {
    const newWatchedVideos = new Set(watchedVideos);
    if (newWatchedVideos.has(videoId)) {
      newWatchedVideos.delete(videoId);
    } else {
      newWatchedVideos.add(videoId);
    }
    setWatchedVideos(newWatchedVideos);

    const updatedPlaylist = {
      ...playlist,
      watchedVideos: newWatchedVideos,
      currentVideoIndex
    };
    onUpdatePlaylist(updatedPlaylist);
  };

  const handleVideoEnd = () => {
    // Mark current video as watched
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(currentVideoId);
    setWatchedVideos(newWatchedVideos);

    // Auto-advance to next video
    if (currentVideoIndex < playlist.videos.length - 1) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex z-50">
      {/* Playlist Sidebar */}
      <div className={`bg-gray-800 ${isFullscreen ? 'hidden' : 'w-80'} h-full overflow-hidden flex flex-col border-r border-gray-700`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center">
            <List className="w-6 h-6 text-purple-400 mr-3" />
            <div>
              <h2 className="text-white text-lg font-semibold">
                {playlist.name}
              </h2>
              <p className="text-gray-400 text-sm">
                {currentVideoIndex + 1} / {playlist.videos.length} video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Playlist Controls */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handlePrevious}
              disabled={currentVideoIndex === 0}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>{isPlaying ? 'Duraklat' : 'Oynat'}</span>
            </button>
            
            <button
              onClick={handleNext}
              disabled={currentVideoIndex === playlist.videos.length - 1}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Video List */}
        <div className="flex-1 overflow-y-auto">
          {playlist.videos.map((video, index) => {
            const videoId = getVideoId(video);
            const isWatched = watchedVideos.has(videoId);
            const isCurrent = index === currentVideoIndex;
            
            return (
              <div
                key={videoId}
                className={`p-3 border-b border-gray-700 cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-purple-600 bg-opacity-20 border-purple-500'
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => handleVideoSelect(index)}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={video.snippet.thumbnails?.high?.url || 
                           video.snippet.thumbnails?.medium?.url || 
                           video.snippet.thumbnails?.default?.url ||
                           `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                      alt={video.snippet.title}
                      className="w-16 h-12 object-cover rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/120x90/374151/9CA3AF?text=Video';
                      }}
                    />
                    {isCurrent && (
                      <div className="absolute inset-0 bg-purple-600 bg-opacity-50 flex items-center justify-center rounded">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-80 text-white text-xs px-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h5 className="text-white text-sm font-medium line-clamp-2 mb-1">
                      {video.snippet.title}
                    </h5>
                    <p className="text-gray-400 text-xs">
                      {video.snippet.channelTitle}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatched(videoId);
                    }}
                    className={`flex-shrink-0 p-1 rounded transition-colors ${
                      isWatched
                        ? 'text-green-400 hover:text-green-300'
                        : 'text-gray-500 hover:text-gray-400'
                    }`}
                    title={isWatched ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Player Area */}
      <div className={`flex-1 bg-black flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
        {/* Video Player Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-white font-semibold text-lg line-clamp-2">
              {currentVideo.snippet.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {currentVideo.snippet.channelTitle} • Video {currentVideoIndex + 1} / {playlist.videos.length}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
            {!isFullscreen && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black relative">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={currentVideo.snippet.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video Info (when not fullscreen) */}
        {!isFullscreen && (
          <div className="bg-gray-800 p-4 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-white font-semibold line-clamp-1">
                  {currentVideo.snippet.title}
                </h3>
                <div className="flex items-center space-x-4 text-gray-400 text-sm">
                  <span>{currentVideo.snippet.channelTitle}</span>
                  {currentVideo.snippet.uploadDate && (
                    <span>
                      {new Date(currentVideo.snippet.uploadDate).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleWatched(currentVideoId)}
                  className={`p-2 rounded-lg transition-colors ${
                    watchedVideos.has(currentVideoId)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                  }`}
                  title={watchedVideos.has(currentVideoId) ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}