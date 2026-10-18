import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Basis-Pfad: relativ, damit die App unter jedem Unterpfad läuft (GitHub Pages, eigener Webspace).
// Mit BASE_PATH überschreibbar, z. B. BASE_PATH=/VocSnap/ npm run build.
export default defineConfig({
  base: process.env.BASE_PATH ?? './',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
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
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        globIgnores: ['tesseract/**'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/tesseract/'),
            handler: 'CacheFirst',
            options: { cacheName: 'tesseract' },
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
