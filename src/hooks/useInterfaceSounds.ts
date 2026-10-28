import { useCallback, useEffect, useRef, useState } from 'react'

type AudioContextConstructor = typeof AudioContext

const MASTER_VOLUME = 0.12

function getAudioContextConstructor() {
  if (typeof window === 'undefined') {
    return null
  }

  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext ??
    null
  )
}

export function useInterfaceSounds() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true
    const saved = localStorage.getItem('clicker-enabled')
    if (saved === null) return true
    return saved === 'true'
  })
  const soundEnabledRef = useRef(soundEnabled)
  const contextRef = useRef<AudioContext | null>(null)
  const masterRef = useRef<GainNode | null>(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    soundEnabledRef.current = soundEnabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('clicker-enabled', soundEnabled.toString())
    }
  }, [soundEnabled])

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => {
      reducedMotionRef.current = query.matches
    }

    update()
    query.addEventListener('change', update)

    return () => {
      query.removeEventListener('change', update)
    }
  }, [])

  useEffect(() => {
    return () => {
      const context = contextRef.current
      contextRef.current = null
      masterRef.current = null

      if (context && context.state !== 'closed') {
        void context.close()
      }
    }
  }, [])

  const ensureAudio = useCallback(() => {
    if (!contextRef.current) {
      const AudioContextClass = getAudioContextConstructor()

      if (!AudioContextClass) {
        return null
      }

      const context = new AudioContextClass()
      const master = context.createGain()
      master.gain.value = MASTER_VOLUME
      master.connect(context.destination)
      contextRef.current = context
      masterRef.current = master
    }

    if (contextRef.current.state === 'suspended') {
      void contextRef.current.resume()
    }

    return contextRef.current
  }, [])

  const playTone = useCallback(
    (
      frequency: number,
      duration: number,
      type: OscillatorType,
      volume: number,
      delay = 0,
    ) => {
      if (!soundEnabledRef.current) {
        return
      }

      const context = ensureAudio()
      const master = masterRef.current

      if (!context || !master) {
        return
      }

      const start = context.currentTime + delay
      const oscillator = context.createOscillator()
      const envelope = context.createGain()

      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, start)
      envelope.gain.setValueAtTime(0.0001, start)
      envelope.gain.exponentialRampToValueAtTime(volume * 1.2, start + 0.002)
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)

      oscillator.connect(envelope)
      envelope.connect(master)
      oscillator.start(start)
      oscillator.stop(start + duration + 0.02)
    },
    [ensureAudio],
  )

  const playClick = useCallback(() => {
    playTone(1200, 0.018, 'square', 0.9)
    playTone(800, 0.012, 'triangle', 0.4, 0.004)
  }, [playTone])

  const playTick = useCallback(() => {
    playTone(2200, 0.01, 'square', 0.7)
  }, [playTone])

  const playSelect = useCallback(() => {
    playTone(900, 0.022, 'square', 0.95)
    playTone(1400, 0.016, 'triangle', 0.5, 0.008)
  }, [playTone])

  const vibrate = useCallback((duration: number | number[]) => {
    if (reducedMotionRef.current) {
      return
    }

    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
      return
    }

    try {
      navigator.vibrate(duration)
    } catch {
      return
    }
  }, [])

  const toggleSound = useCallback(() => {
    const next = !soundEnabled

    if (!next) {
      playTick()
      setSoundEnabled(false)
      return
    }

    setSoundEnabled(true)
    ensureAudio()
    playTone(900, 0.04, 'triangle', 0.7)
    playTone(1400, 0.045, 'triangle', 0.5, 0.03)
  }, [ensureAudio, playTone, playTick, soundEnabled])

  return {
    soundEnabled,
    toggleSound,
    playClick,
    playTick,
    playSelect,
    vibrate,
  }
}
