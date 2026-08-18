/// <reference types="vite/client" />

interface Window {
  api: {
    selectFolder: () => Promise<string | null>
    scanFolder: (path: string) => Promise<void>
    getTracks: () => Promise<any[]>
    getAlbums: () => Promise<any[]>
    onScanProgress: (callback: (progress: any) => void) => void
  }
}
