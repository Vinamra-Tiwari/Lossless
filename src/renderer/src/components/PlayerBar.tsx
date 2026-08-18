import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react'

interface PlayerBarProps {
  player: any
}

function formatTime(seconds: number) {
  if (isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayerBar({ player }: PlayerBarProps) {
  const { currentTrack, isPlaying, progress, duration, volume, togglePlay, nextTrack, prevTrack, seek, setVolume } = player

  return (
    <div className="player-inner" style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
      
      {/* Now Playing Info */}
      <div className="now-playing" style={{ width: '30%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {currentTrack ? (
          <>
            <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>
              {currentTrack.title || currentTrack.filename}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {currentTrack.artist_name || 'Unknown Artist'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-color)', marginTop: '2px', opacity: 0.8 }}>
              {currentTrack.format} • {currentTrack.bit_depth || 16}-bit • {(currentTrack.sample_rate || 44100) / 1000} kHz
            </div>
          </>
        ) : (
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Nothing is playing</div>
        )}
      </div>

      {/* Controls */}
      <div className="controls-center" style={{ width: '40%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={prevTrack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <SkipBack size={20} />
          </button>
          <button onClick={togglePlay} style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
          </button>
          <button onClick={nextTrack} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <SkipForward size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>{formatTime(progress)}</span>
          <input 
            type="range" 
            min="0" 
            max={duration || 100} 
            value={progress || 0} 
            onChange={(e) => seek(Number(e.target.value))}
            style={{ flex: 1, height: '4px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume & Extras */}
      <div className="controls-right" style={{ width: '30%', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
        <Volume2 size={16} color="var(--text-secondary)" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={(e) => setVolume(Number(e.target.value))}
          style={{ width: '80px', height: '4px', accentColor: 'var(--accent-color)', cursor: 'pointer' }}
        />
      </div>

    </div>
  )
}
