import { useCallback, useEffect, useState } from 'react'
import type { PlaylistStatus, Track } from '../types'

function isTrack(value: unknown): value is Track {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const track = value as Record<string, unknown>

  return (
    typeof track.title === 'string' &&
    track.title.trim().length > 0 &&
    typeof track.artist === 'string' &&
    track.artist.trim().length > 0 &&
    typeof track.src === 'string' &&
    track.src.trim().length > 0
  )
}

export function usePlaylist() {
  const [tracks, setTracks] = useState<Track[]>([])
  const [status, setStatus] = useState<PlaylistStatus>('loading')
  const [requestId, setRequestId] = useState(0)

  useEffect(() => {
    let cancelled = false

    fetch('/playlist.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Playlist request failed with status ${response.status}.`)
        }

        return response.json()
      })
      .then((data: unknown) => {
        if (cancelled) {
          return
        }

        if (!Array.isArray(data)) {
          throw new Error('The playlist must be an array.')
        }

        if (data.length === 0) {
          setTracks([])
          setStatus('empty')
          return
        }

        if (!data.every(isTrack)) {
          throw new Error(
            'One or more playlist entries are missing a title, artist, or src.',
          )
        }

        const cleanTracks = data.map((track) => ({
          title: track.title.trim(),
          artist: track.artist.trim(),
          src: track.src.trim(),
        }))

        setTracks(cleanTracks)
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) {
          return
        }

        setTracks([])
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [requestId])

  const reload = useCallback(() => {
    setStatus('loading')
    setRequestId((id) => id + 1)
  }, [])

  return {
    tracks,
    status,
    reload,
  }
}
