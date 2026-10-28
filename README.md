# Playlist

A responsive, iPod-inspired music player built with React and TypeScript. It pairs a white click wheel and a blue-gray LCD with one local playlist and browser-native audio playback. There is no sign-in, upload flow, external music service, or database.

The player includes a working menu, playlist and song views, a settings screen, synthesized interface sounds, haptics where supported, and a Share action that shares the player's own URL.

## Run locally

You will need Node.js 20.19+ (or 22.12+) and npm, plus [Git LFS](https://git-lfs.com) to download the songs.

```bash
git lfs install
git lfs pull
npm install
npm run dev
```

The audio files are stored with Git LFS. If `git lfs` is not installed when you clone, `public/music/*.mp3` will be tiny pointer files instead of audio, and the player will show track errors. Run `git lfs install` once, then `git lfs pull`.

Open the local URL printed by Vite (usually `http://localhost:5173`).

To check the production build:

```bash
npm run build
npm run preview
```

## Songs and playlist

The current playlist is named **`for astha`** and uses the audio files in `public/music/`. The playlist display name lives in `src/playlist.ts`.

`public/playlist.json` is still an ordered JSON array. Each entry has this shape:

```json
[
  {
    "title": "Song Title",
    "artist": "Artist Name",
    "src": "/music/Artist Name - Song Title 01.mp3"
  }
]
```

The order of the array is the playlist order. Each `src` starts with `/music/` and then uses the exact filename from `public/music/`. Do not include the numeric filename suffix in `title`.

- Vite serves `public/music/` during development, and the production build copies it to `dist/music/`.
- The MP3s are stored with Git LFS, so run `git lfs pull` after cloning (see [Run locally](#run-locally)).
- File paths are case-sensitive on many systems, so match the filename exactly.
- The browser must support the audio format. MP3, M4A/AAC, OGG, and WAV have good support in current browsers.
- If `playlist.json` is empty, missing, or invalid, the screen shows a friendly error with a reload button. If an audio file cannot load, the screen shows a track error with retry and next actions.
- The `.wav` files in `public/music/` are older demo tracks and are not used by the current playlist.

## Screens

- **Now Playing** — track number, title, artist, elapsed and remaining time, and a seek bar.
- **Menu** — Now Playing, Playlist, Songs, and Settings, with the current item highlighted.
- **Playlist / Songs** — the **`for astha`** playlist and the Songs view list every track in playlist order. The playing track is marked, and the highlighted row scrolls into view.
- **Settings** — Clicker (off by default) and Share Player. Share messages appear at the bottom of the LCD.
- **Loading, empty, and error states** — keep the device usable and offer reload, retry, or next-track actions.

## Controls

- **Click wheel** — drag clockwise or counterclockwise around the ring to move the highlight or change tracks. Scrolling faster around the dial advances further per movement. On a track list, the wheel moves the selection.
- **Mouse wheel** — scroll with the pointer over the device to browse without dragging.
- **Menu** — opens the main menu from any screen. When the menu is already open, it returns to the previous screen.
- **Previous / Next** — move the highlight in menus, lists, and settings. On Now Playing they change tracks. Press and hold either button to rewind or fast-forward the current track.
- **Play / Pause** — starts or pauses the current track. Playback only begins after a user action.
- **Select** — opens the highlighted menu item, plays the highlighted track, activates the highlighted setting, or opens the menu from Now Playing.
- Drag or tap the on-screen progress bar to seek.
- Clicking any menu, track, or setting row also activates it.
- Keyboard shortcuts: `Space` plays/pauses, `←` and `→` (or `↑` and `↓`) browse, `Enter` selects, and `M` or `Escape` opens the menu or goes back. Shortcuts pause while a form control or button has focus so normal keyboard access still works.

When a playing track ends, the next track starts automatically. After the last track, playback wraps to the first one.

## Sound, haptics, and sharing

- Clicker sounds are synthesized with the Web Audio API: a click for button presses and a light tick for each wheel step. They are **off by default** and can be enabled under **Settings → Clicker**.
- Short haptic feedback is used on supported devices when vibration is available. It is skipped when the user prefers reduced motion. Every control remains usable with the clicker and haptics off.
- **Settings → Share Player** uses the Web Share API when available, then falls back to copying the player's own URL. It never shares an external music-service link.
- Motion and transitions are reduced when `prefers-reduced-motion` is enabled.

## Chicago font required

The LCD and the click-wheel `menu` label are set to the Chicago typeface, but no Chicago font file is included in this project. Chicago is a proprietary Apple typeface, so use a licensed copy rather than downloading a substitute.

To enable it:

1. Add your Chicago font file to `public/fonts/`.
2. Name it **`Chicago.woff2`** (recommended), **`Chicago.ttf`**, or **`Chicago.otf`** so the existing `@font-face` rule picks it up.
3. Refresh the page. No other code changes are needed.

`src/index.css` loads the file from `/fonts/Chicago.woff2`, `/fonts/Chicago.ttf`, or `/fonts/Chicago.otf`, and also checks for an installed `Chicago` font first. Until a file is added, the LCD and wheel label fall back to monospace. If your font file has a different name or weighs, tell me the filename and I will wire it in.

## Project structure

```text
public/
├── fonts/                 add Chicago.woff2, Chicago.ttf, or Chicago.otf
├── music/                 audio files used by the playlist
├── playlist.json          the ordered playlist
└── favicon.svg
src/
├── components/
│   ├── ClickWheel.tsx     wheel buttons, drag stepping, and icons
│   ├── ClickWheel.css
│   ├── Screen.tsx         LCD screens and state views
│   └── Screen.css
├── hooks/
│   ├── useAudioPlayer.ts  HTMLAudioElement playback and events
│   ├── useInterfaceSounds.ts  click/tick sounds and haptics
│   └── usePlaylist.ts     playlist loading and validation
├── utils/formatTime.ts
├── App.tsx                page layout, navigation, and control wiring
├── App.css
├── index.css
├── menu.ts                menu labels and ordering
├── playlist.ts            playlist display name
└── types.ts
```

## Commands

| Command           | Purpose                             |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start the Vite development server   |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build        |
| `npm run lint`    | Run Oxlint                          |
