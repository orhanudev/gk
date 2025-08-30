import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Home, Folder, FolderOpen, Search, Youtube, X } from 'lucide-react';
import { Group, Subgroup, NavigationItem } from '../types';

interface NavigationProps {
  groups: Group[];
  currentPath: NavigationItem[];
  onNavigate: (path: NavigationItem[]) => void;
  onShowSearch: () => void;
  isSearchActive: boolean;
  onShowVideoLink: () => void;
  isVideoLinkActive: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Navigation({ 
  groups, 
  currentPath, 
  onNavigate, 
  onShowSearch, 
  isSearchActive, 
  onShowVideoLink, 
  isVideoLinkActive,
  onClose,
  isMobile = false
}: NavigationProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
              const navItems: NavigationItem[] = [{
                name: subgroup.viewName || subgroup.name,
                path: fullPath,
                subgroup: subgroup
              }];
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
          {hasVideos && (
            <span className="ml-auto text-xs text-gray-400">
              {subgroup.videos.length}
            </span>
          )}
        </div>
        {hasSubgroups && isExpanded && (
          <div className="ml-2">
            {subgroup.subgroups!.map(sub => renderSubgroup(sub, fullPath, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="bg-gray-800 w-80 md:w-80 p-4 overflow-y-auto h-screen flex flex-col">
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
            currentPath.length === 0
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Home className="w-5 h-5 mr-3" />
          <span className="font-medium">Ana Sayfa</span>
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
          <span className="font-medium">YouTube'da Ara</span>
        </button>
        
        <button
          onClick={onShowVideoLink}
          className={`flex items-center w-full py-2 px-3 rounded-lg transition-colors mt-2 ${
            isVideoLinkActive
              ? 'bg-purple-600 text-white'
              : 'text-gray-300 hover:bg-gray-700'
          }`}
        >
          <Youtube className="w-5 h-5 mr-3" />
          <span className="font-medium">YouTube Linki</span>
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
                <span className="font-medium">{group.name}</span>
                <span className="ml-auto text-xs text-gray-400">
                  {totalVideos}
                </span>
              </div>
              {isExpanded && (
                <div className="ml-2">
                  {group.subgroups.map(subgroup => renderSubgroup(subgroup, group.name))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}