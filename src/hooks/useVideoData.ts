import { useState, useEffect } from 'react';
import { Group } from '../types';
import { videoDatabase } from '../database/database';

export function useVideoData() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Initializing database...');
        await videoDatabase.initialize();
        
        console.log('Loading groups from database...');
        const allGroups = await videoDatabase.getAllGroups();
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