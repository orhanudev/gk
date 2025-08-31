import { Group, Subgroup } from '../types';

// Completely dynamic content loader - no hardcoded paths or patterns

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

async function discoverDirectoryStructure(): Promise<{
  folders: string[];
  files: string[];
}> {
  const discoveredFolders: string[] = [];
  const discoveredFiles: string[] = [];
  
  // Try to get directory listing from the server
  try {
    console.log('Attempting to discover directory structure...');
    
    // Try to access the content directory
    const contentResponse = await fetch('/content/');
    
    if (contentResponse.ok) {
      const contentText = await contentResponse.text();
      console.log('Content directory response received');
      
      // Parse HTML directory listing to extract folders and files
      const parser = new DOMParser();
      const doc = parser.parseFromString(contentText, 'text/html');
      
      // Look for links in the directory listing
      const links = doc.querySelectorAll('a[href]');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanHref = href.replace(/^\/+|\/+$/g, '');
          
          if (href.endsWith('/')) {
            // This is a folder
            discoveredFolders.push(cleanHref);
            console.log(`Found folder: ${cleanHref}`);
          } else if (href.endsWith('.json')) {
            // This is a JSON file
            discoveredFiles.push(cleanHref);
            console.log(`Found JSON file: ${cleanHref}`);
          }
        }
      });
      
      // Recursively discover subfolders
      for (const folder of [...discoveredFolders]) {
        await discoverSubfolders(folder, discoveredFolders, discoveredFiles);
      }
    }
  } catch (error) {
    console.warn('Could not access directory listing:', error);
  }
  
  // If we couldn't discover anything, try to probe for existing known structure
  if (discoveredFolders.length === 0 && discoveredFiles.length === 0) {
    console.log('Falling back to probing for existing content...');
    await probeForExistingContent(discoveredFolders, discoveredFiles);
  }
  
  return { folders: discoveredFolders, files: discoveredFiles };
}

async function discoverSubfolders(
  parentFolder: string, 
  discoveredFolders: string[], 
  discoveredFiles: string[]
): Promise<void> {
  try {
    const folderResponse = await fetch(`/content/${parentFolder}/`);
    
    if (folderResponse.ok) {
      const folderText = await folderResponse.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(folderText, 'text/html');
      
      const links = doc.querySelectorAll('a[href]');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '../' && href !== './') {
          const cleanHref = href.replace(/^\/+|\/+$/g, '');
          const fullPath = `${parentFolder}/${cleanHref}`;
          
          if (href.endsWith('/')) {
            // This is a subfolder
            if (!discoveredFolders.includes(fullPath)) {
              discoveredFolders.push(fullPath);
              console.log(`Found subfolder: ${fullPath}`);
            }
          } else if (href.endsWith('.json')) {
            // This is a JSON file
            if (!discoveredFiles.includes(fullPath)) {
              discoveredFiles.push(fullPath);
              console.log(`Found JSON file in subfolder: ${fullPath}`);
            }
          }
        }
      });
    }
  } catch (error) {
    console.warn(`Could not access subfolder ${parentFolder}:`, error);
  }
}

