# Content Directory Structure

This directory contains the hierarchical content structure for the video streaming application.

## Adding Your Content

To add new content to the app, simply place JSON files in this directory structure:

```
public/content/
├── kids/
│   └── kids_populer.json (existing)
├── your-category/
│   ├── your-content1.json
│   └── your-content2.json
├── movies/
│   ├── action.json
│   └── comedy.json
└── music/
    ├── pop.json
    └── rock.json
```

## JSON File Format

Each JSON file should contain an array with group objects. Here's the structure:

```json
[
  {
    "name": "Group Name",
    "subgroups": [
      {
        "name": "internal-name",
        "viewName": "Display Name for Users",
        "channelId": "optional-youtube-channel-id",
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
    ]
  }
]
```

## How to Add Your Content

1. **Create a folder** for your content category (e.g., `movies`, `music`, `tutorials`)
2. **Add JSON files** following the format above
3. **Restart the app** - The content will be automatically loaded
4. **No code changes needed** - Just add your JSON files and they'll appear in the navigation

## Nested Categories

You can create nested categories by adding `subgroups` within subgroups:

```json
{
  "name": "internal-name",
  "viewName": "Parent Category",
  "channelId": "",
  "videos": [],
  "subgroups": [
    {
      "name": "child-category",
      "viewName": "Child Category",
      "channelId": "",
      "videos": [...],
      "subgroups": []
    }
  ]
}
```

## Tips

- Use descriptive folder names for better organization
- Keep video data up to date with proper thumbnails and metadata
- Use meaningful `viewName` values for user-friendly navigation
- The app supports unlimited nesting levels
- File names don't matter - only the content structure does