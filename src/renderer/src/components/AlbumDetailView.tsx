import React, { useState, useEffect } from 'react'
import { Play, Disc, ArrowLeft } from 'lucide-react'

interface AlbumDetailViewProps {
  album: any
  player: any
  onBack: () => void
}

export function AlbumDetailView({ album, player, onBack }: AlbumDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])

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

  return (
    <div className="album-detail-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', width: 'fit-content' }}>
        <ArrowLeft size={20} /> Back to Albums
      </button>

      <div className="album-header" style={{ display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
        <div style={{ width: '200px', height: '200px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          {album.artwork_path && album.artwork_path !== 'NONE' && album.artwork_path !== 'ERROR' ? (
            <img 
              src={`lossless://${album.artwork_path}`} 
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
                <td style={{ color: 'var(--text-secondary)' }}>{track.duration ? new Date(track.duration * 1000).toISOString().substring(14, 19) : '--:--'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