async function probeForExistingContent(
  discoveredFolders: string[], 
  discoveredFiles: string[]
): Promise<void> {
  // Try to discover folders by checking for common patterns
  // We'll use a more systematic approach to find any existing folders
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const commonNames = [
    // Turkish folder names
    'çocuk', 'cocuk', 'kids', 'children',
    'film', 'filmler', 'movies', 'cinema',
    'müzik', 'muzik', 'music', 'songs',
    'eğitim', 'egitim', 'education', 'tutorials',
    'belgesel', 'documentary', 'documentaries',
    'dizi', 'diziler', 'series', 'shows',
    'spor', 'sports', 'games',
    'haber', 'haberler', 'news',
    'eğlence', 'eglence', 'entertainment',
    'komedi', 'comedy', 'funny',
    'aksiyon', 'action', 'adventure',
    'drama', 'romantic', 'romance',
    'korku', 'horror', 'thriller',
    'bilim', 'science', 'technology',
    'sanat', 'art', 'culture',
    'tarih', 'history', 'historical',
    'doğa', 'doga', 'nature', 'animals',
    'sağlık', 'saglik', 'health', 'fitness',
    // Add alphabet and numbers
    ...alphabet.split(''),
    ...alphabet.toUpperCase().split(''),
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0'
  ];
  
  // Try to discover subfolders by checking common patterns
  const commonSubfolders = [
    // Turkish subfolder names
    'populer', 'popular', 'trending',
    'yeni', 'new', 'latest', 'son',
    'klasik', 'classic', 'old', 'eski',
    'aksiyon', 'action', 'adventure', 'macera',
    'komedi', 'comedy', 'funny', 'eglenceli',
    'drama', 'romantic', 'romantik',
    'korku', 'horror', 'thriller', 'gerilim',
    'animasyon', 'animation', 'cartoon', 'cizgi',
    'egitim', 'eğitim', 'educational', 'learning', 'ders',
    'muzik', 'müzik', 'music', 'songs', 'sarki',
    'dans', 'dance', 'dancing',
    'belgesel', 'documentary', 'docs',
    'haber', 'news', 'gündem',
    'spor', 'sports', 'futbol', 'basketbol',
    'teknoloji', 'technology', 'tech',
    'bilim', 'science', 'fen',
    'sanat', 'art', 'kultur', 'culture',
    'tarih', 'history', 'historical',
    'doga', 'doğa', 'nature', 'hayvan',
    'saglik', 'sağlık', 'health', 'fitness',
    'yemek', 'food', 'cooking', 'mutfak',
    'seyahat', 'travel', 'gezi',
    'oyun', 'games', 'gaming',
    'test', 'demo', 'example', 'ornek',
    'index', 'main', 'default'
  ];
  
  // Probe for main folders
  for (const folderName of commonNames) {
    try {
      const response = await fetch(`/content/${folderName}/`, { method: 'HEAD' });
      if (response.ok) {
        if (!discoveredFolders.includes(folderName)) {
          discoveredFolders.push(folderName);
          console.log(`Found existing folder: ${folderName}`);
          
          // Probe for subfolders within this main folder
          for (const subfolderName of commonSubfolders) {
            try {
              const subResponse = await fetch(`/content/${folderName}/${subfolderName}/`, { method: 'HEAD' });
              if (subResponse.ok) {
                const fullSubfolderPath = `${folderName}/${subfolderName}`;
                if (!discoveredFolders.includes(fullSubfolderPath)) {
                  discoveredFolders.push(fullSubfolderPath);
                  console.log(`Found existing subfolder: ${fullSubfolderPath}`);
                }
              }
            } catch (error) {
              // Subfolder doesn't exist, continue
            }
          }
          
          // Probe for JSON files in this folder
          const filePatterns = [
            'index.json',
            'videos.json',
            'content.json',
            'data.json',
            `${folderName}.json`,
            `${folderName}_videos.json`,
            `${folderName}_content.json`
          ];
          
          for (const fileName of filePatterns) {
            try {
              const fileResponse = await fetch(`/content/${folderName}/${fileName}`, { method: 'HEAD' });
              if (fileResponse.ok) {
                const filePath = `${folderName}/${fileName}`;
                if (!discoveredFiles.includes(filePath)) {
                  discoveredFiles.push(filePath);
                  console.log(`Found existing file: ${filePath}`);
                }
              }
            } catch (error) {
              // File doesn't exist, continue
            }
          }
        }
      }
    } catch (error) {
      // Folder doesn't exist, continue
    }
  }
}

