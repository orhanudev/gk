import { Group, Subgroup } from '../types';

async function loadJsonFile(path: string): Promise<any[]> {
  try {
    console.log(`Loading: ${path}`);
    const response = await fetch(path);
    
    if (!response.ok) {
      console.log(`File not found: ${path} (status: ${response.status})`);
      return [];
    }
    
    const text = await response.text();
    
    // Check if it's HTML (directory listing) instead of JSON
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      console.log(`Got HTML instead of JSON for: ${path}`);
      return [];
    }
    
    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn(`Invalid data format in ${path} - not an array`);
        return [];
      }
      
      console.log(`✅ Successfully loaded ${path} with ${data.length} items`);
      return data;
    } catch (parseError) {
      console.error(`❌ JSON parse error for ${path}:`, parseError);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error);
    return [];
  }
}

async function loadManifest(): Promise<string[]> {
  try {
    console.log('📋 Loading content manifest...');
    const response = await fetch('/content/manifest.json');
    
    if (!response.ok) {
      console.log('❌ No manifest.json found');
      return [];
    }
    
    const manifest = await response.json();
    if (!Array.isArray(manifest)) {
      console.error('❌ Invalid manifest format - should be array of file paths');
      return [];
    }
    
    console.log(`✅ Loaded manifest with ${manifest.length} files`);
    return manifest;
  } catch (error) {
    console.error('❌ Error loading manifest:', error);
    return [];
  }
}

function buildGroupsFromFiles(filePaths: string[]): Group[] {
  const groups: Group[] = [];
  const groupMap = new Map<string, Group>();
  
  console.log('🏗️ Building groups from file paths:', filePaths);
  
  filePaths.forEach(filePath => {
    // Remove /content/ prefix if present
    const cleanPath = filePath.replace(/^\/content\//, '');
    const pathParts = cleanPath.split('/');
    
    if (pathParts.length < 2) {
      console.warn(`Invalid file path structure: ${filePath}`);
      return;
    }
    
    const groupName = pathParts[0];
    const fileName = pathParts[pathParts.length - 1].replace('.json', '');
    
    // Get or create group
    let group = groupMap.get(groupName);
    if (!group) {
      group = {
        name: groupName,
        subgroups: []
      };
      groupMap.set(groupName, group);
      groups.push(group);
    }
    
    // Create subgroup for this file
    const subgroup: Subgroup = {
      name: fileName,
      viewName: fileName,
      channelId: '',
      videos: [],
      subgroups: [],
      filePath: filePath
    };
    
    group.subgroups.push(subgroup);
  });
  
  console.log(`✅ Built ${groups.length} groups:`, groups.map(g => ({ name: g.name, subgroups: g.subgroups.length })));
  return groups;
}

async function loadContentForGroups(groups: Group[]): Promise<void> {
  console.log('📥 Loading content for all groups...');
  
  for (const group of groups) {
    console.log(`📥 Loading content for group: ${group.name}`);
    
    for (const subgroup of group.subgroups) {
      if ((subgroup as any).filePath) {
        console.log(`📥 Loading content for subgroup: ${subgroup.name} from ${(subgroup as any).filePath}`);
        
        const content = await loadJsonFile((subgroup as any).filePath);
        
        content.forEach(item => {
          if (item.subgroups && Array.isArray(item.subgroups)) {
            subgroup.subgroups = subgroup.subgroups || [];
            subgroup.subgroups.push(...item.subgroups);
          }
          if (item.videos && Array.isArray(item.videos)) {
            subgroup.videos = subgroup.videos || [];
            subgroup.videos.push(...item.videos);
          }
        });
        
        // Clean up the temporary filePath property
        delete (subgroup as any).filePath;
      }
    }
  }
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('🚀 Starting manifest-based content loading...');
    
    // Load the manifest file
    const filePaths = await loadManifest();
    
    if (filePaths.length === 0) {
      console.log('❌ No files found in manifest');
      return [];
    }
    
    // Build group structure from file paths
    const groups = buildGroupsFromFiles(filePaths);
    
    if (groups.length === 0) {
      console.log('❌ No groups could be built from manifest');
      return [];
    }
    
    // Load actual content from the files
    await loadContentForGroups(groups);
    
    console.log('✅ Content loading complete:', groups);
    return groups;
    
  } catch (error) {
    console.error('❌ Error in content loading:', error);
    return [];
  }
}