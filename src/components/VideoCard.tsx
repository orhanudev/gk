import React, { useState } from 'react';
import { List, Play, Check, Share2 } from 'lucide-react';
import { Video } from '../types';
import { formatDuration } from '../utils/videoUtils';

interface VideoCardProps {
  video: Video;
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
  isWatched?: boolean;
  onToggleWatched?: (video: Video) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (videoId: string) => void;
}

const shareVideo = async (video: Video, useGKLink: boolean = true) => {
  const videoId = video.id.videoId || String(video.id);
  const videoUrl = useGKLink 
    ? `${window.location.origin}?v=${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
  
  const shareData = {
    title: video.snippet.title,
    text: useGKLink 
      ? `${video.snippet.title} - GK'da izle`
      : `${video.snippet.title} - ${video.snippet.channelTitle}`,
    url: videoUrl
  };

  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData);
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(videoUrl);
      alert(useGKLink ? 'GK video linki panoya kopyalandı!' : 'YouTube video linki panoya kopyalandı!');
    }
  } catch (error) {
    console.error('Error sharing:', error);
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(videoUrl);
      alert(useGKLink ? 'GK video linki panoya kopyalandı!' : 'YouTube video linki panoya kopyalandı!');
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      // Final fallback: show URL in prompt
      prompt(useGKLink ? 'GK video linkini kopyalayın:' : 'YouTube video linkini kopyalayın:', videoUrl);
    }
  }
};

export function VideoCard({ 
  video, 
  onPlayVideo, 
  onAddToPlaylist, 
  isWatched = false, 
  onToggleWatched,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelection
}: VideoCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const thumbnailUrl = video.snippet.thumbnails?.high?.url || 
                      video.snippet.thumbnails?.medium?.url || 
                      video.snippet.thumbnails?.default?.url || 
                      `https://i.ytimg.com/vi/${video.id.videoId}/maxresdefault.jpg`;

  const formatPublishDate = (publishedAt: string) => {
    if (!publishedAt) return '';
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 gün önce';
    if (diffDays < 30) return `${diffDays} gün önce`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay önce`;
    return `${Math.floor(diffDays / 365)} yıl önce`;
  };

  return (
    <div 
      className={`bg-gray-800 rounded-lg overflow-hidden shadow-lg transition-all duration-300 group ${
        isSelectionMode 
          ? 'cursor-pointer' 
          : 'hover:shadow-xl transform hover:scale-105 cursor-pointer'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={isSelectionMode 
        ? () => onToggleSelection && onToggleSelection(video.id.videoId || video.id)
        : () => onPlayVideo(video)
      }
    >
      <div className="relative">
        <img
          src={thumbnailUrl}
          alt={video.snippet.title}
          className="w-full h-48 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/320x180/374151/9CA3AF?text=Video';
          }}
        />
        
        {/* Duration Badge */}
        {video.snippet.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-80 text-white text-xs px-2 py-1 rounded">
            {formatDuration(video.snippet.duration)}
          </div>
        )}
        
        {/* Watched Badge */}
        {isWatched && (
          <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center">
            <Check className="w-3 h-3 mr-1" />
            İzlendi
          </div>
        )}
        
        {/* Play Button Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
          isSelectionMode 
            ? `bg-black bg-opacity-30 ${isSelected ? 'opacity-100' : 'opacity-0'}`
            : `bg-black bg-opacity-50 ${isHovered ? 'opacity-100' : 'opacity-0'}`
        }`}>
          {isSelectionMode ? (
            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected
                ? 'bg-purple-600 border-purple-600 text-white'
                : 'bg-gray-800 bg-opacity-80 border-gray-400 text-transparent'
            }`}>
              <Check className="w-5 h-5" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayVideo(video);
              }}
              className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all duration-200 transform hover:scale-110"
            >
              <Play className="w-8 h-8 fill-current" />
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-purple-300 transition-colors">
          {video.snippet.title}
        </h3>
        
        <div className="text-gray-400 text-xs space-y-1">
          <p className="truncate">{video.snippet.channelTitle}</p>
          <div className="flex items-center justify-between">
            <span>{formatPublishDate(video.snippet.uploadDate)}</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelectionMode) {
                onPlayVideo(video);
              }
            }}
            className={`flex items-center space-x-2 transition-colors text-sm ${
              isSelectionMode 
                ? 'text-gray-500 cursor-not-allowed' 
                : 'text-purple-400 hover:text-purple-300'
            }`}
            disabled={isSelectionMode}
          >
            <Play className="w-4 h-4" />
            <span>İzle</span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="relative group">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isSelectionMode) {
                    shareVideo(video, true); // Use GK link by default
                  }
                }}
                className={`transition-colors ${
                  isSelectionMode 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title="GK'da Paylaş"
                disabled={isSelectionMode}
              >
                <Share2 className="w-4 h-4" />
              </button>
              
              {/* Share Options Dropdown */}
              {!isSelectionMode && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 rounded-lg shadow-lg p-2 whitespace-nowrap z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareVideo(video, true);
                    }}
                    className="block w-full text-left px-3 py-1 text-white hover:bg-gray-600 rounded text-xs"
                  >
                    GK'da Paylaş
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      shareVideo(video, false);
                    }}
                    className="block w-full text-left px-3 py-1 text-white hover:bg-gray-600 rounded text-xs"
                  >
                    YouTube'da Paylaş
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (typeof onAddToPlaylist === 'function' && !isSelectionMode) {
                  onAddToPlaylist(video);
                }
              }}
              className={`transition-colors ${
                isSelectionMode 
                  ? 'text-gray-600 cursor-not-allowed' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Listeye ekle"
              disabled={isSelectionMode}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          {onToggleWatched && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isSelectionMode) {
                  onToggleWatched(video);
                }
              }}
              className={`transition-colors ${
                isSelectionMode 
                  ? 'text-gray-600 cursor-not-allowed'
                  : 
                isWatched 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isWatched ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
              disabled={isSelectionMode}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}