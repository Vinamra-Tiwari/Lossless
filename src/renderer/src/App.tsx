import React, { useState, useEffect } from 'react'
import { FolderPlus, RefreshCw, Play } from 'lucide-react'
import { usePlayer } from './store/usePlayer'
import { PlayerBar } from './components/PlayerBar'

function App(): JSX.Element {
  const [tracks, setTracks] = useState<any[]>([])
  const [scanProgress, setScanProgress] = useState<string>('')
  const [isScanning, setIsScanning] = useState(false)
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

  return (
    <div className="app-container">
      <aside className="sidebar">
        <h2>Lossless</h2>
        <nav>
          <ul>
            <li>Home</li>
            <li>Library</li>
            <li style={{ color: 'var(--text-primary)' }}>Songs</li>
            <li>Albums</li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar">
          {scanProgress && <span style={{ marginRight: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{scanProgress}</span>}
          <button onClick={handleAddFolder} disabled={isScanning} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isScanning ? <RefreshCw size={16} className="spin" /> : <FolderPlus size={16} />}
            Add Folder
          </button>
        </header>
        <div className="content-area">
          <h1>Songs</h1>
          {tracks.length === 0 ? (
            <p>Your library is currently empty. Add a folder to get started.</p>
          ) : (
            <table className="tracks-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Duration</th>
                  <th>Format</th>
                </tr>
              </thead>
              <tbody>
                {tracks.map((track, index) => {
                  const isCurrent = player.currentTrack?.id === track.id
                  return (
                    <tr 
                      key={track.id} 
                      onDoubleClick={() => player.playTrack(tracks, index)}
                      style={{ 
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? 'rgba(29, 185, 84, 0.1)' : 'transparent'
                      }}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--accent-color)' }}>
                        {isCurrent && player.isPlaying ? <Play size={14} fill="currentColor" /> : null}
                      </td>
                      <td style={{ color: isCurrent ? 'var(--accent-color)' : 'inherit', fontWeight: isCurrent ? 600 : 400 }}>
                        {track.title || track.filename}
                      </td>
                      <td>{track.artist_name || 'Unknown Artist'}</td>
                      <td>{track.album_title || 'Unknown Album'}</td>
                      <td>{track.duration ? new Date(track.duration * 1000).toISOString().substr(14, 5) : '--:--'}</td>
                      <td>{track.format}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
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
