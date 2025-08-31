import { Group, Subgroup } from '../types';

// List of common folder names to check for
const COMMON_FOLDERS = [

];

// Common subfolder patterns
const COMMON_SUBFOLDERS = [

];

// Common file naming patterns
const COMMON_FILE_PATTERNS = [

];

async function checkPathExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

async function loadJsonFile(path: string): Promise<any[]> {
  try {
    console.log(`Attempting to load: ${path}`);
    const response = await fetch(path);
    
    if (!response.ok) {
      console.log(`File not found: ${path}`);
      return [];
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn(`${path} is not a JSON file`);
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn(`Invalid data format in ${path}: expected array`);
      return [];
    }
    
    console.log(`Successfully loaded ${path} with ${data.length} items`);
    return data;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return [];
  }
}

async function discoverFoldersAndFiles(): Promise<{
  folders: string[];
  files: { path: string; content: any[] }[];
}> {
  const discoveredFolders: string[] = [];
  const discoveredFiles: { path: string; content: any[] }[] = [];
  
  // Check for main category folders
  for (const folder of COMMON_FOLDERS) {
    const folderPath = `/content/${folder}`;
    const exists = await checkPathExists(folderPath);
    
    if (exists) {
      console.log(`Found main folder: ${folder}`);
      discoveredFolders.push(folder);
      
      // Check for JSON files in this main folder
      for (const pattern of COMMON_FILE_PATTERNS) {
        const filePath = `${folderPath}/${pattern}`;
        const content = await loadJsonFile(filePath);
        if (content.length > 0) {
          discoveredFiles.push({ path: filePath, content });
        }
      }
      
      // Check for files with folder name
      const folderNameFile = `${folderPath}/${folder}.json`;
      const folderContent = await loadJsonFile(folderNameFile);
      if (folderContent.length > 0) {
        discoveredFiles.push({ path: folderNameFile, content: folderContent });
      }
      
      // Check for known files (like kids_populer.json)
      const knownFiles = [
        `${folderPath}/kids_populer.json`,
        `${folderPath}/${folder}_popular.json`,
        `${folderPath}/${folder}_populer.json`
      ];
      
      for (const knownFile of knownFiles) {
        const content = await loadJsonFile(knownFile);
        if (content.length > 0) {
          discoveredFiles.push({ path: knownFile, content });
        }
      }
      
      // Check for common subfolders
      for (const subfolder of COMMON_SUBFOLDERS) {
        const subfolderPath = `${folderPath}/${subfolder}`;
        const subExists = await checkPathExists(subfolderPath);
        
        if (subExists) {
          console.log(`Found subfolder: ${folder}/${subfolder}`);
          discoveredFolders.push(`${folder}/${subfolder}`);
          
          // Check for JSON files in subfolder
          for (const pattern of COMMON_FILE_PATTERNS) {
            const filePath = `${subfolderPath}/${pattern}`;
            const content = await loadJsonFile(filePath);
            if (content.length > 0) {
              discoveredFiles.push({ path: filePath, content });
            }
          }
          
          // Check for files with subfolder name
          const subfolderNameFile = `${subfolderPath}/${subfolder}.json`;
          const subfolderContent = await loadJsonFile(subfolderNameFile);
          if (subfolderContent.length > 0) {
            discoveredFiles.push({ path: subfolderNameFile, content: subfolderContent });
          }
        }
      }
    }
  }
  
  return { folders: discoveredFolders, files: discoveredFiles };
}

function createGroupsFromDiscoveredContent(
  folders: string[], 
  files: { path: string; content: any[] }[]
): Group[] {
  const groups: Group[] = [];
  
  // Create groups from discovered folders
  const mainCategories = new Set<string>();
  
  // Extract main categories from folders
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    if (parts.length > 0) {
      mainCategories.add(parts[0]);
    }
  });
  
  // Create group structure
  mainCategories.forEach(categoryName => {
    const group: Group = {
      name: categoryName,
      subgroups: []
    };
    
    // Find all folders that belong to this category
    const categoryFolders = folders.filter(f => f.startsWith(categoryName));
    
    // Create subgroups for each folder
    categoryFolders.forEach(folderPath => {
      const parts = folderPath.split('/');
      
      if (parts.length === 1) {
        // This is a main category folder, check for direct content
        const categoryFiles = files.filter(f => 
          f.path.startsWith(`/content/${categoryName}/`) && 
          !f.path.includes('/', f.path.indexOf(`/content/${categoryName}/`) + `/content/${categoryName}/`.length)
        );
        
        if (categoryFiles.length > 0) {
          // Create a main subgroup for this category
          const mainSubgroup: Subgroup = {
            name: categoryName,
            viewName: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
            channelId: '',
            videos: [],
            subgroups: []
          };
          
          // Add content from all files in this category
          categoryFiles.forEach(file => {
            file.content.forEach(item => {
              if (item.subgroups && Array.isArray(item.subgroups)) {
                mainSubgroup.subgroups!.push(...item.subgroups);
              }
            });
          });
          
          if (mainSubgroup.subgroups!.length > 0) {
            group.subgroups.push(mainSubgroup);
          }
        }
      } else if (parts.length === 2) {
        // This is a subfolder
        const subfolderName = parts[1];
        
        // Find content files for this subfolder
        const subfolderFiles = files.filter(f => f.path.startsWith(`/content/${folderPath}/`));
        
        const subgroup: Subgroup = {
          name: subfolderName,
          viewName: subfolderName.charAt(0).toUpperCase() + subfolderName.slice(1),
          channelId: '',
          videos: [],
          subgroups: []
        };
        
        // Add content from files in this subfolder
        subfolderFiles.forEach(file => {
          file.content.forEach(item => {
            if (item.subgroups && Array.isArray(item.subgroups)) {
              subgroup.subgroups!.push(...item.subgroups);
            }
          });
        });
        
        // Add this subgroup even if it's empty (to show the folder structure)
        group.subgroups.push(subgroup);
      }
    });
    
    // Always add the group, even if it's empty (to show folder structure)
    groups.push(group);
  });
  
  return groups;
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('Starting dynamic content discovery...');
    
    // Discover folders and files
    const { folders, files } = await discoverFoldersAndFiles();
    
    console.log('Discovered folders:', folders);
    console.log('Discovered files:', files.map(f => f.path));
    
    // Create groups from discovered content
    const groups = createGroupsFromDiscoveredContent(folders, files);
    
    console.log('Created groups:', groups);
    
    // If no groups were created, show a helpful message
    if (groups.length === 0) {
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
    
    return groups;
    
  } catch (error) {
    console.error('Error in dynamic content loading:', error);
    
    // Fallback: return empty structure with helpful message
    return [{
      name: 'Error',
      subgroups: [{
        name: 'error',
        viewName: 'Content Loading Error - Check Console',
        channelId: '',
        videos: [],
        subgroups: []
      }]
    }];
  }
}