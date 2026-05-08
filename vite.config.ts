import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const buildCommitFallback = 'live-main'

// https://vite.dev/config/
export default defineConfig({
  base: '/paste-scraper-builder/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'docs',
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.1.0'),
    __BUILD_COMMIT__: JSON.stringify(buildCommitFallback),
    __REPOSITORY_URL__: JSON.stringify('https://github.com/baditaflorin/paste-scraper-builder'),
    __PAYPAL_URL__: JSON.stringify('https://www.paypal.com/paypalme/florinbadita'),
  },
})
