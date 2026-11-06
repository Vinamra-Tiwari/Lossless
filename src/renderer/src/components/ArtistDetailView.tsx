import React, { useEffect, useState } from 'react'
import { ArrowLeft, Disc } from 'lucide-react'
import { OnlineInfoPanel } from './OnlineInfoPanel'

interface ArtistDetailViewProps {
  artist: string
  onBack: () => void
  onAlbumClick: (album: any) => void
}

export function ArtistDetailView({ artist, onBack, onAlbumClick }: ArtistDetailViewProps) {
  const [albums, setAlbums] = useState<any[]>([])

  useEffect(() => {
    let active = true
    window.api.getAlbums().then((items) => {
      if (active) setAlbums(items.filter((album) => album.artist_name?.toLocaleLowerCase() === artist.toLocaleLowerCase()))
    })
    return () => { active = false }
  }, [artist])

  return (
    <div className="detail-view artist-detail-view">
      <button className="text-btn" onClick={onBack}>
        <ArrowLeft size={16} /> Back
      </button>
      <div className="artist-detail-heading">
        <div className="artist-monogram">{artist.slice(0, 1).toLocaleUpperCase()}</div>
        <div className="detail-meta">
          <div className="eyebrow">Artist</div>
          <h1>{artist}</h1>
          <div className="detail-sub">{albums.length} album{albums.length === 1 ? '' : 's'} in your library</div>
        </div>
      </div>

      <OnlineInfoPanel kind="artist" title={artist} />

      {albums.length > 0 && (
        <section className="artist-library-albums">
          <h2>In your collection</h2>
          <div className="album-grid">
            {albums.map((album) => (
              <button key={album.id} className="album-card" onClick={() => onAlbumClick(album)}>
                <span className="album-cover-placeholder">
                  {album.artwork_path && album.artwork_path !== 'NONE' && album.artwork_path !== 'ERROR'
                    ? <img src={`lossless://${encodeURIComponent(album.artwork_path)}`} alt="" />
                    : <Disc size={48} color="var(--text-secondary)" />}
                </span>
                <span className="album-info">
                  <span className="album-title">{album.title || 'Unknown album'}</span>
                  <span className="album-artist">{album.year || 'Album'}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
