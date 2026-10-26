import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../types'

const AUDIO_ERROR_MESSAGE =
  "This track couldn't be loaded. Check that the audio file exists in public/music."

export function useAudioPlayer(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentIndexRef = useRef(0)
  const tracksRef = useRef(tracks)
  const isPlayingRef = useRef(false)
  const autoplayRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [trackError, setTrackError] = useState<string | null>(null)

  const currentTrack = tracks[currentIndex] ?? null

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleDurationChange = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0)
    }

    const handlePlay = () => {
      isPlayingRef.current = true
      setIsPlaying(true)
    }

    const handlePause = () => {
      isPlayingRef.current = false
      setIsPlaying(false)
    }

    const handleEnded = () => {
      const playlist = tracksRef.current

      if (playlist.length === 0) {
        return
      }

      if (playlist.length === 1) {
        audio.currentTime = 0
        setCurrentTime(0)
        void audio.play().catch(() => {
          setIsPlaying(false)
          setTrackError(AUDIO_ERROR_MESSAGE)
        })
        return
      }

      const nextIndex = (currentIndexRef.current + 1) % playlist.length
      autoplayRef.current = true
      currentIndexRef.current = nextIndex
      setCurrentIndex(nextIndex)
    }

    const handleError = () => {
      if (!audio.currentSrc) {
        return
      }

      isPlayingRef.current = false
      setIsPlaying(false)
      setTrackError(AUDIO_ERROR_MESSAGE)
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    setCurrentTime(0)
    setDuration(0)
    setTrackError(null)
    setIsPlaying(false)
    isPlayingRef.current = false

    if (!currentTrack) {
      autoplayRef.current = false
      audio.removeAttribute('src')
      audio.load()
      return
    }

    audio.src = currentTrack.src
    audio.load()

    if (autoplayRef.current) {
      autoplayRef.current = false
      void audio.play().catch(() => {
        setIsPlaying(false)
        setTrackError(AUDIO_ERROR_MESSAGE)
      })
    }
  }, [currentTrack, currentIndex])

  useEffect(() => {
    if (tracks.length === 0) {
      if (currentIndexRef.current !== 0) {
        currentIndexRef.current = 0
        setCurrentIndex(0)
      }
      return
    }

    if (currentIndexRef.current >= tracks.length) {
      currentIndexRef.current = 0
      setCurrentIndex(0)
    }
  }, [tracks.length])

  const startPlayback = useCallback(async () => {
    const audio = audioRef.current

    if (!audio || tracksRef.current.length === 0) {
      return
    }

    setTrackError(null)

    try {
      if (audio.error) {
        audio.load()
      }
      await audio.play()
    } catch {
      isPlayingRef.current = false
      setIsPlaying(false)
      setTrackError(AUDIO_ERROR_MESSAGE)
    }
  }, [])

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current

    if (!audio || tracksRef.current.length === 0) {
      return
    }

    if (audio.paused) {
      void startPlayback()
    } else {
      audio.pause()
    }
  }, [startPlayback])

  const goToTrack = useCallback((index: number, autoplay: boolean) => {
    const playlist = tracksRef.current

    if (playlist.length === 0) {
      return
    }

    const nextIndex = ((index % playlist.length) + playlist.length) % playlist.length
    setTrackError(null)

    if (nextIndex === currentIndexRef.current) {
      const audio = audioRef.current

      if (audio) {
        audio.currentTime = 0
        setCurrentTime(0)
        if (autoplay) {
          void audio.play().catch(() => {
            setIsPlaying(false)
            setTrackError(AUDIO_ERROR_MESSAGE)
          })
        }
      }
      return
    }

    autoplayRef.current = autoplay
    currentIndexRef.current = nextIndex
    setCurrentIndex(nextIndex)
  }, [])

  const selectTrack = useCallback(
    (index: number) => {
      if (index === currentIndexRef.current) {
        void startPlayback()
        return
      }

      goToTrack(index, true)
    },
    [goToTrack, startPlayback],
  )

  const next = useCallback(() => {
    goToTrack(currentIndexRef.current + 1, isPlayingRef.current)
  }, [goToTrack])

  const previous = useCallback(() => {
    goToTrack(currentIndexRef.current - 1, isPlayingRef.current)
  }, [goToTrack])

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current

    if (!audio || !Number.isFinite(audio.duration)) {
      return
    }

    const nextTime = Math.max(0, Math.min(seconds, audio.duration))
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  return {
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    trackError,
    togglePlayback,
    selectTrack,
    next,
    previous,
    seek,
    retry: startPlayback,
  }
}
