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

async function testFileExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path);
    if (!response.ok) return false;
    
    const text = await response.text();
    // Make sure it's not HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return false;
    }
    
    // Try to parse as JSON to verify it's valid
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
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
      console.error('❌ Invalid manifest format - should be array of paths');
      return [];
    }
    
    console.log(`✅ Loaded manifest with ${manifest.length} entries`);
    return manifest;
  } catch (error) {
    console.error('❌ Error loading manifest:', error);
    return [];
  }
}

async function discoverFilesInFolder(folderPath: string): Promise<string[]> {
  const discoveredFiles: string[] = [];
  
  // Common JSON file names to try
  const commonFileNames = [
    'index.json',
    'content.json', 
    'videos.json',
    'list.json',
    'main.json',
    'data.json'
  ];
  
  console.log(`🔍 Discovering files in folder: ${folderPath}`);
  
  for (const fileName of commonFileNames) {
    const filePath = `${folderPath}/${fileName}`;
    const exists = await testFileExists(filePath);
    
    if (exists) {
      console.log(`✅ Found file: ${filePath}`);
      discoveredFiles.push(filePath);
    }
  }
  
  return discoveredFiles;
}

async function expandManifestEntries(manifestEntries: string[]): Promise<string[]> {
  const allFiles: string[] = [];
  
  console.log('🔄 Expanding manifest entries...');
  
  for (const entry of manifestEntries) {
    console.log(`Processing manifest entry: ${entry}`);
    
    if (entry.endsWith('.json')) {
      // This is a direct file path
      const exists = await testFileExists(entry);
      if (exists) {
        console.log(`✅ Direct file exists: ${entry}`);
        allFiles.push(entry);
      } else {
        console.log(`❌ Direct file not found: ${entry}`);
      }
    } else {
      // This is a folder path - discover JSON files in it
      console.log(`📁 Folder entry detected: ${entry}`);
      const folderFiles = await discoverFilesInFolder(entry);
      allFiles.push(...folderFiles);
      
      if (folderFiles.length === 0) {
        console.log(`📂 Empty folder or no JSON files found in: ${entry}`);
      }
    }
  }
  
  console.log(`📊 Expanded to ${allFiles.length} total files:`, allFiles);
  return allFiles;
}

function buildGroupStructureFromPaths(filePaths: string[]): Group[] {
  console.log('🏗️ Building group structure from paths:', filePaths);
  
  const groups: Group[] = [];
  const groupMap = new Map<string, Group>();
  
  // Parse each file path and build the hierarchy
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
    const subfolderParts = pathParts.slice(1, -1); // Everything between group and file
    
    console.log(`Processing: group="${groupName}", subfolders=[${subfolderParts.join(', ')}], file="${fileName}"`);
    
    // Get or create group
    let group = groupMap.get(groupName);
    if (!group) {
      group = {
        name: groupName,
        subgroups: []
      };
      groupMap.set(groupName, group);
      groups.push(group);
      console.log(`Created group: ${groupName}`);
    }
    
    // Navigate/create the subfolder hierarchy
    let currentSubgroups = group.subgroups;
    let currentPath = groupName;
    
    // Create subfolders if they exist
    subfolderParts.forEach(subfolderName => {
      currentPath += `/${subfolderName}`;
      
      let existingSubgroup = currentSubgroups.find(sg => sg.name === subfolderName);
      if (!existingSubgroup) {
        existingSubgroup = {
          name: subfolderName,
          viewName: subfolderName,
          channelId: '',
          videos: [],
          subgroups: []
        };
        currentSubgroups.push(existingSubgroup);
        console.log(`Created subfolder: ${currentPath}`);
      }
      
      currentSubgroups = existingSubgroup.subgroups!;
    });
    
    // Create the final subgroup for the JSON file
    let fileSubgroup = currentSubgroups.find(sg => sg.name === fileName);
    if (!fileSubgroup) {
      fileSubgroup = {
        name: fileName,
        viewName: fileName,
        channelId: '',
        videos: [],
        subgroups: [],
        _filePath: filePath // Temporary property to track which file to load
      };
      currentSubgroups.push(fileSubgroup);
      console.log(`Created file subgroup for: ${fileName}`);
    }
  });
  
  console.log(`✅ Built ${groups.length} groups with hierarchy`);
  return groups;
}

