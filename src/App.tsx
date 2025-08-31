import React, { useState, useMemo } from 'react';
import { List, Search, Play, Folder, Video as VideoIcon, Youtube } from 'lucide-react';
import { useVideoData } from './hooks/useVideoData';
import { usePlaylistData } from './hooks/usePlaylistData';
import { Navigation } from './components/Navigation';
import { VideoGrid } from './components/VideoGrid';
import { SubgroupGrid } from './components/SubgroupGrid';
import { VideoPlayer } from './components/VideoPlayer';
import { PlaylistModal } from './components/PlaylistModal';
import { PlaylistPlayer } from './components/PlaylistPlayer';
import { PlaylistManager } from './components/PlaylistManager';
import { Breadcrumb } from './components/Breadcrumb';
import { YouTubeSearch } from './components/YouTubeSearch';
import { VideoLinkInput } from './components/VideoLinkInput';
import { Video, NavigationItem, Subgroup } from './types';

export default function App() {
  const { groups, loading, error } = useVideoData();
  const { 
    playlists, 
    createPlaylist, 
    addToPlaylist, 
    removeFromPlaylist, 
    deletePlaylist, 
    markAsWatched,
    toggleWatched,
    updatePlaylist
  } = usePlaylistData();
  
  const [currentPath, setCurrentPath] = useState<NavigationItem[]>([]);
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [playlistModalVideo, setPlaylistModalVideo] = useState<Video | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'videos' | 'playlists' | 'search' | 'videolink'>('videos');
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile screen size
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const currentVideos = useMemo(() => {
    if (currentPath.length > 0) {
      const currentItem = currentPath[currentPath.length - 1];
      if (currentItem.subgroup && currentItem.subgroup.videos) {
        return currentItem.subgroup.videos;
      }
    }
    return [];
  }, [currentPath]);

  const currentSubgroups = useMemo(() => {
    if (currentPath.length === 0) {
      return groups.map(group => ({
        name: group.name,
        viewName: group.name,
        channelId: '',
        videos: [],
        subgroups: group.subgroups,
        isGroup: true,
        totalVideos: group.subgroups.reduce((total, subgroup) => {
          const countVideosInSubgroup = (sg: Subgroup): number => {
            const directVideos = sg.videos?.length || 0;
            const nestedVideos = sg.subgroups?.reduce((sum, nested) => sum + countVideosInSubgroup(nested), 0) || 0;
            return directVideos + nestedVideos;
          };
          return total + countVideosInSubgroup(subgroup);
        }, 0)
      }));
    }

    const currentItem = currentPath[currentPath.length - 1];
    if (currentItem.group) {
      return currentItem.group.subgroups || [];
    } else if (currentItem.subgroup && currentItem.subgroup.subgroups) {
      return currentItem.subgroup.subgroups;
    }
    
    return [];
  }, [groups, currentPath]);

  const filteredVideos = useMemo(() => {
    if (!searchQuery) return currentVideos;
    
    return currentVideos.filter(video =>
      video.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.snippet.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currentVideos, searchQuery]);

  const handleCreatePlaylist = (name: string, videos: Video[] = []) => {
    const videosToAdd = videos.length > 0 ? videos : (playlistModalVideo ? [playlistModalVideo] : []);
    createPlaylist(name, videosToAdd);

    if (playlistModalVideo && videos.length === 0) {
      setPlaylistModalVideo(null);
    }
  };

  const handleAddToPlaylist = (playlistId: string, video: Video) => {
    addToPlaylist(playlistId, video);
  };

  const handleRemoveFromPlaylist = (playlistId: string, videoId: string) => {
    removeFromPlaylist(playlistId, videoId);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    deletePlaylist(playlistId);
  };

  const handlePlayPlaylist = (playlist: any) => {
    setCurrentPlaylist(playlist);
    setCurrentVideo(null);
  };

  const handleUpdatePlaylist = (updatedPlaylist: any) => {
    setCurrentPlaylist(updatedPlaylist);
    // Update the playlist in storage
    updatePlaylist(updatedPlaylist);
  };

  const handleNavigate = (path: NavigationItem[]) => {
    setCurrentPath(path);
    setCurrentView('videos'); // Always switch to videos view when navigating
  };

  const handlePlayVideo = (video: Video) => {
    setCurrentVideo(video);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">İçerik yükleniyor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Hata: {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
          >
            Yeniden Yükle
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex relative">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className={`${
          isMobile ? 'fixed inset-y-0 left-0 z-30' : 'relative'
        } transition-all duration-300 ease-in-out`}>
          <Navigation
            groups={groups}
            currentPath={currentPath}
            onNavigate={handleNavigate}
            onShowSearch={() => setCurrentView('search')}
            isSearchActive={currentView === 'search'}
            onShowPlaylists={() => setCurrentView('playlists')}
            isPlaylistsActive={currentView === 'playlists'}
            onShowVideoLink={() => setCurrentView('videolink')}
            isVideoLinkActive={currentView === 'videolink'}
            onAddToPlaylist={setPlaylistModalVideo}
            onAddToPlaylistModal={setPlaylistModalVideo}
            isMobile={isMobile}
          />
        </div>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-gray-800 p-3 md:p-4 border-b border-gray-700">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <List className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1 justify-between">
              <button
                onClick={() => setCurrentView('videolink')}
                className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm ${
                  currentView === 'videolink'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:text-white hover:bg-gray-600'
                }`}
              >
                <Youtube className="w-4 h-4 mr-2" />
                YT Link
              </button>
              
              <div className="flex bg-gray-700 rounded-lg overflow-hidden text-xs md:text-sm">
                <button
                  onClick={() => setCurrentView('videos')}
                  className={`px-2 md:px-4 py-2 transition-colors whitespace-nowrap ${
                    currentView === 'videos'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Videolar
                </button>
                <button
                  onClick={() => setCurrentView('playlists')}
                  className={`px-2 md:px-4 py-2 transition-colors whitespace-nowrap ${
                    currentView === 'playlists'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  <Play className="w-3 h-3 md:w-4 md:h-4 inline mr-1" />
                  <span className="hidden sm:inline">Listelerim </span>({playlists.length})
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          {currentView === 'search' ? (
            <YouTubeSearch
              onAddToPlaylistModal={setPlaylistModalVideo}
              onPlayVideo={setCurrentVideo}
            />
          ) : currentView === 'videolink' ? (
            <VideoLinkInput
              onPlayVideo={setCurrentVideo}
              onAddToPlaylist={setPlaylistModalVideo}
              onAddToPlaylistModal={setPlaylistModalVideo}
            />
          ) : currentView === 'videos' ? (
            <>
              <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
              
              {/* Show subgroups if available */}
              {currentSubgroups.length > 0 && (
                <SubgroupGrid
                  subgroups={currentSubgroups}
                  onNavigate={handleNavigate}
                  currentPath={currentPath}
                />
              )}
              
              {/* Show welcome message only at root with no subgroups */}
              {currentPath.length === 0 && currentSubgroups.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <Folder className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Video kategorilerini keşfedin</p>
                    <p className="text-sm mt-2">Sol menüden bir kategori seçerek videoları görüntüleyebilirsiniz</p>
                  </div>
                </div>
              )}
              
              {/* Show videos if available */}
              {currentVideos.length > 0 && (
                <div className={currentSubgroups.length > 0 ? 'mt-8' : ''}>
                  {currentSubgroups.length > 0 && (
                    <h2 className="text-white text-xl font-bold mb-4 flex items-center">
                      <VideoIcon className="w-6 h-6 mr-2 text-blue-400" />
                      Videolar
                    </h2>
                  )}
                  <VideoGrid
                    videos={filteredVideos}
                    onPlayVideo={setCurrentVideo}
                    onAddToPlaylist={setPlaylistModalVideo}
                  />
                </div>
              )}
            </>
          ) : (
            <PlaylistManager
              playlists={playlists}
              onPlayPlaylist={handlePlayPlaylist}
              onRemoveFromPlaylist={handleRemoveFromPlaylist}
              onDeletePlaylist={handleDeletePlaylist}
              onAddVideoToPlaylist={setPlaylistModalVideo}
              onCreatePlaylist={handleCreatePlaylist}
              onToggleWatched={toggleWatched}
            />
          )}
        </main>
      </div>

      {/* Video Player Modal */}
      <VideoPlayer
        video={currentVideo}
        onClose={() => setCurrentVideo(null)}
        onAddToPlaylist={setPlaylistModalVideo}
      />

      {/* Playlist Player */}
      <PlaylistPlayer
        playlist={currentPlaylist}
        onClose={() => setCurrentPlaylist(null)}
        onUpdatePlaylist={handleUpdatePlaylist}
      />

      {/* Playlist Modal */}
      <PlaylistModal
        video={playlistModalVideo}
        playlists={playlists}
        onClose={() => setPlaylistModalVideo(null)}
        onCreatePlaylist={handleCreatePlaylist}
        onAddToPlaylist={handleAddToPlaylist}
        onDeletePlaylist={handleDeletePlaylist}
      />
    </div>
  );
}