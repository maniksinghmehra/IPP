import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { MENU_ITEMS } from '../menu'
import { PLAYLIST_NAME } from '../playlist'
import type { MenuView, PlaylistStatus, ScreenView, Track } from '../types'
import { formatTime } from '../utils/formatTime'
import { LcdCover } from './LcdCover'
import './Screen.css'

interface ScreenProps {
  status: PlaylistStatus
  view: ScreenView
  tracks: Track[]
  currentIndex: number
  selectedIndex: number
  menuIndex: number
  settingsIndex: number
  isPlaying: boolean
  currentTime: number
  duration: number
  trackError: string | null
  soundEnabled: boolean
  shareMessage: string | null
  volume?: number
  showVolumeIndicator?: boolean
  backlight?: 'low' | 'medium' | 'high'
  playlistSubView?: 'playlists' | 'songs'
  onPlaylistSubViewChange?: (view: 'playlists' | 'songs') => void
  onSelectTrack: (index: number) => void
  onSelectMenu: (target: MenuView, index: number) => void
  onSelectSetting: (index: number) => void
  onSeek: (seconds: number) => void
  onRetry: () => void
  onReload: () => void
  onNextTrack: () => void
}

interface StatusBarProps {
  label: string
  detail?: string
  icon?: ReactNode
  exactLabel?: boolean
}

