import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import './ClickWheel.css'

interface ClickWheelProps {
  isPlaying: boolean
  onMenu: () => void
  onPrevious: () => void
  onPlayPause: () => void
  onNext: () => void
  onScan: (direction: 1 | -1) => void
  onSelect: () => void
  onStep: (direction: 1 | -1) => void
}

interface DragState {
  pointerId: number
  lastAngle: number
  lastTime: number
  accumulated: number
  velocity: number
}

type HoldDirection = 'previous' | 'next'

interface HoldState {
  timeout: number | null
  interval: number | null
  fired: boolean
}

const MIN_STEP_ANGLE = (6 * Math.PI) / 180
const MAX_STEP_ANGLE = (15 * Math.PI) / 180
const FAST_ANGULAR_SPEED = 0.035
const MAX_STEPS_PER_MOVE = 10
const HOLD_DELAY = 480
const SCAN_INTERVAL = 110

function angleFromCenter(
  element: HTMLDivElement,
  clientX: number,
  clientY: number,
) {
  const rect = element.getBoundingClientRect()
  const centerX = rect.left + rect.width / 2
  const centerY = rect.top + rect.height / 2

  return Math.atan2(clientY - centerY, clientX - centerX)
}

function normalizeAngleDelta(delta: number) {
  if (delta > Math.PI) {
    return delta - Math.PI * 2
  }

  if (delta < -Math.PI) {
    return delta + Math.PI * 2
  }

  return delta
}

function SkipIcon({ direction }: { direction: 'previous' | 'next' }) {
  if (direction === 'previous') {
    return (
      <svg
        className="wheel-icon"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="4" y="6" width="2" height="12" fill="currentColor" />
        <polygon points="8,12 16,6 16,18" fill="currentColor" />
        <polygon points="14,12 22,6 22,18" fill="currentColor" />
      </svg>
    )
  }
  return (
    <svg
      className="wheel-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect x="18" y="6" width="2" height="12" fill="currentColor" />
      <polygon points="16,12 8,6 8,18" fill="currentColor" />
      <polygon points="10,12 2,6 2,18" fill="currentColor" />
    </svg>
  )
}

function PlayPauseIcon() {
  return (
    <svg
      className="wheel-icon wheel-icon--play"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <polygon points="6,5 16,12 6,19" fill="currentColor" />
      <rect x="17" y="5" width="2" height="14" fill="currentColor" />
      <rect x="21" y="5" width="2" height="14" fill="currentColor" />
    </svg>
  )
}

