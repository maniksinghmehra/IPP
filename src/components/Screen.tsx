import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import type { PlaylistStatus, ScreenView, Track } from '../types'
import { formatTime } from '../utils/formatTime'
import './Screen.css'

interface ScreenProps {
  status: PlaylistStatus
  view: ScreenView
  tracks: Track[]
  currentIndex: number
  selectedIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  trackError: string | null
  onSelectTrack: (index: number) => void
  onSeek: (seconds: number) => void
  onRetry: () => void
  onReload: () => void
  onNextTrack: () => void
}

interface StatusBarProps {
  label: string
  detail?: string
}

function StatusBar({ label, detail }: StatusBarProps) {
  return (
    <div className="screen-bar">
      <span>{label}</span>
      <span className="screen-bar__detail">{detail}</span>
      <span className="battery" aria-hidden="true">
        <span className="battery__level" />
      </span>
    </div>
  )
}

function Equalizer({ active }: { active: boolean }) {
  return (
    <span className={`equalizer${active ? ' is-active' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}

function NowPlaying({
  track,
  currentIndex,
  totalTracks,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}: {
  track: Track
  currentIndex: number
  totalTracks: number
  isPlaying: boolean
  currentTime: number
  duration: number
  onSeek: (seconds: number) => void
}) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrentTime = Math.min(currentTime, safeDuration || 0)
  const progress = safeDuration > 0 ? (safeCurrentTime / safeDuration) * 100 : 0
  const progressStyle = { '--seek-progress': `${progress}%` } as CSSProperties
  const trackNumber = (currentIndex + 1).toString().padStart(2, '0')
  const totalNumber = totalTracks.toString().padStart(2, '0')

  return (
    <div className="screen-page">
      <StatusBar label="Now playing" />

      <div className="track-hero" key={track.src}>
        <div
          className={`artwork artwork--tone-${currentIndex % 4}`}
          aria-hidden="true"
        >
          <span className="artwork__disc" />
          <span className="artwork__hole" />
        </div>

        <div className="track-meta">
          <p className="track-meta__index">
            {trackNumber} <span>/ {totalNumber}</span>
          </p>
          <h2 className="track-meta__title" title={track.title}>
            {track.title}
          </h2>
          <p className="track-meta__artist" title={track.artist}>
            {track.artist}
          </p>
          <p className="track-meta__state">
            <Equalizer active={isPlaying} />
            {isPlaying ? 'Playing' : 'Paused'}
          </p>
        </div>
      </div>

      <div className="seek">
        <label className="sr-only" htmlFor="seek-progress">
          Seek in {track.title}
        </label>
        <input
          className="seek__input"
          id="seek-progress"
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.1"
          value={safeCurrentTime}
          style={progressStyle}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={safeDuration === 0}
          aria-valuetext={`${formatTime(safeCurrentTime)} of ${
            safeDuration > 0 ? formatTime(safeDuration) : '0:00'
          }`}
        />
        <div className="seek__times">
          <span>{formatTime(safeCurrentTime)}</span>
          <span>{safeDuration > 0 ? formatTime(safeDuration) : '--:--'}</span>
        </div>
      </div>
    </div>
  )
}

function Playlist({
  tracks,
  currentIndex,
  selectedIndex,
  isPlaying,
  onSelectTrack,
}: {
  tracks: Track[]
  currentIndex: number
  selectedIndex: number
  isPlaying: boolean
  onSelectTrack: (index: number) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const selectedRow = listRef.current?.querySelector<HTMLElement>(
      '[data-selected="true"]',
    )
    selectedRow?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  return (
    <div className="screen-page screen-page--playlist">
      <StatusBar label="Music" detail={`${tracks.length} songs`} />

      <ul className="playlist" ref={listRef}>
        {tracks.map((track, index) => {
          const selected = index === selectedIndex
          const current = index === currentIndex

          return (
            <li key={`${track.src}-${index}`}>
              <button
                className={`playlist__row${selected ? ' is-selected' : ''}`}
                type="button"
                data-selected={selected}
                aria-current={current ? 'true' : undefined}
                aria-label={`Play ${track.title} by ${track.artist}`}
                onClick={() => onSelectTrack(index)}
              >
                <span className="playlist__number">
                  {current ? (
                    <Equalizer active={isPlaying} />
                  ) : (
                    (index + 1).toString().padStart(2, '0')
                  )}
                </span>
                <span className="playlist__copy">
                  <span className="playlist__title">{track.title}</span>
                  <span className="playlist__artist">{track.artist}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="screen-tip">Scroll the wheel · Select to play</p>
    </div>
  )
}

function TrackError({
  track,
  onRetry,
  onNextTrack,
}: {
  track: Track
  onRetry: () => void
  onNextTrack: () => void
}) {
  return (
    <div className="screen-page">
      <StatusBar label="Now playing" detail="Error" />
      <div className="screen-message">
        <span className="message-mark" aria-hidden="true">
          !
        </span>
        <h2>Track unavailable</h2>
        <p>We couldn&apos;t load this file. Make sure it exists in:</p>
        <code className="message-code">{`public${track.src}`}</code>
        <div className="message-actions">
          <button className="screen-button" type="button" onClick={onRetry}>
            Try again
          </button>
          <button
            className="screen-button screen-button--quiet"
            type="button"
            onClick={onNextTrack}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyPlaylist({
  isError,
  onReload,
}: {
  isError: boolean
  onReload: () => void
}) {
  return (
    <div className="screen-page">
      <StatusBar label="Music" detail={isError ? 'Error' : 'Empty'} />
      <div className="screen-message">
        <span className="message-mark" aria-hidden="true">
          {isError ? '!' : '0'}
        </span>
        <h2>{isError ? "Couldn't load the playlist" : 'No songs here yet'}</h2>
        <p>
          {isError ? (
            <>
              Check that <code>public/playlist.json</code> exists and contains
              valid JSON.
            </>
          ) : (
            <>
              Add songs to <code>public/music/</code> and list them in{' '}
              <code>public/playlist.json</code>.
            </>
          )}
        </p>
        <div className="message-actions">
          <button className="screen-button" type="button" onClick={onReload}>
            Reload playlist
          </button>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="screen-page screen-page--loading" aria-label="Loading playlist">
      <span className="screen-spinner" aria-hidden="true" />
      <p>Loading playlist...</p>
    </div>
  )
}

export function Screen({
  status,
  view,
  tracks,
  currentIndex,
  selectedIndex,
  isPlaying,
  currentTime,
  duration,
  trackError,
  onSelectTrack,
  onSeek,
  onRetry,
  onReload,
  onNextTrack,
}: ScreenProps) {
  const currentTrack = tracks[currentIndex] ?? null

  let content: ReactNode

  if (status === 'loading') {
    content = <Loading />
  } else if (status === 'empty' || status === 'error') {
    content = <EmptyPlaylist isError={status === 'error'} onReload={onReload} />
  } else if (view === 'playlist') {
    content = (
      <Playlist
        tracks={tracks}
        currentIndex={currentIndex}
        selectedIndex={selectedIndex}
        isPlaying={isPlaying}
        onSelectTrack={onSelectTrack}
      />
    )
  } else if (trackError && currentTrack) {
    content = (
      <TrackError
        track={currentTrack}
        onRetry={onRetry}
        onNextTrack={onNextTrack}
      />
    )
  } else if (currentTrack) {
    content = (
      <NowPlaying
        track={currentTrack}
        currentIndex={currentIndex}
        totalTracks={tracks.length}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        onSeek={onSeek}
      />
    )
  } else {
    content = <EmptyPlaylist isError={false} onReload={onReload} />
  }

  return (
    <div className="screen">
      <div className="screen__glare" aria-hidden="true" />
      {content}
    </div>
  )
}
