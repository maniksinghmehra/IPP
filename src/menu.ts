import type { MenuView } from './types'

export interface MenuItem {
  view: MenuView
  label: string
  chevron?: boolean
}

export const MENU_ITEMS: ReadonlyArray<MenuItem> = [
  { view: 'nowPlaying', label: 'Now Playing' },
  { view: 'playlist', label: 'Playlists', chevron: true },
  { view: 'artists', label: 'Artists', chevron: true },
  { view: 'songs', label: 'Songs', chevron: true },
  { view: 'settings', label: 'Settings', chevron: true },
]

export const SETTINGS_ITEM_COUNT = 3
