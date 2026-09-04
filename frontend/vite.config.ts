import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

const env = loadEnv('', process.cwd(), '')
const authApiUrl = env.AUTH_API_URL || process.env.AUTH_API_URL
const tba3DataApiUrl = env.TBA3_DATA_API_URL || process.env.TBA3_DATA_API_URL

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: ['frontend'],
        watch: {
            // Fix for Docker and WSL2 file change detection
            usePolling: true,
            interval: 100,
        },
        proxy: {
            '/api': {
                target: 'http://backend:3000',
                changeOrigin: true,
            },
            '/ext-auth': {
                target: authApiUrl,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ext-auth/, ''),
            },
            '/ext-tba3': {
                target: tba3DataApiUrl,
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/ext-tba3/, ''),
            },
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
})
