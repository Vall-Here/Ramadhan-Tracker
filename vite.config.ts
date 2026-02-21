import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['moon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Ramadhan Tracker',
        short_name: 'Ramadhan',
        description: 'Asisten ibadah harian kamu selama Ramadhan',
        theme_color: '#1a4731',
        background_color: '#0f2b1d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'id',
        categories: ['lifestyle', 'utilities'],
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: '/icons/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            form_factor: 'narrow',
            label: 'Ramadhan Tracker homescreen',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'gstatic-fonts-cache', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/api\.alquran\.cloud\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'quran-api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/cdn\.islamic\.network\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'quran-audio-cache', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
