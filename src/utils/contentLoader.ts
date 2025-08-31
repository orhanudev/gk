import { Group, Subgroup } from '../types';

// Completely dynamic content loader with zero hardcoding

async function loadJsonFile(path: string): Promise<any[]> {
  try {
    console.log(`Attempting to load: ${path}`);
    const response = await fetch(path);
    
    if (!response.ok) {
      console.log(`File not found: ${path} (${response.status})`);
      return [];
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      console.warn(`${path} is not a JSON file (content-type: ${contentType})`);
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn(`Invalid data format in ${path}: expected array, got ${typeof data}`);
      return [];
    }
    
    console.log(`Successfully loaded ${path} with ${data.length} items`);
    return data;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return [];
  }
}

// Use a manifest file approach - create a manifest.json that lists all available content
async function loadContentManifest(): Promise<{folders: string[], files: string[]}> {
  try {
    console.log('Attempting to load content manifest...');
    const response = await fetch('/content/manifest.json');
    
    if (response.ok) {
      const manifest = await response.json();
      console.log('Loaded content manifest:', manifest);
      return {
        folders: manifest.folders || [],
        files: manifest.files || []
      };
    }
  } catch (error) {
    console.log('No manifest found, will try directory scanning');
  }
  
  return { folders: [], files: [] };
}

// Fallback: try to infer structure from accessible files
async function inferStructureFromKnownFiles(): Promise<{folders: string[], files: string[]}> {
  // Since we want no hardcoding, we'll return empty structure
  // The system should rely on manifest or directory scanning
  return { folders: [], files: [] };
}

// Try to scan directories by attempting to access index files
async function scanForDirectories(): Promise<{folders: string[], files: string[]}> {
  const discoveredFolders: string[] = [];
  const discoveredFiles: string[] = [];
  
  try {
    // Try to get a directory listing from the content folder
    const contentResponse = await fetch('/content/');
    
    if (contentResponse.ok) {
      const contentText = await contentResponse.text();
      
      // Try to parse HTML directory listing
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentText, 'text/html');
      
      // Look for links that might be folders or files
      const links = doc.querySelectorAll('a[href]');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanHref = href.replace(/^\/+|\/+$/g, '');
          
          if (href.endsWith('/')) {
            // This is likely a folder
            discoveredFolders.push(cleanHref);
            console.log(`Discovered folder: ${cleanHref}`);
          } else if (href.endsWith('.json')) {
            // This is a JSON file
            discoveredFiles.push(cleanHref);
            console.log(`Discovered JSON file: ${cleanHref}`);
          }
        }
      });
      
      // Recursively scan discovered folders
      for (const folder of [...discoveredFolders]) {
        await scanSubfolder(folder, discoveredFolders, discoveredFiles);
      }
    }
  } catch (error) {
    console.warn('Could not scan directories:', error);
  }
  
  return { folders: discoveredFolders, files: discoveredFiles };
}

