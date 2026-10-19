/**
 * Arranque de producción del frontend: sirve `dist/` con Vite.
 *
 * La mayoría de plataformas de hosting inyectan el puerto en `PORT`, y Vite no
 * lo respeta en `vite preview`. Este script lo aplica para que el despliegue
 * no falle al escuchar en el puerto que la plataforma espera.
 */
import { preview } from 'vite';

const puerto = Number.parseInt(process.env.PORT ?? '', 10) || 4173;
const servidor = await preview({
  preview: { host: '0.0.0.0', port: puerto },
});

const urls = servidor.resolvedUrls?.local ?? [`http://localhost:${puerto}/`];
console.log(`MiBeca frontend disponible en ${urls.join(', ')}`);

const cerrar = async () => {
  await servidor.close();
  process.exit(0);
};

process.on('SIGINT', cerrar);
process.on('SIGTERM', cerrar);
