import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../types'

const AUDIO_ERROR_MESSAGE =
  "This track couldn't be loaded. Check that the audio file exists in public/music."

export function useAudioPlayer(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null)
  const currentIndexRef = useRef(0)
  const tracksRef = useRef(tracks)
  const isPlayingRef = useRef(false)
  const autoplayRef = useRef(false)
  const loadTimeoutRef = useRef<number | null>(null)
  const lastNavigationRef = useRef(0)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [committedIndex, setCommittedIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.7
    const saved = localStorage.getItem('music-volume')
    const v = saved ? parseFloat(saved) : 0.7
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7
  })

  const currentTrack = tracks[currentIndex] ?? null

  useEffect(() => {
    tracksRef.current = tracks
  }, [tracks])

  useEffect(() => {
    const audio = new Audio()
    const preloadAudio = new Audio()
    audio.preload = 'auto'
    preloadAudio.preload = 'auto'
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music-volume') : null
    const v = saved ? parseFloat(saved) : 0.7
    audio.volume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7
    preloadAudio.volume = audio.volume
    audioRef.current = audio
    preloadAudioRef.current = preloadAudio

    const audioElements = [audio, preloadAudio]
    const listeners = audioElements.map((element) => {
      const handleTimeUpdate = () => {
        if (element === audioRef.current) {
          setCurrentTime(element.currentTime)

          const nextDuration = Number.isFinite(element.duration)
            ? element.duration
            : 0

          if (nextDuration > 0) {
            setDuration(nextDuration)
          }
        }
      }

      const handleDurationChange = () => {
        if (element === audioRef.current) {
          const nextDuration = Number.isFinite(element.duration)
            ? element.duration
            : 0

          if (nextDuration > 0) {
            setDuration(nextDuration)
          }
        }
      }

      const handleLoadedMetadata = () => {
        if (element === audioRef.current) {
          const nextDuration = Number.isFinite(element.duration)
            ? element.duration
            : 0

          if (nextDuration > 0) {
            setDuration(nextDuration)
          }
        }
      }

      const handlePlay = () => {
        if (element === audioRef.current) {
          isPlayingRef.current = true
          setIsPlaying(true)
        }
      }

      const handlePause = () => {
        if (element === audioRef.current) {
          isPlayingRef.current = false
          setIsPlaying(false)
        }
      }

      const handleEnded = () => {
        if (element !== audioRef.current) {
          return
        }

        const playlist = tracksRef.current

        if (playlist.length === 0) {
          return
        }

        if (playlist.length === 1) {
          element.currentTime = 0
          setCurrentTime(0)
          void element.play().catch(() => {
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
        if (element !== audioRef.current || !element.currentSrc) {
          return
        }

        isPlayingRef.current = false
        setIsPlaying(false)
        setTrackError(AUDIO_ERROR_MESSAGE)
      }

      element.addEventListener('timeupdate', handleTimeUpdate)
      element.addEventListener('durationchange', handleDurationChange)
      element.addEventListener('loadedmetadata', handleLoadedMetadata)
      element.addEventListener('play', handlePlay)
      element.addEventListener('pause', handlePause)
      element.addEventListener('ended', handleEnded)
      element.addEventListener('error', handleError)

      return {
        handleTimeUpdate,
        handleDurationChange,
        handleLoadedMetadata,
        handlePlay,
        handlePause,
        handleEnded,
        handleError,
      }
    })

    return () => {
      audioElements.forEach((element, index) => {
        const listener = listeners[index]
        element.pause()
        element.removeEventListener('timeupdate', listener.handleTimeUpdate)
        element.removeEventListener('durationchange', listener.handleDurationChange)
        element.removeEventListener('loadedmetadata', listener.handleLoadedMetadata)
        element.removeEventListener('play', listener.handlePlay)
        element.removeEventListener('pause', listener.handlePause)
        element.removeEventListener('ended', listener.handleEnded)
        element.removeEventListener('error', listener.handleError)
        element.removeAttribute('src')
        element.load()
      })
      audioRef.current = null
      preloadAudioRef.current = null
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

    if (!currentTrack) {
      autoplayRef.current = false
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
      audio.removeAttribute('src')
      audio.load()
      return
    }

    const targetTrack = currentTrack
    const targetIndex = currentIndex

    const commitTrack = () => {
      loadTimeoutRef.current = null

      const activeAudio = audioRef.current

      if (!activeAudio) {
        return
      }

      const preloadAudio = preloadAudioRef.current
      const isPreloaded =
        preloadAudio?.getAttribute('src') === targetTrack.src &&
        !preloadAudio.error

      if (isPreloaded && preloadAudio) {
        activeAudio.pause()
        audioRef.current = preloadAudio
        preloadAudioRef.current = activeAudio
      } else {
        activeAudio.src = targetTrack.src
        activeAudio.load()
      }

      const nextActive = audioRef.current

      if (nextActive) {
        const activeDuration = nextActive.duration

        if (Number.isFinite(activeDuration) && activeDuration > 0) {
          setDuration(activeDuration)
        }

        const activeTime = nextActive.currentTime
        setCurrentTime(Number.isFinite(activeTime) ? activeTime : 0)
      }

      setCommittedIndex(targetIndex)

      if (autoplayRef.current) {
        autoplayRef.current = false
        void nextActive?.play().catch(() => {
          setIsPlaying(false)
          setTrackError(AUDIO_ERROR_MESSAGE)
        })
      }
    }

    if (loadTimeoutRef.current !== null) {
      window.clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = null
    }

    const now =
      typeof performance !== 'undefined' ? performance.now() : Date.now()
    const isRapidNavigation = now - lastNavigationRef.current < 220
    lastNavigationRef.current = now

    const preloadAudio = preloadAudioRef.current
    const alreadyPreloaded =
      preloadAudio?.getAttribute('src') === targetTrack.src && !preloadAudio.error

    if (alreadyPreloaded || !isRapidNavigation) {
      commitTrack()
    } else {
      loadTimeoutRef.current = window.setTimeout(commitTrack, 200)
    }

    return () => {
      if (loadTimeoutRef.current !== null) {
        window.clearTimeout(loadTimeoutRef.current)
        loadTimeoutRef.current = null
      }
    }
  }, [currentTrack, currentIndex])

  useEffect(() => {
    const preloadAudio = preloadAudioRef.current
    const currentAudio = audioRef.current

    if (!preloadAudio || !currentAudio || tracks.length < 2 || committedIndex < 0) {
      if (preloadAudio) {
        preloadAudio.pause()
        preloadAudio.removeAttribute('src')
        preloadAudio.load()
      }
      return
    }

    const nextTrack = tracks[(committedIndex + 1) % tracks.length]
    if (!nextTrack) {
      return
    }

    if (preloadAudio.getAttribute('src') !== nextTrack.src) {
      preloadAudio.src = nextTrack.src
      preloadAudio.load()
    }
  }, [committedIndex, tracks])

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
      autoplayRef.current = false
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

  const seekBy = useCallback((seconds: number) => {
    const audio = audioRef.current

    if (!audio || !Number.isFinite(audio.duration)) {
      return
    }

    const nextTime = Math.max(
      0,
      Math.min(audio.duration, audio.currentTime + seconds),
    )
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    if (typeof window !== 'undefined') {
      localStorage.setItem('music-volume', clamped.toString())
    }
    for (const audio of [audioRef.current, preloadAudioRef.current]) {
      if (audio) {
        audio.volume = clamped
      }
    }
  }, [])

  const adjustVolume = useCallback(
    (delta: number) => {
      setVolumeState((prev) => {
        const clamped = Math.max(0, Math.min(1, prev + delta))
        if (typeof window !== 'undefined') {
          localStorage.setItem('music-volume', clamped.toString())
        }
        for (const audio of [audioRef.current, preloadAudioRef.current]) {
          if (audio) {
            audio.volume = clamped
          }
        }
        return clamped
      })
    },
    [],
  )

  return {
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    trackError,
    volume,
    togglePlayback,
    selectTrack,
    next,
    previous,
    seek,
    seekBy,
    adjustVolume,
    setVolume,
    retry: startPlayback,
  }
}
