import { Group, Subgroup } from "../types";

interface ManifestEntry {
  path: string;
  type: "file" | "folder";
  name?: string;
}

async function loadJsonFile(path: string): Promise<any[]> {
  try {
    console.log(`Loading: ${path}`);
    const response = await fetch(path);

    if (!response.ok) {
      console.log(`File not found: ${path} (status: ${response.status})`);
      return [];
    }

    const text = await response.text();

    // Check if it's HTML (directory listing) instead of JSON
    if (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")
    ) {
      console.log(`Got HTML instead of JSON for: ${path}`);
      return [];
    }

    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data)) {
        console.warn(`Invalid data format in ${path} - not an array`);
        return [];
      }

      console.log(`✅ Successfully loaded ${path} with ${data.length} items`);
      return data;
    } catch (parseError) {
      console.error(`❌ JSON parse error for ${path}:`, parseError);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error loading ${path}:`, error);
    return [];
  }
}

async function testFileExists(path: string): Promise<boolean> {
  try {
    const response = await fetch(path);
    if (!response.ok) return false;

    const text = await response.text();
    // Make sure it's not HTML
    if (
      text.trim().startsWith("<!DOCTYPE") ||
      text.trim().startsWith("<html")
    ) {
      return false;
    }

    // Try to parse as JSON to verify it's valid
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  } catch {
    return false;
  }
}

async function loadManifest(): Promise<ManifestEntry[]> {
  try {
    console.log("📋 Loading content manifest...");
    const response = await fetch("/content/manifest.json");

    if (!response.ok) {
      console.log("❌ No manifest.json found");
      return [];
    }

    const manifest = await response.json();

    // Handle both simple array format and detailed object format
    const entries: ManifestEntry[] = [];

    if (Array.isArray(manifest)) {
      // Simple format: ["path1", "path2", ...]
      manifest.forEach((item) => {
        if (typeof item === "string") {
          entries.push({
            path: item,
            type: item.endsWith(".json") ? "file" : "folder",
          });
        } else if (item && typeof item === "object") {
          // Object format: {path: "...", type: "...", name: "..."}
          entries.push({
            path: item.path,
            type:
              item.type || (item.path.endsWith(".json") ? "file" : "folder"),
            name: item.name,
          });
        }
      });
    } else {
      console.error("❌ Invalid manifest format - should be array");
      return [];
    }

    console.log(`✅ Loaded manifest with ${entries.length} entries`);
    return entries;
  } catch (error) {
    console.error("❌ Error loading manifest:", error);
    return [];
  }
}

function normalizeManifestEntries(entries: ManifestEntry[]): ManifestEntry[] {
  return entries.map((entry) => ({
    ...entry,
    path: entry.path.startsWith("/") ? entry.path : `/content/${entry.path}`,
  }));
}

function buildGroupStructureFromManifest(entries: ManifestEntry[]): Group[] {
  console.log("🏗️ Building group structure from manifest entries:", entries);

  const groups: Group[] = [];
  const groupMap = new Map<string, Group>();

  // Process each manifest entry
  entries.forEach((entry) => {
    // Remove /content/ prefix if present for processing
    const cleanPath = entry.path.replace(/^\/content\//, "");
    const pathParts = cleanPath.split("/").filter((part) => part.length > 0);

    if (pathParts.length === 0) {
      console.warn(`Invalid entry path: ${entry.path}`);
      return;
    }

    const groupName = pathParts[0];

    console.log(
      `Processing: type="${entry.type}", path="${entry.path}", group="${groupName}"`
    );

    // Get or create group
    let group = groupMap.get(groupName);
    if (!group) {
      group = {
        name: groupName,
        subgroups: [],
      };
      groupMap.set(groupName, group);
      groups.push(group);
      console.log(`Created group: ${groupName}`);
    }

    // Navigate/create the path hierarchy using full path as unique identifier
    let currentSubgroups = group.subgroups;
    let currentPath = groupName;

    // Process ALL path parts as folders, including file containers
    const endIndex =
      entry.type === "file" ? pathParts.length : pathParts.length;

    for (let i = 1; i < endIndex; i++) {
      const folderName = pathParts[i];
      let displayName = folderName;

      // If this is a JSON file, remove .json extension for display
      if (entry.type === "file" && i === pathParts.length - 1) {
        displayName = folderName.replace(".json", "");
      }

      currentPath += `/${folderName}`;

      // Use full path as unique identifier
      let existingSubgroup = currentSubgroups.find(
        (sg) => sg._fullPath === currentPath
      );
      if (!existingSubgroup) {
        existingSubgroup = {
          name: displayName,
          viewName:
            entry.name && i === pathParts.length - 1 ? entry.name : displayName,
          channelId: "",
          videos: [],
          subgroups: [],
          _fullPath: currentPath, // Track full path for uniqueness
          _isFileContainer: entry.type === "file" && i === pathParts.length - 1, // Mark if this will contain JSON content
        };

        // If this is a file container, add the file path for loading
        if (entry.type === "file" && i === pathParts.length - 1) {
          (existingSubgroup as any)._filePath = entry.path;
        }

        currentSubgroups.push(existingSubgroup);
        console.log(
          `Created folder level: ${currentPath} (${
            entry.type === "file" && i === pathParts.length - 1
              ? "file container"
              : "folder"
          })`
        );
      } else {
        // If it already exists and this is a file, update the file path
        if (entry.type === "file" && i === pathParts.length - 1) {
          (existingSubgroup as any)._filePath = entry.path;
          (existingSubgroup as any)._isFileContainer = true;
        }
        if (entry.name && i === pathParts.length - 1) {
          existingSubgroup.viewName = entry.name;
        }
      }

      currentSubgroups = existingSubgroup.subgroups!;
    }
  });

  // Clean up the temporary _fullPath and _isFileContainer properties
  const cleanupTempProperties = (subgroups: Subgroup[]) => {
    subgroups.forEach((sg) => {
      delete (sg as any)._fullPath;
      delete (sg as any)._isFileContainer;
      if (sg.subgroups) {
        cleanupTempProperties(sg.subgroups);
      }
    });
  };

  groups.forEach((group) => cleanupTempProperties(group.subgroups));

  console.log(`✅ Built ${groups.length} groups with hierarchy`);
  return groups;
}

async function loadContentForSubgroup(subgroup: Subgroup): Promise<void> {
  const filePath = (subgroup as any)._filePath;
  if (!filePath) {
    // No file path means this is an empty folder or structure-only subgroup
    console.log(
      `📂 Subgroup "${subgroup.name}" has no associated file (empty folder or structure-only)`
    );
    return;
  }

  console.log(
    `📥 Loading content for subgroup "${subgroup.name}" from ${filePath}`
  );

  const content = await loadJsonFile(filePath);

  if (content.length === 0) {
    console.log(`📭 No content loaded from ${filePath}`);
    delete (subgroup as any)._filePath;
    return;
  }

  // Clear existing content since we're rebuilding from JSON structure
  subgroup.subgroups = [];
  subgroup.videos = [];

  content.forEach((item) => {
    // Check if this is a top-level group with a name and subgroups
    if (item.name && item.subgroups && Array.isArray(item.subgroups)) {
      // Use the item's name as the subgroup name, not the filename
      subgroup.name = item.name;
      subgroup.viewName = item.viewName || item.name;
      if (item.channelId) subgroup.channelId = item.channelId;

      // Process each subgroup from the JSON structure
      item.subgroups.forEach((sub: any) => {
        const newSubgroup: Subgroup = {
          name: sub.name,
          viewName: sub.viewName || sub.name,
          channelId: sub.channelId || "",
          videos: sub.videos || [],
          subgroups: sub.subgroups || [],
        };

        // Recursively process nested subgroups
        if (sub.subgroups && Array.isArray(sub.subgroups)) {
          processNestedSubgroups(newSubgroup, sub.subgroups);
        }

        subgroup.subgroups!.push(newSubgroup);
      });
    } else if (item.videos && Array.isArray(item.videos)) {
      // Direct videos in this item
      subgroup.videos.push(...item.videos);
    } else if (item.subgroups && Array.isArray(item.subgroups)) {
      // Direct subgroups in this item
      item.subgroups.forEach((sub: any) => {
        subgroup.subgroups!.push({
          name: sub.name,
          viewName: sub.viewName || sub.name,
          channelId: sub.channelId || "",
          videos: sub.videos || [],
          subgroups: sub.subgroups || [],
        });
      });
    } else if (Array.isArray(item)) {
      // Item itself is an array of videos
      subgroup.videos.push(...item);
    } else if (item.id || item.title || item.url) {
      // Item looks like a single video object
      subgroup.videos.push(item);
    }

    // Update subgroup metadata if present at root level
    if (item.viewName && !item.subgroups) subgroup.viewName = item.viewName;
    if (item.channelId && !item.subgroups) subgroup.channelId = item.channelId;
  });

  // Clean up the temporary file path property
  delete (subgroup as any)._filePath;

  console.log(
    `✅ Loaded content for "${subgroup.viewName || subgroup.name}": ${
      subgroup.videos?.length || 0
    } videos, ${subgroup.subgroups?.length || 0} subgroups`
  );
}

function processNestedSubgroups(
  parentSubgroup: Subgroup,
  nestedSubgroups: any[]
): void {
  nestedSubgroups.forEach((nested) => {
    const nestedSubgroup: Subgroup = {
      name: nested.name,
      viewName: nested.viewName || nested.name,
      channelId: nested.channelId || "",
      videos: nested.videos || [],
      subgroups: nested.subgroups || [],
    };

    // Recursively process deeper nesting
    if (nested.subgroups && Array.isArray(nested.subgroups)) {
      processNestedSubgroups(nestedSubgroup, nested.subgroups);
    }

    parentSubgroup.subgroups!.push(nestedSubgroup);
  });
}

async function loadContentRecursively(subgroups: Subgroup[]): Promise<void> {
  for (const subgroup of subgroups) {
    await loadContentForSubgroup(subgroup);

    // Recursively load content for nested subgroups
    if (subgroup.subgroups && subgroup.subgroups.length > 0) {
      await loadContentRecursively(subgroup.subgroups);
    }
  }
}

export async function loadAllContent(): Promise<Group[]> {
  try {
    console.log("🚀 Starting manifest-based content loading...");

    // Load the manifest file
    const manifestEntries = await loadManifest();

    if (manifestEntries.length === 0) {
      console.log("❌ No entries found in manifest");
      return [];
    }

    console.log("📋 Raw manifest entries:", manifestEntries);

    // Normalize paths in manifest entries
    const normalizedEntries = normalizeManifestEntries(manifestEntries);
    console.log("📋 Normalized manifest entries:", normalizedEntries);

    // Build group structure from manifest entries
    const groups = buildGroupStructureFromManifest(normalizedEntries);

    if (groups.length === 0) {
      console.log("❌ No groups could be built from manifest entries");
      return [];
    }

    console.log(
      "🏗️ Built initial group structure:",
      groups.map((g) => ({
        name: g.name,
        subgroups: g.subgroups.length,
      }))
    );

    // Load actual content from the files
    for (const group of groups) {
      console.log(`📥 Loading content for group: ${group.name}`);
      await loadContentRecursively(group.subgroups);
    }

    console.log("✅ Content loading complete. Final structure:");
    groups.forEach((group) => {
      console.log(`Group: ${group.name}`);
      const logSubgroup = (sg: Subgroup, indent = "  ") => {
        const videosCount = sg.videos?.length || 0;
        const subgroupsCount = sg.subgroups?.length || 0;
        const isEmpty = videosCount === 0 && subgroupsCount === 0;
        console.log(
          `${indent}${
            sg.viewName || sg.name
          } (${videosCount} videos, ${subgroupsCount} subgroups)${
            isEmpty ? " [EMPTY]" : ""
          }`
        );
        sg.subgroups?.forEach((sub) => logSubgroup(sub, indent + "  "));
      };
      group.subgroups.forEach((sg) => logSubgroup(sg));
    });

    return groups;
  } catch (error) {
    console.error("❌ Error in content loading:", error);
    return [];
  }
}
