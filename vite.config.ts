import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { readConfig } from './src/config/env.ts'
import { backendCheck, readPort } from './dev/backend-check.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const { apiBaseUrl } = readConfig(env)
  const port = readPort(env.FRONTEND_PORT)
  return {
    plugins: [react(), tailwindcss(), backendCheck(apiBaseUrl, `http://localhost:${port}`)],
    server: {
      hmr: true,
      port,
      // Another free port would not match CORS_ORIGINS and FRONTEND_URL in the backend.
      strictPort: true,
    },
  }
})
