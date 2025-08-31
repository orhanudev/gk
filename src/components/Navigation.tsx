import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Home, Folder, FolderOpen, Search, Youtube, X, List, Info } from 'lucide-react';
import { Group, Subgroup, NavigationItem } from '../types';

interface NavigationProps {
  groups: Group[];
  currentPath: NavigationItem[];
  onNavigate: (path: NavigationItem[]) => void;
  onShowSearch: () => void;
  isSearchActive: boolean;
  onShowPlaylists: () => void;
  isPlaylistsActive: boolean;
  onShowVideoLink: () => void;
  isVideoLinkActive: boolean;
  onShowYouTubeSearch: () => void;
  isYouTubeSearchActive: boolean;
  onShowAbout: () => void;
  isAboutActive: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Navigation({ 
  groups, 
  currentPath, 
  onNavigate, 
  onShowSearch, 
  isSearchActive, 
  onShowPlaylists,
  isPlaylistsActive,
  onShowVideoLink, 
  isVideoLinkActive,
  onShowYouTubeSearch,
  isYouTubeSearchActive,
  onShowAbout,
  isAboutActive,
  searchQuery,
  onSearchChange,
  onClose,
  isMobile = false
}: NavigationProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const navRef = useRef<HTMLElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

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
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    // Left swipe to close navigation
    if (isLeftSwipe && isMobile && onClose) {
      onClose();
    }
    
    // Right swipe to open navigation (handled by parent component)
    if (isRightSwipe && isMobile && !onClose) {
      // This would be handled by the parent to open navigation
    }
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const renderSubgroup = (subgroup: Subgroup, parentPath: string, depth = 0) => {
    const fullPath = `${parentPath}/${subgroup.name}`.replace(/^\//, ''); // Create proper path hierarchy
    const isExpanded = expandedGroups.has(fullPath);
    const hasSubgroups = subgroup.subgroups && subgroup.subgroups.length > 0;
    const hasVideos = subgroup.videos && subgroup.videos.length > 0;
    
    // Calculate total video count for this subgroup (including nested)
    const getVideoCount = (sg: Subgroup): number => {
      const directVideos = sg.videos?.length || 0;
      const nestedVideos = sg.subgroups?.reduce((sum, nested) => sum + getVideoCount(nested), 0) || 0;
      return directVideos + nestedVideos;
    };
    
    const videoCount = getVideoCount(subgroup);

    return (
      <div key={fullPath} className="ml-4">
        <div
          className={`flex items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
            currentPath.some(item => item.path === fullPath)
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
          onClick={() => {
            if (hasSubgroups) {
              toggleGroup(fullPath);
            }
            // Always allow navigation to subgroups that have videos
            if (hasVideos) {
              // Find the actual subgroup object for navigation
              // Build the complete navigation path from root to this subgroup
              const pathParts = fullPath.split('/');
              const navItems: NavigationItem[] = [];
              
              // Add each level of the path
              let currentPath = '';
              pathParts.forEach((part, index) => {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                
                if (index === 0) {
                  // This is the group level
                  const group = groups.find(g => g.name === part);
                  if (group) {
                    navItems.push({
                      name: part,
                      path: currentPath,
                      group: group
                    });
                  }
                } else {
                  // This is a subgroup level - find the actual subgroup object
                  navItems.push({
                    name: subgroup.viewName || subgroup.name,
                    path: currentPath,
                    subgroup: subgroup
                  });
                }
              });
              
              onNavigate(navItems);
            }
          }}
        >
          {hasSubgroups ? (
            isExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />
          ) : (
            <div className="w-4 h-4 mr-2" />
          )}
          {hasSubgroups ? (
            isExpanded ? <FolderOpen className="w-4 h-4 mr-2" /> : <Folder className="w-4 h-4 mr-2" />
          ) : (
            <div className="w-4 h-4 mr-2" />
          )}
          <span className="text-sm truncate">{subgroup.viewName || subgroup.name}</span>
          {videoCount > 0 && (
            <span className="ml-auto text-xs text-gray-400">
              {videoCount}
            </span>
          )}
        </div>
        {hasSubgroups && isExpanded && (
          <div className="ml-2">
            {subgroup.subgroups!
              .sort((a, b) => {
                const aHasSubgroups = a.subgroups && a.subgroups.length > 0;
                const bHasSubgroups = b.subgroups && b.subgroups.length > 0;
                
                // Folders first, then individual items
                if (aHasSubgroups && !bHasSubgroups) return -1;
                if (!aHasSubgroups && bHasSubgroups) return 1;
                
                // Within same type, sort alphabetically
                return (a.viewName || a.name).localeCompare(b.viewName || b.name);
              })
              .map(sub => renderSubgroup(sub, fullPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav 
      ref={navRef}
      className="bg-gray-800 w-80 md:w-80 p-4 overflow-y-auto h-screen flex flex-col"
      onTouchStart={isMobile ? onTouchStart : undefined}
      onTouchMove={isMobile ? onTouchMove : undefined}
      onTouchEnd={isMobile ? onTouchEnd : undefined}
    >
      {/* Mobile Close Button */}
      {isMobile && onClose && (
        <div className="flex justify-end mb-4 md:hidden">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => onNavigate([])}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${
            currentPath.length === 0 && !isSearchActive && !isPlaylistsActive && !isVideoLinkActive && !isYouTubeSearchActive && !isAboutActive
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Home className="w-5 h-5 mr-3" />
          <span className="font-medium">Ana Sayfa</span>
        </button>
        
        <button
          onClick={() => {
            onNavigate([]);
            onShowPlaylists();
          }}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors mt-2 ${
            isPlaylistsActive
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <List className="w-5 h-5 mr-3" />
          <span className="font-medium">Listelerim</span>
        </button>
        
        <button
          onClick={onShowSearch}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors mt-2 ${
            isSearchActive
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Search className="w-5 h-5 mr-3" />
          <span className="font-medium">Video Ara</span>
        </button>
        
        <button
          onClick={() => {
            onNavigate([]);
            onShowVideoLink();
          }}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors mt-2 ${
            isVideoLinkActive
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:bg-red-600'
          }`}
        >
          <Youtube className="w-5 h-5 mr-3" />
          <span className="font-medium">YouTube Link</span>
        </button>
        
        <button
          onClick={() => {
            onNavigate([]);
            onShowYouTubeSearch();
          }}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors mt-2 ${
            isYouTubeSearchActive
              ? 'bg-red-600 text-white'
              : 'text-gray-300 hover:bg-gray-700 hover:bg-red-600'
          }`}
        >
          <Search className="w-5 h-5 mr-3" />
          <span className="font-medium">YouTube Ara</span>
        </button>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          const totalVideos = group.subgroups.reduce((total, subgroup) => {
            const countVideosInSubgroup = (sg: Subgroup): number => {
              const directVideos = sg.videos?.length || 0;
              const nestedVideos = sg.subgroups?.reduce((sum, nested) => sum + countVideosInSubgroup(nested), 0) || 0;
              return directVideos + nestedVideos;
            };
            return total + countVideosInSubgroup(subgroup);
          }, 0);
          
          return (
            <div key={group.name}>
              <div
                className="flex items-center py-2 px-3 rounded-lg cursor-pointer transition-colors text-gray-300 hover:bg-gray-700"
                onClick={() => toggleGroup(group.name)}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5 mr-2" /> : <ChevronRight className="w-5 h-5 mr-2" />}
                {isExpanded ? <FolderOpen className="w-5 h-5 mr-2" /> : <Folder className="w-5 h-5 mr-2" />}
                <span className={`font-medium ${
                  currentPath.length > 0 && currentPath[0].name === group.name
                    ? 'text-purple-300'
                    : ''
                }`}>{group.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {totalVideos}
                </span>
              </div>
              {isExpanded && (
                <div className="ml-2">
                  {group.subgroups
                    .sort((a, b) => {
                      const aHasSubgroups = a.subgroups && a.subgroups.length > 0;
                      const bHasSubgroups = b.subgroups && b.subgroups.length > 0;
                      
                      // Folders first, then individual items
                      if (aHasSubgroups && !bHasSubgroups) return -1;
                      if (!aHasSubgroups && bHasSubgroups) return 1;
                      
                      // Within same type, sort alphabetically
                      return (a.viewName || a.name).localeCompare(b.viewName || b.name);
                    })
                    .map(subgroup => renderSubgroup(subgroup, group.name))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* About Link at Bottom */}
      <div className="mt-auto pt-4 border-t border-gray-700">
        <button
          onClick={() => {
            onNavigate([]);
            onShowAbout();
          }}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors ${
            isAboutActive
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Info className="w-5 h-5 mr-3" />
          <span className="font-medium">Hakkında</span>
        </button>
      </div>
    </nav>
  );
}