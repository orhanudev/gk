import React from 'react';
import { Check } from 'lucide-react';
import { VideoCard } from './VideoCard';
import { Video } from '../types';

interface VideoGridProps {
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
  isSelectionMode?: boolean;
  selectedVideos?: Set<string>;
  onToggleSelection?: (videoId: string) => void;
}

export function VideoGrid({ 
  videos, 
  onPlayVideo, 
  onAddToPlaylist, 
  isSelectionMode = false,
  selectedVideos = new Set(),
  onToggleSelection
}: VideoGridProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400">
          <p className="text-lg">Bu kategoride video bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {videos.map((video) => (
        <div key={video.id.videoId || video.id} className="relative">
          {isSelectionMode && (
            <div className="absolute top-2 left-2 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleSelection) {
                    onToggleSelection(video.id.videoId || video.id);
                  }
                }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedVideos.has(video.id.videoId || video.id)
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'bg-gray-800 bg-opacity-80 border-gray-400 text-transparent hover:border-purple-400'
                }`}
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          )}
          <VideoCard
            video={video}
            onPlayVideo={isSelectionMode ? () => {} : onPlayVideo}
            onAddToPlaylist={onAddToPlaylist}
            isSelectionMode={isSelectionMode}
            isSelected={selectedVideos.has(video.id.videoId || video.id)}
            onToggleSelection={onToggleSelection}
          />
        </div>
      ))}
    </div>
  );
}