export function ClickWheel({
  onMenu,
  onPrevious,
  onPlayPause,
  onNext,
  onScan,
  onSelect,
  onStep,
}: ClickWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const holdRef = useRef<Record<HoldDirection, HoldState>>({
    previous: { timeout: null, interval: null, fired: false },
    next: { timeout: null, interval: null, fired: false },
  })
  const suppressClickRef = useRef<Record<HoldDirection, boolean>>({
    previous: false,
    next: false,
  })
  const onScanRef = useRef(onScan)
  const [engaged, setEngaged] = useState(false)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    const holds = holdRef.current

    return () => {
      for (const direction of ['previous', 'next'] as const) {
        const hold = holds[direction]

        if (hold.timeout !== null) {
          window.clearTimeout(hold.timeout)
        }

        if (hold.interval !== null) {
          window.clearInterval(hold.interval)
        }
      }
    }
  }, [])

  const resetDrag = useCallback(() => {
    dragRef.current = null
    setEngaged(false)
  }, [])

  const clearHold = useCallback((direction: HoldDirection) => {
    const hold = holdRef.current[direction]

    if (hold.timeout !== null) {
      window.clearTimeout(hold.timeout)
      hold.timeout = null
    }

    if (hold.interval !== null) {
      window.clearInterval(hold.interval)
      hold.interval = null
    }
  }, [])

  const startHold = (
    direction: HoldDirection,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    const hold = holdRef.current[direction]
    suppressClickRef.current[direction] = false
    clearHold(direction)
    hold.fired = false
    hold.timeout = window.setTimeout(() => {
      hold.fired = true
      onScanRef.current(direction === 'next' ? 1 : -1)
      hold.interval = window.setInterval(() => {
        onScanRef.current(direction === 'next' ? 1 : -1)
      }, SCAN_INTERVAL)
    }, HOLD_DELAY)
  }

  const endHold = (direction: HoldDirection) => {
    const hold = holdRef.current[direction]
    const fired = hold.fired
    clearHold(direction)
    hold.fired = false

    if (fired) {
      suppressClickRef.current[direction] = true
    }
  }

  const handlePreviousClick = () => {
    if (suppressClickRef.current.previous) {
      suppressClickRef.current.previous = false
      return
    }

    onPrevious()
  }

  const handleNextClick = () => {
    if (suppressClickRef.current.next) {
      suppressClickRef.current.next = false
      return
    }

    onNext()
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    if (event.target instanceof Element && event.target.closest('button')) {
      return
    }

    const wheel = wheelRef.current

    if (!wheel) {
      return
    }

    const angle = angleFromCenter(wheel, event.clientX, event.clientY)
    dragRef.current = {
      pointerId: event.pointerId,
      lastAngle: angle,
      lastTime: event.timeStamp,
      accumulated: 0,
      velocity: 0,
    }
    wheel.setPointerCapture(event.pointerId)
    setEngaged(true)
    event.preventDefault()
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    const wheel = wheelRef.current

    if (!drag || !wheel || drag.pointerId !== event.pointerId) {
      return
    }

    const angle = angleFromCenter(wheel, event.clientX, event.clientY)
    const delta = normalizeAngleDelta(angle - drag.lastAngle)
    const elapsed = Math.max(1, event.timeStamp - drag.lastTime)
    const speed = Math.abs(delta) / elapsed
    drag.velocity = drag.velocity * 0.65 + speed * 0.35
    drag.accumulated += delta
    drag.lastAngle = angle
    drag.lastTime = event.timeStamp

    const speedRatio = Math.min(1, drag.velocity / FAST_ANGULAR_SPEED)
    const stepAngle =
      MAX_STEP_ANGLE - (MAX_STEP_ANGLE - MIN_STEP_ANGLE) * speedRatio
    let steps = 0

    while (
      Math.abs(drag.accumulated) >= stepAngle &&
      steps < MAX_STEPS_PER_MOVE
    ) {
      const direction: 1 | -1 = drag.accumulated > 0 ? 1 : -1
      drag.accumulated -= stepAngle * direction
      onStep(direction)
      steps += 1
    }

    if (steps === MAX_STEPS_PER_MOVE) {
      drag.accumulated = 0
    }

    event.preventDefault()
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    resetDrag()
  }

  return (
    <div
      className="click-wheel"
      ref={wheelRef}
      role="group"
      tabIndex={0}
      aria-label="Click wheel. Drag around the ring to browse. Arrow keys browse, Enter selects, Space plays or pauses, and M opens the menu."
      data-engaged={engaged}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={resetDrag}
      onLostPointerCapture={resetDrag}
    >
      <span className="click-wheel__inner" aria-hidden="true" />
      <svg
        className="click-wheel__seams"
        viewBox="0 0 100 100"
        aria-hidden="true"
        focusable="false"
      >
        <line x1="18.9" y1="18.9" x2="15.2" y2="15.2" />
        <line x1="81.1" y1="18.9" x2="84.8" y2="15.2" />
        <line x1="18.9" y1="81.1" x2="15.2" y2="84.8" />
        <line x1="81.1" y1="81.1" x2="84.8" y2="84.8" />
      </svg>

      <button
        className="wheel-button wheel-button--menu"
        type="button"
        onClick={onMenu}
        aria-label="Menu"
      >
        MENU
      </button>

      <button
        className="wheel-button wheel-button--previous"
        type="button"
        onClick={handlePreviousClick}
        onPointerDown={(event) => startHold('previous', event)}
        onPointerUp={() => endHold('previous')}
        onPointerCancel={() => endHold('previous')}
        onPointerLeave={() => endHold('previous')}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Previous"
      >
        <SkipIcon direction="previous" />
      </button>

      <button
        className="wheel-button wheel-button--play"
        type="button"
        onClick={onPlayPause}
        aria-label="Play/Pause"
      >
        <PlayPauseIcon />
      </button>

      <button
        className="wheel-button wheel-button--next"
        type="button"
        onClick={handleNextClick}
        onPointerDown={(event) => startHold('next', event)}
        onPointerUp={() => endHold('next')}
        onPointerCancel={() => endHold('next')}
        onPointerLeave={() => endHold('next')}
        onContextMenu={(event) => event.preventDefault()}
        aria-label="Next"
      >
        <SkipIcon direction="next" />
      </button>

      <button
        className="wheel-button wheel-button--select"
        type="button"
        onClick={onSelect}
        aria-label="Select"
      />
    </div>
  )
}
