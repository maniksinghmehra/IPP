import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { ClickWheel } from './components/ClickWheel'
import { Screen } from './components/Screen'
import { useAudioPlayer } from './hooks/useAudioPlayer'
import { usePlaylist } from './hooks/usePlaylist'
import type { ScreenView } from './types'

function App() {
  const { tracks, status, reload } = usePlaylist()
  const {
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
    retry,
  } = useAudioPlayer(tracks)

  const [view, setView] = useState<ScreenView>('nowPlaying')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const hasTracks = status === 'ready' && tracks.length > 0

  const openMenu = useCallback(() => {
    if (!hasTracks) {
      return
    }

    if (view === 'playlist') {
      setView('nowPlaying')
      return
    }

    setSelectedIndex(currentIndex)
    setView('playlist')
  }, [currentIndex, hasTracks, view])

  const handlePrevious = useCallback(() => {
    if (!hasTracks) {
      return
    }

    if (view === 'playlist') {
      setSelectedIndex((index) => (index - 1 + tracks.length) % tracks.length)
      return
    }

    previous()
  }, [hasTracks, previous, tracks.length, view])

  const handleNext = useCallback(() => {
    if (!hasTracks) {
      return
    }

    if (view === 'playlist') {
      setSelectedIndex((index) => (index + 1) % tracks.length)
      return
    }

    next()
  }, [hasTracks, next, tracks.length, view])

  const handleSelect = useCallback(() => {
    if (!hasTracks) {
      return
    }

    if (view === 'playlist') {
      selectTrack(selectedIndex)
      setView('nowPlaying')
      return
    }

    setSelectedIndex(currentIndex)
    setView('playlist')
  }, [currentIndex, hasTracks, selectTrack, selectedIndex, view])

  const handleSelectTrack = useCallback(
    (index: number) => {
      selectTrack(index)
      setSelectedIndex(index)
      setView('nowPlaying')
    },
    [selectTrack],
  )

  const handlePlayNext = useCallback(() => {
    if (tracks.length === 0) {
      return
    }

    handleSelectTrack((currentIndex + 1) % tracks.length)
  }, [currentIndex, handleSelectTrack, tracks.length])

  const handleRetry = useCallback(() => {
    void retry()
  }, [retry])

  const handleReload = useCallback(() => {
    setView('nowPlaying')
    void reload()
  }, [reload])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target

      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        (target instanceof HTMLElement &&
          target.closest('button, input, textarea, select, a, [contenteditable]'))
      ) {
        return
      }

      if (event.code === 'Space') {
        event.preventDefault()
        togglePlayback()
        return
      }

      if (event.key === 'ArrowRight') {
        handleNext()
        return
      }

      if (event.key === 'ArrowLeft') {
        handlePrevious()
        return
      }

      if (event.key.toLowerCase() === 'm') {
        openMenu()
        return
      }

      if (event.key === 'Enter') {
        handleSelect()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrevious, handleSelect, openMenu, togglePlayback])

  let announcement = 'Loading playlist'

  if (status === 'empty') {
    announcement = 'Your playlist is empty.'
  } else if (status === 'error') {
    announcement = "The playlist couldn't be loaded."
  } else if (trackError) {
    announcement = trackError
  } else if (currentTrack) {
    announcement = `${isPlaying ? 'Playing' : 'Paused'}: ${currentTrack.title} by ${
      currentTrack.artist
    }`
  }

  return (
    <div className="app">
      <div className="ambient ambient--top" aria-hidden="true" />
      <div className="ambient ambient--side" aria-hidden="true" />

      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <span />
          </span>
          <span>
            pod<span className="brand__dot">.</span>
          </span>
        </div>
        <p className="topbar__note">
          One playlist <span>/</span> Local audio
        </p>
      </header>

      <main className="main">
        <div className="hero">
          <p className="eyebrow">
            <span className="eyebrow__dot" aria-hidden="true" />
            Classic white · made for the web
          </p>
          <h1>
            Pocket-sized <em>nostalgia.</em>
          </h1>
        </div>

        <div className="device-stage">
          <div className="device-stage__halo" aria-hidden="true" />
          <div className="device" role="group" aria-label="iPod-style music player">
            <div className="screen-frame">
              <Screen
                status={status}
                view={view}
                tracks={tracks}
                currentIndex={currentIndex}
                selectedIndex={selectedIndex}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                trackError={trackError}
                onSelectTrack={handleSelectTrack}
                onSeek={seek}
                onRetry={handleRetry}
                onReload={handleReload}
                onNextTrack={handlePlayNext}
              />
            </div>

            <ClickWheel
              isPlaying={isPlaying}
              disabled={!hasTracks}
              onMenu={openMenu}
              onPrevious={handlePrevious}
              onPlayPause={togglePlayback}
              onNext={handleNext}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div className="shortcuts">
          <span>
            <kbd>Space</kbd> play / pause
          </span>
          <span>
            <kbd>←</kbd>
            <kbd>→</kbd> change track
          </span>
          <span>
            <kbd>M</kbd> menu
          </span>
        </div>

        <p className="mobile-tip">Tap the wheel. Menu opens your playlist.</p>
      </main>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export default App
