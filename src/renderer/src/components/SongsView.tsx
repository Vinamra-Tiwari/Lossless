import React, { useState, useRef, useEffect } from 'react'
import { Play, Plus } from 'lucide-react'

interface SongsViewProps {
  tracks: any[]
  player: any
  searchQuery: string
  playlists?: any[]
}

export function SongsView({ tracks, player, searchQuery, playlists = [] }: SongsViewProps) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  
  if (tracks.length === 0) {
    return <p>Your library is currently empty. Add a folder to get started.</p>
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const filteredTracks = tracks.filter(t => 
    t.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.artist_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.album_title?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    await window.api.addToPlaylist(playlistId, trackId)
    setMenuOpenId(null)
  }

  return (
    <table className="tracks-table" style={{ overflow: 'visible' }}>
      <thead>
        <tr>
          <th style={{ width: '40px' }}></th>
          <th>Title</th>
          <th>Artist</th>
          <th>Album</th>
          <th>Duration</th>
          <th>Format</th>
          {playlists.length > 0 && <th style={{ width: '40px' }}></th>}
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
              <td>{formatDuration(track.duration)}</td>
              <td>{track.format}</td>
              {playlists.length > 0 && (
                <td style={{ position: 'relative' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === track.id ? null : track.id) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                  >
                    <Plus size={16} />
                  </button>
                  {menuOpenId === track.id && (
                    <div style={{ position: 'absolute', right: '100%', top: '50%', transform: 'translateY(-50%)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 0', zIndex: 100, minWidth: '150px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                      <div style={{ padding: '4px 12px', fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Add to Playlist</div>
                      {playlists.map(pl => (
                        <div 
                          key={pl.id}
                          onClick={(e) => { e.stopPropagation(); handleAddToPlaylist(pl.id, track.id) }}
                          style={{ padding: '8px 12px', fontSize: '14px', cursor: 'pointer' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {pl.name}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
              )}
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
