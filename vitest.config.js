import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    globals: true,
    // 'forks' + jsdom en cada archivo agotaba el handshake del pool en Windows.
    pool: 'threads',
    maxWorkers: 4,
    minWorkers: 1,
    teardownTimeout: 20000,
    clearMocks: true,
    restoreMocks: true,
  },
})
