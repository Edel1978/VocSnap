import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { readdirSync, readFileSync } from 'node:fs'

// Cache-Name aus den Tesseract-Versionen: nach einem Update werden Worker, Kern und Sprachdaten neu geladen.
const version = (pkg: string) => JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8')).version as string
const tesseractCache = [
  'tesseract',
  version('tesseract.js'),
  version('tesseract.js-core'),
  ...readdirSync('node_modules/@tesseract.js-data').map((l) => `${l}${version(`@tesseract.js-data/${l}`)}`),
].join('-')

// Basis-Pfad: relativ, damit die App unter jedem Unterpfad läuft (GitHub Pages, eigener Webspace).
// Mit BASE_PATH überschreibbar, z. B. BASE_PATH=/VocSnap/ npm run build.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  define: { __TESSERACT_CACHE__: JSON.stringify(tesseractCache) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Neu laden steuert die App selbst (src/ui/UpdateWatcher.tsx).
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'VocSnap',
        short_name: 'VocSnap',
        description: 'Vokabeln fotografieren und lernen',
        lang: 'de',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#0f172a',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App-Hülle sofort offline. Tesseract (ca. 17 MB) erst beim ersten Scan zwischenspeichern.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,webmanifest,woff2}'],
        globIgnores: ['tesseract/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
            handler: 'CacheFirst',
            options: { cacheName: tesseractCache },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
