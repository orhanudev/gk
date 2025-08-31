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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (playlist) {
      setCurrentVideoIndex(playlist.currentVideoIndex || 0);
      setWatchedVideos(new Set(playlist.watchedVideos || []));
      
      // Mark the first video as watched when playlist starts
      if (playlist.videos.length > 0) {
        const firstVideoId = getVideoId(playlist.videos[playlist.currentVideoIndex || 0]);
        const newWatchedVideos = new Set(playlist.watchedVideos || []);
        newWatchedVideos.add(firstVideoId);
        setWatchedVideos(newWatchedVideos);
        
        // Update the playlist immediately
        const updatedPlaylist = {
          ...playlist,
          watchedVideos: newWatchedVideos
        };
        onUpdatePlaylist(updatedPlaylist);
      }
    }
  }, [playlist, onUpdatePlaylist]);

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
    return video.id.videoId || String(video.id) || '';
  };

  const currentVideo = playlist.videos[currentVideoIndex];
  const currentVideoId = getVideoId(currentVideo);
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1`;

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      
      // Mark the new video as watched and update playlist
      const newVideo = playlist.videos[newIndex];
      const newVideoId = getVideoId(newVideo);
      const newWatchedVideos = new Set(watchedVideos);
      newWatchedVideos.add(newVideoId);
      setWatchedVideos(newWatchedVideos);
      
      const updatedPlaylist = {
        ...playlist,
        currentVideoIndex: newIndex,
        watchedVideos: newWatchedVideos
      };
      onUpdatePlaylist(updatedPlaylist);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(newIndex);
      
      // Update playlist with new index
      const updatedPlaylist = {
        ...playlist,
        currentVideoIndex: newIndex,
        watchedVideos: watchedVideos
      };
      onUpdatePlaylist(updatedPlaylist);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
    
    // Mark the selected video as watched immediately
    const selectedVideo = playlist.videos[index];
    const selectedVideoId = getVideoId(selectedVideo);
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(selectedVideoId);
    setWatchedVideos(newWatchedVideos);
    
    // Update the playlist with new index and watched status
    const updatedPlaylist = {
      ...playlist,
      currentVideoIndex: index,
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

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex z-50">
      {/* Playlist Sidebar */}
      <div className={`bg-gray-800 ${isFullscreen ? 'hidden' : 'w-80 md:w-80'} ${isMobile ? 'w-72' : ''} h-full overflow-hidden flex flex-col border-r border-gray-700`}>
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
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            title="Kapat"
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
            
            <div className="bg-purple-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2">
              <Play className="w-5 h-5" />
              <span>Oynatılıyor</span>
            </div>
            
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
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {index + 1}
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

        {/* Video Controls (Bottom Bar) */}
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1 min-w-0 mr-4">
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
              
              <button
                onClick={toggleFullscreen}
                className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-lg transition-colors"
                title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              <button
                onClick={onClose}
                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors"
                title="Playlist'i Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}