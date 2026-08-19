import { useState, useEffect, useRef } from 'react'

export function usePlayer() {
  const [queue, setQueue] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentPathRef = useRef<string>('')

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const updateProgress = () => setProgress(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    
    const handleEnded = () => {
      // Auto-play next track
      setCurrentIndex((prev) => {
        if (prev < queue.length - 1) return prev + 1
        return prev
      })
    }

    audio.addEventListener('timeupdate', updateProgress)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateProgress)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.pause()
      audio.src = ''
      currentPathRef.current = ''
    }
  }, [queue.length]) // queue.length is safe to track here since we just want it once per session basically? Wait, if we change queue completely... wait.

  // When currentIndex or queue changes, play new track
  useEffect(() => {
    const track = queue[currentIndex]
    const audio = audioRef.current
    if (track && audio) {
      if (currentPathRef.current !== track.path) {
        currentPathRef.current = track.path
        // Use our custom lossless:// protocol
        audio.src = `lossless://${encodeURIComponent(track.path)}`
        audio.volume = volume
        if (isPlaying) {
          audio.play().catch(err => console.error("Playback failed:", err))
        } else {
          // If it wasn't playing, auto-play when selecting a new track
          setIsPlaying(true)
          audio.play().catch(err => console.error("Playback failed:", err))
        }
      }
    }
  }, [currentIndex, queue, isPlaying, volume])

  // Handle Play/Pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return

    if (isPlaying) {
      audio.play().catch(err => console.error("Playback failed:", err))
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // Handle Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const playTrack = (tracks: any[], startIndex: number) => {
    setQueue(tracks)
    setCurrentIndex(startIndex)
    setIsPlaying(true)
  }

  const togglePlay = () => setIsPlaying(!isPlaying)
  
  const nextTrack = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevTrack = () => {
    if (progress > 3) {
      // If played more than 3 seconds, restart current
      if (audioRef.current) audioRef.current.currentTime = 0
    } else if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setProgress(time)
    }
  }

  const setVolumeLevel = (v: number) => {
    if (audioRef.current) {
      audioRef.current.volume = v
    }
    setVolume(v)
  }

  const updateTrackLyrics = (lyrics: string) => {
    const track = queue[currentIndex]
    if (track) {
      setQueue(queue.map(t => t.id === track.id ? { ...t, lyrics } : t))
    }
  }

  return {
    currentTrack: queue[currentIndex],
    queue,
    isPlaying,
    progress,
    duration,
    volume,
    togglePlay,
    playTrack,
    playNext: nextTrack,
    playPrevious: prevTrack,
    seek,
    setVolume: setVolumeLevel,
    updateTrackLyrics
  }
}
