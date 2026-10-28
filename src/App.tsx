import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { ClickWheel } from './components/ClickWheel'
import { Screen } from './components/Screen'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { useInterfaceSounds } from './hooks/useInterfaceSounds'
import { usePlaylist } from './hooks/usePlaylist'
import { MENU_ITEMS, SETTINGS_ITEM_COUNT } from './menu'
import { PLAYLIST_NAME } from './playlist'
import type { MenuView, ScreenView } from './types'

function menuIndexOf(view: MenuView) {
  return MENU_ITEMS.findIndex((item) => item.view === view)
}

async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  return false
}

function App() {
  const { tracks, status, reload } = usePlaylist()
  const {
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
    retry,
  } = useAudioPlayer(tracks)
  const { soundEnabled, toggleSound, playClick, playTick, playSelect, vibrate } =
    useInterfaceSounds()

  const [view, setView] = useState<ScreenView>('nowPlaying')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [menuIndex, setMenuIndex] = useState(0)
  const [settingsIndex, setSettingsIndex] = useState(0)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [backlight, setBacklight] = useState<'low' | 'medium' | 'high'>(() => {
    if (typeof window === 'undefined') return 'medium'
    const saved = localStorage.getItem('backlight')
    if (saved === 'low' || saved === 'medium' || saved === 'high') return saved
    return 'medium'
  })
  const [volumeIndicatorVisible, setVolumeIndicatorVisible] = useState(false)
  const [lcdDimmed, setLcdDimmed] = useState(false)
  const menuReturnView = useRef<ScreenView>('nowPlaying')
  const deviceRef = useRef<HTMLDivElement>(null)
  const inactivityTimeoutRef = useRef<number | null>(null)
  const volumeTimeoutRef = useRef<number | null>(null)
  const hasTracks = status === 'ready' && tracks.length > 0

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('backlight', backlight)
    }
  }, [backlight])

  useEffect(() => {
    if (!shareMessage) {
      return
    }

    const timeout = window.setTimeout(() => setShareMessage(null), 3200)
    return () => window.clearTimeout(timeout)
  }, [shareMessage])

  const wakeScreen = useCallback(() => {
    setLcdDimmed(false)
    if (inactivityTimeoutRef.current !== null) {
      window.clearTimeout(inactivityTimeoutRef.current)
    }
    inactivityTimeoutRef.current = window.setTimeout(() => {
      setLcdDimmed(true)
    }, 30000)
  }, [])

  useEffect(() => {
    wakeScreen()
    return () => {
      if (inactivityTimeoutRef.current !== null) {
        window.clearTimeout(inactivityTimeoutRef.current)
      }
      if (volumeTimeoutRef.current !== null) {
        window.clearTimeout(volumeTimeoutRef.current)
      }
    }
  }, [wakeScreen])

  const showVolumeIndicator = useCallback(() => {
    setVolumeIndicatorVisible(true)
    if (volumeTimeoutRef.current !== null) {
      window.clearTimeout(volumeTimeoutRef.current)
    }
    volumeTimeoutRef.current = window.setTimeout(() => {
      setVolumeIndicatorVisible(false)
    }, 1200)
  }, [])

  const handleMenuAction = useCallback(() => {
    wakeScreen()
    if (view === 'menu') {
      setView(menuReturnView.current)
      return
    }

    menuReturnView.current = view
    setMenuIndex(menuIndexOf(view))
    setView('menu')
  }, [view, wakeScreen])

  const handleMenuSelect = useCallback(
    (target: MenuView) => {
      wakeScreen()
      if (target === 'playlist' || target === 'songs') {
        setSelectedIndex(currentIndex)
      }

      if (target === 'settings') {
        setSettingsIndex(0)
        setShareMessage(null)
      }

      if (target === 'nowPlaying') {
        menuReturnView.current = 'nowPlaying'
      }

      setMenuIndex(menuIndexOf(target))
      setView(target)
    },
    [currentIndex, wakeScreen],
  )

  const handleStep = useCallback(
    (direction: 1 | -1) => {
      wakeScreen()
      if (view === 'nowPlaying' && hasTracks) {
        adjustVolume(direction > 0 ? -0.05 : 0.05)
        showVolumeIndicator()
        return
      }

      if (view === 'menu') {
        setMenuIndex((index) => {
          const nextIdx = index + direction
          if (nextIdx < 0) return 0
          if (nextIdx >= MENU_ITEMS.length) return MENU_ITEMS.length - 1
          return nextIdx
        })
        return
      }

      if (view === 'playlist' || view === 'songs') {
        if (tracks.length === 0) {
          return
        }

        setSelectedIndex((index) => {
          const nextIdx = index + direction
          if (nextIdx < 0) return 0
          if (nextIdx >= tracks.length) return tracks.length - 1
          return nextIdx
        })
        return
      }

      if (view === 'settings') {
        setSettingsIndex((index) => {
          const nextIdx = index + direction
          if (nextIdx < 0) return 0
          if (nextIdx >= SETTINGS_ITEM_COUNT) return SETTINGS_ITEM_COUNT - 1
          return nextIdx
        })
        return
      }

      if (!hasTracks) {
        return
      }
    },
    [
      adjustVolume,
      hasTracks,
      showVolumeIndicator,
      tracks.length,
      view,
      wakeScreen,
    ],
  )

  const handleSelectTrack = useCallback(
    (index: number) => {
      selectTrack(index)
      setSelectedIndex(index)
      setView('nowPlaying')
    },
    [selectTrack],
  )

  const handleTrackPress = useCallback(
    (index: number) => {
      wakeScreen()
      playSelect()
      vibrate(8)
      handleSelectTrack(index)
    },
    [handleSelectTrack, playSelect, vibrate, wakeScreen],
  )

  const handleMenuRowPress = useCallback(
    (target: MenuView, index: number) => {
      wakeScreen()
      playClick()
      vibrate(8)
      setMenuIndex(index)
      handleMenuSelect(target)
    },
    [handleMenuSelect, playClick, vibrate, wakeScreen],
  )

  const handleShare = useCallback(async () => {
    playClick()
    vibrate(8)

    const shareUrl = new URL(window.location.href)
    shareUrl.hash = ''
    const url = shareUrl.toString()
    const shareData = {
      title: document.title,
      text: 'Listen to this local iPod-style player.',
      url,
    }

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData)
        setShareMessage('Shared')
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
      }
    }

    if (await copyToClipboard(url)) {
      setShareMessage('Link copied')
      return
    }

    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.setAttribute('readonly', '')
    textArea.style.position = 'fixed'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.select()

    let copied = false

    try {
      copied = document.execCommand('copy')
    } catch {
      copied = false
    }

    document.body.removeChild(textArea)
    setShareMessage(copied ? 'Link copied' : 'Could not copy link')
  }, [playClick, vibrate])

  const handleClickerToggle = useCallback(() => {
    wakeScreen()
    vibrate(8)
    toggleSound()
  }, [toggleSound, vibrate, wakeScreen])

  const cycleBacklight = useCallback(() => {
    wakeScreen()
    setBacklight((prev) => {
      if (prev === 'low') return 'medium'
      if (prev === 'medium') return 'high'
      return 'low'
    })
  }, [wakeScreen])

  const handleSettingPress = useCallback(
    (index: number) => {
      wakeScreen()
      setSettingsIndex(index)

      if (index === 0) {
        cycleBacklight()
        return
      }

      if (index === 1) {
        handleClickerToggle()
        return
      }

      if (index === 2) {
        void handleShare()
        return
      }
    },
    [cycleBacklight, handleClickerToggle, handleShare, wakeScreen],
  )

  const handleMenuPress = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    handleMenuAction()
  }, [handleMenuAction, playClick, vibrate, wakeScreen])

  const handlePreviousPress = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    if (view === 'nowPlaying' && hasTracks) {
      previous()
      return
    }
    handleStep(-1)
  }, [handleStep, hasTracks, playClick, previous, vibrate, view, wakeScreen])

  const handleNextPress = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    if (view === 'nowPlaying' && hasTracks) {
      next()
      return
    }
    handleStep(1)
  }, [handleStep, hasTracks, next, playClick, vibrate, view, wakeScreen])

  const handleWheelStep = useCallback(
    (direction: 1 | -1) => {
      wakeScreen()
      playTick()
      vibrate(6)
      handleStep(direction)
    },
    [handleStep, playTick, vibrate, wakeScreen],
  )

  const handleScan = useCallback(
    (direction: 1 | -1) => {
      wakeScreen()
      seekBy(direction * 2)
    },
    [seekBy, wakeScreen],
  )

  const handlePlayPausePress = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    togglePlayback()
  }, [playClick, togglePlayback, vibrate, wakeScreen])

  const handleSelectPress = useCallback(() => {
    wakeScreen()
    if (view === 'settings') {
      playSelect()
      handleSettingPress(settingsIndex)
      return
    }

    playSelect()
    vibrate(8)

    if (view === 'menu') {
      handleMenuSelect(MENU_ITEMS[menuIndex].view)
      return
    }

    if (view === 'playlist' || view === 'songs') {
      if (tracks.length === 0) {
        return
      }

      handleSelectTrack(selectedIndex)
      return
    }

    playClick()
    handleMenuAction()
  }, [
    handleMenuAction,
    handleMenuSelect,
    handleSelectTrack,
    handleSettingPress,
    menuIndex,
    playClick,
    playSelect,
    selectedIndex,
    settingsIndex,
    tracks.length,
    vibrate,
    view,
    wakeScreen,
  ])

  const handlePlayNext = useCallback(() => {
    if (tracks.length === 0) {
      return
    }

    handleTrackPress((currentIndex + 1) % tracks.length)
  }, [currentIndex, handleTrackPress, tracks.length])

  const handleRetry = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    void retry()
  }, [playClick, retry, vibrate, wakeScreen])

  const handleReload = useCallback(() => {
    wakeScreen()
    playClick()
    vibrate(8)
    setView('nowPlaying')
    void reload()
  }, [playClick, reload, vibrate, wakeScreen])

  useEffect(() => {
    const device = deviceRef.current

    if (!device) {
      return
    }

    let accumulated = 0
    let resetTimeout: number | null = null

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        return
      }

      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? 400
            : 1
      const delta =
        (Math.abs(event.deltaY) >= Math.abs(event.deltaX)
          ? event.deltaY
          : event.deltaX) * unit

      if (delta === 0) {
        return
      }

      event.preventDefault()
      accumulated += delta

      if (resetTimeout !== null) {
        window.clearTimeout(resetTimeout)
      }

      resetTimeout = window.setTimeout(() => {
        accumulated = 0
      }, 160)

      if (Math.abs(accumulated) < 40) {
        return
      }

      handleWheelStep(accumulated > 0 ? 1 : -1)
      accumulated = 0
    }

    device.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      device.removeEventListener('wheel', handleWheel)

      if (resetTimeout !== null) {
        window.clearTimeout(resetTimeout)
      }
    }
  }, [handleWheelStep])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target

      if (event.altKey || event.ctrlKey || event.metaKey) {
        return
      }

      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, a, [contenteditable]')
      ) {
        return
      }

      const onButton =
        target instanceof HTMLElement && target.closest('button') !== null

      if (
        onButton &&
        (event.key === 'Enter' || event.key === ' ' || event.code === 'Space')
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        handlePlayPausePress()
        return
      }

      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        handleWheelStep(1)
        return
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        handleWheelStep(-1)
        return
      }

      if (event.key.toLowerCase() === 'm' || event.key === 'Escape') {
        event.preventDefault()
        handleMenuPress()
        return
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        handleSelectPress()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    handleMenuPress,
    handlePlayPausePress,
    handleSelectPress,
    handleWheelStep,
  ])

  let announcement = 'Loading playlist'

  if (view === 'menu') {
    announcement = `Menu. ${MENU_ITEMS[menuIndex].label} highlighted.`
  } else if (view === 'settings') {
    announcement =
      settingsIndex === 0
        ? `Settings. Backlight ${backlight}.`
        : settingsIndex === 1
          ? `Settings. Clicker ${soundEnabled ? 'on' : 'off'}.`
          : 'Settings. Share player.'
  } else if (status === 'loading') {
    announcement = 'Loading playlist'
  } else if (status === 'empty') {
    announcement = 'Your playlist is empty.'
  } else if (status === 'error') {
    announcement = "The playlist couldn't be loaded."
  } else if (view === 'playlist' || view === 'songs') {
    const highlightedTrack = tracks[selectedIndex]
    const label = view === 'playlist' ? PLAYLIST_NAME : 'Songs'

    announcement = highlightedTrack
      ? `${label}. ${highlightedTrack.title} by ${highlightedTrack.artist} highlighted.`
      : `${label}. Your playlist is empty.`
  } else if (trackError) {
    announcement = trackError
  } else if (currentTrack) {
    announcement = `${isPlaying ? 'Playing' : 'Paused'}: ${currentTrack.title} by ${
      currentTrack.artist
    }`
  }

  return (
    <div className="app">
      <main className="stage">
        <h1 className="sr-only">Music Player</h1>
        <div className="device-stage">
          <div
            className="device"
            ref={deviceRef}
            role="group"
            aria-label="Music player"
          >
            <div className="device__gloss" aria-hidden="true" />
            <div className="screen-frame">
              <Screen
                status={status}
                view={view}
                tracks={tracks}
                currentIndex={currentIndex}
                selectedIndex={selectedIndex}
                menuIndex={menuIndex}
                settingsIndex={settingsIndex}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                trackError={trackError}
                soundEnabled={soundEnabled}
                shareMessage={shareMessage}
                volume={volume}
                showVolumeIndicator={volumeIndicatorVisible}
                backlight={backlight}
                lcdDimmed={lcdDimmed}
                onSelectTrack={handleTrackPress}
                onSelectMenu={handleMenuRowPress}
                onSelectSetting={handleSettingPress}
                onSeek={seek}
                onRetry={handleRetry}
                onReload={handleReload}
                onNextTrack={handlePlayNext}
              />
            </div>

            <ClickWheel
              isPlaying={isPlaying}
              onMenu={handleMenuPress}
              onPrevious={handlePreviousPress}
              onPlayPause={handlePlayPausePress}
              onNext={handleNextPress}
              onScan={handleScan}
              onSelect={handleSelectPress}
              onStep={handleWheelStep}
            />
          </div>
        </div>
      </main>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export default App
