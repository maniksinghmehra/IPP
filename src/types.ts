export interface Track {
  title: string
  artist: string
  src: string
  album?: string
}

export type PlaylistStatus = 'loading' | 'ready' | 'empty' | 'error'

export type MenuView =
  | 'nowPlaying'
  | 'playlist'
  | 'artists'
  | 'songs'
  | 'settings'

export type ScreenView = 'menu' | MenuView
