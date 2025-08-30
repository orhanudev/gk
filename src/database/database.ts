import initSqlJs, { Database } from 'sql.js';
import { Group, Video, Playlist } from '../types';

class VideoDatabase {
  private db: Database | null = null;
  private initializationPromise: Promise<void> | null = null;

  async initialize() {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.doInitialize();
    return this.initializationPromise;
  }

  private async doInitialize() {
    if (this.db) return;

    try {
      const SQL = await initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
      });
      
      // Always create a new database in memory
      this.db = new SQL.Database();
      console.log('Created new in-memory database');
      
      // Create schema and seed data
      await this.createTablesAndSeedData();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.initializationPromise = null; // Reset on error so it can be retried
      throw error;
    }
  }

  private async createTablesAndSeedData() {
    if (!this.db) throw new Error('Database not initialized');

    // Create schema
    const schema = `
      CREATE TABLE groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE subgroups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        parent_group_id INTEGER,
        parent_subgroup_id INTEGER,
        channel_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_subgroup_id) REFERENCES subgroups(id) ON DELETE CASCADE
      );

      CREATE TABLE videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        channel_title TEXT NOT NULL,
        duration TEXT NOT NULL DEFAULT 'PT0S',
        upload_date TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL,
        subgroup_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (subgroup_id) REFERENCES subgroups(id) ON DELETE CASCADE
      );

      CREATE TABLE playlists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE playlist_videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        playlist_id INTEGER NOT NULL,
        video_id TEXT NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        is_watched BOOLEAN DEFAULT FALSE,
        added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_subgroups_parent_group ON subgroups(parent_group_id);
      CREATE INDEX idx_subgroups_parent_subgroup ON subgroups(parent_subgroup_id);
      CREATE INDEX idx_videos_subgroup ON videos(subgroup_id);
      CREATE INDEX idx_videos_video_id ON videos(video_id);
      CREATE INDEX idx_playlist_videos_playlist ON playlist_videos(playlist_id);
      CREATE INDEX idx_playlist_videos_video ON playlist_videos(video_id);
    `;

    this.db.exec(schema);
    console.log('Database schema created');

    // Seed with kids content
    await this.seedKidsContent();
  }

  private async seedKidsContent() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Load the kids content from the JSON file
      const response = await fetch('/content/kids/kids_populer.json');
      if (!response.ok) {
        console.warn('Could not load kids content, skipping seed');
        return;
      }
      
      const data = await response.json();
      
      // Insert Kids group
      this.db.run('INSERT INTO groups (name, display_name) VALUES (?, ?)', ['kids', 'Kids']);
      const kidsGroupResult = this.db.exec('SELECT last_insert_rowid() as id');
      const kidsGroupId = kidsGroupResult[0].values[0][0] as number;
      
      if (Array.isArray(data)) {
        for (const groupData of data) {
          if (groupData.name === 'Popüler' && groupData.subgroups && Array.isArray(groupData.subgroups)) {
            // Insert Popüler subgroup
            this.db.run('INSERT INTO subgroups (name, display_name, parent_group_id) VALUES (?, ?, ?)', 
                       ['populer', 'Popüler', kidsGroupId]);
            const populerResult = this.db.exec('SELECT last_insert_rowid() as id');
            const populerSubgroupId = populerResult[0].values[0][0] as number;
            
            // Process each subgroup under Popüler
            for (const subgroup of groupData.subgroups) {
              if (subgroup.name && subgroup.viewName) {
                // Insert the subgroup (e.g., "Afacanların Hikâyesi")
                this.db.run('INSERT INTO subgroups (name, display_name, parent_group_id, parent_subgroup_id, channel_id) VALUES (?, ?, ?, ?, ?)',
                           [subgroup.name, subgroup.viewName, kidsGroupId, populerSubgroupId, subgroup.channelId || null]);
                const subgroupResult = this.db.exec('SELECT last_insert_rowid() as id');
                const subgroupId = subgroupResult[0].values[0][0] as number;
                
                // Insert all videos for this subgroup
                if (subgroup.videos && Array.isArray(subgroup.videos)) {
                  for (const video of subgroup.videos) {
                    if (video.id && video.id.videoId && video.snippet) {
                      this.db.run(`INSERT OR IGNORE INTO videos 
                                 (video_id, title, channel_title, duration, upload_date, thumbnail_url, subgroup_id) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                 [
                                   video.id.videoId,
                                   video.snippet.title,
                                   video.snippet.channelTitle,
                                   video.snippet.duration,
                                   video.snippet.uploadDate,
                                   video.snippet.thumbnails.high.url,
                                   subgroupId
                                 ]);
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      console.log('Kids content seeded successfully');
    } catch (error) {
      console.error('Error seeding kids content:', error);
    }
  }

  public async getAllGroups(): Promise<Group[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM groups ORDER BY name');
    const groups: Array<{ id: number; name: string; display_name: string }> = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      groups.push({
        id: row.id as number,
        name: row.name as string,
        display_name: row.display_name as string
      });
    }
    stmt.free();

    const result: Group[] = [];
    for (const group of groups) {
      result.push({
        name: group.display_name,
        subgroups: await this.getSubgroupsByParent(group.id, null)
      });
    }

    return result;
  }

  private async getSubgroupsByParent(groupId: number, parentSubgroupId: number | null): Promise<Subgroup[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare(`
      SELECT * FROM subgroups 
      WHERE parent_group_id = ? AND parent_subgroup_id ${parentSubgroupId === null ? 'IS NULL' : '= ?'}
      ORDER BY display_name
    `);
    
    const params = parentSubgroupId === null ? [groupId] : [groupId, parentSubgroupId];
    stmt.bind(params);

    const subgroups: Array<{
      id: number;
      name: string;
      display_name: string;
      channel_id: string | null;
    }> = [];
    
    while (stmt.step()) {
      const row = stmt.getAsObject();
      subgroups.push({
        id: row.id as number,
        name: row.name as string,
        display_name: row.display_name as string,
        channel_id: row.channel_id as string | null
      });
    }
    stmt.free();

    const result: Subgroup[] = [];
    for (const subgroup of subgroups) {
      result.push({
        name: subgroup.name,
        viewName: subgroup.display_name,
        channelId: subgroup.channel_id || '',
        videos: await this.getVideosBySubgroup(subgroup.id),
        subgroups: await this.getSubgroupsByParent(groupId, subgroup.id)
      });
    }

    return result;
  }

  private async getVideosBySubgroup(subgroupId: number): Promise<Video[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM videos WHERE subgroup_id = ? ORDER BY title');
    stmt.bind([subgroupId]);

    const videos: Video[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      videos.push({
        id: { videoId: row.video_id as string },
        snippet: {
          title: row.title as string,
          channelTitle: row.channel_title as string,
          duration: row.duration as string,
          uploadDate: row.upload_date as string,
          thumbnails: {
            high: { url: row.thumbnail_url as string }
          }
        }
      });
    }
    stmt.free();

    return videos;
  }

  // Playlist management methods
  public async getUserPlaylists(): Promise<Playlist[]> {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM playlists ORDER BY created_at DESC');
    const playlists: Array<{
      id: number;
      name: string;
      created_at: string;
    }> = [];

    while (stmt.step()) {
      const row = stmt.getAsObject();
      playlists.push({
        id: row.id as number,
        name: row.name as string,
        created_at: row.created_at as string
      });
    }
    stmt.free();

    const result: Playlist[] = [];
    for (const playlist of playlists) {
      const videosStmt = this.db.prepare(`
        SELECT v.*, pv.is_watched, pv.position 
        FROM videos v
        JOIN playlist_videos pv ON v.video_id = pv.video_id
        WHERE pv.playlist_id = ?
        ORDER BY pv.position
      `);
      videosStmt.bind([playlist.id]);

      const videos: Video[] = [];
      const watchedVideoIds: string[] = [];

      while (videosStmt.step()) {
        const row = videosStmt.getAsObject();
        videos.push({
          id: { videoId: row.video_id as string },
          snippet: {
            title: row.title as string,
            channelTitle: row.channel_title as string,
            duration: row.duration as string,
            uploadDate: row.upload_date as string,
            thumbnails: {
              high: { url: row.thumbnail_url as string }
            }
          }
        });

        if (row.is_watched) {
          watchedVideoIds.push(row.video_id as string);
        }
      }
      videosStmt.free();

      result.push({
        id: playlist.id.toString(),
        name: playlist.name,
        videos,
        createdAt: playlist.created_at,
        watchedVideos: new Set(watchedVideoIds),
        currentVideoIndex: 0
      });
    }

    return result;
  }

  public async createPlaylist(name: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('INSERT INTO playlists (name) VALUES (?)', [name]);
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }

  public async addVideoToPlaylist(playlistId: number, videoId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Get the next position
    const posStmt = this.db.prepare('SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM playlist_videos WHERE playlist_id = ?');
    posStmt.bind([playlistId]);
    posStmt.step();
    const posResult = posStmt.getAsObject();
    const nextPosition = posResult.next_position as number;
    posStmt.free();

    this.db.run(`INSERT OR IGNORE INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)`,
                [playlistId, videoId, nextPosition]);
  }

  public async removeVideoFromPlaylist(playlistId: number, videoId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('DELETE FROM playlist_videos WHERE playlist_id = ? AND video_id = ?', [playlistId, videoId]);
  }

  public async deletePlaylist(playlistId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('DELETE FROM playlists WHERE id = ?', [playlistId]);
  }

  public async markVideoAsWatched(playlistId: number, videoId: string, watched: boolean = true): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('UPDATE playlist_videos SET is_watched = ? WHERE playlist_id = ? AND video_id = ?', 
                [watched, playlistId, videoId]);
  }

  public async addGroup(name: string, displayName: string): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('INSERT INTO groups (name, display_name) VALUES (?, ?)', [name, displayName]);
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }

  public async addSubgroup(
    name: string, 
    displayName: string, 
    parentGroupId: number, 
    parentSubgroupId: number | null = null,
    channelId: string | null = null
  ): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run('INSERT INTO subgroups (name, display_name, parent_group_id, parent_subgroup_id, channel_id) VALUES (?, ?, ?, ?, ?)',
                [name, displayName, parentGroupId, parentSubgroupId, channelId]);
    const result = this.db.exec('SELECT last_insert_rowid() as id');
    return result[0].values[0][0] as number;
  }

  public async addVideo(
    videoId: string,
    title: string,
    channelTitle: string,
    duration: string,
    uploadDate: string,
    thumbnailUrl: string,
    subgroupId: number
  ): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    this.db.run(`INSERT OR IGNORE INTO videos 
                (video_id, title, channel_title, duration, upload_date, thumbnail_url, subgroup_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [videoId, title, channelTitle, duration, uploadDate, thumbnailUrl, subgroupId]);
  }

  // Export database for download/backup
  public exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }
}

// Create singleton instance
export const videoDatabase = new VideoDatabase();