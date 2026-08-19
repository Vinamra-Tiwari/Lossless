import React, { useState, useEffect } from 'react'
import { FolderPlus, RefreshCw, Play, Trash2 } from 'lucide-react'
import { usePlayer } from './store/usePlayer'
import { PlayerBar } from './components/PlayerBar'
import { SongsView } from './components/SongsView'
import { AlbumsView } from './components/AlbumsView'
import { AlbumDetailView } from './components/AlbumDetailView'
import { PlaylistDetailView } from './components/PlaylistDetailView'
import { SettingsView } from './components/SettingsView'
import { LyricsPane } from './components/LyricsPane'

export type ViewType = 'songs' | 'albums' | 'album-detail' | 'playlist-detail' | 'settings'

function App(): JSX.Element {
  const [tracks, setTracks] = useState<any[]>([])
  const [scanProgress, setScanProgress] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
  const [currentView, setCurrentView] = useState<ViewType>('songs')
  const [activeAlbum, setActiveAlbum] = useState<any>(null)
  const [activePlaylist, setActivePlaylist] = useState<any>(null)
  const [isLyricsOpen, setIsLyricsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [playlists, setPlaylists] = useState<any[]>([])
  const player = usePlayer()

  const loadTracks = async () => {
    const data = await window.api.getTracks()
    setTracks(data)
  }

  const loadPlaylists = async () => {
    const data = await window.api.getPlaylists()
    setPlaylists(data)
  }

  useEffect(() => {
    loadTracks()
    loadPlaylists()

    window.api.onScanProgress((progress: string) => {
      setScanProgress(progress)
      if (progress.includes('Scan complete')) {
        setIsScanning(false)
        loadTracks()
        // Run background artwork extraction
        window.api.extractMissingArtwork()
      }
      if (progress.includes('Artwork extraction complete')) {
        window.dispatchEvent(new Event('artwork-complete'))
      }
    })

    const handlePlaylistUpdate = () => loadPlaylists()
    window.addEventListener('playlists-updated', handlePlaylistUpdate)
    return () => window.removeEventListener('playlists-updated', handlePlaylistUpdate)
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

  const handleCreatePlaylist = async () => {
    const name = prompt("Enter playlist name:")
    if (name && name.trim()) {
      await window.api.createPlaylist(name.trim())
      loadPlaylists()
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
              style={{ color: currentView === 'albums' || currentView === 'album-detail' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={() => setCurrentView('albums')}
            >
              Albums
            </li>
            <li 
              style={{ color: currentView === 'settings' ? 'var(--text-primary)' : 'var(--text-secondary)', cursor: 'pointer', marginTop: '32px' }}
              onClick={() => setCurrentView('settings')}
            >
              Settings
            </li>
          </ul>
        </nav>

        <div style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>Playlists</h3>
            <button onClick={handleCreatePlaylist} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }} title="Create Playlist">
              <FolderPlus size={14} />
            </button>
          </div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {playlists.map(pl => (
              <li 
                key={pl.id}
                style={{ color: currentView === 'playlist-detail' && activePlaylist?.id === pl.id ? 'var(--accent-color)' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onClick={() => {
                  setActivePlaylist(pl)
                  setCurrentView('playlist-detail')
                }}
              >
                {pl.name}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, marginRight: '24px' }}>
            {currentView !== 'settings' && currentView !== 'album-detail' && (
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '300px',
                  padding: '10px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  fontSize: '14px',
                }}
              />
            )}
          </div>
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
        <div className="content-area" style={{ position: 'relative' }}>
          {currentView !== 'album-detail' && currentView !== 'playlist-detail' && <h1 style={{ textTransform: 'capitalize' }}>{currentView}</h1>}
          {currentView === 'songs' ? (
            <SongsView tracks={tracks} player={player} searchQuery={searchQuery} playlists={playlists} />
          ) : currentView === 'albums' ? (
            <AlbumsView onAlbumClick={(album) => {
              setActiveAlbum(album)
              setCurrentView('album-detail')
            }} searchQuery={searchQuery} />
          ) : currentView === 'settings' ? (
            <SettingsView />
          ) : currentView === 'playlist-detail' ? (
            activePlaylist && <PlaylistDetailView playlist={activePlaylist} player={player} onBack={() => setCurrentView('songs')} />
          ) : (
            activeAlbum && <AlbumDetailView album={activeAlbum} player={player} onBack={() => setCurrentView('albums')} playlists={playlists} />
          )}

          <LyricsPane track={player.currentTrack} isOpen={isLyricsOpen} onLyricsUpdate={player.updateTrackLyrics} />
        </div>
      </main>
      <footer className="player-bar">
        <PlayerBar 
          player={player} 
          isLyricsOpen={isLyricsOpen} 
          onToggleLyrics={() => setIsLyricsOpen(!isLyricsOpen)} 
        />
      </footer>
    </div>
  )
}

export default App
