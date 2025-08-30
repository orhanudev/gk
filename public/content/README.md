# Content Directory Structure

This directory contains the hierarchical content structure for the video streaming application.

## Structure

```
content/
├── group1/
│   ├── subgroup1.json
│   ├── subgroup2.json
│   └── nested-group/
│       ├── nested-subgroup1.json
│       └── nested-subgroup2.json
├── group2/
│   ├── subgroup1.json
│   └── subgroup2.json
└── index.json (optional)
```

## File Format

Each JSON file should contain a subgroup object with the following structure:

```json
{
  "name": "subgroup-internal-name",
  "viewName": "Display Name for Users",
  "channelId": "optional-channel-id",
  "videos": [
    {
      "id": {
        "videoId": "youtube-video-id"
      },
      "snippet": {
        "title": "Video Title",
        "channelTitle": "Channel Name",
        "duration": "PT5M30S",
        "uploadDate": "2023-01-01T00:00:00Z",
        "thumbnails": {
          "high": {
            "url": "https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg"
          }
        }
      }
    }
  ],
  "subgroups": []
}
```

## Adding Your Content

1. Create folders for each main group
2. Add JSON files for each subgroup within those folders
3. Use nested folders for hierarchical organization
4. The application will automatically discover and load the structure

## Notes

- Folder names become group names in the navigation
- JSON file names become subgroup identifiers
- Use `viewName` property for user-friendly display names
- The system supports unlimited nesting levels