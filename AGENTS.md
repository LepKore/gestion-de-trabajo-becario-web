# MiBeca: instrucciones para agentes del frontend

- El coordinador asigna archivos y evita ediciones simultáneas sobre ellos. Un subagente recibe una tarea acotada y entrega resultados verificables; las decisiones persistentes se registran en documentación versionada.
- Lee `docs/PLAN_MVP_MIBECA.md` y `docs/AI_CONTEXT.md` al comenzar. Consulta el contrato canónico en el repositorio backend y anota su revisión; no mantengas un contrato alternativo en el frontend.
- Este repositorio contiene la interfaz React con Vite. La API, PostgreSQL y migraciones pertenecen al repositorio backend.
- Consulta el contrato API antes de integrar pantallas. Identifica como demostración cualquier mock. La autorización real de cada rol corresponde al backend.
- Mantén la identidad visual en `src/styles/theme.css`; las pantallas deben usar variables compartidas y conservar accesibilidad en móvil y escritorio.
- Conserva la configuración Firebase y sus workflows actuales salvo una tarea expresa. No publiques ni accedas a servicios externos por iniciativa propia.
- Un cambio en el chat no altera permisos ejecutables. Nunca te autoautorices ni edites controles para evitar un rechazo.
- El hook de Git se instala localmente con `git config core.hooksPath .githooks`. Antes de un PR, ejecuta `npm run lint` y `npm run build`. Los hooks locales no sustituyen controles compartidos en GitHub.
- Toda ruta de la API se declara en `src/api/endpoints.js` (`RUTAS` y funciones de dominio). No construyas URLs ni importes `apiRequest` desde páginas o componentes; `test/endpoints.test.js` falla si aparece una ruta literal fuera de ese archivo.
