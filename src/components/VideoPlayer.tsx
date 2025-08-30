import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video | null;
  onClose: () => void;
}

export function VideoPlayer({ video, onClose }: VideoPlayerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (video) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [video, onClose]);

  if (!video) return null;

  const videoId = video.id.videoId || video.id;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&fs=1`;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2 md:p-4">
      <div className={`bg-gray-900 rounded-lg overflow-hidden shadow-2xl transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full' 
          : 'w-full max-w-6xl h-full max-h-[90vh] md:max-h-[85vh]'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-white font-semibold text-sm md:text-lg line-clamp-1 md:line-clamp-2">
              {video.snippet.title}
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1 truncate">
              {video.snippet.channelTitle}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black relative aspect-video">
          <iframe
            width="100%"
            height="100%"
            src={embedUrl}
            title={video.snippet.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
            className="w-full h-full"
          />
        </div>

        {/* Video Info (Desktop only, not in fullscreen) */}
        {!isFullscreen && (
          <div className="hidden md:block bg-gray-800 p-4 border-t border-gray-700">
            <div className="space-y-2">
              <h3 className="text-white font-semibold text-lg line-clamp-2">
                {video.snippet.title}
              </h3>
              <div className="flex items-center justify-between text-gray-400 text-sm">
                <span>{video.snippet.channelTitle}</span>
                {video.snippet.uploadDate && (
                  <span>
                    {new Date(video.snippet.uploadDate).toLocaleDateString('tr-TR')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}