import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // This is needed to make the app accessible in some sandboxed environments
    host: '0.0.0.0',
    port: 3000, 
  },
})
