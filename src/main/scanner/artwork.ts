import { getDb } from '../database'
import * as mm from 'music-metadata'
import { app } from 'electron'
import path from 'path'
import fs from 'fs/promises'

export async function extractMissingArtwork(onProgress: (msg: string) => void) {
  const db = getDb()
  const COVER_DIR = path.join(app.getPath('userData'), 'covers')
  
  // Ensure cover directory exists
  try {
    await fs.mkdir(COVER_DIR, { recursive: true })
  } catch (err) {
    console.error('Failed to create cover directory', err)
    return
  }

  // Find albums that don't have artwork yet
  const albumsToProcess = db.prepare(`SELECT id FROM albums WHERE artwork_path IS NULL`).all() as any[]
  
  if (albumsToProcess.length === 0) {
    return
  }

  onProgress(`Extracting artwork for ${albumsToProcess.length} albums...`)

  const getTrackForAlbum = db.prepare(`SELECT path FROM tracks WHERE album_id = ? LIMIT 1`)
  const updateAlbumArtwork = db.prepare(`UPDATE albums SET artwork_path = ? WHERE id = ?`)

  let processedCount = 0

  for (const album of albumsToProcess) {
    const track = getTrackForAlbum.get(album.id) as any
    if (!track) continue

    try {
      const metadata = await mm.parseFile(track.path, { duration: false, skipCovers: false })
      
      if (metadata.common.picture && metadata.common.picture.length > 0) {
        const picture = metadata.common.picture[0]
        const ext = picture.format === 'image/png' ? '.png' : '.jpg'
        const coverFileName = `album_${album.id}${ext}`
        const coverFilePath = path.join(COVER_DIR, coverFileName)
        
        await fs.writeFile(coverFilePath, picture.data)
        updateAlbumArtwork.run(coverFilePath, album.id)
      } else {
        // Fallback to iTunes API
        try {
          const query = encodeURIComponent(`${album.title || ''} ${track.album_artist || track.artist || ''}`)
          const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=album&limit=1`)
          const data = await response.json()
          
          if (data.results && data.results.length > 0) {
            const artworkUrl = data.results[0].artworkUrl100.replace('100x100bb.jpg', '600x600bb.jpg')
            const imgRes = await fetch(artworkUrl)
            const arrayBuffer = await imgRes.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            const coverFileName = `album_${album.id}_web.jpg`
            const coverFilePath = path.join(COVER_DIR, coverFileName)
            
            await fs.writeFile(coverFilePath, buffer)
            updateAlbumArtwork.run(coverFilePath, album.id)
          } else {
            updateAlbumArtwork.run('NONE', album.id)
          }
        } catch (apiErr) {
          console.error(`iTunes API failed for album ${album.id}`, apiErr)
          updateAlbumArtwork.run('NONE', album.id)
        }
      }
    } catch (err) {
      console.error(`Failed to extract artwork for album ${album.id} from ${track.path}`, err)
      updateAlbumArtwork.run('ERROR', album.id)
    }

    processedCount++
    if (processedCount % 10 === 0) {
      onProgress(`Extracted artwork for ${processedCount}/${albumsToProcess.length} albums...`)
    }
  }

  onProgress(`Artwork extraction complete.`)
}
