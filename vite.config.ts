import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into vendor chunks
          // Keep React with all React-dependent libraries to avoid forwardRef issues
          if (id.includes('node_modules')) {
            // React core + all React-dependent chart libraries together
            if (id.includes('react-dom') || id.includes('/react/') ||
                id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-react'
            }
            // UI libraries that also need React
            if (id.includes('lucide-react') || id.includes('framer-motion')) {
              return 'vendor-ui'
            }
          }
        },
      },
    },
  },
})
