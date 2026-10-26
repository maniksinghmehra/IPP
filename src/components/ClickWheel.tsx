import './ClickWheel.css'

interface ClickWheelProps {
  isPlaying: boolean
  disabled: boolean
  onMenu: () => void
  onPrevious: () => void
  onPlayPause: () => void
  onNext: () => void
  onSelect: () => void
}

function SkipIcon({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg
      className={`wheel-icon wheel-icon--${direction}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M6 5v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M18 6.2 9.4 12 18 17.8V6.2Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlayPauseIcon({ isPlaying }: { isPlaying: boolean }) {
  if (isPlaying) {
    return (
      <svg className="wheel-icon" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="7" y="5" width="3.4" height="14" rx="1" fill="currentColor" />
        <rect x="13.6" y="5" width="3.4" height="14" rx="1" fill="currentColor" />
      </svg>
    )
  }

  return (
    <svg className="wheel-icon wheel-icon--play" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 5.4 19 12 8 18.6V5.4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ClickWheel({
  isPlaying,
  disabled,
  onMenu,
  onPrevious,
  onPlayPause,
  onNext,
  onSelect,
}: ClickWheelProps) {
  return (
    <div className="click-wheel" role="group" aria-label="iPod click wheel">
      <button
        className="wheel-button wheel-button--menu"
        type="button"
        onClick={onMenu}
        disabled={disabled}
        aria-label="Open playlist menu"
      >
        Menu
      </button>

      <button
        className="wheel-button wheel-button--previous"
        type="button"
        onClick={onPrevious}
        disabled={disabled}
        aria-label="Previous track"
      >
        <SkipIcon direction="previous" />
      </button>

      <button
        className="wheel-button wheel-button--play"
        type="button"
        onClick={onPlayPause}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        <PlayPauseIcon isPlaying={isPlaying} />
      </button>

      <button
        className="wheel-button wheel-button--next"
        type="button"
        onClick={onNext}
        disabled={disabled}
        aria-label="Next track"
      >
        <SkipIcon direction="next" />
      </button>

      <button
        className="wheel-button wheel-button--select"
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-label="Select"
      >
        Select
      </button>
    </div>
  )
}
