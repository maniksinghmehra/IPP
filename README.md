# POD — a classic music player

A responsive, iPod-inspired music player built with React and TypeScript. It uses one local playlist, a tactile white click wheel, and browser-native audio playback. There is no sign-in, upload flow, external music service, or database.

## Run locally

You will need Node.js 20.19+ (or 22.12+) and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

To check the production build:

```bash
npm run build
npm run preview
```

## Add your own songs

1. Put your audio files in `public/music/`.

   For example:

   ```text
   public/
   ├── music/
   │   ├── my-first-song.mp3
   │   └── another-song.m4a
   └── playlist.json
   ```

2. Open `public/playlist.json` and add one object for each song:

   ```json
   [
     {
       "title": "My First Song",
       "artist": "My Favorite Artist",
       "src": "/music/my-first-song.mp3"
     },
     {
       "title": "Another Song",
       "artist": "Another Artist",
       "src": "/music/another-song.m4a"
     }
   ]
   ```

3. Refresh the page. The order of the objects is the playlist order.

Notes:

- `src` starts with `/music/` because files in `public/` are served from the site root. The actual file lives at `public/music/my-first-song.mp3`.
- File paths are case-sensitive on many systems, so match the filename exactly.
- The browser must support the audio format. MP3, M4A/AAC, OGG, and WAV have good support in current browsers.
- The three included tracks are short synthesized WAV demos. Replace or remove them in both `public/music/` and `public/playlist.json`.
- If `playlist.json` is empty, missing, or invalid, the screen shows a friendly error with a reload button. If an audio file cannot load, the screen shows a track error with retry and next actions.

## Controls

- **Menu** opens and closes the playlist. While the playlist is open, Previous/Next move the highlight and Select starts that track.
- **Previous / Next** change tracks while the now-playing screen is visible. On the playlist screen they move the selection.
- **Play / Pause** controls the current track.
- **Select** opens the playlist from the now-playing screen, or plays the highlighted track while browsing.
- Drag or tap the on-screen progress bar to seek.
- Keyboard shortcuts: `Space` plays/pauses, `←` and `→` change tracks, `M` toggles the menu, and `Enter` selects. Shortcuts pause while a form control or button has focus so normal keyboard access still works.
- Clicking any playlist row also plays that track.

When a playing track ends, the next track starts automatically. After the last track, playback wraps to the first one.

## Project structure

```text
public/
├── music/                 audio files
├── playlist.json          the single playlist
└── favicon.svg
src/
├── components/
│   ├── ClickWheel.tsx     wheel controls and icons
│   ├── ClickWheel.css
│   ├── Screen.tsx         now playing, playlist, and state screens
│   └── Screen.css
├── hooks/
│   ├── useAudioPlayer.ts  HTMLAudioElement playback and events
│   └── usePlaylist.ts     playlist loading and validation
├── utils/formatTime.ts
├── App.tsx                page layout and control wiring
├── App.css
├── index.css
└── types.ts
```

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start the Vite development server |
| `npm run build`   | Type-check and build for production |
| `npm run preview` | Preview the production build    |
| `npm run lint`    | Run Oxlint                      |
