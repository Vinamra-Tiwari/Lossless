import React from 'react'
import { Play } from 'lucide-react'
import { AddToPlaylistMenu } from './AddToPlaylistMenu'

interface SongsViewProps {
  tracks: any[]
  player: any
  searchQuery: string
  playlists?: any[]
  emptyMessage?: string
  onRemove?: (trackId: number) => void
}

function formatDuration(seconds: number) {
  if (!seconds || isNaN(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function SongsView({
  tracks,
  player,
  searchQuery,
  playlists = [],
  emptyMessage = 'Your library is empty. Add one or more folders to get started.',
  onRemove
}: SongsViewProps) {
  const q = searchQuery.toLowerCase()
  const filteredTracks = tracks.filter((t) =>
    t.title?.toLowerCase().includes(q) ||
    t.artist_name?.toLowerCase().includes(q) ||
    t.album_title?.toLowerCase().includes(q) ||
    t.filename?.toLowerCase().includes(q)
  )

  if (tracks.length === 0) {
    return <p className="empty-copy">{emptyMessage}</p>
  }

  if (filteredTracks.length === 0) {
    return <p className="empty-copy">No tracks match “{searchQuery}”.</p>
  }

  return (
    <table className="tracks-table">
      <thead>
        <tr>
          <th className="col-num"></th>
          <th>Title</th>
          <th>Artist</th>
          <th>Album</th>
          <th>Duration</th>
          <th>Format</th>
          <th className="col-actions"></th>
        </tr>
      </thead>
      <tbody>
        {filteredTracks.map((track, index) => {
          const isCurrent = player.currentTrack?.id === track.id
          return (
            <tr
              key={track.id}
              onDoubleClick={() => player.playTrack(filteredTracks, index)}
              className={isCurrent ? 'is-current' : ''}
            >
              <td className="col-num">
                {isCurrent && player.isPlaying ? <Play size={14} fill="currentColor" /> : index + 1}
              </td>
              <td className="col-title">{track.title || track.filename}</td>
              <td>{track.artist_name || 'Unknown Artist'}</td>
              <td>{track.album_title || 'Unknown Album'}</td>
              <td className="col-muted">{formatDuration(track.duration)}</td>
              <td><span className="format-chip">{track.format}</span></td>
              <td className="col-actions">
                <div className="row-actions">
                  <AddToPlaylistMenu trackId={track.id} playlists={playlists} />
                  {onRemove && (
                    <button className="icon-btn danger" title="Remove from playlist" onClick={(e) => {
                      e.stopPropagation()
                      onRemove(track.id)
                    }}>
                      ×
                    </button>
                  )}
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
