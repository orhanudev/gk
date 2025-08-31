# Content Directory Structure

This directory contains the hierarchical content structure for the video streaming application.

## Adding Your Content

To add new content to the app, you can organize your JSON files in nested folders:

```
public/content/
├── kids/
│   ├── kids_populer.json (existing)
│   └── populer/
│       ├── afacanlar.json
│       ├── pepee.json
│       └── other_series.json
├── movies/
│   ├── action/
│   │   ├── superhero.json
│   │   └── thriller.json
│   └── comedy/
│       ├── family.json
│       └── romantic.json
├── music/
│   ├── pop/
│   │   ├── turkish.json
│   │   └── international.json
│   └── rock/
│       ├── classic.json
│       └── modern.json
└── tutorials/
    ├── programming/
    │   ├── react.json
    │   ├── javascript.json
    │   └── python.json
    └── design/
        ├── photoshop.json
        └── figma.json
```

## How It Works

1. **Main Categories**: Top-level folders become main groups (Kids, Movies, Music, etc.)
2. **Nested Structure**: Subfolders create nested navigation
3. **JSON Files**: Each JSON file contains video data for that specific category

## Adding New Files

1. **Create your folder structure** in `public/content/`
2. **Add your JSON files** following the format below
3. **Update the content loader** by adding your file paths to `src/utils/contentLoader.ts`:

```javascript
const staticFiles = [
  '/content/kids/kids_populer.json',
  '/content/kids/populer/afacanlar.json',     // Add your files here
  '/content/movies/action/superhero.json',
  '/content/music/pop/turkish.json',
  // ... add all your JSON file paths
];
```

4. **Restart the app** - Your content will appear in the navigation

## JSON File Format

Each JSON file should contain an array with group objects:

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

## Example: Kids/Populer Structure

If you want to move the existing content to a nested structure:

1. **Create folder**: `public/content/kids/populer/`
2. **Move content**: Split `kids_populer.json` into separate files like `afacanlar.json`
3. **Update paths**: Add the new file paths to the content loader
4. **Result**: Navigation will show: Kids → Populer → Afacanlar

## Tips

- Use descriptive folder and file names
- Keep related content together in the same folder
- The app supports unlimited nesting levels
- File names don't affect the display - use the `viewName` property for user-facing names
- Each JSON file can contain multiple groups and subgroups