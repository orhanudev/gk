import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Check } from 'lucide-react';
import ReactPlayer from 'react-player';
import { Playlist, Video } from '../types';
import { formatDuration } from '../utils/videoUtils';

interface PlaylistPlayerProps {
  playlist: Playlist | null;
  onClose: () => void;
  onUpdatePlaylist: (playlist: Playlist) => void;
}

export function PlaylistPlayer({ playlist, onClose, onUpdatePlaylist }: PlaylistPlayerProps) {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const playerRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    if (playlist) {
      setWatchedVideos(new Set(playlist.watchedVideos || []));
    }
  }, [playlist]);

  if (!playlist || !playlist.videos.length) return null;

  const currentVideo = playlist.videos[currentVideoIndex];

  const getVideoId = (video: Video): string => {
    return video.id.videoId || video.id || '';
  };

  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const handleVideoSelect = (index: number) => {
    setCurrentVideoIndex(index);
  };

  const handleVideoEnd = () => {
    // Mark current video as watched
    const newWatchedVideos = new Set(watchedVideos);
    newWatchedVideos.add(getVideoId(currentVideo));
    setWatchedVideos(newWatchedVideos);

    // Update playlist with watched status
    const updatedPlaylist = {
      ...playlist,
      watchedVideos: Array.from(newWatchedVideos)
    };
    onUpdatePlaylist(updatedPlaylist);

    // Auto-play next video
    if (currentVideoIndex < playlist.videos.length - 1) {
      handleNext();
    }
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
      watchedVideos: Array.from(newWatchedVideos)
    };
    onUpdatePlaylist(updatedPlaylist);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div>
            <h2 className="text-white text-lg font-semibold">
              {playlist.name}
            </h2>
            <p className="text-gray-400 text-sm">
              {currentVideoIndex + 1} / {playlist.videos.length} videos
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Video Player */}
          <div className="flex-1 flex flex-col">
            <div className="aspect-video bg-black">
              <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${getVideoId(currentVideo)}`}
                width="100%"
                height="100%"
                controls={true}
                playing={isPlaying}
                muted={isMuted}
                onEnded={handleVideoEnd}
                config={{
                  youtube: {
                    playerVars: {
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                      iv_load_policy: 3,
                    },
                  },
                }}
              />
            </div>

            {/* Video Info */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold mb-2">
                {currentVideo.snippet.title}
              </h3>
              <p className="text-gray-400 text-sm">
                {currentVideo.snippet.channelTitle}
              </p>
            </div>

            {/* Controls */}
            <div className="p-4 flex items-center justify-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentVideoIndex === 0}
                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-full transition-colors"
              >
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              
              <button
                onClick={handleNext}
                disabled={currentVideoIndex === playlist.videos.length - 1}
                className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Playlist Sidebar */}
          <div className="w-80 bg-gray-900 border-l border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-700">
              <h4 className="text-white font-semibold">Playlist Videos</h4>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {playlist.videos.map((video, index) => (
                <div
                  key={getVideoId(video)}
                  className={`p-3 border-b border-gray-700 cursor-pointer transition-colors ${
                    index === currentVideoIndex
                      ? 'bg-purple-600 bg-opacity-20'
                      : 'hover:bg-gray-700'
                  }`}
                  onClick={() => handleVideoSelect(index)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <img
                        src={video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails.high.url}
                        alt={video.snippet.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      {index === currentVideoIndex && (
                        <div className="absolute inset-0 bg-purple-600 bg-opacity-50 flex items-center justify-center rounded">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                      )}
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
                        toggleWatched(getVideoId(video));
                      }}
                      className={`flex-shrink-0 p-1 rounded transition-colors ${
                        watchedVideos.has(getVideoId(video))
                          ? 'text-green-400 hover:text-green-300'
                          : 'text-gray-500 hover:text-gray-400'
                      }`}
                      title={watchedVideos.has(getVideoId(video)) ? 'Mark as unwatched' : 'Mark as watched'}
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}