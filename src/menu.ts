import type { MenuView } from './types'

export interface MenuItem {
  view: MenuView
  label: string
}

export const MENU_ITEMS: ReadonlyArray<MenuItem> = [
  { view: 'playlist', label: 'Playlists ›' },
  { view: 'nowPlaying', label: 'Now Playing' },
  { view: 'settings', label: 'Settings ›' },
]

export const SETTINGS_ITEM_COUNT = 3
