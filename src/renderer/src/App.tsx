import React, { useState, useEffect } from 'react'
import { FolderPlus, RefreshCw, Trash2, Plus, Music, Disc3, Settings, ListMusic } from 'lucide-react'
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
  const [playlistModalOpen, setPlaylistModalOpen] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [pendingPlaylistTrackId, setPendingPlaylistTrackId] = useState<number | null>(null)
  const player = usePlayer()

  const loadTracks = async () => {
    const data = await window.api.getTracks()
    setTracks(data)
  }

  const loadPlaylists = async () => {
    const data = await window.api.getPlaylists()
    setPlaylists(data)
    setActivePlaylist((prev: any) => {
      if (!prev) return prev
      return data.find((p: any) => p.id === prev.id) || prev
    })
  }

  useEffect(() => {
    loadTracks()
    loadPlaylists()

    const off = window.api.onScanProgress((progress: string) => {
      setScanProgress(progress)
      if (progress.includes('Scan complete')) {
        setIsScanning(false)
        loadTracks()
        window.api.extractMissingArtwork()
        window.dispatchEvent(new Event('folders-updated'))
      }
      if (progress.includes('Artwork extraction complete')) {
        window.dispatchEvent(new Event('artwork-complete'))
        loadTracks()
      }
    })

    const handlePlaylistUpdate = () => loadPlaylists()
    const handleOpenCreate = (e: Event) => {
      const trackId = (e as CustomEvent).detail?.trackId
      setPendingPlaylistTrackId(typeof trackId === 'number' ? trackId : null)
      setPlaylistModalOpen(true)
    }
    window.addEventListener('playlists-updated', handlePlaylistUpdate)
    window.addEventListener('open-create-playlist', handleOpenCreate)
    window.addEventListener('library-cleared', loadTracks)
    return () => {
      off?.()
      window.removeEventListener('playlists-updated', handlePlaylistUpdate)
      window.removeEventListener('open-create-playlist', handleOpenCreate)
      window.removeEventListener('library-cleared', loadTracks)
    }
  }, [])

  const handleAddFolder = async () => {
    const folders = await window.api.selectFolder()
    if (folders && folders.length > 0) {
      setIsScanning(true)
      setScanProgress(`Starting scan of ${folders.length} folder${folders.length > 1 ? 's' : ''}...`)
      try {
        await window.api.scanFolder(folders)
      } finally {
        setIsScanning(false)
      }
    }
  }

  const handleClearLibrary = async () => {
    if (confirm('Clear the entire library and all playlists?')) {
      await window.api.clearLibrary()
      setTracks([])
      setPlaylists([])
      setActivePlaylist(null)
      window.dispatchEvent(new Event('library-cleared'))
      setCurrentView('songs')
    }
  }

  const submitPlaylist = async (e?: React.FormEvent) => {
    e?.preventDefault()
    const name = newPlaylistName.trim()
    if (!name) return
    const id = Number(await window.api.createPlaylist(name))
    const trackToAdd = pendingPlaylistTrackId
    if (trackToAdd != null) {
      await window.api.addToPlaylist(id, trackToAdd)
    }
    setNewPlaylistName('')
    setPlaylistModalOpen(false)
    setPendingPlaylistTrackId(null)
    await loadPlaylists()
    window.dispatchEvent(new Event('playlists-updated'))
    if (trackToAdd == null) {
      setActivePlaylist({ id, name })
      setCurrentView('playlist-detail')
    }
  }

  const viewTitle =
    currentView === 'songs' ? 'Songs' :
    currentView === 'albums' ? 'Albums' :
    currentView === 'settings' ? 'Settings' : ''

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">♪</div>
          <h2>Lossless</h2>
        </div>
        <nav>
          <ul>
            <li className={currentView === 'songs' ? 'active' : ''} onClick={() => setCurrentView('songs')}>
              <Music size={18} /> Songs
            </li>
            <li
              className={currentView === 'albums' || currentView === 'album-detail' ? 'active' : ''}
              onClick={() => setCurrentView('albums')}
            >
              <Disc3 size={18} /> Albums
            </li>
            <li className={currentView === 'settings' ? 'active' : ''} onClick={() => setCurrentView('settings')}>
              <Settings size={18} /> Settings
            </li>
          </ul>
        </nav>

        <div className="playlist-section">
          <div className="playlist-section-header">
            <h3>Playlists</h3>
            <button
              className="icon-btn"
              onClick={() => setPlaylistModalOpen(true)}
              title="Create playlist"
            >
              <Plus size={16} />
            </button>
          </div>
          {playlists.length === 0 ? (
            <p className="sidebar-hint">Create a playlist to group tracks.</p>
          ) : (
            <ul className="playlist-list">
              {playlists.map((pl) => (
                <li
                  key={pl.id}
                  className={currentView === 'playlist-detail' && activePlaylist?.id === pl.id ? 'active' : ''}
                  onClick={() => {
                    setActivePlaylist(pl)
                    setCurrentView('playlist-detail')
                  }}
                  title={pl.name}
                >
                  <ListMusic size={16} />
                  <span className="playlist-name">{pl.name}</span>
                  <span className="playlist-count">{pl.track_count || 0}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            {currentView !== 'settings' && currentView !== 'album-detail' && currentView !== 'playlist-detail' && (
              <input
                type="text"
                className="search-input"
                placeholder="Search songs, artists, albums…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            )}
          </div>
          {scanProgress && <span className="scan-status">{scanProgress}</span>}
          <div className="topbar-actions">
            <button className="ghost-btn" onClick={handleClearLibrary} disabled={isScanning}>
              <Trash2 size={16} />
              Clear
            </button>
            <button className="primary-btn" onClick={handleAddFolder} disabled={isScanning}>
              {isScanning ? <RefreshCw size={16} className="spin" /> : <FolderPlus size={16} />}
              Add folders
            </button>
          </div>
        </header>
        <div className="content-area">
          {viewTitle && <h1>{viewTitle}</h1>}
          {currentView === 'songs' ? (
            <SongsView tracks={tracks} player={player} searchQuery={searchQuery} playlists={playlists} />
          ) : currentView === 'albums' ? (
            <AlbumsView
              onAlbumClick={(album) => {
                setActiveAlbum(album)
                setCurrentView('album-detail')
              }}
              searchQuery={searchQuery}
            />
          ) : currentView === 'settings' ? (
            <SettingsView />
          ) : currentView === 'playlist-detail' ? (
            activePlaylist && (
              <PlaylistDetailView
                playlist={activePlaylist}
                player={player}
                playlists={playlists}
                onBack={() => setCurrentView('songs')}
                onDeleted={() => {
                  setActivePlaylist(null)
                  setCurrentView('songs')
                }}
              />
            )
          ) : (
            activeAlbum && (
              <AlbumDetailView album={activeAlbum} player={player} onBack={() => setCurrentView('albums')} playlists={playlists} />
            )
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

      {playlistModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setPlaylistModalOpen(false)
            setPendingPlaylistTrackId(null)
          }}
        >
          <form
            className="modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={submitPlaylist}
            onKeyDown={(e) => e.key === 'Escape' && setPlaylistModalOpen(false)}
          >
            <h3>New playlist</h3>
            <input
              autoFocus
              className="search-input"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setPlaylistModalOpen(false)
                  setPendingPlaylistTrackId(null)
                }}
              >
                Cancel
              </button>
              <button type="submit" className="primary-btn" disabled={!newPlaylistName.trim()}>
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
