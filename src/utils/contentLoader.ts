import { Group } from '../types';

// List of known content files - add your JSON files here
const CONTENT_FILES = [
  '/content/kids/kids_populer.json'
  // Add your JSON files here:
  // '/content/movies/action.json',
  // '/content/music/pop.json',
  // '/content/tutorials/react.json'
];

export async function loadAllContent(): Promise<Group[]> {
  const allGroups: Group[] = [];
  
  for (const filePath of CONTENT_FILES) {
    try {
      console.log(`Loading content from: ${filePath}`);
      const response = await fetch(filePath);
      
      if (!response.ok) {
        console.warn(`Failed to load ${filePath}: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        // Determine group name from file path
        const pathParts = filePath.split('/');
        const categoryName = pathParts[pathParts.length - 2]; // Get folder name
        const fileName = pathParts[pathParts.length - 1].replace('.json', '');
        
        // Create group name (capitalize first letter)
        const groupName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
        
        // Process each item in the JSON data
        for (const item of data) {
          if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
            // Check if we already have a group with this name
            let existingGroup = allGroups.find(g => g.name === groupName);
            
            if (!existingGroup) {
              existingGroup = {
                name: groupName,
                subgroups: []
              };
              allGroups.push(existingGroup);
            }
            
            // Add subgroups to the existing group
            existingGroup.subgroups.push(...item.subgroups);
          }
        }
      } else {
        console.warn(`Invalid data format in ${filePath}: expected array`);
      }
    } catch (error) {
      console.error(`Error loading ${filePath}:`, error);
    }
  }
  
  return allGroups;
}

// Auto-discovery function (experimental)
export async function discoverContentFiles(): Promise<string[]> {
  // This would require a backend endpoint to list files
  // For now, return the known files
  return CONTENT_FILES;
}