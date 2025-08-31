import React, { useState, useEffect } from 'react';
import { X, Play, SkipBack, SkipForward, Check, List, Maximize2, Minimize2, Share2, Repeat, Shuffle } from 'lucide-react';
import { Playlist, Video } from '../types';

interface PlaylistPlayerProps {
  playlist: Playlist | null;
  onClose: () => void;
  onUpdatePlaylist: (playlist: Playlist) => void;
}

const shareVideo = async (video: Video) => {
  const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`;
  const shareData = {
    title: video.snippet.title,
    text: `${video.snippet.title} - ${video.snippet.channelTitle}`,
    url: videoUrl
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(videoUrl);
      alert('Video linki panoya kopyalandı!');
    }
  } catch (error) {
    console.error('Error sharing:', error);
    try {
      await navigator.clipboard.writeText(videoUrl);
      alert('Video linki panoya kopyalandı!');
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      prompt('Video linkini kopyalayın:', videoUrl);
    }
  }
};

export function PlaylistPlayer({ playlist, onClose, onUpdatePlaylist }: PlaylistPlayerProps) {
  // ALL hooks must be declared first, before any conditional logic
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [shuffleMode, setShuffleMode] = useState(false);

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

  // Keyboard event handler
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

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, onClose]);

  // Auto-advance to next video
  useEffect(() => {
    if (!autoplay || !playlist) return;

    // Listen for YouTube player events to detect when video ends
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = JSON.parse(event.data);
        // YouTube player sends state changes: 0 = ended, 1 = playing, 2 = paused
        if (data.event === 'video-progress' && data.info?.playerState === 0) {
          // Video ended, advance to next
          if (shuffleMode) {
            // Random next video
            const availableIndices = playlist.videos
              .map((_, index) => index)
              .filter(index => index !== currentVideoIndex);
            
            if (availableIndices.length > 0) {
              const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
              handleVideoSelect(randomIndex);
            }
          } else {
            // Sequential play
            if (currentVideoIndex < playlist.videos.length - 1) {
              handleNext();
            }
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentVideoIndex, autoplay, shuffleMode, playlist, handleNext]);

  // Early return AFTER all hooks are declared
  if (!playlist || !playlist.videos.length) return null;

  const getVideoId = (video: Video): string => {
    return video.id.videoId || String(video.id) || '';
  };

  const currentVideo = playlist.videos[currentVideoIndex];
  
  const currentVideoId = getVideoId(currentVideo);
  
  // Create embed URL with autoplay parameters
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1&enablejsapi=1&origin=${window.location.origin}&end=${Date.now()}`;

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
    <div className={`fixed inset-0 bg-black bg-opacity-90 z-50 ${
      isMobile ? 'flex flex-col' : 'flex'
    }`}>
      {/* Playlist Sidebar */}
      <div className={`bg-gray-800 ${
        isFullscreen ? 'hidden' : 
        isMobile ? 'w-full h-48 border-b' : 'w-80 h-full border-r'
      } overflow-hidden flex flex-col border-gray-700`}>
        {/* Sidebar Header */}
        <div className={`flex items-center justify-between border-b border-gray-700 ${
          isMobile ? 'p-2' : 'p-4'
        }`}>
          <div className="flex items-center">
            <List className="w-6 h-6 text-purple-400 mr-3" />
            <div>
              <h2 className={`text-white font-semibold ${isMobile ? 'text-sm' : 'text-lg'}`}>
                {playlist.name}
              </h2>
              <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
        <div className={`border-b border-gray-700 ${isMobile ? 'p-1' : 'p-4'}`}>
          <div className="flex items-center justify-center space-x-2 mb-3">
            <button
              onClick={handlePrevious}
              disabled={currentVideoIndex === 0}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1.5 rounded-lg hover:bg-gray-700"
            >
              <SkipBack className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>
            
            <div className={`bg-purple-600 text-white rounded-lg flex items-center space-x-2 ${isMobile ? 'px-3 py-2' : 'px-6 py-3'}`}>
              <Play className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
              <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Oynatılıyor</span>
            </div>
            
            <button
              onClick={handleNext}
              disabled={currentVideoIndex === playlist.videos.length - 1}
              className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors p-1.5 rounded-lg hover:bg-gray-700"
            >
              <SkipForward className={`${isMobile ? 'w-4 h-4' : 'w-5 h-5'}`} />
            </button>
          </div>
          
          {/* Autoplay Controls */}
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setAutoplay(!autoplay)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors text-xs ${
                autoplay
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
              title={autoplay ? 'Otomatik oynatmayı kapat' : 'Otomatik oynatmayı aç'}
            >
              <Repeat className="w-3 h-3" />
              <span>Otomatik</span>
            </button>
            
            <button
              onClick={() => setShuffleMode(!shuffleMode)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-colors text-xs ${
                shuffleMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
              }`}
              title={shuffleMode ? 'Sıralı oynatma' : 'Karışık oynatma'}
            >
              <Shuffle className="w-3 h-3" />
              <span>{shuffleMode ? 'Karışık' : 'Sıralı'}</span>
            </button>
          </div>
        </div>
        
        {/* Video List */}
        <div className={`flex-1 overflow-y-auto ${isMobile ? 'overflow-x-auto' : ''}`}>
          <div className={isMobile ? 'flex space-x-2 p-2' : ''}>
          {playlist.videos.map((video, index) => {
            const videoId = getVideoId(video);
            const isWatched = watchedVideos.has(videoId);
            const isCurrent = index === currentVideoIndex;
            
            return (
              <div
                key={videoId}
                className={`cursor-pointer transition-colors ${
                  isMobile 
                    ? `flex-shrink-0 w-32 p-2 rounded-lg ${
                        isCurrent ? 'bg-purple-600 bg-opacity-20 border border-purple-500' : 'bg-gray-700'
                      }`
                    : `p-3 border-b border-gray-700 ${
                  isCurrent
                    ? 'bg-purple-600 bg-opacity-20 border-purple-500'
                    : 'hover:bg-gray-700'
                      }`
                }`}
                onClick={() => handleVideoSelect(index)}
              >
                <div className={`flex ${
                  isMobile ? 'flex-col space-y-1' : 'items-start space-x-3'
                }`}>
                  <div className={`flex-shrink-0 bg-purple-600 rounded-full flex items-center justify-center text-white font-medium ${isMobile ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'}`}>
                    {index + 1}
                  </div>
                  
                  <div className={`${isMobile ? '' : 'flex-1'} min-w-0`}>
                    <h5 className={`text-white font-medium line-clamp-2 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      {video.snippet.title}
                    </h5>
                    <p className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                      {video.snippet.channelTitle}
                    </p>
                  </div>

                  <div className={`flex ${isMobile ? 'justify-center space-x-1' : 'flex-col space-y-1'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareVideo(video, true);
                      }}
                      className={`flex-shrink-0 rounded transition-colors ${isMobile ? 'p-0.5' : 'p-1'} text-gray-500 hover:text-gray-400`}
                      title="GK'da Paylaş"
                    >
                      <Share2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatched(videoId);
                      }}
                      className={`flex-shrink-0 rounded transition-colors ${isMobile ? 'p-0.5' : 'p-1'} ${
                        isWatched
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      title={isWatched ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
                    >
                      <Check className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Video Player Area */}
      <div className={`bg-black flex flex-col ${
        isFullscreen ? 'fixed inset-0 z-50' : 
        isMobile ? 'flex-1' : 'flex-1'
      }`}>
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
        <div className={`bg-gray-800 border-t border-gray-700 ${isMobile ? 'p-2' : 'p-4'}`}>
          <div className="flex items-center justify-between">
            <div className={`space-y-1 flex-1 min-w-0 ${isMobile ? 'mr-2' : 'mr-4'}`}>
              <h3 className={`text-white font-semibold line-clamp-1 ${isMobile ? 'text-sm' : 'text-base'}`}>
                {currentVideo.snippet.title}
              </h3>
              <div className={`flex items-center text-gray-400 ${isMobile ? 'space-x-2 text-xs' : 'space-x-4 text-sm'}`}>
                <span>{currentVideo.snippet.channelTitle}</span>
                {currentVideo.snippet.uploadDate && (
                  <span>
                    {new Date(currentVideo.snippet.uploadDate).toLocaleDateString('tr-TR')}
                  </span>
                )}
              </div>
            </div>
            
            <div className={`flex items-center ${isMobile ? 'space-x-1' : 'space-x-2'}`}>
              <button
                onClick={() => toggleWatched(currentVideoId)}
                className={`rounded-lg transition-colors ${isMobile ? 'p-1.5' : 'p-2'} ${
                  watchedVideos.has(currentVideoId)
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
                title={watchedVideos.has(currentVideoId) ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
              >
                <Check className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className={`bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
                title={isFullscreen ? 'Tam ekrandan çık' : 'Tam ekran'}
              >
                {isFullscreen ? <Minimize2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} /> : <Maximize2 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />}
              </button>

              <button
                onClick={onClose}
                className={`bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors ${isMobile ? 'p-1.5' : 'p-2'}`}
                title="Playlist'i Kapat"
              >
                <X className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}