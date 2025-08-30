import React from 'react';
import { VideoCard } from './VideoCard';
import { Video } from '../types';

interface VideoGridProps {
  videos: Video[];
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
}

export function VideoGrid({ videos, onPlayVideo, onAddToPlaylist }: VideoGridProps) {
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
        <VideoCard
          key={video.id}
          video={video}
          onPlayVideo={onPlayVideo}
          onAddToPlaylist={onAddToPlaylist}
        />
      ))}
    </div>
  );
}