export interface Video {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    duration: string;
    uploadDate: string;
    thumbnails: {
      default?: { url: string };
      medium?: { url: string };
      high: { url: string };
    };
  };
}

export interface Subgroup {
  name: string;
  viewName: string;
  channelId: string;
  videos: Video[];
  subgroups?: Subgroup[];
  totalVideos?: number;
  isGroup?: boolean;
}

export interface Group {
  name: string;
  subgroups: Subgroup[];
}

export interface NavigationItem {
  name: string;
  path: string;
  group?: Group;
  subgroup?: Subgroup;
}

export interface Playlist {
  id: string;
  name: string;
  videos: Video[];
  createdAt: string;
  watchedVideos?: Set<string>;
  currentVideoIndex?: number;
}

export interface VideoCardProps {
  video: Video;
  onPlayVideo: (video: Video) => void;
  onAddToPlaylist: (video: Video) => void;
  isWatched?: boolean;
  onToggleWatched?: (video: Video) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (videoId: string) => void;
}