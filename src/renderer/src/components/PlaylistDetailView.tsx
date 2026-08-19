import React, { useState, useEffect } from 'react'
import { Play, ArrowLeft } from 'lucide-react'
import { SongsView } from './SongsView'

interface PlaylistDetailViewProps {
  playlist: any
  player: any
  onBack: () => void
}

export function PlaylistDetailView({ playlist, player, onBack }: PlaylistDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])

  useEffect(() => {
    const fetchTracks = async () => {
      const data = await window.api.getPlaylistTracks(playlist.id)
      setTracks(data)
    }
    fetchTracks()
  }, [playlist.id])

  return (
    <div className="playlist-detail" style={{ paddingBottom: '100px' }}>
      <button 
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginBottom: '24px' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="playlist-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', marginBottom: '32px' }}>
        <div style={{ width: '200px', height: '200px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <span style={{ fontSize: '48px', fontWeight: 'bold', color: 'var(--text-secondary)' }}>{playlist.name.charAt(0).toUpperCase()}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Playlist</div>
          <h1 style={{ fontSize: '48px', fontWeight: 900, margin: '0 0 16px 0', letterSpacing: '-1px' }}>{playlist.name}</h1>
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {tracks.length} songs
          </div>
        </div>
      </div>

      <div className="playlist-actions" style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => {
            if (tracks.length > 0) player.playTrack(tracks, 0)
          }}
          style={{ background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '50%', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 8px 16px rgba(29,185,84,0.3)' }}
        >
          <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
        </button>
      </div>

      <SongsView tracks={tracks} player={player} searchQuery="" playlists={[]} />
    </div>
  )
}
