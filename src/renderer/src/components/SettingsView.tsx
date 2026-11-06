import React, { useState, useEffect } from 'react'
import { Folder, Trash2 } from 'lucide-react'

export function SettingsView() {
  const [folders, setFolders] = useState<any[]>([])
  const [spotifyId, setSpotifyId] = useState('')
  const [spotifyStatus, setSpotifyStatus] = useState({ configured: false, connected: false, clientId: '' })
  const [spotifyMessage, setSpotifyMessage] = useState('')
  const [spotifyBusy, setSpotifyBusy] = useState(false)

  const loadFolders = async () => {
    const data = await window.api.getLibraryFolders()
    setFolders(data)
  }

  useEffect(() => {
    loadFolders()
    window.api.getSpotifyStatus().then((status) => { setSpotifyStatus(status); setSpotifyId(status.clientId) })
    window.addEventListener('library-cleared', loadFolders)
    window.addEventListener('folders-updated', loadFolders)
    return () => {
      window.removeEventListener('library-cleared', loadFolders)
      window.removeEventListener('folders-updated', loadFolders)
    }
  }, [])

  const saveSpotifyId = async () => {
    try {
      const status = await window.api.setSpotifyClientId(spotifyId)
      setSpotifyStatus(status)
      setSpotifyId(status.clientId)
      setSpotifyMessage(status.configured ? 'Client ID saved.' : 'Spotify connection cleared.')
    } catch (error) {
      setSpotifyMessage(error instanceof Error ? error.message : String(error))
    }
  }

  const connectSpotify = async () => {
    setSpotifyBusy(true)
    setSpotifyMessage('Opening Spotify sign-in…')
    try {
      const status = await window.api.connectSpotify()
      setSpotifyStatus(status)
      setSpotifyMessage('Spotify connected. Catalog search and suggestions are ready.')
    } catch (error) {
      setSpotifyMessage(error instanceof Error ? error.message : String(error))
    } finally { setSpotifyBusy(false) }
  }

  const handleRemoveFolder = async (path: string) => {
    if (!confirm(`Remove this folder and its tracks from the library?\n\n${path}`)) return
    await window.api.removeLibraryFolder(path)
    loadFolders()
    window.dispatchEvent(new Event('library-cleared'))
  }

  return (
    <div className="settings-panel">
      <h2>Library</h2>
      <div className="settings-card">
        <h3>Watched folders</h3>
        <p className="empty-copy">You can add multiple folders. Tracks from all of them stay in one library.</p>
        {folders.length === 0 ? (
          <p className="empty-copy" style={{ marginTop: 16 }}>No folders added yet.</p>
        ) : (
          <ul className="folder-list">
            {folders.map((folder) => (
              <li key={folder.id}>
                <div className="folder-path">
                  <Folder size={18} />
                  <span>{folder.path}</span>
                </div>
                <button
                  className="icon-btn danger"
                  onClick={() => handleRemoveFolder(folder.path)}
                  title="Remove folder"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <h2 style={{ marginTop: 28 }}>Spotify</h2>
      <div className="settings-card">
        <h3>{spotifyStatus.connected ? 'Connected' : 'Connect Spotify catalog'}</h3>
        <p className="empty-copy">Create a Spotify developer app, add <code>http://127.0.0.1/callback</code> as a redirect URI, then paste its Client ID here. Spotify sign-in uses PKCE and does not ask for playback or library permissions.</p>
        <label className="spotify-client-id-label" htmlFor="spotify-client-id">Client ID</label>
        <div className="spotify-connect-row">
          <input id="spotify-client-id" value={spotifyId} onChange={(event) => setSpotifyId(event.target.value)} placeholder="Spotify developer Client ID" />
          <button className="secondary-btn" onClick={saveSpotifyId}>Save</button>
          <button className="primary-btn" onClick={connectSpotify} disabled={!spotifyStatus.configured || spotifyBusy}>{spotifyBusy ? 'Connecting…' : 'Connect'}</button>
        </div>
        {spotifyMessage && <p className="empty-copy" style={{ marginTop: 12 }}>{spotifyMessage}</p>}
      </div>
    </div>
  )
}
