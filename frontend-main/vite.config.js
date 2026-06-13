import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/petfood/',
  plugins: [react()],
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts', 'html2canvas'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://10.1.10.144:8090',
        changeOrigin: true,
      },
      '/recommender': {
        target: 'http://10.1.10.144:8000',
        changeOrigin: true,
      },
    },
  },
})
