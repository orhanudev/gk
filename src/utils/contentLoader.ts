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

async function scanDirectory(path: string): Promise<{folders: string[], files: string[]}> {
  const folders: string[] = [];
  const files: string[] = [];
  
  try {
    console.log(`🔍 Scanning directory: ${path}`);
    const response = await fetch(path);
    
    if (!response.ok) {
      console.log(`❌ Cannot access directory: ${path} - Status: ${response.status}`);
      return { folders, files };
    }
    
    const html = await response.text();
    console.log(`📄 Directory HTML length: ${html.length} characters`);
    console.log(`📄 First 200 chars of HTML:`, html.substring(0, 200));
    
    // Parse directory listing HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = doc.querySelectorAll('a[href]');
    console.log(`🔗 Found ${links.length} links in directory listing`);
    
    for (const link of links) {
      const href = link.getAttribute('href');
      console.log(`🔗 Processing link: ${href}`);
      if (href && href !== '../' && href !== './') {
        const cleanPath = href.replace(/^\/+|\/+$/g, '');
        
        if (href.endsWith('/')) {
          // This is a folder
          const folderName = cleanPath;
          if (folderName && !folders.includes(folderName)) {
            folders.push(folderName);
            console.log(`📁 Found folder: ${folderName}`);
          }
        } else if (href.endsWith('.json')) {
          // This is a JSON file
          if (cleanPath && !files.includes(cleanPath)) {
            files.push(cleanPath);
            console.log(`📄 Found JSON file: ${cleanPath}`);
          }
        }
      }
    }
    
    console.log(`✅ Scan complete for ${path}: ${folders.length} folders, ${files.length} files`);
  } catch (error) {
    console.log(`❌ Could not scan directory: ${path}`, error);
  }
  
  console.log(`📊 Final results for ${path}:`, { folders, files });
  return { folders, files };
}

async function scanRecursively(basePath: string, relativePath: string = ''): Promise<{folders: string[], files: string[]}> {
  const allFolders: string[] = [];
  const allFiles: string[] = [];
  
  const fullPath = relativePath ? `${basePath}${relativePath}/` : basePath;
  const { folders, files } = await scanDirectory(fullPath);
  
  // Add current level folders and files
  folders.forEach(folder => {
    const fullFolderPath = relativePath ? `${relativePath}/${folder}` : folder;
    allFolders.push(fullFolderPath);
  });
  
  files.forEach(file => {
    const fullFilePath = relativePath ? `${relativePath}/${file}` : file;
    allFiles.push(fullFilePath);
  });
  
  // Recursively scan subfolders
  for (const folder of folders) {
    const subPath = relativePath ? `${relativePath}/${folder}` : folder;
    const subResult = await scanRecursively(basePath, subPath);
    allFolders.push(...subResult.folders);
    allFiles.push(...subResult.files);
  }
  
  return { folders: allFolders, files: allFiles };
}

function buildGroupStructure(folders: string[], files: string[]): Group[] {
  const groups: Group[] = [];
  
  // Get all top-level categories
  const topLevelCategories = new Set<string>();
  
  folders.forEach(folderPath => {
    const parts = folderPath.split('/');
    if (parts.length > 0 && parts[0]) {
      topLevelCategories.add(parts[0]);
    }
  });
  
  files.forEach(filePath => {
    const parts = filePath.split('/');
    if (parts.length > 0 && parts[0]) {
      topLevelCategories.add(parts[0]);
    }
  });
  
  // Create groups for each top-level category
  topLevelCategories.forEach(categoryName => {
    const group: Group = {
      name: categoryName,
      subgroups: []
    };
    
    // Build subgroup structure for this category
    const categoryFolders = folders.filter(f => f.startsWith(`${categoryName}/`));
    const categoryFiles = files.filter(f => f.startsWith(`${categoryName}/`));
    
    // Create subgroups from folder structure
    const subgroupMap = new Map<string, Subgroup>();
    
    // Process folders
    categoryFolders.forEach(folderPath => {
      const relativePath = folderPath.substring(categoryName.length + 1);
      const pathParts = relativePath.split('/');
      
      let currentPath = '';
      let currentSubgroups = group.subgroups;
      
      pathParts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const fullPath = `${categoryName}/${currentPath}`;
        
        let existingSubgroup = currentSubgroups.find(sg => sg.name === part);
        
        if (!existingSubgroup) {
          existingSubgroup = {
            name: part,
            viewName: part,
            channelId: '',
            videos: [],
            subgroups: []
          };
          currentSubgroups.push(existingSubgroup);
        }
        
        currentSubgroups = existingSubgroup.subgroups!;
      });
    });
    
    // Process files
    categoryFiles.forEach(filePath => {
      const relativePath = filePath.substring(categoryName.length + 1);
      const pathParts = relativePath.split('/');
      const fileName = pathParts.pop()?.replace('.json', '') || 'content';
      
      if (pathParts.length === 0) {
        // File is directly in the category folder
        let existingSubgroup = group.subgroups.find(sg => sg.name === fileName);
        if (!existingSubgroup) {
          existingSubgroup = {
            name: fileName,
            viewName: fileName,
            channelId: '',
            videos: [],
            subgroups: []
          };
          group.subgroups.push(existingSubgroup);
        }
      } else {
        // File is in a subfolder
        let currentSubgroups = group.subgroups;
        
        pathParts.forEach(part => {
          let existingSubgroup = currentSubgroups.find(sg => sg.name === part);
          if (!existingSubgroup) {
            existingSubgroup = {
              name: part,
              viewName: part,
              channelId: '',
              videos: [],
              subgroups: []
            };
            currentSubgroups.push(existingSubgroup);
          }
          currentSubgroups = existingSubgroup.subgroups!;
        });
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
    console.log('🚀 Starting completely dynamic content discovery...');
    
    // Scan the entire content directory recursively
    const { folders, files } = await scanRecursively('/content/');
    
    console.log('📁 Discovered folders:', folders);
    console.log('📄 Discovered files:', files);
    
    if (folders.length === 0 && files.length === 0) {
      console.log('❌ No content found in /content/ directory');
      return [];
    }
    
    // Build group structure from discovered content
    console.log('🏗️ Building group structure...');
    const groups = buildGroupStructure(folders, files);
    console.log('🏗️ Built groups:', groups.map(g => ({ name: g.name, subgroupCount: g.subgroups.length })));
    
    // Load actual content from discovered JSON files
    console.log('📥 Loading content from JSON files...');
    for (const group of groups) {
      console.log(`📥 Loading content for group: ${group.name}`);
      for (const subgroup of group.subgroups) {
        console.log(`📥 Loading content for subgroup: ${subgroup.name}`);
        await loadContentForSubgroup(subgroup, group.name, files);
      }
    }
    
    console.log('✅ Final groups structure:', groups);
    return groups;
    
  } catch (error) {
    console.error('❌ Error in dynamic content loading:', error);
    return [];
  }
}