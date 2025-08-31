import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Play, Pause, Volume2, VolumeX, List, Share2 } from 'lucide-react';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video | null;
  onClose: () => void;
  onAddToPlaylist?: (video: Video) => void;
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
      // Fallback: copy to clipboard
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

export function VideoPlayer({ video, onClose, onAddToPlaylist }: VideoPlayerProps) {

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


  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex flex-col">
      <div className="bg-gray-900 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700 flex-shrink-0">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-white font-semibold text-lg line-clamp-2">
              {video.snippet.title}
            </h2>
            <p className="text-gray-400 text-sm mt-1 truncate">
              {video.snippet.channelTitle}
            </p>
          </div>
          
          <div className="flex items-center">
            {onAddToPlaylist && (
              <button
                onClick={() => onAddToPlaylist(video)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700 mr-2"
                title="Oynatma listesine ekle"
              >
                <List className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => shareVideo(video)}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700 mr-2"
              title="Paylaş"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="flex-1 bg-black relative">
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

        {/* Video Info */}
        <div className="bg-gray-800 p-4 border-t border-gray-700 flex-shrink-0">
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
      </div>
    </div>
  );
}