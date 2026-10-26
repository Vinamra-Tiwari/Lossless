import React, { useState, useEffect } from 'react'
import { Play, Disc, ArrowLeft } from 'lucide-react'
import { AddToPlaylistMenu } from './AddToPlaylistMenu'

interface AlbumDetailViewProps {
  album: any
  player: any
  onBack: () => void
  playlists?: any[]
}

function formatDuration(seconds: number) {
  if (!seconds || isNaN(seconds)) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function AlbumDetailView({ album, player, onBack, playlists = [] }: AlbumDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const hasArt = album.artwork_path && album.artwork_path !== 'NONE' && album.artwork_path !== 'ERROR'

  useEffect(() => {
    window.api.getAlbumTracks(album.id).then(setTracks)
  }, [album.id])

  return (
    <div className="detail-view">
      <button className="text-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back to albums
      </button>

      <div className="detail-header">
        <div className="detail-cover">
          {hasArt ? (
            <img src={`lossless://${encodeURIComponent(album.artwork_path)}`} alt={album.title} />
          ) : (
            <Disc size={80} />
          )}
        </div>
        <div className="detail-meta">
          <div className="eyebrow">Album</div>
          <h1>{album.title}</h1>
          <div className="detail-sub">
            <strong>{album.artist_name || 'Unknown Artist'}</strong>
            {album.year ? ` · ${album.year}` : ''}
            {` · ${tracks.length} songs`}
          </div>
        </div>
      </div>

      <div className="detail-actions">
        <button className="round-play" onClick={() => tracks.length > 0 && player.playTrack(tracks, 0)}>
          <Play size={24} fill="currentColor" />
        </button>
      </div>

      <table className="tracks-table">
        <thead>
          <tr>
            <th className="col-num">#</th>
            <th>Title</th>
            <th>Duration</th>
            <th className="col-actions"></th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => {
            const isCurrent = player.currentTrack?.id === track.id
            return (
              <tr
                key={track.id}
                onDoubleClick={() => player.playTrack(tracks, index)}
                className={isCurrent ? 'is-current' : ''}
              >
                <td className="col-num">
                  {isCurrent && player.isPlaying
                    ? <Play size={14} fill="currentColor" />
                    : track.track_number || index + 1}
                </td>
                <td className="col-title">{track.title || track.filename}</td>
                <td className="col-muted">{formatDuration(track.duration)}</td>
                <td className="col-actions">
                  <AddToPlaylistMenu trackId={track.id} playlists={playlists} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
