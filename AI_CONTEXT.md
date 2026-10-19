# Contexto del proyecto

> Última verificación: 2026-10-19

## 1. Propósito del proyecto
Interfaz React para la gestión de trabajo becario de MiBeca.
Audiencia / uso: desarrollo local y Firebase Hosting.

## 2. Stack tecnológico y arquitectura
Frontend: React 19, Vite, JavaScript y `react-router-dom`.
Backend: N/A; vive en el repositorio hermano.
Patrones clave: cliente HTTP único en `src/lib/api.js` y rutas protegidas.

## 3. Estructura del proyecto (mapeo)
`src/`: aplicación, componentes, páginas, autenticación y estilos.
`public/`: recursos públicos y fallback 404.
`.github/workflows/`: validación y despliegue Firebase.
Nota para IA: no modificar Firebase ni publicar por iniciativa propia.

## 4. Comandos críticos
Inicialización: `npm ci`.
Desarrollo: `npm run dev`.
Testing: `npm test`.
Lint / typecheck: `npm run lint`; no hay typecheck configurado.
Deploy: `npm run build` y Firebase Hosting; requiere confirmación humana.

## 5. Reglas y convenciones estrictas
Estilo de código: JavaScript, componentes React y variables de `src/styles/theme.css`.
Librerías permitidas / prohibidas: usar dependencias ya declaradas salvo autorización.
Manejo de errores: respetar `ApiError` y no presentar mocks como datos reales.

## 6. Estado actual y registro de cambios
Completado: autenticación, rutas por rol y administración de usuarios.
En progreso: fases posteriores del MVP.
Problemas conocidos: sin verificación de despliegue real en Firebase.
