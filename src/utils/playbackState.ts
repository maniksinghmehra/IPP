export interface SavedPlayback {
  index: number
  time: number
}

const PLAYBACK_KEY = 'music-playback'

function normalizeTime(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, value)
    : 0
}

function readLegacyPlayback(): SavedPlayback | null {
  if (typeof window === 'undefined') {
    return null
  }

  const index = Number.parseInt(
    localStorage.getItem('music-current-index') ?? '',
    10,
  )

  if (!Number.isInteger(index) || index < 0) {
    return null
  }

  const time = Number.parseFloat(
    localStorage.getItem('music-current-time') ?? '',
  )

  return { index, time: normalizeTime(time) }
}

export function loadPlayback(): SavedPlayback | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = localStorage.getItem(PLAYBACK_KEY)

    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedPlayback>

      if (Number.isInteger(parsed.index) && (parsed.index as number) >= 0) {
        return {
          index: parsed.index as number,
          time: normalizeTime(parsed.time),
        }
      }
    }
  } catch {
    // Fall through to the legacy format.
  }

  return readLegacyPlayback()
}

export function savePlayback(index: number, time: number) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(
      PLAYBACK_KEY,
      JSON.stringify({ index, time: normalizeTime(time) }),
    )
    localStorage.setItem('music-current-index', index.toString())
    localStorage.setItem('music-current-time', normalizeTime(time).toString())
  } catch {
    // Storage can be unavailable in private browsing or when it is full.
  }
}
