import fs from 'fs/promises'
import path from 'path'
import * as mm from 'music-metadata'
import { getDb } from '../database'

export const SUPPORTED_EXTENSIONS = new Set([
  '.flac', '.mp3', '.wav', '.wave', '.aac', '.m4a', '.alac', '.ogg', '.oga', '.opus',
  '.aiff', '.aif', '.aifc', '.mp4', '.m4v', '.m4b', '.webm', '.wma', '.ape', '.wv',
  '.dsf', '.dff', '.caf', '.pcm', '.ac3', '.amr', '.3gp'
])

function extractLyrics(common: mm.ICommonTagsResult): string | null {
  const lyrics = common.lyrics
  if (!lyrics || lyrics.length === 0) return null
  const first = lyrics[0] as any
  if (typeof first === 'string') return first
  if (first?.text) {
    return Array.isArray(first.text) ? first.text.join('\n') : String(first.text)
  }
  return null
}

export async function scanDirectory(dirPath: string, onProgress: (msg: string) => void) {
  const db = getDb()

  const insertTrack = db.prepare(`
    INSERT INTO tracks (
      path, filename, title, artist_id, album_id, album_artist, genre, year,
      track_number, disc_number, duration, format, codec, bitrate, sample_rate,
      bit_depth, channels, lyrics, last_modified
    ) VALUES (
      @path, @filename, @title, @artist_id, @album_id, @album_artist, @genre, @year,
      @track_number, @disc_number, @duration, @format, @codec, @bitrate, @sample_rate,
      @bit_depth, @channels, @lyrics, @last_modified
    )
    ON CONFLICT(path) DO UPDATE SET
      filename=excluded.filename,
      title=excluded.title,
      artist_id=excluded.artist_id,
      album_id=excluded.album_id,
      album_artist=excluded.album_artist,
      genre=excluded.genre,
      year=excluded.year,
      track_number=excluded.track_number,
      disc_number=excluded.disc_number,
      duration=excluded.duration,
      format=excluded.format,
      codec=excluded.codec,
      bitrate=excluded.bitrate,
      sample_rate=excluded.sample_rate,
      bit_depth=excluded.bit_depth,
      channels=excluded.channels,
      lyrics=COALESCE(excluded.lyrics, tracks.lyrics),
      last_modified=excluded.last_modified
  `)

  const insertArtist = db.prepare(`INSERT OR IGNORE INTO artists (name) VALUES (@name)`)
  const getArtist = db.prepare(`SELECT id FROM artists WHERE name = @name`)

  const insertAlbum = db.prepare(`INSERT OR IGNORE INTO albums (title, artist_id, year) VALUES (@title, @artist_id, @year)`)
  const getAlbum = db.prepare(`SELECT id FROM albums WHERE title = @title AND artist_id = @artist_id`)

  const addFolder = db.prepare(`INSERT OR IGNORE INTO library_folders (path) VALUES (@path)`)
  addFolder.run({ path: dirPath })

  const insertBatch = db.transaction((tracksData: any[]) => {
    for (const track of tracksData) {
      let trackArtistId = null
      if (track.artist) {
        insertArtist.run({ name: track.artist })
        trackArtistId = (getArtist.get({ name: track.artist }) as any)?.id
      }

      let albumArtistId = trackArtistId
      let albumArtistName = track.album_artist || track.artist
      if (albumArtistName && albumArtistName !== track.artist) {
        insertArtist.run({ name: albumArtistName })
        albumArtistId = (getArtist.get({ name: albumArtistName }) as any)?.id
      }

      let albumId = null
      if (track.album) {
        insertAlbum.run({ title: track.album, artist_id: albumArtistId, year: track.year })
        albumId = (getAlbum.get({ title: track.album, artist_id: albumArtistId }) as any)?.id
      }

      insertTrack.run({
        ...track,
        artist_id: trackArtistId,
        album_id: albumId,
      })
    }
  })

  const scanQueue = [dirPath]
  let scannedCount = 0
  let batchData: any[] = []

  while (scanQueue.length > 0) {
    const currentPath = scanQueue.pop()!
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = path.join(currentPath, entry.name)

        if (entry.isDirectory()) {
          scanQueue.push(fullPath)
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase()
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            try {
              const stat = await fs.stat(fullPath)
              const metadata = await mm.parseFile(fullPath, { duration: true, skipCovers: true })

              const { common, format } = metadata

              batchData.push({
                path: fullPath,
                filename: entry.name,
                title: common.title || path.parse(entry.name).name,
                artist: common.artist,
                album: common.album,
                album_artist: common.albumartist,
                genre: common.genre ? common.genre[0] : null,
                year: common.year,
                track_number: common.track?.no,
                disc_number: common.disk?.no,
                duration: format.duration,
                format: ext.replace('.', '').toUpperCase(),
                codec: format.codec,
                bitrate: format.bitrate,
                sample_rate: format.sampleRate,
                bit_depth: format.bitsPerSample,
                channels: format.numberOfChannels,
                lyrics: extractLyrics(common),
                last_modified: stat.mtimeMs
              })

              scannedCount++
              if (scannedCount % 50 === 0) {
                insertBatch(batchData)
                batchData = []
                onProgress(`Scanned ${scannedCount} tracks...`)
              }
            } catch (err: any) {
              if (err.message && err.message.includes('Invalid FLAC preamble')) {
                console.warn(`[Skip] Invalid FLAC header: ${entry.name}`)
              } else {
                console.error(`Failed to parse metadata for ${fullPath}:`, err)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(`Failed to read directory ${currentPath}:`, err)
    }
  }

  if (batchData.length > 0) {
    insertBatch(batchData)
  }

  onProgress(`Indexed ${scannedCount} tracks in this folder.`)
  return scannedCount
}
