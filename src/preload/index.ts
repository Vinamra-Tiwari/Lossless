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
