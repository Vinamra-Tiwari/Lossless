import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { initDatabase, getDb, pruneOrphans } from './database'
import { scanDirectory } from './scanner'
import { extractMissingArtwork } from './scanner/artwork'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#0b0b0f',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'lossless', privileges: { bypassCSP: true, supportFetchAPI: true, stream: true, corsEnabled: true } }
])

app.whenReady().then(() => {
  protocol.handle('lossless', (request) => {
    const encoded = request.url.replace(/^lossless:\/\//, '')
    const filePath = decodeURIComponent(encoded)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  initDatabase()
  electronApp.setAppUserModelId('com.lossless.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Add music folders',
    properties: ['openDirectory', 'multiSelections']
  })
  if (canceled || filePaths.length === 0) return null
  return filePaths
})

ipcMain.handle('scan-folder', async (event, folderPath: string | string[]) => {
  const folders = Array.isArray(folderPath) ? folderPath : [folderPath]
  let total = 0
  for (let i = 0; i < folders.length; i++) {
    const folder = folders[i]
    event.sender.send('scan-progress', `Scanning folder ${i + 1} of ${folders.length}…`)
    total += await scanDirectory(folder, (msg) => {
      event.sender.send('scan-progress', msg)
    })
  }
  event.sender.send('scan-progress', `Scan complete. Found ${total} tracks.`)
})

ipcMain.handle('get-tracks', () => {
  const db = getDb()
  return db.prepare(`
    SELECT tracks.*, artists.name as artist_name, albums.title as album_title, albums.artwork_path
    FROM tracks
    LEFT JOIN artists ON tracks.artist_id = artists.id
    LEFT JOIN albums ON tracks.album_id = albums.id
    ORDER BY
      artists.name COLLATE NOCASE ASC,
      albums.title COLLATE NOCASE ASC,
      tracks.disc_number ASC,
      tracks.track_number ASC,
      tracks.path ASC
  `).all()
})

ipcMain.handle('get-albums', () => {
  const db = getDb()
  return db.prepare(`
    SELECT albums.*, artists.name as artist_name
    FROM albums
    LEFT JOIN artists ON albums.artist_id = artists.id
    ORDER BY artists.name COLLATE NOCASE ASC, albums.title COLLATE NOCASE ASC
  `).all()
})

ipcMain.handle('get-album-tracks', (_, albumId: number) => {
  const db = getDb()
  return db.prepare(`
    SELECT tracks.*, artists.name as artist_name, albums.title as album_title, albums.artwork_path
    FROM tracks
    LEFT JOIN artists ON tracks.artist_id = artists.id
    LEFT JOIN albums ON tracks.album_id = albums.id
    WHERE tracks.album_id = ?
    ORDER BY tracks.disc_number ASC, tracks.track_number ASC, tracks.path ASC
  `).all(albumId)
})

ipcMain.handle('clear-library', () => {
  const db = getDb()
  db.exec(`
    DELETE FROM playlist_tracks;
    DELETE FROM playlists;
    DELETE FROM tracks;
    DELETE FROM albums;
    DELETE FROM artists;
    DELETE FROM library_folders;
  `)
})

ipcMain.handle('extract-missing-artwork', async (event) => {
  await extractMissingArtwork((msg) => {
    event.sender.send('scan-progress', msg)
  })
})

ipcMain.handle('get-library-folders', () => {
  const db = getDb()
  return db.prepare(`SELECT * FROM library_folders ORDER BY path ASC`).all()
})

ipcMain.handle('remove-library-folder', (_, folderPath: string) => {
  const db = getDb()
  const sep = folderPath.endsWith('/') || folderPath.endsWith('\\') ? '' : (process.platform === 'win32' ? '\\' : '/')
  const prefix = folderPath + sep
  db.prepare(`DELETE FROM tracks WHERE path = ? OR path LIKE ?`).run(folderPath, prefix + '%')
  db.prepare(`DELETE FROM library_folders WHERE path = ?`).run(folderPath)
  pruneOrphans()
})

ipcMain.handle('fetch-online-lyrics', async (_, trackId: number, artist: string, title: string) => {
  try {
    const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`)
    if (res.ok) {
      const data = await res.json()
      if (data.lyrics) {
        const db = getDb()
        db.prepare(`UPDATE tracks SET lyrics = ? WHERE id = ?`).run(data.lyrics, trackId)
        return data.lyrics
      }
    }
  } catch (err) {
    console.error('Failed to fetch online lyrics', err)
  }
  return null
})

ipcMain.handle('save-lyrics', (_, trackId: number, text: string) => {
  const db = getDb()
  db.prepare(`UPDATE tracks SET lyrics = ? WHERE id = ?`).run(text, trackId)
})

ipcMain.handle('create-playlist', (_, name: string) => {
  const db = getDb()
  const info = db.prepare(`INSERT INTO playlists (name) VALUES (?)`).run(name)
  return info.lastInsertRowid
})

ipcMain.handle('rename-playlist', (_, playlistId: number, name: string) => {
  const db = getDb()
  db.prepare(`UPDATE playlists SET name = ? WHERE id = ?`).run(name, playlistId)
})

ipcMain.handle('delete-playlist', (_, playlistId: number) => {
  const db = getDb()
  db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ?`).run(playlistId)
  db.prepare(`DELETE FROM playlists WHERE id = ?`).run(playlistId)
})

ipcMain.handle('get-playlists', () => {
  const db = getDb()
  return db.prepare(`
    SELECT p.*, COUNT(pt.track_id) as track_count
    FROM playlists p
    LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at ASC
  `).all()
})

ipcMain.handle('add-to-playlist', (_, playlistId: number, trackId: number) => {
  const db = getDb()
  const existing = db.prepare(
    `SELECT 1 FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`
  ).get(playlistId, trackId)
  if (existing) return
  const maxRow = db.prepare(
    `SELECT MAX(track_order) as maxOrder FROM playlist_tracks WHERE playlist_id = ?`
  ).get(playlistId) as any
  const nextOrder = (maxRow?.maxOrder || 0) + 1
  db.prepare(`INSERT INTO playlist_tracks (playlist_id, track_id, track_order) VALUES (?, ?, ?)`).run(
    playlistId,
    trackId,
    nextOrder
  )
})

ipcMain.handle('remove-from-playlist', (_, playlistId: number, trackId: number) => {
  const db = getDb()
  db.prepare(`DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?`).run(playlistId, trackId)
})

ipcMain.handle('get-playlist-tracks', (_, playlistId: number) => {
  const db = getDb()
  return db.prepare(`
    SELECT t.*, ar.name as artist_name, a.title as album_title, a.artwork_path
    FROM tracks t
    JOIN playlist_tracks pt ON pt.track_id = t.id
    LEFT JOIN artists ar ON t.artist_id = ar.id
    LEFT JOIN albums a ON t.album_id = a.id
    WHERE pt.playlist_id = ?
    ORDER BY pt.track_order ASC
  `).all(playlistId)
})
