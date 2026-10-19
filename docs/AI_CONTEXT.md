# Contexto de agentes: frontend MiBeca

## 1. Propósito y alcance

Este repositorio contiene React/Vite, estilos y Firebase Hosting. El backend y el contrato API viven en `gestion-de-trabajo-becario-backend`. El coordinador de la raíz asigna archivos y evita ediciones simultáneas.

## 2. Stack y estructura comprobados

React 19 con JavaScript, Vite, ESLint y `react-router-dom`. `src/App.jsx` monta el enrutado real: `/login`, `/change-password`, un layout protegido con secciones por rol y una ruta 404. `src/auth/AuthProvider.jsx` recupera la sesión con `GET /auth/me` y expone inicio de sesión, cierre y cambio de contraseña; `src/lib/api.js` es el único cliente HTTP (credenciales incluidas, cabecera `X-CSRF-Token` en escrituras, `ApiError` con `code`). `src/components/ProtectedRoute.jsx` protege rutas y `src/components/AppShell.jsx` aporta la navegación según el rol. `src/pages/AdminUsuarios.jsx` implementa el alta de cuentas, filtros, paginación, desactivación, reactivación y nueva contraseña, mostrando la contraseña temporal una sola vez. `src/config/navegacion.js` y `src/config/vistas.js` declaran las secciones de cada rol, incluidas las de fases 3 y 4 todavía vacías. `src/styles/theme.css` centraliza colores y tipografía y su identidad visual se conserva. El selector de rol demostrativo ya no existe. Firebase Hosting publica `dist` mediante workflows existentes, que no se modificaron en esta etapa.

## 3. Instalación y comandos

Consultar `README.md` y `package.json`; los comandos previstos son `npm ci`, `npm run lint`, `npm run build` y `npm run dev`. El 18-10-2026 se ejecutaron lint y build con Node de Windows. El 19-10-2026 se verificó además la aplicación en navegador con el backend local: `npm run dev` en el web y en el backend, gracias al proxy de Vite que reenvía `/api` a `http://127.0.0.1:3000` (mismo origen, la cookie HttpOnly funciona sin CORS entre puertos). `VITE_API_URL` permite apuntar a otro origen y solo debe cambiarse con la CORS del backend configurada para ese origen. Comandos de despliegue: `npm ci`, `npm run build` (genera `dist/`) y `npm run start` (`node scripts/start.js`, que sirve `dist/` con Vite aplicando el `PORT` del proveedor, porque `vite preview` lo ignora). La aplicación es de una sola página: el hosting estático debe devolver `index.html` en las rutas de la aplicación y `public/404.html` en las desconocidas; ese archivo guarda la ruta en `sessionStorage` (`mibeca.ruta404`) y `src/main.jsx` la restaura antes de montar React.

## 4. Reglas y contrato

Leer el plan canónico en `../gestion-de-trabajo-becario-backend/docs/PLAN_MVP_MIBECA.md` desde la raíz común; esta carpeta conserva una copia idéntica para compañeros que clonan solo frontend. El contrato canónico es `backend/openapi.yaml` (ya existe, OpenAPI 3.1, cubre auth y usuarios); `backend/docs/api-v1.md` es un resumen subordinado a él. Anotar en cada PR el commit/tag del contrato backend usado; mientras está sin commit, declarar “borrador no fijado”. No copiar un contrato alternativo aquí. Los mocks deben identificarse como tales.

## 5. Estado y verificaciones

El 19-10-2026 se completó la fase 2 del plan en el frontend: autenticación real contra el backend, cambio obligatorio de contraseña, recuperación de sesión, rutas por rol y administración de usuarios. La interfaz ya no consume la API solo por simulación: no hay mocks activos, solo hay estados vacíos declarados para las secciones de fases 3 y 4. Verificado: `npm run lint` sin incidencias, `npm run build` correcto y recorrido completo en navegador (login del administrador, alta de becario y de encargado con contraseña temporal mostrada una vez, cambio de contraseña, cierre de sesión, inicio de sesión con la temporal, permisos por rol con redirección en `/admin/usuarios` para becario). La evidencia completa está en `backend/docs/VERIFICACION_FASE_2.md`. **Pendiente**: sin pruebas automatizadas en el frontend, sin verificación en Firebase Hosting y sin despliegue.

El 18-10-2026 se ejecutaron `npm run lint` y `npm run build` con Node de Windows; ambos finalizaron correctamente. No consta verificación de ejecuciones reales de Firebase ni gate de lint. Python 3.11.9 está disponible como `python` en el PowerShell del usuario; los hooks se ajustaron para usarlo. El hook Git, idéntico al de backend, permitió un commit temporal inocuo y bloqueó un `.env`; el script Codex pasó simulaciones, pero su activación real en el cliente no se verificó. Los cambios previos de `.agents` y `.claude` son ajenos a esta etapa.

## 6. Límites y siguientes tareas

No modificar configuración Firebase ni publicar por iniciativa del perfil. No presentar datos simulados como reales: las secciones de trabajos, postulaciones y control siguen vacías a propósito. Al iniciar la fase 3 hay que ampliar `openapi.yaml` primero en el backend y luego consumirlo aquí, sin inventar un contrato paralelo. Antes de cualquier PR hay que ejecutar `npm run lint` y `npm run build` y comprobar accesibilidad (foco visible, `aria-*`, navegación por teclado). Entregar al coordinador rutas, resultados y dependencia exacta del backend.
