# LearnLens Clippy Notes - Chrome Extension

A Chrome browser extension that lets you save notes from any webpage directly to LearnLens!

## Features

- 📝 **Quick Note Capture**: Select text on any webpage and save it as a note
- 🏷️ **Subject Organization**: Organize notes by subject (CS 101, Data Structures, etc.)
- 🔖 **Tags**: Add custom tags to categorize your notes
- 🔍 **Search & Filter**: Quickly find notes using search and subject filters
- 📤 **Export**: Export all notes as JSON for backup or sharing
- 🖱️ **Context Menu**: Right-click on selected text to save instantly
- 💬 **Floating Save Button**: A Clippy button appears when you select text on any page

## Installation (Developer Mode)

Since this extension isn't on the Chrome Web Store, follow these steps to install it:

### Step 1: Prepare the Icons

The extension needs PNG icons. You can either:

**Option A**: Use the included SVG files and convert them to PNG:
```bash
cd frontend/extension/icons

# Rename SVGs (remove .svg extension if you want to use them as-is in development)
# Or convert using ImageMagick:
convert clippy-16.png.svg clippy-16.png
convert clippy-32.png.svg clippy-32.png
convert clippy-48.png.svg clippy-48.png
convert clippy-128.png.svg clippy-128.png
```

**Option B**: Create simple PNG icons manually or use any 16x16, 32x32, 48x48, and 128x128 PNG images renamed as:
- `clippy-16.png`
- `clippy-32.png`
- `clippy-48.png`
- `clippy-128.png`

**Option C (Quick Start)**: Just rename the SVG files to PNG (Chrome may accept them):
```bash
cd frontend/extension/icons
mv clippy-16.png.svg clippy-16.png
mv clippy-32.png.svg clippy-32.png
mv clippy-48.png.svg clippy-48.png
mv clippy-128.png.svg clippy-128.png
```

### Step 2: Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in the top right)
3. Click **"Load unpacked"**
4. Navigate to and select the `frontend/extension` folder
5. The extension should now appear with the Clippy icon!

## Usage

### Method 1: Popup Interface
1. Click the LearnLens Clippy icon in your browser toolbar
2. Select text on any webpage
3. Click "Get Selection" to capture the selected text
4. Choose a subject and add tags (optional)
5. Click "Save Note"

### Method 2: Floating Button
1. Select text on any webpage
2. A floating "Save Note" button appears near your selection
3. Click it to instantly save the note

### Method 3: Context Menu (Right-Click)
1. Select text on any webpage
2. Right-click and choose "Save to LearnLens Notes"
3. The note is saved instantly with "quick-save" tag

## Viewing Your Notes

1. Click the extension icon
2. Go to the "My Notes" tab
3. Use the search bar to find specific notes
4. Filter by subject using the dropdown
5. Click the ✕ button to delete individual notes

## Exporting Notes

1. Go to the "My Notes" tab
2. Click "Export All Notes"
3. A JSON file will be downloaded with all your notes

## Integration with LearnLens Web App

The extension stores notes in Chrome's local storage. To sync with the LearnLens web app:

### Method 1: Export/Import (Manual Sync)
1. **Export from Extension**: Go to "My Notes" tab → Click "Export All Notes"
2. **Import in Web App**: Go to the Notes page → Click "Import" → Select the JSON file

### Method 2: Copy to Web App localStorage (Automatic Sync)
Since both the extension and web app use the same note format, you can sync them:

1. Export notes from the extension as JSON
2. Open the LearnLens web app in the same browser
3. Open browser DevTools (F12) → Console tab
4. Run: `localStorage.setItem('learnlens-notes', JSON.stringify(YOUR_EXPORTED_NOTES.notes))`
5. Refresh the Notes page

### Note Format
Both the extension and web app use the same JSON format:
```json
{
  "id": 1234567890,
  "content": "Your note text",
  "subject": "CS 101",
  "tags": ["important", "exam"],
  "timestamp": "2025-03-01T12:00:00.000Z",
  "source": {
    "url": "https://example.com",
    "title": "Page Title"
  }
}
```

## Troubleshooting

### Extension not loading?
- Make sure all PNG icon files exist in the `icons` folder
- Check the Chrome console for errors (`chrome://extensions/` → Details → Inspect views)

### Can't capture text from some pages?
- The extension cannot run on `chrome://` pages or other browser internal pages
- Some websites may have Content Security Policy (CSP) that blocks extensions

### Notes not saving?
- Check if Chrome storage has space (limit is ~5MB for local storage)
- Try clearing some old notes

## File Structure

```
extension/
├── manifest.json        # Extension configuration
├── popup.html           # Popup UI HTML
├── popup.css            # Popup styles (Microsoft Fluent Design)
├── popup.js             # Popup functionality
├── background.js        # Service worker (context menu, storage)
├── content.js           # Content script (floating button, text capture)
├── content-styles.css   # Content script styles
├── icons/
│   ├── clippy-16.png
│   ├── clippy-32.png
│   ├── clippy-48.png
│   └── clippy-128.png
└── README.md            # This file
```

## Privacy

- All notes are stored **locally** in your browser
- No data is sent to any external servers
- You have full control over your data with export and clear functions

---

Made with 💙 by LearnLens Team
