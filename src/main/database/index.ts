import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import fs from 'fs'

const dbPath = join(app.getPath('userData'), 'lossless.db')
const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

export function initDatabase() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS library_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS artists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist_id INTEGER,
      year INTEGER,
      artwork_path TEXT,
      FOREIGN KEY (artist_id) REFERENCES artists (id),
      UNIQUE(title, artist_id)
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      path TEXT UNIQUE NOT NULL,
      filename TEXT NOT NULL,
      title TEXT,
      artist_id INTEGER,
      album_id INTEGER,
      album_artist TEXT,
      genre TEXT,
      year INTEGER,
      track_number INTEGER,
      disc_number INTEGER,
      duration REAL,
      format TEXT,
      codec TEXT,
      bitrate INTEGER,
      sample_rate INTEGER,
      bit_depth INTEGER,
      channels INTEGER,
      lyrics TEXT,
      date_added DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_modified INTEGER,
      FOREIGN KEY (artist_id) REFERENCES artists (id),
      FOREIGN KEY (album_id) REFERENCES albums (id)
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_path ON tracks(path);
    CREATE INDEX IF NOT EXISTS idx_tracks_album ON tracks(album_id);
    CREATE INDEX IF NOT EXISTS idx_tracks_artist ON tracks(artist_id);
    CREATE INDEX IF NOT EXISTS idx_albums_artist ON albums(artist_id);
  `)
}

export function getDb() {
  return db
}
