/// <reference types="vite/client" />

interface Window {
  api: {
    selectFolder: () => Promise<string[] | null>
    scanFolder: (path: string | string[]) => Promise<void>
    getTracks: () => Promise<any[]>
    getAlbums: () => Promise<any[]>
    getAlbumTracks: (albumId: number) => Promise<any[]>
    clearLibrary: () => Promise<void>
    extractMissingArtwork: () => Promise<void>
    getLibraryFolders: () => Promise<any[]>
    removeLibraryFolder: (path: string) => Promise<void>
    fetchOnlineLyrics: (trackId: number, artist: string, title: string) => Promise<string | null>
    saveLyrics: (trackId: number, text: string) => Promise<void>
    getPersonalNote: (kind: 'track' | 'album', id: number) => Promise<string | null>
    savePersonalNote: (kind: 'track' | 'album', id: number, note: string) => Promise<void>
    getOnlineInsights: (kind: 'artist' | 'album', title: string, artist?: string) => Promise<any>
    getSuggestedAlbums: (seedArtist?: string) => Promise<any>
    getSpotifyStatus: () => Promise<{ configured: boolean; connected: boolean; clientId: string }>
    setSpotifyClientId: (clientId: string) => Promise<{ configured: boolean; connected: boolean; clientId: string }>
    connectSpotify: () => Promise<{ configured: boolean; connected: boolean; clientId: string }>
    createPlaylist: (name: string) => Promise<number>
    renamePlaylist: (playlistId: number, name: string) => Promise<void>
    deletePlaylist: (playlistId: number) => Promise<void>
    getPlaylists: () => Promise<any[]>
    addToPlaylist: (playlistId: number, trackId: number) => Promise<void>
    removeFromPlaylist: (playlistId: number, trackId: number) => Promise<void>
    getPlaylistTracks: (playlistId: number) => Promise<any[]>
    onScanProgress: (callback: (progress: string) => void) => (() => void) | void
  }
}
