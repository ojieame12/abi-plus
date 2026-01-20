import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          'vendor-charts': ['recharts'],
          // Split heavy feature modules
          'feature-artifacts': [
            './src/components/artifacts/registry.ts',
            './src/components/artifacts/ArtifactRenderer.tsx',
          ],
          'feature-community': [
            './src/services/communityService.ts',
            './src/services/communityMockData.ts',
          ],
        },
      },
    },
  },
})
