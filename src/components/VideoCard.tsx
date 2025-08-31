import React, { useState } from 'react';
import { List, Play, Check } from 'lucide-react';
import { Video } from '../types';
import { formatDuration } from '../utils/videoUtils';

interface VideoCardProps {
  video: Video;
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
  isWatched?: boolean;
  onToggleWatched?: (video: Video) => void;
}

export function VideoCard({ video, onPlayVideo, onAddToPlaylist, isWatched = false, onToggleWatched }: VideoCardProps) {
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
      className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlayVideo(video)}
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
        <div className={`absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayVideo(video);
            }}
            className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all duration-200 transform hover:scale-110"
          >
            <Play className="w-8 h-8 fill-current" />
          </button>
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
              onPlayVideo(video);
            }}
            className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors text-sm"
          >
            <Play className="w-4 h-4" />
            <span>İzle</span>
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (typeof onAddToPlaylist === 'function') {
                onAddToPlaylist(video);
              }
            }}
            className="text-gray-400 hover:text-white transition-colors"
            title="Listeye ekle"
          >
            <List className="w-4 h-4" />
          </button>
          
          {onToggleWatched && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatched(video);
              }}
              className={`transition-colors ${
                isWatched 
                  ? 'text-green-400 hover:text-green-300' 
                  : 'text-gray-400 hover:text-white'
              }`}
              title={isWatched ? 'İzlenmedi olarak işaretle' : 'İzlendi olarak işaretle'}
            >
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}