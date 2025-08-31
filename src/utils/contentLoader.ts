import { Group } from '../types';

// Recursively discover all JSON files in the content directory
async function discoverContentFiles(basePath: string = '/content'): Promise<string[]> {
  const contentFiles: string[] = [];
  
  try {
    // Try to fetch the directory listing
    const response = await fetch(basePath);
    if (!response.ok) {
      console.warn(`Could not access ${basePath}`);
      return [];
    }
    
    const html = await response.text();
    
    // Parse directory listing HTML to find files and folders
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    
    for (const link of links) {
      const href = link.getAttribute('href');
      if (!href || href === '../' || href === './') continue;
      
      const fullPath = `${basePath}/${href}`.replace(/\/+/g, '/');
      
      if (href.endsWith('/')) {
        // It's a directory, recursively scan it
        const subFiles = await discoverContentFiles(fullPath.slice(0, -1));
        contentFiles.push(...subFiles);
      } else if (href.endsWith('.json')) {
        // It's a JSON file
        contentFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Error scanning directory ${basePath}:`, error);
  }
  
  return contentFiles;
}

// Fallback function for when dynamic discovery fails
async function getFallbackFiles(): Promise<string[]> {
  const knownFiles = [
    '/content/kids/kids_populer.json',
    '/content/Çocuk/kids_populer.json'
  ];
  
  const validFiles: string[] = [];
  
  for (const file of knownFiles) {
    try {
      const response = await fetch(file);
      if (response.ok) {
        validFiles.push(file);
      }
    } catch (error) {
      console.warn(`File ${file} not accessible`);
    }
  }
  
  return validFiles;
}

export async function loadAllContent(): Promise<Group[]> {
  const allGroups: Group[] = [];
  
  try {
    console.log('Starting dynamic content discovery...');
    
    // Try dynamic discovery first
    let contentFiles = await discoverContentFiles('/content');
    
    // If dynamic discovery fails or returns no files, use fallback
    if (contentFiles.length === 0) {
      console.log('Dynamic discovery failed, using fallback...');
      contentFiles = await getFallbackFiles();
    }
    
    console.log('Discovered content files:', contentFiles);
    
    if (contentFiles.length === 0) {
      console.warn('No content files found');
      return [];
    }
    
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
        
        // Parse the file path to create group hierarchy
        const pathParts = filePath.split('/').filter(part => part && part !== 'content');
        pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1].replace('.json', '');
        
        // Create group name from the first directory
        const mainCategory = pathParts[0];
        const groupName = mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
        
        // Find or create the main group
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
            // If we have nested folders, create nested structure
            if (pathParts.length > 2) {
              // Create nested subgroup structure
              let currentLevel = existingGroup.subgroups;
              
              // Navigate through the path (skip first part which is the main group)
              for (let i = 1; i < pathParts.length - 1; i++) {
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
              
              // Add the actual content to the final level
              currentLevel.push(...item.subgroups);
            } else {
              // Direct subgroups
              existingGroup.subgroups.push(...item.subgroups);
            }
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