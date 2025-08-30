import fs from 'fs';
import path from 'path';

// Simple file collection and display since we can't create actual zip files
// in WebContainer without external dependencies
function collectProjectFiles(dir = '.', prefix = '') {
  const files = [];
  const excludeDirs = ['node_modules', '.git', 'dist', '.bolt'];
  const excludeFiles = ['create-zip.js', 'project.tar.gz', 'package-lock.json'];
  
  try {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const relativePath = path.join(prefix, item);
      
      if (excludeFiles.includes(item)) continue;
      if (excludeDirs.includes(item)) continue;
      
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        files.push(...collectProjectFiles(fullPath, relativePath));
      } else {
        files.push({
          path: relativePath,
          size: stats.size,
          modified: stats.mtime
        });
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

try {
  console.log('📁 Collecting project files...');
  
  const files = collectProjectFiles();
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  
  console.log('\n✅ Project files collected successfully!');
  console.log(`📊 Total files: ${files.length}`);
  console.log(`💾 Total size: ${(totalSize / 1024).toFixed(2)} KB`);
  
  console.log('\n📋 Project structure:');
  files.forEach(file => {
    console.log(`  ${file.path} (${(file.size / 1024).toFixed(2)} KB)`);
  });
  
  console.log('\n💡 To download your project:');
  console.log('1. Use the file explorer on the left');
  console.log('2. Select all files you want to download');
  console.log('3. Right-click and choose "Download"');
  console.log('4. Or download individual files one by one');
  
  console.log('\n🚀 Your app is also deployed at:');
  console.log('   https://youtube-video-stream-cnbr.bolt.host');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}