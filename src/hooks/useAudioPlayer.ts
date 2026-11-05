import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../types'

const AUDIO_ERROR_MESSAGE =
  "This track couldn't be loaded. Check that the audio file exists in public/music."

const PRELOAD_SLOTS = 2
const PREFETCH_DELAY = 800

function isAbortError(error: unknown) {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
}

function getPreloadLimit() {
  if (typeof navigator === 'undefined') {
    return PRELOAD_SLOTS
  }

  if (!navigator.onLine) {
    return 0
  }

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }
  ).connection

  if (!connection) {
    return PRELOAD_SLOTS
  }

  if (connection.saveData) {
    return 1
  }

  const effectiveType = connection.effectiveType
  if (
    effectiveType === 'slow-2g' ||
    effectiveType === '2g' ||
    effectiveType === '3g'
  ) {
    return 1
  }

  return PRELOAD_SLOTS
}

export function useAudioPlayer(tracks: Track[]) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const spareAudioRefs = useRef<HTMLAudioElement[]>([])
  const currentIndexRef = useRef(0)
  const tracksRef = useRef(tracks)
  const isPlayingRef = useRef(false)
  const autoplayRef = useRef(false)
  const directionRef = useRef<1 | -1>(1)
  const loadTimeoutRef = useRef<number | null>(null)
  const lastNavigationRef = useRef(0)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [committedIndex, setCommittedIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
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
    const spares = Array.from({ length: PRELOAD_SLOTS }, () => new Audio())
    const audioElements = [audio, ...spares]
    const saved = typeof window !== 'undefined' ? localStorage.getItem('music-volume') : null
    const v = saved ? parseFloat(saved) : 0.7
    const initialVolume = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7

    for (const element of audioElements) {
      element.preload = 'auto'
      element.volume = initialVolume
    }

    audioRef.current = audio
    spareAudioRefs.current = spares

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

      const handleWaiting = () => {
        if (element === audioRef.current) {
          setIsBuffering(true)
        }
      }

      const handleCanPlay = () => {
        if (element === audioRef.current) {
          setIsBuffering(false)
        }
      }

      const handlePlaying = () => {
        if (element === audioRef.current) {
          setIsBuffering(false)
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
          void element.play().catch((error) => {
            if (isAbortError(error) || audioRef.current !== element) {
              return
            }
            setIsPlaying(false)
            if (!element.error) {
              return
            }
            setTrackError(AUDIO_ERROR_MESSAGE)
          })
          return
        }

        const nextIndex = (currentIndexRef.current + 1) % playlist.length
        autoplayRef.current = true
        directionRef.current = 1
        currentIndexRef.current = nextIndex
        setCurrentIndex(nextIndex)
      }

      const handleError = () => {
        if (element !== audioRef.current) {
          return
        }

        const mediaError = element.error
        if (!mediaError || mediaError.code === MediaError.MEDIA_ERR_ABORTED) {
          return
        }

        const expected = tracksRef.current[currentIndexRef.current]
        if (!expected || element.getAttribute('src') !== expected.src) {
          return
        }

        isPlayingRef.current = false
        setIsPlaying(false)
        setIsBuffering(false)
        setTrackError(AUDIO_ERROR_MESSAGE)
      }

      element.addEventListener('timeupdate', handleTimeUpdate)
      element.addEventListener('durationchange', handleDurationChange)
      element.addEventListener('loadedmetadata', handleLoadedMetadata)
      element.addEventListener('play', handlePlay)
      element.addEventListener('pause', handlePause)
      element.addEventListener('waiting', handleWaiting)
      element.addEventListener('canplay', handleCanPlay)
      element.addEventListener('playing', handlePlaying)
      element.addEventListener('ended', handleEnded)
      element.addEventListener('error', handleError)

      return {
        handleTimeUpdate,
        handleDurationChange,
        handleLoadedMetadata,
        handlePlay,
        handlePause,
        handleWaiting,
        handleCanPlay,
        handlePlaying,
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
        element.removeEventListener('waiting', listener.handleWaiting)
        element.removeEventListener('canplay', listener.handleCanPlay)
        element.removeEventListener('playing', listener.handlePlaying)
        element.removeEventListener('ended', listener.handleEnded)
        element.removeEventListener('error', listener.handleError)
        element.removeAttribute('src')
        element.load()
      })
      audioRef.current = null
      spareAudioRefs.current = []
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
    setIsBuffering(currentTrack !== null)

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

      const spares = spareAudioRefs.current
      let preloaded: HTMLAudioElement | null = null
      let preloadedSlot = -1

      for (let i = 0; i < spares.length; i += 1) {
        const spare = spares[i]
        if (
          spare.getAttribute('src') === targetTrack.src &&
          !spare.error
        ) {
          preloaded = spare
          preloadedSlot = i
          break
        }
      }

      if (preloaded && preloadedSlot >= 0) {
        activeAudio.pause()
        audioRef.current = preloaded
        spares[preloadedSlot] = activeAudio
      } else {
        activeAudio.src = targetTrack.src
        activeAudio.load()
      }

      const nextActive = audioRef.current

      for (const spare of spareAudioRefs.current) {
        if (spare === nextActive) {
          continue
        }
        if (spare.getAttribute('src')) {
          spare.pause()
          spare.removeAttribute('src')
          spare.load()
        }
      }

      if (nextActive) {
        if (nextActive.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
          setIsBuffering(false)
        }

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
        void nextActive?.play().catch((error) => {
          if (isAbortError(error) || audioRef.current !== nextActive) {
            return
          }
          setIsPlaying(false)
          if (!nextActive?.error) {
            return
          }
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

    const alreadyPreloaded = spareAudioRefs.current.some(
      (spare) =>
        spare.getAttribute('src') === targetTrack.src && !spare.error,
    )

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
    const stopSpares = () => {
      const currentAudio = audioRef.current
      for (const spare of spareAudioRefs.current) {
        if (spare === currentAudio) {
          continue
        }
        spare.pause()
        spare.removeAttribute('src')
        spare.load()
      }
    }

    const currentAudio = audioRef.current

    if (
      !currentAudio ||
      tracks.length < 2 ||
      committedIndex < 0 ||
      currentAudio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
    ) {
      stopSpares()
      return
    }

    const preloadLimit = getPreloadLimit()
    const upcoming: Track[] = []
    const seen = new Set<string>()

    for (let distance = 1; distance <= preloadLimit; distance += 1) {
      const offset = directionRef.current * distance
      const track =
        tracks[
          ((committedIndex + offset) % tracks.length + tracks.length) %
            tracks.length
        ]
      if (!track || seen.has(track.src)) {
        continue
      }
      seen.add(track.src)
      upcoming.push(track)
    }

    const timeout = window.setTimeout(() => {
      const activeAudio = audioRef.current

      if (
        !activeAudio ||
        activeAudio.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
      ) {
        return
      }

      spareAudioRefs.current.forEach((spare, index) => {
        if (spare === activeAudio) {
          return
        }

        const target = upcoming[index]

        if (!target) {
          if (spare.getAttribute('src')) {
            spare.pause()
            spare.removeAttribute('src')
            spare.load()
          }
          return
        }

        if (spare.getAttribute('src') !== target.src) {
          spare.src = target.src
          spare.load()
        }
      })
    }, PREFETCH_DELAY)

    return () => window.clearTimeout(timeout)
  }, [committedIndex, tracks, isBuffering])

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
    } catch (error) {
      if (isAbortError(error) || audioRef.current !== audio) {
        return
      }
      isPlayingRef.current = false
      setIsPlaying(false)
      if (!audio.error) {
        return
      }
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
          void audio.play().catch((error) => {
            if (isAbortError(error) || audioRef.current !== audio) {
              return
            }
            setIsPlaying(false)
            if (!audio.error) {
              return
            }
            setTrackError(AUDIO_ERROR_MESSAGE)
          })
        }
      }
      return
    }

    autoplayRef.current = autoplay
    directionRef.current = index > currentIndexRef.current ? 1 : -1
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
    for (const audio of [audioRef.current, ...spareAudioRefs.current]) {
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
        for (const audio of [audioRef.current, ...spareAudioRefs.current]) {
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
    isBuffering,
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
