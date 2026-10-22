# Contexto del proyecto

> Última verificación: 2026-10-22

## 1. Propósito del proyecto
Interfaz React para la gestión de trabajo becario de MiBeca.
Audiencia / uso: desarrollo local y Firebase Hosting.

## 2. Stack tecnológico y arquitectura
Frontend: React 19, Vite, JavaScript y `react-router-dom`.
Backend: N/A; vive en el repositorio hermano.
Patrones clave: cliente HTTP único en `src/lib/api.js`; todas las rutas de la API se declaran en `src/api/endpoints.js` y ningún otro archivo construye URLs.

## 3. Estructura del proyecto (mapeo)
`src/`: aplicación, componentes, páginas, autenticación y estilos.
`src/api/endpoints.js`: única fuente de verdad de las rutas de la API (`RUTAS`) y funciones de dominio que envuelven `apiRequest`.
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
Endpoints: declarar toda ruta en `src/api/endpoints.js`; las páginas no construyen URLs ni importan `apiRequest`.

## 6. Estado actual y registro de cambios
Completado: autenticación, rutas por rol y administración de usuarios.
En progreso: fases posteriores del MVP.
Problemas conocidos: sin verificación de despliegue real en Firebase.
2026-10-21: endpoints centralizados en `src/api/endpoints.js` con `RUTAS` y funciones `sesionApi`, `usuariosApi`, `trabajosApi`, `postulacionesApi`; `useRecurso` sigue recibiendo rutas de `RUTAS`.
2026-10-22: `src/pages/Postulaciones.jsx` es la pantalla de postulaciones del ENCARGADO (tablero, filtros, aceptar/rechazar); la gestión de postulantes salió del detalle del trabajo. Los datos se agregan con `postulacionesApi.deMisTrabajos()` porque el contrato solo expone postulantes por trabajo.
2026-10-22: columna «Beca» en la lista de postulantes con semestre, horas acreditadas sobre la meta y horas faltantes. Se apoya en el contrato backend **1.4.0**, que añade `semester`, `targetMinutes`, `accreditedMinutes` y `remainingMinutes` al estudiante de `GET /jobs/{id}/applications`; si la API responde con el shape anterior la celda muestra «Sin datos».
