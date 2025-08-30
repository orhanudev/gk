import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { NavigationItem } from '../types';

interface BreadcrumbProps {
  path: NavigationItem[];
  onNavigate: (path: NavigationItem[]) => void;
}

export function Breadcrumb({ path, onNavigate }: BreadcrumbProps) {
  if (path.length === 0) {
    return (
      <div className="flex items-center text-gray-400 mb-6">
        <Home className="w-4 h-4 mr-2" />
        <span>Ana Sayfa</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-gray-400 mb-6 flex-wrap">
      <button
        onClick={() => onNavigate([])}
        className="flex items-center hover:text-white transition-colors"
      >
        <Home className="w-4 h-4 mr-2" />
        <span>Ana Sayfa</span>
      </button>
      {path.map((item, index) => (
        <React.Fragment key={item.path}>
          <ChevronRight className="w-4 h-4 mx-2" />
          <button
            onClick={() => onNavigate(path.slice(0, index + 1))}
            className="hover:text-white transition-colors"
          >
            {item.subgroup?.viewName || item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}