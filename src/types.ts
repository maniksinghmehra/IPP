export interface Track {
  title: string
  artist: string
  src: string
}

export type PlaylistStatus = 'loading' | 'ready' | 'empty' | 'error'

export type MenuView = 'nowPlaying' | 'playlist' | 'songs' | 'settings'

export type ScreenView = 'menu' | MenuView