function createGroupsFromStructure(
  folders: string[], 
  files: string[]
): Group[] {
  const groups: Group[] = [];
  
  // Get all main categories (top-level folders)
  const mainCategories = new Set<string>();
  
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    if (parts.length > 0) {
      mainCategories.add(parts[0]);
    }
  });
  
  // Also check for main categories from file paths
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
    
    // Create subgroups for direct files in the main category
    const directFiles = categoryFiles.filter(f => {
      const relativePath = f.substring(categoryName.length + 1);
      return !relativePath.includes('/'); // No additional slashes = direct file
    });
    
    // Create subgroups for subfolders
    const subfolders = new Set<string>();
    categoryFolders.forEach(folderPath => {
      const relativePath = folderPath.substring(categoryName.length + 1);
      const firstLevel = relativePath.split('/')[0];
      if (firstLevel) {
        subfolders.add(firstLevel);
      }
    });
    
    // Also check for subfolders from file paths
    categoryFiles.forEach(filePath => {
      const relativePath = filePath.substring(categoryName.length + 1);
      const pathParts = relativePath.split('/');
      if (pathParts.length > 1) {
        subfolders.add(pathParts[0]);
      }
    });
    
    // Create subgroups for each discovered subfolder
    subfolders.forEach(subfolderName => {
      const subgroup: Subgroup = {
        name: subfolderName,
        viewName: subfolderName.charAt(0).toUpperCase() + subfolderName.slice(1),
        channelId: '',
        videos: [],
        subgroups: [],
        totalVideos: 0
      };
      
      // Find files in this subfolder
      const subfolderFiles = categoryFiles.filter(f => {
        const relativePath = f.substring(categoryName.length + 1);
        return relativePath.startsWith(`${subfolderName}/`);
      });
      
      // Load content from files in this subfolder
      subfolderFiles.forEach(async (filePath) => {
        const content = await loadJsonFile(`/content/${filePath}`);
        content.forEach(item => {
          if (item.subgroups && Array.isArray(item.subgroups)) {
            subgroup.subgroups!.push(...item.subgroups);
          }
        });
      });
      
      group.subgroups.push(subgroup);
    });
    
    // Also create subgroups for any folders that don't have JSON files yet
    const emptyFolders = folders.filter(f => 
      f.startsWith(`${categoryName}/`) && 
      !subfolders.has(f.substring(categoryName.length + 1).split('/')[0])
    );
    
    emptyFolders.forEach(folderPath => {
      const relativePath = folderPath.substring(categoryName.length + 1);
      const folderName = relativePath.split('/')[0];
      
      if (folderName && !subfolders.has(folderName)) {
        const emptySubgroup: Subgroup = {
          name: folderName,
          viewName: folderName.charAt(0).toUpperCase() + folderName.slice(1),
          channelId: '',
          videos: [],
          subgroups: [],
          totalVideos: 0
        };
        
        group.subgroups.push(emptySubgroup);
      }
    });
    
    // Add direct content from files in the main category
    directFiles.forEach(async (filePath) => {
      const content = await loadJsonFile(`/content/${filePath}`);
      content.forEach(item => {
        if (item.subgroups && Array.isArray(item.subgroups)) {
          group.subgroups.push(...item.subgroups);
        }
      });
    });
    
    groups.push(group);
  });
  
  return groups;
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log('Starting completely dynamic content discovery...');
    
    // Discover the actual directory structure
    const { folders, files } = await discoverDirectoryStructure();
    
    console.log('Discovered folders:', folders);
    console.log('Discovered files:', files);
    
    // Create groups from the discovered structure
    const groups = createGroupsFromStructure(folders, files);
    
    // Load actual content from discovered JSON files
    for (const group of groups) {
      for (const subgroup of group.subgroups) {
        // Find and load JSON files for this subgroup
        const relevantFiles = files.filter(f => 
          f.startsWith(`${group.name}/`) && 
          (f.includes(subgroup.name) || f.startsWith(`${group.name}/${subgroup.name}/`))
        );
        
        for (const filePath of relevantFiles) {
          const content = await loadJsonFile(`/content/${filePath}`);
          content.forEach(item => {
            if (item.subgroups && Array.isArray(item.subgroups)) {
              subgroup.subgroups = subgroup.subgroups || [];
              subgroup.subgroups.push(...item.subgroups);
            }
          });
        }
      }
    }
    
    console.log('Final groups structure:', groups);
    
    // If no groups were created, show a helpful message
    if (groups.length === 0) {
      return [{
        name: 'Content',
        subgroups: [{
          name: 'empty',
          viewName: 'No Content Found - Add folders to /public/content/',
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