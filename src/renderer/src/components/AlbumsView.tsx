import React, { useState, useEffect } from 'react'
import { Disc, Sparkles, ChevronDown, ChevronUp, ArrowUpRight } from 'lucide-react'

interface AlbumsViewProps {
  onAlbumClick: (album: any) => void
  searchQuery: string
  currentAlbumId?: number | null
  onAlbumsLoaded?: () => void
}

export function AlbumsView({ onAlbumClick, searchQuery, currentAlbumId, onAlbumsLoaded }: AlbumsViewProps) {
  const [albums, setAlbums] = useState<any[]>([])
  const [suggestions, setSuggestions] = useState<any>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionSeed, setSuggestionSeed] = useState<any>(null)

  useEffect(() => {
    const loadAlbums = async () => {
      const data = await window.api.getAlbums()
      setAlbums(data)
      onAlbumsLoaded?.()
    }
    loadAlbums()

    // Automatically reload when a scan finishes
    const off = window.api.onScanProgress((progress: string) => {
      if (progress.includes('Scan complete')) {
        loadAlbums()
      }
    })

    window.addEventListener('library-cleared', loadAlbums)
    window.addEventListener('artwork-complete', loadAlbums)
    return () => {
      off?.()
      window.removeEventListener('library-cleared', loadAlbums)
      window.removeEventListener('artwork-complete', loadAlbums)
    }
  }, [])

  if (albums.length === 0) {
    return <p className="empty-copy">No albums found. Add one or more folders to get started.</p>
  }

  const filteredAlbums = albums.filter(a => 
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    a.artist_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleSuggestions = async (album: any) => {
    if (suggestionsOpen && suggestionSeed?.id === album.id) { setSuggestionsOpen(false); return }
    setSuggestionSeed(album)
    setSuggestionsOpen(true)
    setSuggestionsLoading(true)
    try { setSuggestions(await window.api.getSuggestedAlbums(album.artist_name || '')) }
    catch { setSuggestions({ albums: [], state: 'offline', basedOn: [] }) }
    finally { setSuggestionsLoading(false) }
  }

  return (
    <>
      <div className="album-grid">
      {filteredAlbums.map((album) => (
        <div key={album.id} className={`album-card${album.id === currentAlbumId ? ' is-playing' : ''}`} onClick={() => onAlbumClick(album)}>
          <div className="album-cover-placeholder">
            {album.artwork_path && album.artwork_path !== 'NONE' && album.artwork_path !== 'ERROR' ? (
              <img 
                src={`lossless://${encodeURIComponent(album.artwork_path)}`} 
                alt={album.title} 
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px' }} 
              />
            ) : (
              <Disc size={48} color="var(--text-secondary)" />
            )}
            {album.id === currentAlbumId && <span className="album-playing-badge">NOW PLAYING</span>}
          </div>
          <div className="album-info">
            <div className="album-title">{album.title || 'Unknown Album'}</div>
            <div className="album-artist">{album.artist_name || 'Unknown Artist'}</div>
            <button className="album-suggest-btn" onClick={(event) => { event.stopPropagation(); toggleSuggestions(album) }}>
              <Sparkles size={13} /> Similar albums
            </button>
          </div>
        </div>
      ))}
      </div>
      {suggestionsOpen && <section className="album-suggestions-menu">
        <button className="suggestions-toggle" onClick={() => setSuggestionsOpen(false)}>
          <span><Sparkles size={15} /> More like {suggestionSeed?.title}</span><ChevronUp size={15} />
        </button>
        {suggestionsLoading ? <p className="online-muted">Finding related albums…</p> : suggestions?.albums?.length ? (
          <div className="suggested-album-list">{suggestions.albums.map((item: any) => <a key={`${item.title}-${item.artist}`} className="suggested-album" href={item.url} target="_blank" rel="noreferrer">
            <span className="suggested-album-copy"><strong>{item.title}</strong><span>{item.artist}{item.year ? ` · ${item.year}` : ''}</span><small>{item.tasteMatch}</small></span><ArrowUpRight size={14} />
          </a>)}</div>
        ) : <p className="online-muted">{suggestions?.state === 'needs-connection' ? 'Connect Spotify in Settings to see suggestions.' : 'No matching suggestions found.'}</p>}
      </section>}
    </>
  )
}
