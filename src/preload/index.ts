import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFolder: (path: string) => ipcRenderer.invoke('scan-folder', path),
  getTracks: () => ipcRenderer.invoke('get-tracks'),
  getAlbums: () => ipcRenderer.invoke('get-albums'),
  getAlbumTracks: (albumId: number) => ipcRenderer.invoke('get-album-tracks', albumId),
  clearLibrary: () => ipcRenderer.invoke('clear-library'),
  extractMissingArtwork: () => ipcRenderer.invoke('extract-missing-artwork'),
  getLibraryFolders: () => ipcRenderer.invoke('get-library-folders'),
  removeLibraryFolder: (path: string) => ipcRenderer.invoke('remove-library-folder', path),
  fetchOnlineLyrics: (trackId: number, artist: string, title: string) => ipcRenderer.invoke('fetch-online-lyrics', trackId, artist, title),
  saveLyrics: (trackId: number, text: string) => ipcRenderer.invoke('save-lyrics', trackId, text),
  onScanProgress: (callback: (progress: any) => void) => {
    ipcRenderer.on('scan-progress', (_event, progress) => callback(progress))
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
