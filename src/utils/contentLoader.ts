import { Group, Subgroup } from '../types';

async function loadJsonFile(path: string): Promise<any[]> {
  try {
    console.log(`Loading: ${path}`);
    const response = await fetch(path);
    
    if (!response.ok) {
      console.log(`File not found: ${path}`);
      return [];
    }
    
    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.log(`Not a JSON file: ${path} (content-type: ${contentType})`);
      return [];
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      console.warn(`Invalid data format in ${path}`);
      return [];
    }
    
    console.log(`Loaded ${path} with ${data.length} items`);
    return data;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    return [];
  }
}

// Try to discover what content actually exists
async function discoverContent(): Promise<{folders: string[], files: string[]}> {
  const folders: string[] = [];
  const files: string[] = [];
  
  // Try to load a manifest file first
  try {
    const manifestResponse = await fetch('/content/manifest.json');
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      console.log('Found manifest:', manifest);
      return {
        folders: manifest.folders || [],
        files: manifest.files || []
      };
    }
  } catch (error) {
    console.log('No manifest file found');
  }
  
  // Try to access the main content directory
  try {
    const contentResponse = await fetch('/content/');
    if (contentResponse.ok) {
      const html = await contentResponse.text();
      
      // Parse directory listing HTML to find folders and files
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href]');
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanPath = href.replace(/^\/+|\/+$/g, '');
          
          if (href.endsWith('/')) {
            // This is a folder
            folders.push(cleanPath);
            console.log(`Found folder: ${cleanPath}`);
            
            // Try to scan this subfolder
            await scanSubfolder(cleanPath, folders, files);
          } else if (href.endsWith('.json')) {
            // This is a JSON file
            files.push(cleanPath);
            console.log(`Found file: ${cleanPath}`);
          }
        }
      }
    }
  } catch (error) {
    console.log('Could not scan content directory');
  }
  
  // If we still have nothing, try some basic file checks
  if (folders.length === 0 && files.length === 0) {
    console.log('Trying basic file discovery...');
    
    // Try to discover all directories and files by testing common Turkish folder names
    const commonFolders = [
      'Çocuk', 'cocuk', 'Cocuk', 'COCUK',
      'Genç', 'genc', 'Genc', 'GENC', 
      'Yetişkin', 'yetiskin', 'Yetiskin', 'YETISKIN',
      'Müzik', 'muzik', 'Muzik', 'MUZIK',
      'Film', 'film', 'FILM',
      'Belgesel', 'belgesel', 'BELGESEL',
      'Eğitim', 'egitim', 'Egitim', 'EGITIM',
      'Spor', 'spor', 'SPOR'
    ];
    
    // Test each potential folder
    for (const folderName of commonFolders) {
      try {
        const response = await fetch(`/content/${folderName}/`, { method: 'HEAD' });
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
          if (!folders.includes(folderName)) {
            folders.push(folderName);
            console.log(`Found accessible folder: ${folderName}`);
            
            // Try to scan this folder for files
            await scanSubfolder(folderName, folders, files);
          }
          }
        }
      } catch (error) {
        // Folder doesn't exist, continue
      }
    }
    
    // Also try to find JSON files directly in the root
    const commonFiles = [
      'kids_populer.json',
      'genc_populer.json', 
      'yetiskin_populer.json',
      'muzik_populer.json'
    ];
    
    for (const fileName of commonFiles) {
      try {
        const response = await fetch(`/content/${fileName}`, { method: 'HEAD' });
        if (response.ok) {
          if (!files.includes(fileName)) {
            files.push(fileName);
            console.log(`Found accessible file: ${fileName}`);
          }
        }
      } catch (error) {
        // File doesn't exist, continue
      }
    }
  }
  
  return { folders, files };
}

async function scanSubfolder(folderPath: string, folders: string[], files: string[]): Promise<void> {
  try {
    const response = await fetch(`/content/${folderPath}/`);
    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const links = doc.querySelectorAll('a[href]');
      
      for (const link of links) {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanPath = href.replace(/^\/+|\/+$/g, '');
          const fullPath = `${folderPath}/${cleanPath}`;
          
          if (href.endsWith('/')) {
            if (!folders.includes(fullPath)) {
              folders.push(fullPath);
              console.log(`Found subfolder: ${fullPath}`);
            }
          } else if (href.endsWith('.json')) {
            if (!files.includes(fullPath)) {
              files.push(fullPath);
              console.log(`Found file: ${fullPath}`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.log(`Could not scan subfolder: ${folderPath}`);
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
    console.log('Starting dynamic content discovery...');
    
    const { folders, files } = await discoverContent();
    
    console.log('Discovered folders:', folders);
    console.log('Discovered files:', files);
    
    // Create groups from the discovered structure
    const groups = createGroupsFromStructure(folders, files);
    
    // Load actual content from discovered JSON files
    for (const group of groups) {
      for (const subgroup of group.subgroups) {
        await loadContentForSubgroup(subgroup, group.name, files);
      }
    }
    
    console.log('Final groups structure:', groups);
    return groups;
    
  } catch (error) {
    console.error('Error in dynamic content loading:', error);
    return [];
  }
}