import { getDb } from './database'
import { getSpotifyArtistGenres, getSpotifyStatus, spotifySearchAlbums } from './spotify'

type Article = { title: string; description: string; extract: string; url: string }
type InsightPayload = {
  articles: Article[]
  genres: string[]
  genreSource: string | null
  catalog: { releaseDate: string | null; trackCount: number | null; url: string | null } | null
}
type Recommendation = {
  title: string
  artist: string
  genre: string | null
  year: string | null
  trackCount: number | null
  url: string
  tasteMatch: string
}

const cacheTtl = 30 * 24 * 60 * 60 * 1000
const requestTimeout = 9000
const userAgent = 'Lossless/1.0.3 (https://github.com/Vinamra-Tiwari/Lossless)'

function normalized(value: string): string {
  return value.normalize('NFKD').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function cacheKey(parts: string[]): string {
  return parts.map(normalized).join(':')
}

function readCache<T>(key: string): { value: T; fresh: boolean } | null {
  const row = getDb().prepare('SELECT payload, fetched_at FROM online_cache WHERE cache_key = ?').get(key) as
    | { payload: string; fetched_at: number }
    | undefined
  if (!row) return null
  try {
    return { value: JSON.parse(row.payload) as T, fresh: Date.now() - row.fetched_at < cacheTtl }
  } catch {
    return null
  }
}

function writeCache(key: string, value: unknown): void {
  getDb().prepare(`
    INSERT INTO online_cache(cache_key, payload, fetched_at) VALUES (?, ?, ?)
    ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at
  `).run(key, JSON.stringify(value), Date.now())
}

async function getJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), requestTimeout)
  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': userAgent },
      signal: controller.signal
    })
    if (!response.ok) throw new Error(`Online lookup returned ${response.status}`)
    return await response.json() as T
  } finally {
    clearTimeout(timeout)
  }
}

async function wikipediaArticle(query: string, preferredTitle: string): Promise<Article | null> {
  const searchUrl = `https://en.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(query)}&limit=5`
  const result = await getJson<{ pages?: Array<{ key: string; title: string; description?: string }> }>(searchUrl)
  const pages = result.pages || []
  if (!pages.length) return null

  const preferred = normalized(preferredTitle)
  const page = pages
    .map((candidate) => ({
      candidate,
      score: normalized(candidate.title) === preferred ? 4 :
        normalized(candidate.title).includes(preferred) ? 3 :
          preferred.includes(normalized(candidate.title)) ? 2 : 0
    }))
    .sort((a, b) => b.score - a.score)[0].candidate

  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.key)}`
  const summary = await getJson<{
    title?: string
    description?: string
    extract?: string
    content_urls?: { desktop?: { page?: string } }
  }>(summaryUrl)
  if (!summary.extract) return null
  return {
    title: summary.title || page.title,
    description: summary.description || page.description || '',
    extract: summary.extract,
    url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.key)}`
  }
}

type SpotifyAlbum = Awaited<ReturnType<typeof spotifySearchAlbums>>[number]

function onlineState(value: InsightPayload, state: 'online' | 'cached' | 'offline') {
  return { ...value, state }
}

export async function getOnlineInsights(kind: 'artist' | 'album', title: string, artist = '') {
  const cleanTitle = title.trim().slice(0, 180)
  const cleanArtist = artist.trim().slice(0, 180)
  if (!cleanTitle || !['artist', 'album'].includes(kind)) {
    return { articles: [], genres: [], genreSource: null, catalog: null, state: 'offline' as const }
  }

  const key = cacheKey(['insight-spotify-v1', `connected-${getSpotifyStatus().connected}`, kind, cleanTitle, cleanArtist])
  const cached = readCache<InsightPayload>(key)
  if (cached?.fresh) return onlineState(cached.value, 'cached')

  const tasks: Array<Promise<unknown>> = []
  const articleQueries = kind === 'artist'
    ? [
        wikipediaArticle(cleanTitle, cleanTitle),
        wikipediaArticle(`${cleanTitle} discography`, `${cleanTitle} discography`)
      ]
    : [
        wikipediaArticle(`${cleanTitle} ${cleanArtist} album`, cleanTitle),
        ...(cleanArtist ? [wikipediaArticle(cleanArtist, cleanArtist)] : [])
      ]
  tasks.push(...articleQueries)

  if (kind === 'album') {
    tasks.push(spotifySearchAlbums(`album:"${cleanTitle}" artist:"${cleanArtist}"`, 10))
  }

  const results = await Promise.allSettled(tasks)
  const articles: Article[] = []
  const genres: string[] = []
  let catalog: InsightPayload['catalog'] = null
  let anyOnlineResponse = false
  let responseIndex = 0

  for (let i = 0; i < articleQueries.length; i++) {
    const result = results[responseIndex++]
    if (result.status === 'fulfilled') {
      anyOnlineResponse = true
      if (result.value && typeof result.value === 'object' && 'extract' in result.value) articles.push(result.value as Article)
    }
  }

  if (kind === 'album') {
    const result = results[responseIndex]
    if (result?.status === 'fulfilled') {
      anyOnlineResponse = true
      const candidates = result.value as SpotifyAlbum[]
      const albumKey = normalized(cleanTitle)
      const artistKey = normalized(cleanArtist)
      const exact = candidates.find((item) =>
        normalized(item.name || '') === albumKey &&
        (!artistKey || item.artists.some((artist) => normalized(artist.name).includes(artistKey) || artistKey.includes(normalized(artist.name))))
      )
      const chosen = exact || candidates.find((item) =>
        normalized(item.name || '').includes(albumKey) &&
        (!artistKey || item.artists.some((artist) => normalized(artist.name).includes(artistKey) || artistKey.includes(normalized(artist.name))))
      )
      if (chosen) {
        const artistId = chosen.artists.find((item) => item.id)?.id
        if (artistId) genres.push(...await getSpotifyArtistGenres(artistId))
        catalog = {
          releaseDate: chosen.release_date || null,
          trackCount: chosen.total_tracks || null,
          url: chosen.external_urls?.spotify || `https://open.spotify.com/album/${chosen.id}`
        }
      }
    }
  }

  const uniqueArticles = articles.filter((article, index) => articles.findIndex((other) => other.url === article.url) === index)
  const savedArticles = uniqueArticles.length ? uniqueArticles : (cached?.value.articles || [])
  const savedGenres = genres.length ? genres : (cached?.value.genres || [])
  const savedCatalog = catalog || cached?.value.catalog || null
  const payload: InsightPayload = {
    articles: savedArticles,
    genres: savedGenres,
    genreSource: genres.length ? 'Spotify artist catalog' : (cached?.value.genreSource || null),
    catalog: savedCatalog
  }
  if (anyOnlineResponse) {
    writeCache(key, payload)
    return onlineState(payload, 'online')
  }
  return cached ? onlineState(cached.value, 'cached') : { ...payload, state: 'offline' as const }
}

