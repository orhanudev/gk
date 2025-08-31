import { Group, Subgroup } from '../types';

// Recursively discover all folders and JSON files in the content directory
async function discoverContentStructure(basePath: string = '/content'): Promise<{
  folders: string[];
  jsonFiles: string[];
}> {
  const folders: string[] = [];
  const jsonFiles: string[] = [];
  
  // Function to recursively scan a directory
  const scanDirectory = async (dirPath: string, depth: number = 0): Promise<void> => {
    // Prevent infinite recursion
    if (depth > 10) return;
    
    try {
      console.log(`Scanning directory: ${dirPath}`);
      
      // Try to fetch the directory listing
      const response = await fetch(dirPath);
      if (!response.ok) {
        console.log(`Directory ${dirPath} not accessible`);
        return;
      }
      
      const html = await response.text();
      
      // Parse HTML directory listing to find files and folders
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href]');
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (!href || href === '../' || href === './') continue;
        
        const fullPath = `${dirPath}/${href}`.replace(/\/+/g, '/');
        
        if (href.endsWith('/')) {
          // This is a folder
          const folderPath = href.slice(0, -1); // Remove trailing slash
          const fullFolderPath = `${dirPath}/${folderPath}`.replace(/\/+/g, '/');
          
          console.log(`Found folder: ${fullFolderPath}`);
          folders.push(fullFolderPath);
          
          // Recursively scan this folder
          await scanDirectory(fullFolderPath, depth + 1);
        } else if (href.endsWith('.json')) {
          // This is a JSON file
          const fullFilePath = fullPath.replace(/\/+/g, '/');
          console.log(`Found JSON file: ${fullFilePath}`);
          jsonFiles.push(fullFilePath);
        }
      }
    } catch (error) {
      console.log(`Error scanning ${dirPath}:`, error);
      
      // Fallback: try to access some common files/folders directly
      if (dirPath === '/content') {
        const commonItems = [
          '/content/kids',
          '/content/Çocuk', 
          '/content/movies',
          '/content/music',
          '/content/tutorials',
          '/content/kids/kids_populer.json',
          '/content/Çocuk/kids_populer.json'
        ];
        
        for (const item of commonItems) {
          try {
            const testResponse = await fetch(item);
            if (testResponse.ok) {
              if (item.endsWith('.json')) {
                jsonFiles.push(item);
              } else {
                folders.push(item);
                // Try to scan this folder too
                await scanDirectory(item, depth + 1);
              }
            }
          } catch {
            // Ignore errors for fallback items
          }
        }
      }
    }
  };
  
  await scanDirectory(basePath);
  
  console.log('Discovered folders:', folders);
  console.log('Discovered JSON files:', jsonFiles);
  
  return { folders, jsonFiles };
}

// Create folder structure from discovered paths
function createFolderStructureFromPaths(folderPaths: string[]): Group[] {
  const groups: Group[] = [];
  
  // Process each folder path
  for (const folderPath of folderPaths) {
    const pathParts = folderPath.split('/').filter(part => part && part !== 'content');
    if (pathParts.length === 0) continue;
    
    // Create or find the main group
    const mainCategoryName = pathParts[0];
    let group = groups.find(g => g.name === mainCategoryName);
    if (!group) {
      group = {
        name: mainCategoryName,
        subgroups: []
      };
      groups.push(group);
    }
    
    // Navigate through the path to create nested structure
    let currentLevel = group.subgroups;
    
    for (let i = 1; i < pathParts.length; i++) {
      const folderName = pathParts[i];
      
      let subgroup = currentLevel.find(sg => sg.name === folderName);
      if (!subgroup) {
        subgroup = {
          name: folderName,
          viewName: folderName.charAt(0).toUpperCase() + folderName.slice(1),
          channelId: '',
          videos: [],
          subgroups: []
        };
        currentLevel.push(subgroup);
      }
      
      if (!subgroup.subgroups) {
        subgroup.subgroups = [];
      }
      currentLevel = subgroup.subgroups;
    }
  }
  
  return groups;
}

// Load JSON content into the folder structure
async function loadJsonContentIntoStructure(groups: Group[], jsonFiles: string[]): Promise<void> {
  for (const filePath of jsonFiles) {
    try {
      console.log(`Loading JSON content from: ${filePath}`);
      
      const response = await fetch(filePath);
      if (!response.ok) {
        console.warn(`Failed to load ${filePath}: ${response.status}`);
        continue;
      }
      
      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.warn(`${filePath} is not a JSON file, skipping`);
        continue;
      }
      
      const data = await response.json();
      if (!Array.isArray(data)) {
        console.warn(`Invalid data format in ${filePath}: expected array`);
        continue;
      }
      
      // Parse the file path to find where to place the content
      const pathParts = filePath.split('/').filter(part => part && part !== 'content');
      const fileName = pathParts[pathParts.length - 1].replace('.json', '');
      const folderParts = pathParts.slice(0, -1); // Remove filename
      
      if (folderParts.length === 0) continue;
      
      // Find the target location in the groups structure
      const mainCategoryName = folderParts[0];
      const group = groups.find(g => g.name === mainCategoryName);
      if (!group) continue;
      
      // Navigate to the correct subgroup
      let currentLevel = group.subgroups;
      for (let i = 1; i < folderParts.length; i++) {
        const folderName = folderParts[i];
        const subgroup = currentLevel.find(sg => sg.name === folderName);
        if (!subgroup) break;
        
        if (!subgroup.subgroups) {
          subgroup.subgroups = [];
        }
        currentLevel = subgroup.subgroups;
      }
      
      // Add the JSON content to the structure
      for (const item of data) {
        if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
          currentLevel.push(...item.subgroups);
        }
      }
      
    } catch (error) {
      console.error(`Error loading JSON from ${filePath}:`, error);
    }
  }
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('Starting fully dynamic content discovery...');
    
    // Discover all folders and JSON files
    const { folders, jsonFiles } = await discoverContentStructure();
    
    // Create folder structure from discovered paths
    const groups = createFolderStructureFromPaths(folders);
    
    // Load JSON content into the structure
    await loadJsonContentIntoStructure(groups, jsonFiles);
    
    // If no content was discovered, create a minimal fallback
    if (groups.length === 0) {
      console.log('No content discovered, creating minimal structure...');
      return [{
        name: 'Content',
        subgroups: [{
          name: 'empty',
          viewName: 'No Content Found',
          channelId: '',
          videos: [],
          subgroups: []
        }]
      }];
    }
    
    console.log('Final dynamic groups structure:', groups);
    return groups;
    
  } catch (error) {
    console.error('Error in dynamic content loading:', error);
    
    // Ultimate fallback - return empty structure
    return [{
      name: 'Error',
      subgroups: [{
        name: 'error',
        viewName: 'Content Loading Error',
        channelId: '',
        videos: [],
        subgroups: []
      }]
    }];
  }
}