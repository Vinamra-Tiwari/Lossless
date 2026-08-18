import React, { useState, useEffect } from 'react'
import { FolderPlus, RefreshCw, Play, Trash2 } from 'lucide-react'
import { usePlayer } from './store/usePlayer'
import { PlayerBar } from './components/PlayerBar'
import { SongsView } from './components/SongsView'
import { AlbumsView } from './components/AlbumsView'

export type ViewType = 'songs' | 'albums'

function App(): JSX.Element {
  const [tracks, setTracks] = useState<any[]>([])
  const [scanProgress, setScanProgress] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('songs')
  const player = usePlayer()

  const loadTracks = async () => {
    const data = await window.api.getTracks()
    setTracks(data)
  }

  useEffect(() => {
    loadTracks()

    window.api.onScanProgress((progress: string) => {
      setScanProgress(progress)
      if (progress.includes('Scan complete')) {
        setIsScanning(false)
        loadTracks()
      }
    })
  }, [])

  const handleAddFolder = async () => {
    const folder = await window.api.selectFolder()
    if (folder) {
      setIsScanning(true)
      setScanProgress('Starting scan...')
      await window.api.scanFolder(folder)
    }
  }

  const handleClearLibrary = async () => {
    if (confirm("Are you sure you want to completely clear your library?")) {
      await window.api.clearLibrary()
      setTracks([])
      window.dispatchEvent(new CustomEvent('library-cleared')) // Simple event to trigger reload
      loadTracks()
    }
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Lossless</h2>
        <nav>
          <ul>
            <li 
              style={{ color: currentView === 'songs' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setCurrentView('songs')}
            >
              Songs
            </li>
            <li 
              style={{ color: currentView === 'albums' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setCurrentView('albums')}
            >
              Albums
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          {scanProgress && <span style={{ marginRight: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{scanProgress}</span>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleClearLibrary} disabled={isScanning} style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)' }}>
              <Trash2 size={16} />
              Clear Library
            </button>
            <button onClick={handleAddFolder} disabled={isScanning} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isScanning ? <RefreshCw size={16} className="spin" /> : <FolderPlus size={16} />}
              Add Folder
            </button>
          </div>
        </header>
        <div className="content-area">
          <h1 style={{ textTransform: 'capitalize' }}>{currentView}</h1>
          {currentView === 'songs' ? (
            <SongsView tracks={tracks} player={player} />
          ) : (
            <AlbumsView />
          )}
        </div>
      </main>
      <footer className="player-bar">
        <PlayerBar player={player} />
      </footer>
    </div>
  )
}

export default App
