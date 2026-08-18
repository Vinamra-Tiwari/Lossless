import React from 'react'

interface LyricsPaneProps {
  track: any
  isOpen: boolean
}

export function LyricsPane({ track, isOpen }: LyricsPaneProps) {
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
      <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 8px 0' }}>{track?.title || 'Unknown Track'}</h2>
      <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 32px 0', fontWeight: 400 }}>{track?.artist_name || 'Unknown Artist'}</h3>
      
      {track && track.lyrics ? (
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
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '64px' }}>
          <p>No lyrics found in file metadata.</p>
        </div>
      )}
    </div>
  )
}
