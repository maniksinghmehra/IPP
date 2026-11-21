# P1 v1.0.0 — Native Android & Web Music Player

Welcome to the official **v1.0.0** release of **P1**, a retro iPod Classic web & native Android music player. P1 ships with the **`for astha`** playlist.

---

## 🌟 Key Features & Functions

### 1. 🛞 Classic Click Wheel & Haptic Feedback
- **Touch & Drag Controls**: Smooth angular wheel scrolling to navigate menus, playlists, and track listings.
- **Physical Button Actions**:
  - **Menu**: Navigate back up menu hierarchies.
  - **Previous / Next**: Skip tracks or press & hold to scan backward/forward.
  - **Play / Pause**: Instant audio playback control.
  - **Select**: Enter submenus or play selected tracks.
- **Haptic Feedback**: Tactile click ticks on rotation and button presses powered by `@capacitor/haptics`.

### 2. 🎵 Android System Media Notification & Lock Screen Controls
- Native integration with the Android `MediaSession` API (`@capgo/capacitor-media-session`).
- Displays live metadata (Track Title, Artist Name, Album Art) in the Android Notification Shade and Lock Screen.
- Controls (Play, Pause, Skip, Seek) stay in sync with system media buttons and Bluetooth audio devices.

### 3. ⏱️ Persistent State & Cold-Start Resume
- Saves playback state (current track index, track position, volume, active menu view) on playback events, app backgrounding (`appStateChange`), and browser unload.
- When re-opening the application or refreshing the browser, playback resumes from the exact song and timestamp.

### 4. ⚡ High Performance & Instant Asset Loading
- Lightweight image assets (~46 KB compressed cover art).
- Smart metadata preloading (`preload="metadata"`) prevents network bandwidth congestion on web deployments.
- Full offline playback for packaged Android APK assets.

---

## 📱 Installation & Deployment

### Web Deployment
1. Build client assets:
   ```bash
   npm run build
   ```
2. Serve the `dist/` directory on any static web host (GitHub Pages, Vercel, Netlify).

### Android Native App
1. Build production APK:
   ```bash
   npm run android:sync
   cd android && ./gradlew assembleDebug
   ```
2. The generated APK is located at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📦 Tech Stack
- **Framework**: React 19 + TypeScript + Vite
- **Mobile Platform**: Capacitor 8 (Android)
- **Plugins**: `@capacitor/haptics`, `@capgo/capacitor-media-session`, `@capacitor/app`
- **Styling**: Pure CSS with pixel-accurate iPod Classic LCD screen & Click Wheel styling
