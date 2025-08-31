import { Group } from '../types';

// Recursively discover all folders and JSON files in the content directory
async function discoverContentStructure(basePath: string = '/content'): Promise<{files: string[], folders: string[]}> {
  const contentFiles: string[] = [];
  const contentFolders: string[] = [];
  
  try {
    // Try to fetch the directory listing
    const response = await fetch(basePath);
    if (!response.ok) {
      console.warn(`Could not access ${basePath}`);
      return { files: [], folders: [] };
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
        // It's a directory
        const folderPath = fullPath.slice(0, -1);
        contentFolders.push(folderPath);
        
        // Recursively scan subdirectories
        const subStructure = await discoverContentStructure(folderPath);
        contentFiles.push(...subStructure.files);
        contentFolders.push(...subStructure.folders);
      } else if (href.endsWith('.json')) {
        // It's a JSON file
        contentFiles.push(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Error scanning directory ${basePath}:`, error);
  }
  
  return { files: contentFiles, folders: contentFolders };
}

// Fallback function for when dynamic discovery fails
async function getFallbackFiles(): Promise<string[]> {
  const knownFiles = [
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
    
    // Discover both files and folders
    const { files: contentFiles, folders: contentFolders } = await discoverContentStructure('/content');
    
    console.log('Discovered content files:', contentFiles);
    console.log('Discovered content folders:', contentFolders);
    
    // Create folder structure first
    const allGroups = createFolderStructure(contentFolders);
    
    // If no folders found, use fallback
    if (allGroups.length === 0 && contentFiles.length === 0) {
      console.log('No content discovered, using fallback...');
      const fallbackFiles = await getFallbackFiles();
      
      // Process fallback files
      for (const filePath of fallbackFiles) {
        try {
          const response = await fetch(filePath);
          if (!response.ok) continue;
          
          const data = await response.json();
          if (!Array.isArray(data)) continue;
          
          const pathParts = filePath.split('/').filter(part => part && part !== 'content');
          const mainCategory = pathParts[0];
          const groupName = mainCategory.charAt(0).toUpperCase() + mainCategory.slice(1);
          
          let existingGroup = allGroups.find(g => g.name === groupName);
          if (!existingGroup) {
            existingGroup = { name: groupName, subgroups: [] };
            allGroups.push(existingGroup);
          }
          
          for (const item of data) {
            if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
              existingGroup.subgroups.push(...item.subgroups);
            }
          }
        } catch (error) {
          console.error(`Error loading fallback file ${filePath}:`, error);
        }
      }
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