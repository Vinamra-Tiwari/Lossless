import React, { useState, useEffect } from 'react'
import { Play, ArrowLeft, Trash2 } from 'lucide-react'
import { SongsView } from './SongsView'

interface PlaylistDetailViewProps {
  playlist: any
  player: any
  playlists: any[]
  onBack: () => void
  onDeleted: () => void
}

export function PlaylistDetailView({ playlist, player, playlists, onBack, onDeleted }: PlaylistDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])

  const fetchTracks = async () => {
    const data = await window.api.getPlaylistTracks(playlist.id)
    setTracks(data)
  }

  useEffect(() => {
    fetchTracks()
    const onUpdate = () => fetchTracks()
    window.addEventListener('playlists-updated', onUpdate)
    return () => window.removeEventListener('playlists-updated', onUpdate)
  }, [playlist.id])

  const handleDelete = async () => {
    if (!confirm(`Delete playlist “${playlist.name}”?`)) return
    await window.api.deletePlaylist(playlist.id)
    window.dispatchEvent(new Event('playlists-updated'))
    onDeleted()
  }

  const handleRemove = async (trackId: number) => {
    await window.api.removeFromPlaylist(playlist.id, trackId)
    fetchTracks()
    window.dispatchEvent(new Event('playlists-updated'))
  }

  return (
    <div className="detail-view">
      <button className="text-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>

      <div className="detail-header">
        <div className="detail-cover playlist-cover">
          <span>{playlist.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="detail-meta">
          <div className="eyebrow">Playlist</div>
          <h1>{playlist.name}</h1>
          <div className="detail-sub">{tracks.length} song{tracks.length === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div className="detail-actions">
        <button
          className="round-play"
          onClick={() => tracks.length > 0 && player.playTrack(tracks, 0)}
          disabled={tracks.length === 0}
          title="Play playlist"
        >
          <Play size={24} fill="currentColor" />
        </button>
        <button className="ghost-btn danger" onClick={handleDelete}>
          <Trash2 size={16} /> Delete
        </button>
      </div>

      <SongsView
        tracks={tracks}
        player={player}
        searchQuery=""
        playlists={playlists}
        emptyMessage="This playlist is empty. Add tracks from Songs or Albums."
        onRemove={handleRemove}
      />
    </div>
  )
}
