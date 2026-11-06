# Lossless Music Player

A blazing-fast, beautiful, offline-first local music player built for audiophiles. Lossless Music Player is designed to manage massive local libraries (FLAC, MP3, M4A) with stunning aesthetics and premium web integrations.

## Features

### 🎧 High-Fidelity Playback
- **Lossless Protocol**: Streams audio data directly from your local filesystem using a custom secure `lossless://` protocol, bypassing browser memory limitations.
- **Audiophile Metadata**: Instantly displays codec information, bit-depth, and sample rate (e.g., `FLAC • 24-bit • 48 kHz`).

### 🎨 Stunning Visuals
- **Spotify-Inspired Aesthetics**: A gorgeous dark mode UI built with custom CSS, featuring glassmorphism, subtle micro-animations, and responsive grid layouts.
- **iTunes High-Res Artwork Fetching**: If your local files are missing embedded album art, the app runs a background service to instantly fetch stunning `600x600` album covers from the Apple iTunes Store Search API.

### 🎤 Intelligent Lyrics System
- **Embedded & Web Lyrics**: Automatically extracts embedded lyrics from your audio files. If none are found, use the **Fetch from Web** button to automatically pull lyrics from an open API.
- **Premium Editor**: Open the lyrics pane and click **Edit** to manually paste and save custom lyrics perfectly to your database using the built-in, code-editor-style text area.

### 🔍 Powerful Library Management
- **Instant Scan**: Built with `better-sqlite3` and `music-metadata`, it can scan thousands of tracks in seconds.
- **Global Search Engine**: Use the top search bar for real-time fuzzy matching across your entire library of songs, albums, and artists.
- **Custom Playlists**: Create unlimited custom playlists and quickly append songs to them using a sleek, context-aware dropdown menu directly from your library views.

## Technology Stack
- **Framework:** Electron, React, TypeScript, Vite
- **Database:** SQLite (`better-sqlite3`)
- **Metadata:** `music-metadata`
- **Styling:** Custom Vanilla CSS

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

Lossless is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
