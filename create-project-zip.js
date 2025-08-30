import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

async function createProjectZip() {
  console.log('📦 Creating project zip file...');
  
  const zip = new JSZip();
  const excludeDirs = ['node_modules', '.git', 'dist', '.bolt'];
  const excludeFiles = ['create-project-zip.js', 'create-zip.js', 'project.zip', 'project.tar.gz', 'package-lock.json'];
  
  function addFilesToZip(dir = '.', zipFolder = null) {
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = fs.statSync(fullPath);
        
        if (excludeFiles.includes(item)) continue;
        if (excludeDirs.includes(item)) continue;
        
        if (stats.isDirectory()) {
          const newZipFolder = zipFolder ? zipFolder.folder(item) : zip.folder(item);
          addFilesToZip(fullPath, newZipFolder);
        } else {
          try {
            const content = fs.readFileSync(fullPath);
            if (zipFolder) {
              zipFolder.file(item, content);
            } else {
              zip.file(item, content);
            }
            console.log(`✅ Added: ${fullPath}`);
          } catch (error) {
            console.warn(`⚠️  Skipped: ${fullPath} (${error.message})`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${dir}:`, error.message);
    }
  }
  
  // Add all project files to zip
  addFilesToZip();
  
  try {
    console.log('🔄 Generating zip file...');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    // Write zip file
    fs.writeFileSync('project.zip', zipBuffer);
    
    const stats = fs.statSync('project.zip');
    console.log(`\n🎉 Success! Created project.zip`);
    console.log(`📊 File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📁 Location: /home/project/project.zip`);
    console.log('\n💡 You can now download project.zip from the file explorer!');
    
  } catch (error) {
    console.error('❌ Error creating zip file:', error.message);
  }
}

createProjectZip().catch(console.error);