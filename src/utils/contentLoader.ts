import { Group } from '../types';

// Auto-discovery function to find all JSON files in content directory
async function discoverContentFiles(): Promise<string[]> {
  const contentFiles: string[] = [];
  
  // Known structure - you can add more paths here
  const knownPaths = [
    '/content/kids/kids_populer.json',
    '/content/kids/populer/', // This would be a folder
    // Add more paths as needed
  ];
  
  // For now, we'll use a predefined list since we can't dynamically scan directories in the browser
  // You can add your file paths here:
  const staticFiles = [
    '/content/kids/kids_populer.json',
    // Add your nested files here:
    // '/content/kids/populer/afacanlar.json',
    // '/content/kids/populer/other_series.json',
    // '/content/movies/action/superhero.json',
    // '/content/movies/comedy/family.json',
  ];
  
  return staticFiles;
}

export async function loadAllContent(): Promise<Group[]> {
  const allGroups: Group[] = [];
  
  try {
    const contentFiles = await discoverContentFiles();
    console.log('Discovered content files:', contentFiles);
    
    for (const filePath of contentFiles) {
      try {
        console.log(`Loading content from: ${filePath}`);
        const response = await fetch(filePath);
        
        if (!response.ok) {
          console.warn(`Failed to load ${filePath}: ${response.status}`);
          continue;
        }
        
        const data = await response.json();
        
        if (Array.isArray(data)) {
          // Parse the file path to create group hierarchy
          const pathParts = filePath.split('/').filter(part => part && part !== 'content');
          pathParts[pathParts.length - 1] = pathParts[pathParts.length - 1].replace('.json', '');
          
          // Create group name from the first directory (e.g., 'kids' -> 'Kids')
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
              // If we have nested folders (like kids/populer/), create nested structure
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
                // Direct subgroups (existing behavior)
                existingGroup.subgroups.push(...item.subgroups);
              }
            }
          }
        } else {
          console.warn(`Invalid data format in ${filePath}: expected array`);
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

// Helper function to add new content files
export function addContentFile(filePath: string) {
  // This would be used to dynamically add new content files
  // For now, you need to manually add them to the staticFiles array above
  console.log(`To add ${filePath}, update the staticFiles array in contentLoader.ts`);
}