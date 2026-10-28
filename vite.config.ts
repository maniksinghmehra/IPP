import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const projectRoot = fileURLToPath(new URL('.', import.meta.url))

function copyLocalSongs(): Plugin {
  return {
    name: 'copy-local-songs',
    apply: 'build',
    closeBundle() {
      const candidates = ['Songs', 'songs']
      for (const name of candidates) {
        const src = resolve(projectRoot, name)
        if (existsSync(src)) {
          const dest = resolve(projectRoot, 'dist', 'songs')
          cpSync(src, dest, { recursive: true })
          return
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyLocalSongs()],
})