function TransportIcon({ isPlaying }: { isPlaying: boolean }) {
  if (isPlaying) {
    return (
      <svg
        className="lcd-icon"
        viewBox="0 0 12 12"
        aria-hidden="true"
        shapeRendering="crispEdges"
      >
        <rect x="2" y="1.5" width="3" height="9" fill="currentColor" />
        <rect x="7" y="1.5" width="3" height="9" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg
      className="lcd-icon"
      viewBox="0 0 12 12"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M3 1.5 9.5 6 3 10.5Z" fill="currentColor" />
    </svg>
  )
}

function PlayMark() {
  return (
    <svg
      className="lcd-play-mark"
      viewBox="0 0 10 10"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path d="M2.5 1.5 8.5 5 2.5 8.5Z" fill="currentColor" />
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg
      className="lcd-chevron"
      viewBox="0 0 10 10"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path
        d="M3.5 1.5 7 5 3.5 8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

function StatusBar({ label, exactLabel }: StatusBarProps) {
  return (
    <div className="lcd-status">
      <span
        className={`lcd-status__label${
          exactLabel ? ' lcd-status__label--exact' : ''
        }`}
      >
        {label}
      </span>
      <span className="lcd-battery" aria-hidden="true">
        <span className="lcd-battery__fill" />
      </span>
    </div>
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
  volume,
  showVolumeIndicator,
}: {
  track: Track
  currentIndex: number
  totalTracks: number
  isPlaying: boolean
  currentTime: number
  duration: number
  onSeek: (seconds: number) => void
  volume?: number
  showVolumeIndicator?: boolean
}) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const safeCurrentTime = Math.min(Math.max(currentTime, 0), safeDuration || 0)
  const remaining = Math.max(0, safeDuration - safeCurrentTime)
  const progress = safeDuration > 0 ? (safeCurrentTime / safeDuration) * 100 : 0
  const progressStyle = { '--seek-progress': `${progress}%` } as CSSProperties
  const trackNumber = (currentIndex + 1).toString().padStart(2, '0')
  const totalNumber = totalTracks.toString().padStart(2, '0')

  const volumePercent = Math.round((volume ?? 0.7) * 100)
  const volumeBars = Math.max(0, Math.min(10, Math.round((volume ?? 0.7) * 10)))

  return (
    <div className="lcd-page lcd-page--now">
      <StatusBar
        label="Now Playing"
        icon={<TransportIcon isPlaying={isPlaying} />}
      />

      {showVolumeIndicator ? (
        <div className="lcd-volume-indicator" role="status" aria-live="polite">
          <div className="lcd-volume-indicator__label">Volume</div>
          <div className="lcd-volume-indicator__bar">
            <div
              className="lcd-volume-indicator__fill"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
          <div className="lcd-volume-indicator__steps">
            {Array.from({ length: 10 }).map((_, i) => (
              <span
                key={i}
                className={`lcd-volume-indicator__step${i < volumeBars ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div className="lcd-cover lcd-cover--now">
        <LcdCover src="/for-astha.jpg" alt="for astha cover" size={72} />
      </div>

      <div className="now-playing">
        <p className="now-playing__index">
          TRACK {trackNumber} / {totalNumber}
        </p>
        <h2 className="now-playing__title" title={track.title}>
          {track.title}
        </h2>
        <p className="now-playing__artist" title={track.artist}>
          {track.artist}
        </p>
      </div>

      <div className="lcd-seek">
        <label className="sr-only" htmlFor="seek-progress">
          Seek in {track.title}
        </label>
        <input
          className="lcd-seek__input"
          id="seek-progress"
          type="range"
          min="0"
          max={safeDuration || 0}
          step="0.1"
          value={safeCurrentTime}
          style={progressStyle}
          onChange={(event) => onSeek(Number(event.target.value))}
          disabled={safeDuration === 0}
          aria-valuetext={`Elapsed ${formatTime(safeCurrentTime)}, ${formatTime(
            remaining,
          )} remaining`}
        />
        <div className="lcd-seek__times">
          <span>{formatTime(safeCurrentTime)}</span>
          <span>{safeDuration > 0 ? `-${formatTime(remaining)}` : '--:--'}</span>
        </div>
      </div>
    </div>
  )
}

function MenuScreen({
  menuIndex,
  onSelectMenu,
}: {
  menuIndex: number
  onSelectMenu: (target: MenuView, index: number) => void
}) {
  return (
    <div className="lcd-page lcd-page--menu">
      <StatusBar label="Music" />

      <ul className="lcd-menu" aria-label="Music menu">
        {MENU_ITEMS.map((item, index) => {
          const selected = index === menuIndex

          return (
            <li key={item.view}>
              <button
                className={`lcd-row lcd-row--menu${selected ? ' is-selected' : ''}`}
                type="button"
                data-selected={selected}
                onClick={() => onSelectMenu(item.view, index)}
              >
                <span className="lcd-row__label">{item.label}</span>
                {item.label.includes('›') ? <ChevronIcon /> : null}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function PlaylistsList({
  onSelectPlaylist,
}: {
  onSelectPlaylist: () => void
}) {
  return (
    <div className="lcd-page lcd-page--list">
      <StatusBar label="Playlists" />
      <ul className="lcd-menu" aria-label="Playlists">
        <li>
          <button
            className="lcd-row lcd-row--menu"
            type="button"
            onClick={onSelectPlaylist}
          >
            <span className="lcd-playlist-thumb">
              <LcdCover src="/for-astha.jpg" alt="for astha cover" size={64} />
            </span>
            <span className="lcd-row__label">{PLAYLIST_NAME}</span>
            <ChevronIcon />
          </button>
        </li>
      </ul>
      <p className="lcd-hint">SELECT TO OPEN · MENU BACK</p>
    </div>
  )
}

function TrackList({
  label,
  exactLabel,
  tracks,
  currentIndex,
  selectedIndex,
  isPlaying,
  onSelectTrack,
}: {
  label: string
  exactLabel: boolean
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

  const showCover = exactLabel && label === PLAYLIST_NAME

  return (
    <div className="lcd-page lcd-page--list">
      <StatusBar
        label={label}
        detail={showCover ? undefined : `${tracks.length} SONGS`}
        icon={showCover ? undefined : <TransportIcon isPlaying={isPlaying} />}
        exactLabel={exactLabel}
      />

      {showCover ? (
        <div className="lcd-playlist-header">
          <div className="lcd-cover lcd-cover--list">
            <LcdCover src="/for-astha.jpg" alt="for astha cover" size={64} />
          </div>
          <div className="lcd-playlist-meta">
            <div className="lcd-playlist-name">{PLAYLIST_NAME}</div>
            <div className="lcd-playlist-count">{tracks.length} Songs</div>
          </div>
        </div>
      ) : null}

      <ul className="lcd-list" ref={listRef} aria-label={label}>
        {tracks.map((track, index) => {
          const selected = index === selectedIndex
          const current = index === currentIndex

          return (
            <li key={`${track.src}-${index}`}>
              <button
                className={`lcd-row lcd-row--track${selected ? ' is-selected' : ''}`}
                type="button"
                data-selected={selected}
                aria-current={current ? 'true' : undefined}
                aria-label={`Play ${track.title} by ${track.artist}`}
                onClick={() => onSelectTrack(index)}
              >
                <span className="lcd-row__number">
                  {current ? (
                    <PlayMark />
                  ) : (
                    (index + 1).toString().padStart(2, '0')
                  )}
                </span>
                <span className="lcd-row__copy">
                  <span className="lcd-row__title">{track.title}</span>
                  <span className="lcd-row__artist">{track.artist}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <p className="lcd-hint">SELECT TO PLAY · MENU BACK</p>
    </div>
  )
}

function SettingsScreen({
  settingsIndex,
  soundEnabled,
  shareMessage,
  onSelectSetting,
  backlight,
}: {
  settingsIndex: number
  soundEnabled: boolean
  shareMessage: string | null
  onSelectSetting: (index: number) => void
  backlight?: 'low' | 'medium' | 'high'
}) {
  return (
    <div className="lcd-page lcd-page--settings">
      <StatusBar label="Settings" />

      <ul className="lcd-menu lcd-menu--settings" aria-label="Settings">
        <li>
          <button
            className={`lcd-row lcd-row--setting${
              settingsIndex === 0 ? ' is-selected' : ''
            }`}
            type="button"
            data-selected={settingsIndex === 0}
            aria-pressed={false}
            onClick={() => onSelectSetting(0)}
          >
            <span className="lcd-row__label">Backlight</span>
            <span className="lcd-row__value">
              {backlight === 'low' ? 'Low' : backlight === 'high' ? 'High' : 'Medium'}
            </span>
          </button>
        </li>
        <li>
          <button
            className={`lcd-row lcd-row--setting${
              settingsIndex === 1 ? ' is-selected' : ''
            }`}
            type="button"
            data-selected={settingsIndex === 1}
            aria-pressed={soundEnabled}
            onClick={() => onSelectSetting(1)}
          >
            <span className="lcd-row__label">Clicker</span>
            <span className="lcd-row__value">{soundEnabled ? 'On' : 'Off'}</span>
          </button>
        </li>
        <li>
          <button
            className={`lcd-row lcd-row--setting${
              settingsIndex === 2 ? ' is-selected' : ''
            }`}
            type="button"
            data-selected={settingsIndex === 2}
            onClick={() => onSelectSetting(2)}
          >
            <span className="lcd-row__label">Share Player</span>
            <ChevronIcon />
          </button>
        </li>
      </ul>

      {shareMessage ? (
        <p className="lcd-note" role="status">
          {shareMessage}
        </p>
      ) : null}
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
    <div className="lcd-page">
      <StatusBar label="Now Playing" detail="ERROR" />
      <div className="lcd-message">
        <span className="lcd-message__mark" aria-hidden="true">
          !
        </span>
        <h2>Track unavailable</h2>
        <p>Couldn&apos;t load this file. Check that it exists in:</p>
        <code className="lcd-message__path">{`public${track.src}`}</code>
        <div className="lcd-message__actions">
          <button className="lcd-button" type="button" onClick={onRetry}>
            Try Again
          </button>
          <button
            className="lcd-button lcd-button--quiet"
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
    <div className="lcd-page">
      <StatusBar label="Music" detail={isError ? 'ERROR' : 'EMPTY'} />
      <div className="lcd-message">
        <span className="lcd-message__mark" aria-hidden="true">
          {isError ? '!' : '0'}
        </span>
        <h2>{isError ? "Couldn't load playlist" : 'No songs here'}</h2>
        <p>
          {isError ? (
            <>
              Check <code>public/playlist.json</code> exists and contains valid
              JSON.
            </>
          ) : (
            <>
              Add songs to <code>public/music/</code> and list them in{' '}
              <code>public/playlist.json</code>.
            </>
          )}
        </p>
        <div className="lcd-message__actions">
          <button className="lcd-button" type="button" onClick={onReload}>
            Reload
          </button>
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div className="lcd-page lcd-page--loading">
      <StatusBar label="Music" detail="LOADING" />
      <div className="lcd-loading">
        <span className="lcd-loading__block" aria-hidden="true" />
        <p>Loading playlist...</p>
      </div>
    </div>
  )
}

export function Screen({
  status,
  view,
  tracks,
  currentIndex,
  selectedIndex,
  menuIndex,
  settingsIndex,
  isPlaying,
  currentTime,
  duration,
  trackError,
  soundEnabled,
  shareMessage,
  volume = 0.7,
  showVolumeIndicator = false,
  backlight = 'medium',
  playlistSubView,
  onPlaylistSubViewChange,
  onSelectTrack,
  onSelectMenu,
  onSelectSetting,
  onSeek,
  onRetry,
  onReload,
  onNextTrack,
}: ScreenProps) {
  const currentTrack = tracks[currentIndex] ?? null
  const [internalPlaylistView, setInternalPlaylistView] = useState<'playlists' | 'songs'>('playlists')
  const playlistView = playlistSubView ?? internalPlaylistView
  const setPlaylistView = onPlaylistSubViewChange ?? setInternalPlaylistView

  useEffect(() => {
    if (view !== 'playlist') {
      setPlaylistView('playlists')
    }
  }, [view, setPlaylistView])

  let content: ReactNode

  if (view === 'menu') {
    content = (
      <MenuScreen menuIndex={menuIndex} onSelectMenu={onSelectMenu} />
    )
  } else if (view === 'settings') {
    content = (
      <SettingsScreen
        settingsIndex={settingsIndex}
        soundEnabled={soundEnabled}
        shareMessage={shareMessage}
        onSelectSetting={onSelectSetting}
        backlight={backlight}
      />
    )
  } else if (status === 'loading') {
    content = <Loading />
  } else if (status === 'empty' || status === 'error') {
    content = <EmptyPlaylist isError={status === 'error'} onReload={onReload} />
  } else if (view === 'playlist') {
    if (playlistView === 'playlists') {
      content = <PlaylistsList onSelectPlaylist={() => setPlaylistView('songs')} />
    } else {
      content = (
        <TrackList
          label={PLAYLIST_NAME}
          exactLabel={true}
          tracks={tracks}
          currentIndex={currentIndex}
          selectedIndex={selectedIndex}
          isPlaying={isPlaying}
          onSelectTrack={onSelectTrack}
        />
      )
    }
  } else if (view === 'songs') {
    content = (
      <TrackList
        label={'Songs'}
        exactLabel={false}
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
        volume={volume}
        showVolumeIndicator={showVolumeIndicator}
      />
    )
  } else {
    content = <EmptyPlaylist isError={false} onReload={onReload} />
  }

  const backlightClass =
    backlight === 'low'
      ? ' screen--backlight-low'
      : backlight === 'high'
        ? ' screen--backlight-high'
        : ' screen--backlight-medium'

  return (
    <div className={`screen${backlightClass}`}>
      <div className="screen__glare" aria-hidden="true" />
      {content}
    </div>
  )
}
