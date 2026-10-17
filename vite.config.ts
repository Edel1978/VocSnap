import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Basis-Pfad: relativ, damit die App unter jedem Unterpfad läuft (GitHub Pages, eigener Webspace).
// Mit BASE_PATH überschreibbar, z. B. BASE_PATH=/VocSnap/ npm run build.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
