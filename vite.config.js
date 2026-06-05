import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrlValue = env.VITE_API_BACKEND_URL || 'http://localhost/api.php/v2.3'
  const backendUrl = new URL(backendUrlValue)

  let vueDevToolsPlugin = null
  try {
    const mod = await import('vite-plugin-vue-devtools')
    const factory = mod && (mod.default || mod)
    if (typeof factory === 'function') vueDevToolsPlugin = factory()
  } catch (e) {
    // plugin not installed — continue without it
  }

  return {
    plugins: [
      vue(),
      ...(vueDevToolsPlugin ? [vueDevToolsPlugin] : []),
    ],
    server: {
      proxy: {
        '/glpi-api': {
          target: backendUrl.origin,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => `${backendUrl.pathname.replace(/\/$/, '')}${path.replace(/^\/glpi-api/, '')}`,
        },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
  }
})