async function scanSubfolder(
  folderPath: string,
  discoveredFolders: string[],
  discoveredFiles: string[]
): Promise<void> {
  try {
    const folderResponse = await fetch(`/content/${folderPath}/`);
    
    if (folderResponse.ok) {
      const folderText = await folderResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(folderText, 'text/html');
      
      const links = doc.querySelectorAll('a[href]');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanHref = href.replace(/^\/+|\/+$/g, '');
          const fullPath = `${folderPath}/${cleanHref}`;
          
          if (href.endsWith('/')) {
            if (!discoveredFolders.includes(fullPath)) {
              discoveredFolders.push(fullPath);
              console.log(`Discovered subfolder: ${fullPath}`);
            }
          } else if (href.endsWith('.json')) {
            if (!discoveredFiles.includes(fullPath)) {
              discoveredFiles.push(fullPath);
              console.log(`Discovered JSON file: ${fullPath}`);
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn(`Could not scan subfolder ${folderPath}:`, error);
  }
}

function createGroupsFromStructure(folders: string[], files: string[]): Group[] {
  const groups: Group[] = [];
  
  // Get all main categories (top-level folders)
  const mainCategories = new Set<string>();
  
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    if (parts.length > 0) {
      mainCategories.add(parts[0]);
    }
  });
  
  files.forEach(filePath => {
    const parts = filePath.split('/');
    if (parts.length > 1) {
      mainCategories.add(parts[0]);
    }
  });
  
  // Create groups for each main category
  mainCategories.forEach(categoryName => {
    const group: Group = {
      name: categoryName,
      subgroups: []
    };
    
    // Find all subfolders for this category
    const categoryFolders = folders.filter(f => f.startsWith(`${categoryName}/`));
    const categoryFiles = files.filter(f => f.startsWith(`${categoryName}/`));
    
    // Get all unique subfolder names (including empty folders)
    const subfolderNames = new Set<string>();
    
    categoryFolders.forEach(folderPath => {
      const relativePath = folderPath.substring(categoryName.length + 1);
      const firstLevel = relativePath.split('/')[0];
      if (firstLevel) {
        subfolderNames.add(firstLevel);
      }
    });
    
    categoryFiles.forEach(filePath => {
      const relativePath = filePath.substring(categoryName.length + 1);
      const pathParts = relativePath.split('/');
      if (pathParts.length > 1) {
        subfolderNames.add(pathParts[0]);
      }
    });
    
    // Create subgroups for each discovered subfolder (including empty ones)
    subfolderNames.forEach(subfolderName => {
      const subgroup: Subgroup = {
        name: subfolderName,
        viewName: subfolderName.charAt(0).toUpperCase() + subfolderName.slice(1),
        channelId: '',
        videos: [],
        subgroups: []
      };
      
      group.subgroups.push(subgroup);
    });
    
    // Also add direct files in the main category as subgroups
    const directFiles = categoryFiles.filter(f => {
      const relativePath = f.substring(categoryName.length + 1);
      return !relativePath.includes('/');
    });
    
    directFiles.forEach(filePath => {
      const fileName = filePath.split('/').pop()?.replace('.json', '') || 'content';
      
      // Only add if not already added as a subfolder
      if (!subfolderNames.has(fileName)) {
        const subgroup: Subgroup = {
          name: fileName,
          viewName: fileName.charAt(0).toUpperCase() + fileName.slice(1),
          channelId: '',
          videos: [],
          subgroups: []
        };
        
        group.subgroups.push(subgroup);
      }
    });
    
    groups.push(group);
  });
  
  return groups;
}

async function loadContentForSubgroup(subgroup: Subgroup, categoryName: string, files: string[]): Promise<void> {
  // Find JSON files for this subgroup
  const relevantFiles = files.filter(f => {
    const relativePath = f.substring(categoryName.length + 1);
    return relativePath.startsWith(`${subgroup.name}/`) || relativePath === `${subgroup.name}.json`;
  });
  
  for (const filePath of relevantFiles) {
    const content = await loadJsonFile(`/content/${filePath}`);
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
  }
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('Starting completely dynamic content discovery...');
    
    // First try to load from manifest
    let { folders, files } = await loadContentManifest();
    
    // If no manifest, try directory scanning
    if (folders.length === 0 && files.length === 0) {
      console.log('No manifest found, attempting directory scan...');
      const scanned = await scanForDirectories();
      folders = scanned.folders;
      files = scanned.files;
    }
    
    // If still nothing found, try to infer from any existing files
    if (folders.length === 0 && files.length === 0) {
      console.log('No content discovered via scanning, trying inference...');
      const inferred = await inferStructureFromKnownFiles();
      folders = inferred.folders;
      files = inferred.files;
    }
    
    console.log('Final discovered folders:', folders);
    console.log('Final discovered files:', files);
    
    // Create groups from the discovered structure
    const groups = createGroupsFromStructure(folders, files);
    
    // Load actual content from discovered JSON files
    for (const group of groups) {
      for (const subgroup of group.subgroups) {
        await loadContentForSubgroup(subgroup, group.name, files);
      }
    }
    
    console.log('Final groups structure:', groups);
    
    // If no groups were created, return empty structure
    if (groups.length === 0) {
      console.log('No content structure discovered');
      return [];
    }
    
    return groups;
    
  } catch (error) {
    console.error('Error in dynamic content loading:', error);
    return [];
  }
}