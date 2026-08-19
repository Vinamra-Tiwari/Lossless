import { app, shell, BrowserWindow, ipcMain, dialog, protocol, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

import { initDatabase, getDb } from './database'
import { scanDirectory } from './scanner'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    autoHideMenuBar: true,
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

  // HMR for renderer base on electron-vite cli.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Set up IPC handlers bound to mainWindow
  ipcMain.handle('scan-folder', async (_, folderPath) => {
    await scanDirectory(folderPath, (msg) => {
      mainWindow.webContents.send('scan-progress', msg)
    })
  })
}

protocol.registerSchemesAsPrivileged([
  { scheme: 'lossless', privileges: { bypassCSP: true, supportFetchAPI: true, stream: true } }
])

app.whenReady().then(() => {
  protocol.handle('lossless', (request) => {
    const filePath = request.url.replace('lossless://', '')
    return net.fetch('file://' + decodeURIComponent(filePath))
  })

  initDatabase()
  // Set app user model id for windows
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
    properties: ['openDirectory']
  })
  if (!canceled) {
    return filePaths[0]
  }
  return null
})

ipcMain.handle('get-tracks', () => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT tracks.*, artists.name as artist_name, albums.title as album_title 
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
  return rows
})

ipcMain.handle('get-albums', () => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT albums.*, artists.name as artist_name 
    FROM albums 
    LEFT JOIN artists ON albums.artist_id = artists.id
    ORDER BY artists.name COLLATE NOCASE ASC, albums.title COLLATE NOCASE ASC
  `).all()
  return rows
})

ipcMain.handle('get-album-tracks', (_, albumId: number) => {
  const db = getDb()
  const rows = db.prepare(`
    SELECT tracks.*, artists.name as artist_name, albums.title as album_title 
    FROM tracks 
    LEFT JOIN artists ON tracks.artist_id = artists.id 
    LEFT JOIN albums ON tracks.album_id = albums.id
    WHERE tracks.album_id = ?
    ORDER BY tracks.disc_number ASC, tracks.track_number ASC, tracks.path ASC
  `).all(albumId)
  return rows
})

ipcMain.handle('clear-library', () => {
  const db = getDb()
  db.exec(`
    DROP TABLE IF EXISTS tracks;
    DROP TABLE IF EXISTS albums;
    DROP TABLE IF EXISTS artists;
    DROP TABLE IF EXISTS library_folders;
  `)
  initDatabase()
})

import { extractMissingArtwork } from './scanner/artwork'

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
  // This just removes it from the table for now. 
  // Full deletion would delete tracks, but user can use Clear Library for full wipe.
  const db = getDb()
  db.prepare(`DELETE FROM library_folders WHERE path = ?`).run(folderPath)
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

// End of file
