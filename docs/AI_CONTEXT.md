# Contexto de agentes: frontend MiBeca

## Propósito y alcance

Este repositorio contiene React/Vite, estilos y Firebase Hosting. El backend, PostgreSQL y el contrato canónico viven en `../gestion-de-trabajo-becario-backend`. El coordinador asigna archivos entre repositorios. Consultar `docs/PLAN_MVP_MIBECA.md` y el contrato backend antes de cambiar flujos.

## Estructura actual

React 19, Vite y `react-router-dom`. `src/App.jsx` monta las rutas; `src/auth/AuthProvider.jsx` mantiene la sesión con `GET /auth/me`; `src/lib/api.js` es el cliente HTTP único. La cookie de sesión es HttpOnly; el cliente envía CSRF en escrituras y `Idempotency-Key` al cerrar un trabajo. `ProtectedRoute` restringe por rol y `AppShell` ofrece navegación. `src/styles/theme.css` conserva la identidad visual. No hay selector de rol ni datos simulados activos.

`AdminUsuarios.jsx` gestiona cuentas. `Trabajos.jsx` permite publicar, editar, postularse, decidir postulantes y consultar detalles. `Control.jsx` implementa el cierre con asistencia exhaustiva, consulta de asistencia del encargado, progreso real del becario e historiales de ambos roles. `/admin/supervision` continúa como estado vacío para la fase 5.

## Contrato y fase 4

Integración basada en `backend/openapi.yaml` revisión **1.2.0, borrador sin commit/tag fijado**. El frontend consume `POST /jobs/{id}/close`, `GET /jobs/{id}/attendance`, `GET /me/progress` y `GET /me/history`, además de las rutas de trabajos y postulaciones de la revisión 1.1.0. El formulario carga todas las páginas de aceptados y exige asistencia o ausencia explícita de cada uno. Para un reintento con el mismo contenido conserva la misma clave; al cambiar la asistencia genera otra. Los minutos acreditados proceden exclusivamente del backend. El historial del becario conserva las ausencias; el del encargado muestra asistentes de sus trabajos cerrados.

Las fechas se muestran y se introducen en `VITE_TIME_ZONE` (por defecto `America/La_Paz`). El formulario convierte la hora de esa zona a UTC para la API y convierte UTC de vuelta a la zona al editar. Valida fechas imposibles y horas inexistentes o ambiguas durante cambios de horario. `VITE_API_URL` permite apuntar al backend configurado; en desarrollo Vite reenvía `/api` a `http://127.0.0.1:3000` para usar cookies del mismo origen. El backend debe estar levantado con PostgreSQL local y migraciones aplicadas para el flujo real.

## Verificación y límites

El 19-10-2026 se ejecutaron `npm run lint`, `npm run build` y `npm test`: 19 pruebas aprobadas. Las pruebas de fase 4 cubren marcado exhaustivo, clave estable en reintento, encabezado de idempotencia y visualización de ausencias. El coordinador verificó el flujo real en Chromium contra API y PostgreSQL de prueba local: cierre explícito, 276 minutos para asistente, cero para ausente, progreso e historial de ambos roles becarios, sin desbordamiento a 390 px ni errores JavaScript. También publicó un trabajo el mismo día con hora futura de Bolivia; la API recibió UTC correcto y la edición mostró las mismas horas locales. No hay despliegue en esta etapa.

Firebase Hosting y sus workflows no se modificaron. Antes de PR, repetir lint, build y pruebas, verificar permisos por rol en backend y recorrer móvil y escritorio.