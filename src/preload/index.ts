import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder') as Promise<string[] | null>,
  scanFolder: (path: string | string[]) => ipcRenderer.invoke('scan-folder', path),
  getTracks: () => ipcRenderer.invoke('get-tracks'),
  getAlbums: () => ipcRenderer.invoke('get-albums'),
  getAlbumTracks: (albumId: number) => ipcRenderer.invoke('get-album-tracks', albumId),
  clearLibrary: () => ipcRenderer.invoke('clear-library'),
  extractMissingArtwork: () => ipcRenderer.invoke('extract-missing-artwork'),
  getLibraryFolders: () => ipcRenderer.invoke('get-library-folders'),
  removeLibraryFolder: (path: string) => ipcRenderer.invoke('remove-library-folder', path),
  fetchOnlineLyrics: (trackId: number, artist: string, title: string) =>
    ipcRenderer.invoke('fetch-online-lyrics', trackId, artist, title),
  saveLyrics: (trackId: number, text: string) => ipcRenderer.invoke('save-lyrics', trackId, text),
  createPlaylist: (name: string) => ipcRenderer.invoke('create-playlist', name),
  renamePlaylist: (playlistId: number, name: string) => ipcRenderer.invoke('rename-playlist', playlistId, name),
  deletePlaylist: (playlistId: number) => ipcRenderer.invoke('delete-playlist', playlistId),
  getPlaylists: () => ipcRenderer.invoke('get-playlists'),
  addToPlaylist: (playlistId: number, trackId: number) => ipcRenderer.invoke('add-to-playlist', playlistId, trackId),
  removeFromPlaylist: (playlistId: number, trackId: number) =>
    ipcRenderer.invoke('remove-from-playlist', playlistId, trackId),
  getPlaylistTracks: (playlistId: number) => ipcRenderer.invoke('get-playlist-tracks', playlistId),
  onScanProgress: (callback: (progress: string) => void) => {
    const listener = (_event: unknown, progress: string) => callback(progress)
    ipcRenderer.on('scan-progress', listener)
    return () => ipcRenderer.removeListener('scan-progress', listener)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore
  window.electron = electronAPI
  // @ts-ignore
  window.api = api
}
