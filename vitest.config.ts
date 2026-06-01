import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Per-file `// @vitest-environment jsdom` still applies; this only adds the
    // shared setup (Web Animations API polyfill for jsdom — see vitest.setup.ts).
    setupFiles: ['./vitest.setup.ts'],
  },
})
