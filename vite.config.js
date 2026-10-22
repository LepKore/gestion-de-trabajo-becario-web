import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El backend local corre en http://127.0.0.1:3000. El proxy mantiene el
// mismo origen durante el desarrollo, de modo que la cookie HttpOnly de
// sesión funciona con SameSite=Lax sin depender de CORS entre puertos.
const proxyApi = {
  '/api': {
    target: 'http://127.0.0.1:3000',
    changeOrigin: false,
  },
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: proxyApi },
  // Solo para comprobar el build contra la API local. En producción el
  // frontend se sirve como archivos estáticos y el backend es otro origen:
  // ahí la conexión usa VITE_API_URL y la CORS exacta del backend.
  preview: { proxy: proxyApi },
})