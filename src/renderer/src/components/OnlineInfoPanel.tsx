import React, { useEffect, useState } from 'react'
import { ArrowUpRight, BookOpen, ChevronDown, ChevronUp, Compass, LoaderCircle } from 'lucide-react'

interface OnlineInfoPanelProps {
  kind: 'artist' | 'album'
  title: string
  artist?: string
}

export function OnlineInfoPanel({ kind, title, artist = '' }: OnlineInfoPanelProps) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  useEffect(() => {
    let active = true
    setInsights(null)
    setLoading(true)
    window.api.getOnlineInsights(kind, title, artist).then((result) => {
      if (active) setInsights(result)
    }).catch(() => {
      if (active) setInsights({ articles: [], genres: [], state: 'offline' })
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [kind, title, artist])

  const toggleSuggestions = async () => {
    const shouldOpen = !suggestionsOpen
    setSuggestionsOpen(shouldOpen)
    if (!shouldOpen || (suggestions && suggestions.state !== 'offline')) return
    setSuggestionsLoading(true)
    try {
      setSuggestions(await window.api.getSuggestedAlbums(kind === 'artist' ? title : artist))
    } catch {
      setSuggestions({ albums: [], state: 'offline', basedOn: [] })
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const hasArticles = Boolean(insights?.articles?.length)
  const statusText = loading ? 'Looking up background…' :
    insights?.state === 'cached' ? 'Saved from an earlier lookup' :
      insights?.state === 'offline' ? 'Online information is unavailable right now' : 'Online sources'

  const retryInsights = async () => {
    setLoading(true)
    try {
      setInsights(await window.api.getOnlineInsights(kind, title, artist))
    } catch {
      setInsights({ articles: [], genres: [], state: 'offline' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="online-panel">
      <div className="online-panel-heading">
        <div>
          <div className="eyebrow"><BookOpen size={13} /> Liner notes</div>
          <h2>{kind === 'album' ? 'The story behind the record' : 'Artist notes'}</h2>
        </div>
        <span className={`online-status ${insights?.state === 'offline' ? 'is-offline' : ''}`}>
          {loading && <LoaderCircle size={13} className="spin" />}
          {statusText}
        </span>
        {insights?.state === 'offline' && !loading && (
          <button className="text-btn online-retry" onClick={retryInsights}>Try again</button>
        )}
      </div>

      {kind === 'album' && (
        <>
          <div className="genre-suggestion">
            <span className="genre-suggestion-label">Genre suggestion</span>
            {insights?.genres?.length ? (
              <div className="genre-chips">
                {insights.genres.map((genre: string) => <span key={genre} className="genre-chip">{genre}</span>)}
                <small>via {insights.genreSource || 'online catalog'}</small>
              </div>
            ) : (
              <span className="online-muted">{loading ? 'Checking music catalogs…' : 'No reliable catalog match yet.'}</span>
            )}
          </div>
          {insights?.catalog && (
            <div className="online-album-facts">
              {insights.catalog.releaseDate && <span>Release date <strong>{new Date(insights.catalog.releaseDate).getUTCFullYear()}</strong></span>}
              {insights.catalog.trackCount && <span>Tracks <strong>{insights.catalog.trackCount}</strong></span>}
              {insights.catalog.url && <a href={insights.catalog.url} target="_blank" rel="noreferrer">Open in Spotify <ArrowUpRight size={13} /></a>}
            </div>
          )}
          {!insights?.catalog && !loading && <div className="online-album-facts"><a href={`https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`} target="_blank" rel="noreferrer">Search Spotify catalog <ArrowUpRight size={13} /></a></div>}
        </>
      )}

      {hasArticles ? (
        <div className="online-articles">
          {insights.articles.map((article: any) => (
            <article className="online-article" key={article.url}>
              <div className="online-article-title-row">
                <div>
                  <h3>{article.title}</h3>
                  {article.description && <span>{article.description}</span>}
                </div>
                <a href={article.url} target="_blank" rel="noreferrer" title="Read source article">
                  <ArrowUpRight size={15} />
                </a>
              </div>
              <p>{article.extract}</p>
              <small>Source: Wikipedia</small>
            </article>
          ))}
        </div>
      ) : !loading ? (
        <p className="online-muted">{insights?.state === 'offline' ? 'Connect to the internet and select “Try again” to fetch background notes.' : 'No matching background articles were found.'}</p>
      ) : null}

      <div className="suggestions-block">
        <button className="suggestions-toggle" onClick={toggleSuggestions}>
          <span><Compass size={16} /> Suggested albums</span>
          {suggestionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {suggestionsOpen && (
          <div className="suggestions-content">
            {suggestionsLoading ? (
              <p className="online-muted"><LoaderCircle size={14} className="spin" /> Finding albums from your library taste…</p>
            ) : suggestions?.albums?.length ? (
              <>
                <p className="suggestions-caption">Based on artists represented in your library: {suggestions.basedOn.join(', ')}. Albums already in your collection are left out.</p>
                <div className="suggested-album-list">
                  {suggestions.albums.map((album: any) => (
                    <a key={`${album.title}-${album.artist}`} className="suggested-album" href={album.url} target="_blank" rel="noreferrer">
                      <span className="suggested-album-copy">
                        <strong>{album.title}</strong>
                        <span>{album.artist}{album.year ? ` · ${album.year}` : ''}</span>
                        <small>{album.tasteMatch}</small>
                      </span>
                      <span className="suggested-album-meta">
                        {album.genre && <span className="genre-chip">{album.genre}</span>}
                        <ArrowUpRight size={14} />
                      </span>
                    </a>
                  ))}
                </div>
                <p className="catalog-attribution">Album catalog and links from Spotify.</p>
              </>
            ) : (
              <p className="online-muted">
                {suggestions?.state === 'needs-connection'
                  ? 'Connect Spotify in Settings to load catalog suggestions.'
                  : suggestions?.state === 'empty'
                  ? 'Add some music to your library first so suggestions can learn your taste.'
                  : suggestions?.state === 'online' || suggestions?.state === 'cached'
                    ? 'No new albums matched your library taste.'
                    : 'Suggestions are unavailable while offline. Close and reopen this section when you are connected.'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