export async function getSuggestedAlbums(seedArtist = '') {
  const db = getDb()
  const favorites = db.prepare(`
    SELECT artists.name AS name, COUNT(tracks.id) AS plays
    FROM artists JOIN tracks ON tracks.artist_id = artists.id
    GROUP BY artists.id
    ORDER BY plays DESC, artists.name COLLATE NOCASE ASC
    LIMIT 5
  `).all() as Array<{ name: string; plays: number }>

  if (seedArtist.trim() && !favorites.some((item) => normalized(item.name) === normalized(seedArtist))) {
    favorites.unshift({ name: seedArtist.trim().slice(0, 180), plays: 1 })
  }
  const taste = favorites.slice(0, 5)
  if (!taste.length) return { albums: [], state: 'empty', basedOn: [] }

  const ownedCount = (db.prepare('SELECT COUNT(*) AS count FROM albums').get() as { count: number }).count
  const key = cacheKey(['suggestions-spotify-v1', `connected-${getSpotifyStatus().connected}`, `owned-${ownedCount}`, ...taste.map((item) => `${item.name} ${item.plays}`)])
  const cached = readCache<{ albums: Recommendation[]; basedOn: string[] }>(key)
  if (cached?.fresh) return { ...cached.value, state: 'cached' as const }
  if (!getSpotifyStatus().connected) return cached ? { ...cached.value, state: 'cached' as const } : { albums: [], state: 'needs-connection', basedOn: taste.map((item) => item.name) }

  const owned = db.prepare(`
    SELECT albums.title, artists.name AS artist
    FROM albums LEFT JOIN artists ON albums.artist_id = artists.id
  `).all() as Array<{ title: string; artist: string | null }>
  const ownedKeys = new Set(owned.map((item) => `${normalized(item.title)}|${normalized(item.artist || '')}`))

  const responses = await Promise.allSettled(taste.map((item) => spotifySearchAlbums(`artist:"${item.name}"`, 10)))
  const albums = new Map<string, Recommendation>()
  for (let i = 0; i < responses.length; i++) {
    const response = responses[i]
    if (response.status !== 'fulfilled') continue
    const artistTaste = taste[i]
    for (const item of response.value) {
      const title = item.name || ''
      const artist = item.artists.map((entry) => entry.name).join(', ')
      const artistKey = normalized(artist)
      const tasteArtistKey = normalized(artistTaste.name)
      if (!title || !artist || (!artistKey.includes(tasteArtistKey) && !tasteArtistKey.includes(artistKey))) continue
      if (ownedKeys.has(`${normalized(title)}|${artistKey}`)) continue
      const id = item.id || `${normalized(title)}|${artistKey}`
      const previous = albums.get(id)
      if (!previous || artistTaste.plays > Number(previous.tasteMatch.match(/\d+/)?.[0] || 0)) {
        albums.set(id, {
          title,
          artist,
          genre: null,
          year: item.release_date?.slice(0, 4) || null,
          trackCount: item.total_tracks || null,
          url: item.external_urls?.spotify || `https://open.spotify.com/album/${item.id}`,
          tasteMatch: `${artistTaste.plays} ${artistTaste.plays === 1 ? 'track' : 'tracks'} by ${artistTaste.name}`
        })
      }
    }
  }

  const recommendations = [...albums.values()]
    .sort((a, b) => Number(b.tasteMatch.match(/^\d+/)?.[0] || 0) - Number(a.tasteMatch.match(/^\d+/)?.[0] || 0))
    .slice(0, 12)
  const payload = { albums: recommendations, basedOn: taste.map((item) => item.name) }
  if (responses.some((response) => response.status === 'fulfilled')) {
    writeCache(key, payload)
    return { ...payload, state: 'online' as const }
  }
  return cached ? { ...cached.value, state: 'cached' as const } : { ...payload, state: 'offline' as const }
}
