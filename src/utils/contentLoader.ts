import { Group } from '../types';

// Try to access common folder structures
async function tryAccessFolder(path: string): Promise<boolean> {
  try {
    const response = await fetch(path);
    return response.ok;
  } catch {
    return false;
  }
}

// Common folder names to check for
const commonFolders = [
  'kids', 'çocuk', 'children',
  'movies', 'filmler', 'film',
  'music', 'müzik', 'muzik',
  'tutorials', 'eğitim', 'egitim',
  'documentaries', 'belgesel',
  'series', 'dizi',
  'sports', 'spor',
  'news', 'haber',
  'comedy', 'komedi',
  'animation', 'animasyon',
  'educational', 'eğitici'
];

// Try to discover folders by attempting to access them
async function discoverFolders(): Promise<string[]> {
  const discoveredFolders: string[] = [];
  
  // Check for main category folders
  for (const folder of commonFolders) {
    const folderPath = `/content/${folder}`;
    if (await tryAccessFolder(folderPath)) {
      discoveredFolders.push(folderPath);
      
      // Check for common subfolders
      const commonSubfolders = [
        'popular', 'populer', 'popüler',
        'new', 'yeni',
        'trending', 'trend',
        'classic', 'klasik',
        'action', 'aksiyon',
        'comedy', 'komedi',
        'drama',
        'adventure', 'macera',
        'family', 'aile',
        'educational', 'eğitici'
      ];
      
      for (const subfolder of commonSubfolders) {
        const subfolderPath = `${folderPath}/${subfolder}`;
        if (await tryAccessFolder(subfolderPath)) {
          discoveredFolders.push(subfolderPath);
        }
      }
    }
  }
  
  return discoveredFolders;
}

// Discover JSON files by trying common patterns
async function discoverJsonFiles(): Promise<string[]> {
  const jsonFiles: string[] = [];
  
  // Known existing files
  const knownFiles = [
    '/content/Çocuk/kids_populer.json'
  ];
  
  // Check known files first
  for (const file of knownFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        jsonFiles.push(file);
      }
    } catch (error) {
      console.warn(`Could not access ${file}`);
    }
  }
  
  // Try to discover more files in discovered folders
  const folders = await discoverFolders();
  
  for (const folder of folders) {
    // Try common JSON file names
    const commonFileNames = [
      'index.json',
      'videos.json',
      'content.json',
      'data.json',
      folder.split('/').pop() + '.json', // folder name + .json
      folder.split('/').pop() + '_videos.json',
      folder.split('/').pop() + '_content.json'
    ];
    
    for (const fileName of commonFileNames) {
      const filePath = `${folder}/${fileName}`;
      try {
        const response = await fetch(filePath);
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
          jsonFiles.push(filePath);
        }
      } catch (error) {
        // Silently continue - file doesn't exist
      }
    }
  }
  
  return [...new Set(jsonFiles)]; // Remove duplicates
}

// Create folder structure from discovered folders
function createFolderStructure(folders: string[]): Group[] {
  const groups: Group[] = [];
  
  // Sort folders to ensure parent folders are processed before children
  const sortedFolders = folders.sort((a, b) => {
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b);
  });
  
  for (const folderPath of sortedFolders) {
    const pathParts = folderPath.split('/').filter(part => part && part !== 'content');
    if (pathParts.length === 0) continue;
    
    // Create group name from the first directory
    const mainCategory = pathParts[0];
    const groupName = mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
    
    // Find or create the main group
    let existingGroup = groups.find(g => g.name === groupName);
    if (!existingGroup) {
      existingGroup = {
        name: groupName,
        subgroups: []
      };
      groups.push(existingGroup);
    }
    
    // Create nested folder structure
    if (pathParts.length > 1) {
      let currentLevel = existingGroup.subgroups;
      
      // Navigate through the path (skip first part which is the main group)
      for (let i = 1; i < pathParts.length; i++) {
        const folderName = pathParts[i];
        const displayName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
        
        let folder = currentLevel.find(sg => sg.name === folderName);
        if (!folder) {
          folder = {
            name: folderName,
            viewName: displayName,
            channelId: '',
            videos: [],
            subgroups: []
          };
          currentLevel.push(folder);
        }
        
        if (!folder.subgroups) {
          folder.subgroups = [];
        }
        currentLevel = folder.subgroups;
      }
    }
  }
  
  return groups;
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('Starting dynamic content discovery...');
    
    // Discover folders and JSON files
    const [contentFolders, contentFiles] = await Promise.all([
      discoverFolders(),
      discoverJsonFiles()
    ]);
    
    console.log('Discovered content folders:', contentFolders);
    console.log('Discovered content files:', contentFiles);
    
    // Create folder structure first (this will show all folders, even empty ones)
    const allGroups = createFolderStructure(contentFolders);
    
    // If no dynamic discovery worked, create a basic structure
    if (allGroups.length === 0) {
      console.log('No folders discovered, creating basic structure...');
      
      // Create basic structure with known categories
      const basicGroups: Group[] = [
        {
          name: 'Çocuk',
          subgroups: [
            {
              name: 'populer',
              viewName: 'Popüler',
              channelId: '',
              videos: [],
              subgroups: []
            }
          ]
        }
      ];
      
      allGroups.push(...basicGroups);
    }
    
    // Now load JSON content into the folder structure
    for (const filePath of contentFiles) {
      try {
        console.log(`Loading content from: ${filePath}`);
        const response = await fetch(filePath);
        
        if (!response.ok) {
          console.warn(`Failed to load ${filePath}: ${response.status}`);
          continue;
        }
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.warn(`${filePath} is not a JSON file, skipping`);
          continue;
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.warn(`Invalid data format in ${filePath}: expected array`);
          continue;
        }
        
        // Parse the file path to find the correct location in the structure
        const pathParts = filePath.split('/').filter(part => part && part !== 'content');
        pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1].replace('.json', '');
        
        // Create group name from the first directory
        const mainCategory = pathParts[0];
        const groupName = mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
        
        // Find the main group
        let existingGroup = allGroups.find(g => g.name === groupName);
        if (!existingGroup) {
          existingGroup = {
            name: groupName,
            subgroups: []
          };
          allGroups.push(existingGroup);
        }
        
        // Process each item in the JSON data
        for (const item of data) {
          if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
            // Navigate to the correct location in the folder structure
            let currentLevel = existingGroup.subgroups;
            
            // Navigate through the path (skip first part which is the main group, and last part which is the file name)
            for (let i = 1; i < pathParts.length - 1; i++) {
              const folderName = pathParts[i];
              
              let folder = currentLevel.find(sg => sg.name === folderName);
              if (!folder) {
                const displayName = folderName.charAt(0).toUpperCase() + folderName.slice(1);
                folder = {
                  name: folderName,
                  viewName: displayName,
                  channelId: '',
                  videos: [],
                  subgroups: []
                };
                currentLevel.push(folder);
              }
              
              if (!folder.subgroups) {
                folder.subgroups = [];
              }
              currentLevel = folder.subgroups;
            }
            
            // Add the actual content to the final level
            currentLevel.push(...item.subgroups);
          }
        }
      } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
      }
    }
    
    console.log('Final groups structure:', allGroups);
    return allGroups;
  } catch (error) {
    console.error('Error in loadAllContent:', error);
    return [];
  }
}

// Helper function to manually add content files (for development)
export function addContentFile(filePath: string) {
  console.log(`To add ${filePath}, place the JSON file in the public${filePath} directory`);
}