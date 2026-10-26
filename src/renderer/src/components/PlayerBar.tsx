import React from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Mic2, Disc } from 'lucide-react'

interface PlayerBarProps {
  player: any
  onToggleLyrics: () => void
  isLyricsOpen: boolean
}

function formatTime(seconds: number) {
  if (isNaN(seconds) || !seconds) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function PlayerBar({ player, onToggleLyrics, isLyricsOpen }: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    playNext,
    playPrevious,
    seek,
    setVolume
  } = player

  const art = currentTrack?.artwork_path
  const hasArt = art && art !== 'NONE' && art !== 'ERROR'

  return (
    <div className="player-inner">
      <div className="now-playing">
        <div className="now-playing-art">
          {hasArt ? (
            <img src={`lossless://${encodeURIComponent(art)}`} alt="" />
          ) : (
            <Disc size={22} />
          )}
        </div>
        {currentTrack ? (
          <div className="now-playing-meta">
            <div className="now-playing-title">{currentTrack.title || currentTrack.filename}</div>
            <div className="now-playing-artist">{currentTrack.artist_name || 'Unknown Artist'}</div>
            <div className="now-playing-tech">
              {currentTrack.format}
              {currentTrack.bit_depth ? ` · ${currentTrack.bit_depth}-bit` : ''}
              {currentTrack.sample_rate ? ` · ${currentTrack.sample_rate / 1000} kHz` : ''}
            </div>
          </div>
        ) : (
          <div className="now-playing-meta">
            <div className="now-playing-idle">Nothing is playing</div>
          </div>
        )}
      </div>

      <div className="controls-center">
        <div className="transport">
          <button className="icon-btn" onClick={playPrevious} title="Previous">
            <SkipBack size={20} />
          </button>
          <button className="play-btn" onClick={togglePlay} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
          </button>
          <button className="icon-btn" onClick={playNext} title="Next">
            <SkipForward size={20} />
          </button>
        </div>
        <div className="seek-row">
          <span>{formatTime(progress)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress || 0}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="controls-right">
        <button
          className={`icon-btn ${isLyricsOpen ? 'active' : ''}`}
          onClick={onToggleLyrics}
          title="Toggle lyrics"
        >
          <Mic2 size={18} />
        </button>
        <Volume2 size={16} />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="volume-slider"
        />
      </div>
    </div>
  )
}
