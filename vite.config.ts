import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Vite configuration.
 *
 * `manualChunks` groups heavy vendor libs into separate chunks so the
 * initial download is much smaller and each chunk can be cached long-term
 * across deploys (as long as its deps don't change). Route-level code
 * splitting happens in `src/pages/lazy.ts` via `React.lazy`.
 */
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    // 3D scene chunks are legitimately > 500 kB; raise the noisy warning.
    chunkSizeWarningLimit: 900,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined;

          // Three.js core — loaded by every 3D scene.
          if (id.includes('node_modules/three/')) return 'three';

          // Drei helpers — heavyweight, split off from r3f proper.
          if (id.includes('@react-three/drei')) return 'drei';

          // Rapier physics — used only on game routes that need collisions.
          if (id.includes('@react-three/rapier') || id.includes('@dimforge/rapier')) {
            return 'rapier';
          }

          // R3F core + react-spring/three integration.
          if (
            id.includes('@react-three/fiber') ||
            id.includes('@react-spring/three') ||
            id.includes('@react-spring')
          ) {
            return 'r3f';
          }

          // Framer Motion — animation runtime, used across the app shell.
          if (
            id.includes('framer-motion') ||
            id.includes('motion-dom') ||
            id.includes('motion-utils')
          ) {
            return 'motion';
          }

          // React + router + state libs — core shell dependencies.
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('react-router') ||
            id.includes('/zustand/') ||
            id.includes('scheduler')
          ) {
            return 'react-core';
          }

          // Chess engine lib — only used on the chess route.
          if (id.includes('chess.js')) return 'chess-vendor';

          return undefined;
        },
      },
    },
  },
})
