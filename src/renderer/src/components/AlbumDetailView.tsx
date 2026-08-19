import React, { useState, useEffect } from 'react'
import { Play, Disc, ArrowLeft, Plus } from 'lucide-react'

interface AlbumDetailViewProps {
  album: any
  player: any
  onBack: () => void
  playlists?: any[]
}

export function AlbumDetailView({ album, player, onBack, playlists = [] }: AlbumDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)

  const formatDuration = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '--:--'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const loadTracks = async () => {
      const data = await window.api.getAlbumTracks(album.id)
      setTracks(data)
    }
    loadTracks()
  }, [album.id])

  const handlePlayAlbum = () => {
    if (tracks.length > 0) {
      player.playTrack(tracks, 0)
    }
  }

  const handleAddToPlaylist = async (playlistId: number, trackId: number) => {
    await window.api.addToPlaylist(playlistId, trackId)
    setMenuOpenId(null)
  }

  return (
    <div className="album-detail-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 'fit-content' }}>
        <ArrowLeft size={20} /> Back to Albums
      </button>

      <div className="album-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
        <div style={{ width: '200px', height: '200px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {album.artwork_path && album.artwork_path !== 'NONE' && album.artwork_path !== 'ERROR' ? (
            <img 
              src={`lossless://${encodeURIComponent(album.artwork_path)}`} 
              alt={album.title} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <Disc size={80} color="var(--text-secondary)" />
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Album</span>
          <h1 style={{ fontSize: '48px', margin: 0, fontWeight: 800, lineHeight: '1.1' }}>{album.title}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{album.artist_name || 'Unknown Artist'}</span>
            {album.year && <span>• {album.year}</span>}
            <span>• {tracks.length} songs</span>
          </div>
        </div>
      </div>

      <div className="album-actions">
        <button 
          onClick={handlePlayAlbum}
          style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }}
        >
          <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />
        </button>
      </div>

      <table className="tracks-table">
        <thead>
          <tr>
            <th style={{ width: '40px', textAlign: 'center' }}>#</th>
            <th>Title</th>
            <th>Duration</th>
            {playlists.length > 0 && <th style={{ width: '40px' }}></th>}
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
                <td style={{ textAlign: 'center', color: isCurrent ? 'var(--accent-color)' : 'var(--text-secondary)' }}>
                  {isCurrent && player.isPlaying ? <Play size={14} fill="currentColor" /> : track.track_number || index + 1}
                </td>
                <td style={{ color: isCurrent ? 'var(--accent-color)' : 'inherit', fontWeight: isCurrent ? 600 : 400 }}>
                  {track.title || track.filename}
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{formatDuration(track.duration)}</td>
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
    </div>
  )
}
