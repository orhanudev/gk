import { useState, useEffect } from 'react';
import { Group } from '../types';
import { loadAllContent } from '../utils/contentLoader';

export function useVideoData() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Loading all content from JSON files...');
        const allGroups = await loadAllContent();
        console.log('Loaded groups:', allGroups);
        
        setGroups(allGroups);
      } catch (err) {
        console.error('Error loading video data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { groups, loading, error };
}