async function loadContentForSubgroup(subgroup: Subgroup): Promise<void> {
  const filePath = (subgroup as any)._filePath;
  if (!filePath) return;
  
  console.log(`📥 Loading content for subgroup "${subgroup.name}" from ${filePath}`);
  
  const content = await loadJsonFile(filePath);
  
  content.forEach(item => {
    if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
      // This is a group container, merge its subgroups
      item.subgroups.forEach((sub: any) => {
        const existingSubgroup = subgroup.subgroups?.find(sg => sg.name === sub.name);
        if (existingSubgroup) {
          // Merge videos if subgroup already exists
          if (sub.videos && Array.isArray(sub.videos)) {
            existingSubgroup.videos = existingSubgroup.videos || [];
            existingSubgroup.videos.push(...sub.videos);
          }
          if (sub.subgroups && Array.isArray(sub.subgroups)) {
            existingSubgroup.subgroups = existingSubgroup.subgroups || [];
            existingSubgroup.subgroups.push(...sub.subgroups);
          }
        } else {
          // Add new subgroup
          subgroup.subgroups = subgroup.subgroups || [];
          subgroup.subgroups.push({
            name: sub.name,
            viewName: sub.viewName || sub.name,
            channelId: sub.channelId || '',
            videos: sub.videos || [],
            subgroups: sub.subgroups || []
          });
        }
      });
    } else if (item.videos && Array.isArray(item.videos)) {
      // Direct videos in this file
      subgroup.videos = subgroup.videos || [];
      subgroup.videos.push(...item.videos);
    } else if (item.subgroups && Array.isArray(item.subgroups)) {
      // Direct subgroups in this file
      subgroup.subgroups = subgroup.subgroups || [];
      subgroup.subgroups.push(...item.subgroups);
    }
  });
  
  // Clean up the temporary file path property
  delete (subgroup as any)._filePath;
  
  console.log(`✅ Loaded content for "${subgroup.name}": ${subgroup.videos?.length || 0} videos, ${subgroup.subgroups?.length || 0} subgroups`);
}

async function loadContentRecursively(subgroups: Subgroup[]): Promise<void> {
  for (const subgroup of subgroups) {
    await loadContentForSubgroup(subgroup);
    
    // Recursively load content for nested subgroups
    if (subgroup.subgroups && subgroup.subgroups.length > 0) {
      await loadContentRecursively(subgroup.subgroups);
    }
  }
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('🚀 Starting manifest-based content loading...');
    
    // Load the manifest file
    const manifestEntries = await loadManifest();
    
    if (manifestEntries.length === 0) {
      console.log('❌ No entries found in manifest');
      return [];
    }
    
    console.log('📋 Manifest entries:', manifestEntries);
    
    // Expand manifest entries (handle both files and folders)
    const filePaths = await expandManifestEntries(manifestEntries);
    
    if (filePaths.length === 0) {
      console.log('❌ No files found after expanding manifest entries');
      return [];
    }
    
    console.log('📁 Files to process:', filePaths);
    
    // Build group structure from file paths
    const groups = buildGroupStructureFromPaths(filePaths);
    
    if (groups.length === 0) {
      console.log('❌ No groups could be built from file paths');
      return [];
    }
    
    console.log('🏗️ Built initial group structure:', groups.map(g => ({ 
      name: g.name, 
      subgroups: g.subgroups.length 
    })));
    
    // Load actual content from the files
    for (const group of groups) {
      console.log(`📥 Loading content for group: ${group.name}`);
      await loadContentRecursively(group.subgroups);
    }
    
    console.log('✅ Content loading complete. Final structure:');
    groups.forEach(group => {
      console.log(`Group: ${group.name}`);
      const logSubgroup = (sg: Subgroup, indent = '  ') => {
        console.log(`${indent}${sg.viewName || sg.name} (${sg.videos?.length || 0} videos, ${sg.subgroups?.length || 0} subgroups)`);
        sg.subgroups?.forEach(sub => logSubgroup(sub, indent + '  '));
      };
      group.subgroups.forEach(sg => logSubgroup(sg));
    });
    
    return groups;
    
  } catch (error) {
    console.error('❌ Error in content loading:', error);
    return [];
  }
}