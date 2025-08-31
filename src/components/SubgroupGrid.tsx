import React from 'react';
import { Folder, Video as VideoIcon } from 'lucide-react';
import { Subgroup, NavigationItem } from '../types';

interface SubgroupGridProps {
  subgroups: (Subgroup & { isGroup?: boolean; totalVideos?: number })[];
  onNavigate: (path: NavigationItem[]) => void;
  currentPath: NavigationItem[];
}

export function SubgroupGrid({ subgroups, onNavigate, currentPath }: SubgroupGridProps) {
  if (subgroups.length === 0) {
    return null;
  }

  const handleSubgroupClick = (subgroup: Subgroup & { isGroup?: boolean; totalVideos?: number }) => {
    if (subgroup.isGroup) {
      // This is a main group, navigate to it
      const group = { name: subgroup.name, subgroups: subgroup.subgroups || [] };
      const navItem: NavigationItem = {
        name: subgroup.name,
        path: subgroup.name,
        group
      };
      onNavigate([navItem]);
    } else {
      // This is a subgroup, add it to the current path
      const navItem: NavigationItem = {
        name: subgroup.viewName || subgroup.name,
        path: subgroup.name,
        subgroup
      };
      onNavigate([...currentPath, navItem]);
    }
  };

  const getVideoCount = (subgroup: Subgroup): number => {
    const directVideos = subgroup.videos?.length || 0;
    const nestedVideos = subgroup.subgroups?.reduce((sum, nested) => sum + getVideoCount(nested), 0) || 0;
    return directVideos + nestedVideos;
  };

  return (
    <div className="mb-8">
      <h2 className="text-white text-xl font-bold mb-4 flex items-center">
        <Folder className="w-6 h-6 mr-2 text-purple-400" />
        Kategoriler
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {subgroups
          .sort((a, b) => {
            const aHasSubgroups = a.subgroups && a.subgroups.length > 0;
            const bHasSubgroups = b.subgroups && b.subgroups.length > 0;
            
            // Folders first, then individual items
            if (aHasSubgroups && !bHasSubgroups) return -1;
            if (!aHasSubgroups && bHasSubgroups) return 1;
            
            // Within same type, sort alphabetically
            return (a.viewName || a.name).localeCompare(b.viewName || b.name);
          })
          .map((subgroup) => {
          const videoCount = subgroup.totalVideos || getVideoCount(subgroup);
          const hasSubgroups = subgroup.subgroups && subgroup.subgroups.length > 0;
          const hasVideos = subgroup.videos && subgroup.videos.length > 0;
          
          return (
            <div
              key={subgroup.name}
              onClick={() => handleSubgroupClick(subgroup)}
              className="bg-gray-800 rounded-lg p-6 cursor-pointer hover:bg-gray-700 transition-all duration-300 hover:scale-105 group border border-gray-700 hover:border-purple-500"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="bg-purple-600 bg-opacity-20 p-4 rounded-full group-hover:bg-opacity-30 transition-all duration-300">
                  <Folder className="w-8 h-8 text-purple-400 group-hover:text-purple-300" />
                </div>
              </div>
              
              <h3 className="text-white font-semibold text-center mb-2 line-clamp-2">
                {subgroup.viewName || subgroup.name}
              </h3>
              
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center text-gray-400 text-sm">
                  <VideoIcon className="w-4 h-4 mr-1" />
                  <span>{videoCount} video</span>
                </div>
                
                {hasSubgroups && (
                  <div className="text-purple-400 text-xs">
                    {subgroup.subgroups!.length} alt kategori
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex justify-center">
                <div className="bg-gray-700 group-hover:bg-purple-600 text-gray-300 group-hover:text-white px-3 py-1 rounded-full text-xs transition-all duration-300">
                  {hasSubgroups && hasVideos ? 'Kategoriler & Videolar' : 
                   hasSubgroups ? 'Alt Kategoriler' : 'Videolar'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}