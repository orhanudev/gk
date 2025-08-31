import React, { useState, useMemo } from 'react';
import { List, Search, Play, Folder, Video as VideoIcon, Youtube, X, Plus } from 'lucide-react';
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
import { AboutPage } from './components/AboutPage';
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
  const [currentView, setCurrentView] = useState<'videos' | 'playlists' | 'search' | 'videolink' | 'youtube-search' | 'about'>('videos');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
  const [playlistCreationType, setPlaylistCreationType] = useState<'all' | 'selected'>('all');
  const [searchResults, setSearchResults] = useState<Video[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [forceClosePlaylist, setForceClosePlaylist] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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

  // Force close playlist when forceClosePlaylist changes
  React.useEffect(() => {
    if (forceClosePlaylist > 0) {
      setCurrentPlaylist(null);
      setCurrentVideo(null);
    }
  }, [forceClosePlaylist]);

  const handleForceClosePlaylist = () => {
    console.log('Force closing playlist...');
    setForceClosePlaylist(prev => prev + 1);
  };
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

  // Function to search through all videos in all groups
  const searchAllVideos = (query: string): Video[] => {
    if (!query.trim()) return [];
    
    const allVideos: Video[] = [];
    const searchTerm = query.toLowerCase();
    
    const collectVideos = (subgroups: any[]) => {
      subgroups.forEach(subgroup => {
        if (subgroup.videos) {
          subgroup.videos.forEach((video: Video) => {
            if (video.snippet.title.toLowerCase().includes(searchTerm) ||
                video.snippet.channelTitle.toLowerCase().includes(searchTerm)) {
              allVideos.push(video);
            }
          });
        }
        if (subgroup.subgroups) {
          collectVideos(subgroup.subgroups);
        }
      });
    };
    
    groups.forEach(group => {
      collectVideos(group.subgroups);
    });
    
    return allVideos;
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    const results = searchAllVideos(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleCreatePlaylist = (name: string, videos: Video[] = []) => {
    const videosToAdd = videos.length > 0 ? videos : (playlistModalVideo ? [playlistModalVideo] : []);
    createPlaylist(name, videosToAdd);

    if (playlistModalVideo && videos.length === 0) {
      setPlaylistModalVideo(null);
    }
  };

  const handleCreatePlaylistFromVideos = (name: string) => {
    if (playlistCreationType === 'all') {
      const videosToUse = currentView === 'search' ? searchResults : currentVideos;
      createPlaylist(name, videosToUse);
    } else {
      const videosToUse = currentView === 'search' ? searchResults : currentVideos;
      const selectedVideoObjects = videosToUse.filter(video => 
        selectedVideos.has(video.id.videoId || String(video.id))
      );
      createPlaylist(name, selectedVideoObjects);
    }
    setShowCreatePlaylistModal(false);
    setSelectedVideos(new Set());
    setIsSelectionMode(false);
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectAll = () => {
    const videosToUse = currentView === 'search' ? searchResults : currentVideos;
    if (selectedVideos.size === videosToUse.length) {
      setSelectedVideos(new Set());
    } else {
      const allVideoIds = videosToUse.map(video => video.id.videoId || String(video.id));
      setSelectedVideos(new Set(allVideoIds));
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

  // Touch handlers for mobile swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Right swipe to open navigation when closed
    if (isRightSwipe && !sidebarOpen && isMobile) {
      setSidebarOpen(true);
    }
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
    <div 
      className="min-h-screen bg-gray-900 flex relative"
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
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
            onShowYouTubeSearch={() => setCurrentView('youtube-search')}
            isYouTubeSearchActive={currentView === 'youtube-search'}
            onShowAbout={() => setCurrentView('about')}
            isAboutActive={currentView === 'about'}
            searchQuery=""
            onSearchChange={() => {}}
            onClose={() => setSidebarOpen(false)}
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
              <div className="flex items-center space-x-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8" />
                <h1 className="text-white font-bold text-lg hidden sm:block">Gözden Kalbe</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1 justify-end">
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
                <button
                  onClick={() => setCurrentView('videolink')}
                  className={`px-2 md:px-4 py-2 transition-colors whitespace-nowrap flex items-center ${
                    currentView === 'videolink'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-red-600'
                  }`}
                >
                  <Youtube className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  YT Link
                </button>
                <button
                  onClick={() => setCurrentView('youtube-search')}
                  className={`px-2 md:px-4 py-2 transition-colors whitespace-nowrap flex items-center ${
                    currentView === 'youtube-search'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-red-600'
                  }`}
                >
                  <Search className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  YT Ara
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          {currentView === 'search' ? (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center justify-center">
                  <Search className="w-8 h-8 mr-3 text-blue-500" />
                  Video Ara
                </h2>
                <p className="text-gray-400 mb-6">
                  Tüm videolar arasında arama yapın
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Video ara... (örn: 'Afacanlar')"
                    className="w-full bg-gray-800 text-white pl-12 pr-24 py-4 rounded-xl border border-gray-700 focus:border-blue-500 focus:outline-none text-lg"
                  />
                  <button
                    type="submit"
                    disabled={!searchQuery.trim() || isSearching}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {isSearching ? 'Arıyor...' : 'Ara'}
                  </button>
                </div>
              </form>

              {/* Playlist Creation Buttons for Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setPlaylistCreationType('all');
                        setShowCreatePlaylistModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                    >
                      <List className="w-4 h-4" />
                      <span>Tüm Sonuçları Liste Yap ({searchResults.length})</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedVideos(new Set());
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                        isSelectionMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      <VideoIcon className="w-4 h-4" />
                      <span>{isSelectionMode ? 'Seçimi İptal Et' : 'Video Seç'}</span>
                    </button>
                    
                    {isSelectionMode && (
                      <>
                        <button
                          onClick={handleSelectAll}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          {selectedVideos.size === searchResults.length ? 'Hiçbirini Seçme' : 'Hepsini Seç'}
                        </button>
                        
                        {selectedVideos.size > 0 && (
                          <button
                            onClick={() => {
                              setPlaylistCreationType('selected');
                              setShowCreatePlaylistModal(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Seçilenleri Liste Yap ({selectedVideos.size})</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isSelectionMode && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-blue-200 text-sm">
                        <strong>Seçim Modu:</strong> Oynatma listesi oluşturmak için videoları seçin. 
                        {selectedVideos.size > 0 && ` ${selectedVideos.size} video seçildi.`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                    <VideoIcon className="w-6 h-6 mr-2 text-blue-400" />
                    Arama Sonuçları ({searchResults.length})
                  </h3>
                  <VideoGrid
                    videos={searchResults}
                    onPlayVideo={setCurrentVideo}
                    onAddToPlaylist={setPlaylistModalVideo}
                    isSelectionMode={isSelectionMode}
                    selectedVideos={selectedVideos}
                    onToggleSelection={toggleVideoSelection}
                  />
                </div>
              )}

              {/* No Results */}
              {searchQuery && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">"{searchQuery}" için sonuç bulunamadı</p>
                  <p className="text-gray-500 text-sm mt-2">Farklı anahtar kelimeler deneyin</p>
                </div>
              )}

              {/* Initial State */}
              {!searchQuery && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 text-lg">Videolar arasında arama yapmak için yukarıdaki arama kutusunu kullanın</p>
                  <p className="text-gray-500 text-sm mt-2">Video başlığı veya kanal adı ile arama yapabilirsiniz</p>
                </div>
              )}
            </div>
          ) : currentView === 'videolink' ? (
            <VideoLinkInput
              onPlayVideo={setCurrentVideo}
              onAddToPlaylist={setPlaylistModalVideo}
              onAddToPlaylistModal={setPlaylistModalVideo}
            />
          ) : currentView === 'youtube-search' ? (
            <YouTubeSearch
              onAddToPlaylistModal={setPlaylistModalVideo}
              onPlayVideo={setCurrentVideo}
            />
          ) : currentView === 'youtube-search' ? (
            <YouTubeSearch
              onAddToPlaylistModal={setPlaylistModalVideo}
              onPlayVideo={setCurrentVideo}
            />
          ) : currentView === 'about' ? (
            <AboutPage />
          ) : currentView === 'videos' ? (
            <>
              <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
              
              {/* Playlist Creation Buttons */}
              {currentVideos.length > 0 && currentView === 'videos' && (
                <div className="mb-6 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setPlaylistCreationType('all');
                        setShowCreatePlaylistModal(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                    >
                      <List className="w-4 h-4" />
                      <span>Tüm Videoları Liste Yap ({currentVideos.length})</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedVideos(new Set());
                      }}
                      className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm ${
                        isSelectionMode
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-600 hover:bg-gray-700 text-white'
                      }`}
                    >
                      <VideoIcon className="w-4 h-4" />
                      <span>{isSelectionMode ? 'Seçimi İptal Et' : 'Video Seç'}</span>
                    </button>
                    
                    {isSelectionMode && (
                      <>
                        <button
                          onClick={handleSelectAll}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                          {selectedVideos.size === currentVideos.length ? 'Hiçbirini Seçme' : 'Hepsini Seç'}
                        </button>
                        
                        {selectedVideos.size > 0 && (
                          <button
                            onClick={() => {
                              setPlaylistCreationType('selected');
                              setShowCreatePlaylistModal(true);
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Seçilenleri Liste Yap ({selectedVideos.size})</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  {isSelectionMode && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-blue-200 text-sm">
                        <strong>Seçim Modu:</strong> Oynatma listesi oluşturmak için videoları seçin. 
                        {selectedVideos.size > 0 && ` ${selectedVideos.size} video seçildi.`}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
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
                    videos={currentVideos}
                    onPlayVideo={setCurrentVideo}
                    onAddToPlaylist={setPlaylistModalVideo}
                    isSelectionMode={isSelectionMode}
                    selectedVideos={selectedVideos}
                    onToggleSelection={toggleVideoSelection}
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
              onImportPlaylist={handleCreatePlaylist}
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
        onClose={handleForceClosePlaylist}
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

      {/* Create Playlist Modal */}
      {showCreatePlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-white text-lg font-semibold">
                {playlistCreationType === 'all' 
                  ? `Tüm Videoları Liste Yap (${currentView === 'search' ? searchResults.length : currentVideos.length})` 
                  : `Seçili Videoları Liste Yap (${selectedVideos.size})`
                }
              </h3>
              <button
                onClick={() => setShowCreatePlaylistModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('playlistName') as string;
                if (name.trim()) {
                  handleCreatePlaylistFromVideos(name.trim());
                }
              }}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="playlistName" className="block text-gray-300 text-sm font-medium mb-2">
                      Oynatma Listesi Adı
                    </label>
                    <input
                      id="playlistName"
                      name="playlistName"
                      type="text"
                      placeholder="Liste adı girin..."
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      autoFocus
                      required
                    />
                  </div>
                  
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-300 text-sm">
                      {playlistCreationType === 'all' 
                        ? `${currentView === 'search' ? searchResults.length : currentVideos.length} video bu listeye eklenecek`
                        : `${selectedVideos.size} seçili video bu listeye eklenecek`
                      }
                    </p>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreatePlaylistModal(false)}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                    >
                      Oluştur
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}