import { videoDatabase } from './database';

export async function seedKidsContent() {
  try {
    // Ensure database is initialized
    await videoDatabase.initialize();
    
    // Load the kids content from the JSON file
    const response = await fetch('/content/kids/kids_populer.json');
    if (!response.ok) {
      throw new Error(`Failed to load kids content: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Create Kids group
    const kidsGroupId = await videoDatabase.addGroup('kids', 'Kids');
    
    if (Array.isArray(data)) {
      for (const groupData of data) {
        if (groupData.name === 'Popüler' && groupData.subgroups && Array.isArray(groupData.subgroups)) {
          // Create Popüler subgroup
          const populerSubgroupId = await videoDatabase.addSubgroup(
            'populer', 
            'Popüler', 
            kidsGroupId
          );
          
          // Process each subgroup under Popüler
          for (const subgroup of groupData.subgroups) {
            if (subgroup.name && subgroup.viewName) {
              // Create the subgroup (e.g., "Afacanların Hikâyesi")
              const subgroupId = await videoDatabase.addSubgroup(
                subgroup.name,
                subgroup.viewName,
                kidsGroupId,
                populerSubgroupId,
                subgroup.channelId || null
              );
              
              // Add all videos to this subgroup
              if (subgroup.videos && Array.isArray(subgroup.videos)) {
                for (const video of subgroup.videos) {
                  if (video.id && video.id.videoId && video.snippet) {
                    await videoDatabase.addVideo(
                      video.id.videoId,
                      video.snippet.title,
                      video.snippet.channelTitle,
                      video.snippet.duration,
                      video.snippet.uploadDate,
                      video.snippet.thumbnails.high.url,
                      subgroupId
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
    
    console.log('Kids content seeded successfully');
  } catch (error) {
    console.error('Error seeding kids content:', error);
    throw error;
  }
}