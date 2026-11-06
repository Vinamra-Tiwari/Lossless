import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface PersonalNotesModalProps {
  track?: any
  album?: any
  onClose: () => void
}

export function PersonalNotesModal({ track, album, onClose }: PersonalNotesModalProps) {
  const [kind, setKind] = useState<'track' | 'album'>('track')
  const [trackNote, setTrackNote] = useState('')
  const [albumNote, setAlbumNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const trackId = track?.id
  const albumId = album?.id ?? track?.album_id
  const hasTrack = Number.isInteger(trackId)
  const hasAlbum = Number.isInteger(albumId)

  useEffect(() => {
    let active = true
    setKind(hasTrack ? 'track' : 'album')
    setLoading(true)
    setMessage('')
    Promise.all([
      hasTrack ? window.api.getPersonalNote('track', trackId) : Promise.resolve(null),
      hasAlbum ? window.api.getPersonalNote('album', albumId) : Promise.resolve(null)
    ]).then(([song, album]) => {
      if (!active) return
      setTrackNote(song || '')
      setAlbumNote(album || '')
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setMessage('Could not load your notes.')
      setLoading(false)
    })
    return () => { active = false }
  }, [trackId, albumId, hasTrack, hasAlbum])

  const save = async () => {
    const id = kind === 'track' ? trackId : albumId
    if (!id) return
    setSaving(true)
    setMessage('')
    try {
      await window.api.savePersonalNote(kind, id, kind === 'track' ? trackNote : albumNote)
      setMessage('Saved on this device')
    } catch {
      setMessage('Could not save your note.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop notes-backdrop" onClick={onClose}>
      <section
        className="modal notes-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="personal-notes-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.key === 'Escape' && onClose()}
      >
        <header className="notes-heading">
          <div>
            <div className="eyebrow">Private to your library</div>
            <h3 id="personal-notes-title">Personal notes</h3>
            <p>
              {album
                ? `${album.title || 'Unknown album'} · ${album.artist_name || 'Unknown artist'}`
                : track
                  ? `${track.title || track.filename} · ${track.artist_name || 'Unknown artist'}`
                  : 'Select a song or album to start a note.'}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close personal notes">
            <X size={18} />
          </button>
        </header>

        <div className="note-tabs" role="tablist" aria-label="Note type">
          <button className={kind === 'track' ? 'active' : ''} disabled={!hasTrack} onClick={() => { setKind('track'); setMessage('') }}>
            This song
          </button>
          <button
            className={kind === 'album' ? 'active' : ''}
            disabled={!hasAlbum}
            onClick={() => { setKind('album'); setMessage('') }}
          >
            This album
          </button>
        </div>

        <label className="note-label" htmlFor="personal-note-text">
          {kind === 'track' ? 'What do you want to remember about this song?' : 'What do you want to remember about this album?'}
        </label>
        <textarea
          id="personal-note-text"
          className="note-textarea"
          autoFocus
          placeholder={kind === 'track' ? 'A memory, a detail, what you love about it…' : 'Your thoughts, context, or favorite details…'}
          value={kind === 'track' ? trackNote : albumNote}
          onChange={(event) => kind === 'track' ? setTrackNote(event.target.value) : setAlbumNote(event.target.value)}
          disabled={loading}
        />
        <footer className="modal-actions notes-actions">
          <span className="note-save-status">{loading ? 'Loading notes…' : message}</span>
          <button className="ghost-btn" onClick={onClose}>Done</button>
          <button className="primary-btn" onClick={save} disabled={loading || saving || (kind === 'album' && !hasAlbum)}>
            {saving ? 'Saving…' : 'Save note'}
          </button>
        </footer>
      </section>
    </div>
  )
}
