import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  // Rutas relativas: el sitio funciona igual en localhost y en GitHub Pages (/malla-curricular/)
  base: './',
  build: {
    rollupOptions: {
      input: {
        stand: resolve(__dirname, 'index.html'), // versión del stand (cámara + mano)
        movil: resolve(__dirname, 'movil.html'), // versión para celular (la abre el QR)
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
  },
});
