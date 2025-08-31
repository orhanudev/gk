import React, { useState, useEffect } from 'react';
import { X, Play, SkipBack, SkipForward, Check, List } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';
import { Playlist, Video } from '../types';

interface PlaylistPlayerProps {
  playlist: Playlist | null;
  onClose: () => void;
  onUpdatePlaylist: (playlist: Playlist) => void;
}

export function PlaylistPlayer({ playlist, onClose, onUpdatePlaylist }: PlaylistPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);

  useEffect(() => {
    if (playlist) {
      setWatchedVideos(new Set(playlist.watchedVideos || []));
      setCurrentVideoIndex(playlist.currentVideoIndex || 0);
    }
  }, [playlist]);

  if (!playlist || !playlist.videos.length) return null;

  const getVideoId = (video: Video): string => {
    return video.id.videoId || video.id || '';
  };

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      const newIndex = currentVideoIndex + 1;
      setCurrentVideoIndex(newIndex);
      
      // Update playlist with new current index
      const updatedPlaylist = {
        ...playlist,
        currentVideoIndex: newIndex,
        watchedVideos: watchedVideos
      };
      onUpdatePlaylist(updatedPlaylist);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      const newIndex = currentVideoIndex - 1;
      setCurrentVideoIndex(newIndex);
      
      // Update playlist with new current index
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
    
    // Update playlist with new current index
    const updatedPlaylist = {
      ...playlist,
      currentVideoIndex: index,
      watchedVideos: watchedVideos
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
      watchedVideos: newWatchedVideos
    };
    onUpdatePlaylist(updatedPlaylist);
  };

  const handleVideoPlayerClose = () => {
    // Mark current video as watched when closing
    const currentVideoId = getVideoId(playlist.videos[currentVideoIndex]);
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(currentVideoId);
    setWatchedVideos(newWatchedVideos);

    // Update playlist
    const updatedPlaylist = {
      ...playlist,
      watchedVideos: newWatchedVideos,
      currentVideoIndex
    };
    onUpdatePlaylist(updatedPlaylist);

    // Close the video player but keep playlist open
    setCurrentVideo(null);
  };

  const handlePlayCurrentVideo = () => {
    setCurrentVideo(playlist.videos[currentVideoIndex]);
  };

  const handlePlayVideoFromList = (video: Video, index: number) => {
    setCurrentVideoIndex(index);
    setCurrentVideo(video);
    
    // Update playlist with new current index
    const updatedPlaylist = {
      ...playlist,
      currentVideoIndex: index,
      watchedVideos: watchedVideos
    };
    onUpdatePlaylist(updatedPlaylist);
  };

  return (
    <>
      {/* Playlist Sidebar */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex z-40">
        <div className="bg-gray-800 w-96 h-full overflow-hidden flex flex-col">
          {/* Header */}
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

          {/* Controls */}
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
                onClick={handlePlayCurrentVideo}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Oynat</span>
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
                  onClick={() => handlePlayVideoFromList(video, index)}
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

        {/* Close overlay area */}
        <div 
          className="flex-1 bg-black bg-opacity-30"
          onClick={onClose}
        />
      </div>

      {/* Video Player */}
      <VideoPlayer
        video={currentVideo}
        onClose={handleVideoPlayerClose}
      />
    </>
  );
}