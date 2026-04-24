import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function resolveProxyTarget(env) {
  const rawTarget =
    env.VITE_PRIMARY_BACKEND_URL ||
    env.VITE_API_URL ||
    env.VITE_GATEWAY_URL ||
    'http://localhost:5050'

  if (rawTarget.startsWith('/')) {
    return 'http://localhost:5050'
  }

  try {
    return new URL(rawTarget).origin
  } catch {
    return 'http://localhost:5050'
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = resolveProxyTarget(env)

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': { target: proxyTarget, changeOrigin: true },
        '/gateway': { target: proxyTarget, changeOrigin: true },
      },
    },
  }
})
