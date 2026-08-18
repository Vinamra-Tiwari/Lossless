import React, { useState, useEffect } from 'react'
import { Disc } from 'lucide-react'

interface AlbumsViewProps {
  onAlbumClick: (album: any) => void
}

export function AlbumsView({ onAlbumClick }: AlbumsViewProps) {
  const [albums, setAlbums] = useState<any[]>([])

  useEffect(() => {
    const loadAlbums = async () => {
      const data = await window.api.getAlbums()
      setAlbums(data)
    }
    loadAlbums()

    // Automatically reload when a scan finishes
    window.api.onScanProgress((progress: string) => {
      if (progress.includes('Scan complete')) {
        loadAlbums()
      }
    })

    window.addEventListener('library-cleared', loadAlbums)
    return () => window.removeEventListener('library-cleared', loadAlbums)
  }, [])

  if (albums.length === 0) {
    return <p>No albums found. Add a folder to get started.</p>
  }

  return (
    <div className="album-grid">
      {albums.map((album) => (
        <div key={album.id} className="album-card" onClick={() => onAlbumClick(album)}>
          <div className="album-cover-placeholder">
            <Disc size={48} color="var(--text-secondary)" />
          </div>
          <div className="album-info">
            <div className="album-title">{album.title || 'Unknown Album'}</div>
            <div className="album-artist">{album.artist_name || 'Unknown Artist'}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
