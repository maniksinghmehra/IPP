import { cpSync } from 'node:fs'
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
      cpSync(resolve(projectRoot, 'songs'), resolve(projectRoot, 'dist', 'songs'), {
        recursive: true,
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyLocalSongs()],
})
