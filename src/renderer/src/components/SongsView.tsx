import React from 'react'
import { Play } from 'lucide-react'

interface SongsViewProps {
  tracks: any[]
  player: any
  searchQuery: string
}

export function SongsView({ tracks, player, searchQuery }: SongsViewProps) {
  if (tracks.length === 0) {
    return <p>Your library is currently empty. Add a folder to get started.</p>
  }

  const filteredTracks = tracks.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
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
        {filteredTracks.map((track, index) => {
          const isCurrent = player.currentTrack?.id === track.id
          return (
            <tr 
              key={track.id} 
              onDoubleClick={() => player.playTrack(filteredTracks, index)}
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
              <td>{track.duration ? new Date(track.duration * 1000).toISOString().substring(14, 19) : '--:--'}</td>
              <td>{track.format}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
