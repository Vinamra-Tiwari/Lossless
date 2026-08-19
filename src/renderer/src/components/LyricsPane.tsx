import React, { useState, useEffect } from 'react'
import { Edit2, Save, DownloadCloud } from 'lucide-react'

interface LyricsPaneProps {
  track: any
  isOpen: boolean
  onLyricsUpdate: (lyrics: string) => void
}

export function LyricsPane({ track, isOpen, onLyricsUpdate }: LyricsPaneProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState('')
  const [isFetching, setIsFetching] = useState(false)

  // Reset state when track changes
  useEffect(() => {
    setIsEditing(false)
    setEditText(track?.lyrics || '')
  }, [track?.id, track?.lyrics])

  const handleSave = async () => {
    if (track) {
      await window.api.saveLyrics(track.id, editText)
      onLyricsUpdate(editText)
      setIsEditing(false)
    }
  }

  const handleFetchWeb = async () => {
    if (!track) return
    setIsFetching(true)
    const lyrics = await window.api.fetchOnlineLyrics(track.id, track.artist_name || 'Unknown', track.title)
    if (lyrics) {
      onLyricsUpdate(lyrics)
      setEditText(lyrics)
    } else {
      alert("No lyrics found online for this track.")
    }
    setIsFetching(false)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: '90px', // above playerbar
      width: '400px',
      backgroundColor: 'var(--bg-primary)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '32px',
      overflowY: 'auto',
      zIndex: 10,
      boxShadow: '-8px 0 24px rgba(0,0,0,0.5)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>{track?.title || 'Unknown Track'}</h2>
          <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 32px 0', fontWeight: 400 }}>{track?.artist_name || 'Unknown Artist'}</h3>
        </div>
        
        {track && (
          <div style={{ display: 'flex', gap: '8px' }}>
            {isEditing ? (
              <button onClick={handleSave} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Save size={16} /> Save
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                <Edit2 size={16} /> Edit
              </button>
            )}
          </div>
        )}
      </div>
      
      {isEditing ? (
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          style={{ 
            width: '100%', 
            height: 'calc(100% - 100px)', 
            backgroundColor: 'rgba(255,255,255,0.05)', 
            border: '1px solid rgba(255,255,255,0.2)', 
            color: 'var(--text-primary)', 
            padding: '16px', 
            borderRadius: '8px', 
            fontSize: '14px', 
            fontFamily: 'system-ui, -apple-system, sans-serif', 
            resize: 'none',
            outline: 'none',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
          }}
        />
      ) : track && track.lyrics ? (
        <div style={{
          whiteSpace: 'pre-wrap',
          fontSize: '16px',
          lineHeight: '1.8',
          color: 'var(--text-primary)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {track.lyrics}
        </div>
      ) : (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '64px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <p>No lyrics found in file metadata.</p>
          {track && (
            <button 
              onClick={handleFetchWeb} 
              disabled={isFetching}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '20px', padding: '8px 16px', cursor: isFetching ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, opacity: isFetching ? 0.5 : 1 }}
            >
              <DownloadCloud size={18} /> {isFetching ? 'Searching...' : 'Fetch from Web'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
