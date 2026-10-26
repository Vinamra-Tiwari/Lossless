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
  const queueRef = useRef<any[]>([])
  const indexRef = useRef(-1)
  const playingRef = useRef(false)

  queueRef.current = queue
  indexRef.current = currentIndex
  playingRef.current = isPlaying

  useEffect(() => {
    const audio = new Audio()
    audioRef.current = audio

    const updateProgress = () => setProgress(audio.currentTime)
    const updateDuration = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)

    const handleEnded = () => {
      const next = indexRef.current + 1
      if (next < queueRef.current.length) {
        setCurrentIndex(next)
      } else {
        setIsPlaying(false)
      }
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
  }, [])

  useEffect(() => {
    const track = queue[currentIndex]
    const audio = audioRef.current
    if (!track || !audio) return

    if (currentPathRef.current !== track.path) {
      currentPathRef.current = track.path
      audio.src = `lossless://${encodeURIComponent(track.path)}`
      audio.volume = volume
      setProgress(0)
      setIsPlaying(true)
      audio.play().catch((err) => console.error('Playback failed:', err))
    }
  }, [currentIndex, queue])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audio.src) return

    if (isPlaying) {
      audio.play().catch((err) => console.error('Playback failed:', err))
    } else {
      audio.pause()
    }
  }, [isPlaying])

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

  const togglePlay = () => {
    if (currentIndex < 0 && queue.length === 0) return
    setIsPlaying((prev) => !prev)
  }

  const playNext = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const playPrevious = () => {
    if (progress > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0
      setProgress(0)
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
      setQueue(queue.map((t) => (t.id === track.id ? { ...t, lyrics } : t)))
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
    playNext,
    playPrevious,
    seek,
    setVolume: setVolumeLevel,
    updateTrackLyrics
  }
}
