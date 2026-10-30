# Contexto de agentes: frontend MiBeca

## Propósito y alcance

Este repositorio contiene React/Vite, estilos y Firebase Hosting. El backend, PostgreSQL y el contrato canónico viven en `../gestion-de-trabajo-becario-backend`. El coordinador asigna archivos entre repositorios. Consultar `docs/PLAN_MVP_MIBECA.md` y el contrato backend antes de cambiar flujos.

## Estructura actual

React 19, Vite y `react-router-dom`. `src/App.jsx` monta las rutas; `src/auth/AuthProvider.jsx` mantiene la sesión con `GET /auth/me`; `src/lib/api.js` es el cliente HTTP único y `src/api/endpoints.js` la única fuente de verdad de las rutas de la API (las páginas usan `RUTAS` o los grupos `*Api`). La cookie de sesión es HttpOnly; el cliente envía CSRF en escrituras y `Idempotency-Key` al cerrar un trabajo. `ProtectedRoute` restringe por rol y `AppShell` ofrece navegación. `src/styles/theme.css` conserva la identidad visual. No hay selector de rol ni datos simulados activos.

`AdminUsuarios.jsx` gestiona cuentas. `Trabajos.jsx` permite publicar, editar, postularse, decidir postulantes y consultar detalles. `Control.jsx` implementa el cierre con asistencia exhaustiva, consulta de asistencia del encargado, progreso real del becario e historiales de ambos roles. `/admin/supervision` permite a ADMIN consultar progreso paginado e historial de estudiantes.

## Contrato y fases 5–6

Integración basada en `backend/openapi.yaml` revisión **1.6.0**, actualización local del backend pendiente de commit. El frontend consume `POST /jobs/{id}/close`, `GET /jobs/{id}/attendance`, `GET /me/progress` y `GET /me/history`, además de las rutas de trabajos y postulaciones. El formulario carga todas las páginas de aceptados y exige asistencia o ausencia explícita de cada uno. Para un reintento con el mismo contenido conserva la misma clave; al cambiar la asistencia genera otra. Los minutos acreditados proceden exclusivamente del backend. El historial del becario conserva las ausencias; el del encargado muestra asistentes y evaluaciones guardadas de sus trabajos cerrados.

Las fechas se muestran y se introducen en `VITE_TIME_ZONE` (por defecto `America/La_Paz`). El formulario convierte la hora de esa zona a UTC para la API y convierte UTC de vuelta a la zona al editar. Valida fechas imposibles y horas inexistentes o ambiguas durante cambios de horario. `VITE_API_URL` permite apuntar al backend configurado; en desarrollo Vite reenvía `/api` a `http://127.0.0.1:3000` para usar cookies del mismo origen. El backend debe estar levantado con PostgreSQL local y migraciones aplicadas para el flujo real.

## Spec Kit (Spec-Driven Development Toolkit)

Spec Kit (github.com/github/spec-kit, v1.2.4.dev0) es el marco de trabajo SDD del proyecto, instalado el 26-10-2026. Reemplaza la skill `spec-driven-development` (eliminada).

**¿Qué es?** Un CLI `specify` + directorio `.specify/` con plantillas y comandos slash. No es un agente: los agentes leen los archivos de `.specify/` y los siguen.

**Comandos slash disponibles en OpenCode:**
- `/speckit.constitution` — Principios gobernantes del proyecto
- `/speckit.specify` — Crear especificación (.specify/spec.md)
- `/speckit.clarify` — Aclarar áreas ambiguas (opcional, antes de /speckit.plan)
- `/speckit.plan` — Plan técnico (.specify/plan.md)
- `/speckit.tasks` — Lista de tareas (.specify/tasks.md)
- `/speckit.analyze` — Análisis de consistencia entre artifacts (opcional)
- `/speckit.checklist` — Checklist de calidad (opcional)
- `/speckit.implement` — Ejecutar implementación
- `/speckit.converge` — Evaluar codebase y añadir tareas pendientes

**Estructura:** `.specify/` contiene `templates/` (spec-template.md, plan-template.md, tasks-template.md, constitution-template.md, checklist-template.md), `scripts/powershell/`, `workflows/speckit/workflow.yml`, `memory/constitution.md` (plantilla sin completar), `integrations/opencode.manifest.json` y `integration.json`.

**Flujo:** constitution → specify → clarify → plan → tasks → analyze → implement. Cada fase se guarda en `.specify/` y requiere aprobación humana antes de pasar a la siguiente.

**Comandos CLI:** `specify --version`, `specify check`, `specify init . --here --integration opencode --force --non-interactive`.

**Relación con el flujo existente:** El plan canónico del proyecto es `docs/PLAN_MVP_MIBECA.md`. Spec Kit complementa el flujo de desarrollo (especificación → plan → tareas → implementación) pero no reemplaza los documentos del proyecto. Los artifacts de Spec Kit (.specify/spec.md, .specify/plan.md) son para trabajo nuevo no cubierto por el plan existente.

**Instalación:** `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git`. Requiere `uv` (instalar con `Invoke-WebRequest -Uri https://astral.sh/uv/install.ps1 -OutFile $env:TEMP\uv.ps1; . $env:TEMP\uv.ps1`).

## Verificación y límites

El 19-10-2026 se ejecutaron `npm run lint`, `npm run build` y `npm test`: 19 pruebas aprobadas. Las pruebas de fase 4 cubren marcado exhaustivo, clave estable en reintento, encabezado de idempotencia y visualización de ausencias. El coordinador verificó el flujo real en Chromium contra API y PostgreSQL de prueba local: cierre explícito, 276 minutos para asistente, cero para ausente, progreso e historial de ambos roles becarios, sin desbordamiento a 390 px ni errores JavaScript. También publicó un trabajo el mismo día con hora futura de Bolivia; la API recibió UTC correcto y la edición mostró las mismas horas locales. No hay despliegue en esta etapa.

Firebase Hosting conserva los workflows de preview en PR y live desde `main`; ahora lint, pruebas y build deben pasar antes de desplegar. La CI de frontend también se ejecuta en `main`, `dev` y `sergio`.

En fase 6 se corrigió el estado al expirar la sesión y se agregó una prueba con el cliente HTTP del frontend; el diálogo atrapa el foco con Tab, cierra con Escape y devuelve el foco al activador. CI ejecuta lint, pruebas y build en PR y en `main`, `dev` y `sergio`; los workflows Firebase validan `VITE_API_URL`, comprueban `/ready` y aplican los mismos controles antes de preview/live. La configuración de proyecto, secretos de GitHub, CORS del preview, cookies entre dominios y despliegues reales no se verificaron ni modificaron.

El 21-10-2026 se añadió el control local `mibeca.code-audit` (`.opencode/plugin/code-audit.js`, autocargado por OpenCode): rechaza secretos, archivos de credenciales, rutas de API literales fuera de `src/api/endpoints.js` y tokens de sesión en el almacenamiento del navegador; el resto de reglas de accesibilidad, tema, React e higiene se avisa en el turno siguiente. Expone la tool `audit_code` y el comando `/auditar`. Ese mismo motor se usa en Codex a través de `.codex/hooks/audit_bridge.mjs` (`PreToolUse`/`PostToolUse` sobre `apply_patch`), sin una segunda tabla de reglas. No sustituye a lint, pruebas ni al subagente `reviewer`: verifica solo invariantes mecánicas del texto que escribe el agente. Reglas puras en `.opencode/lib/code-audit-rules.js`, casos en `node .opencode/plugin/code-audit.verify.mjs`, `test/code-audit.test.js` y `test/codex-audit.test.js`, y límites en `docs/automation.md`.

El 20-10-2026, en la rama `sergio`, Playwright comprobó casos límite contra la API y PostgreSQL locales: rechazo visible en «Mis postulaciones»; cupo completo con `0 de 1` y postulación deshabilitada; cierre con «No asistió», `0 h` en el encargado y en el historial/progreso del estudiante; validación del inicio pasado sin crear trabajo; carga inicial y error HTTP 503 con recuperación al reintentar. No se detectaron fallas nuevas en esos escenarios ni excepciones JavaScript; los errores HTTP de sesión invalidadas durante la limpieza fueron respuestas esperadas. Se eliminaron las cuentas, trabajos, postulaciones, cierres y auditoría temporales; quedó una sola cuenta admin, sin trabajos ni cierres, con contraseña y cambio obligatorio restaurados. No hubo despliegue.
La rama `dev` incorporó el panel de supervisión de ADMIN y sus pruebas de fase 5. Antes de abrir PR, repetir lint, build y pruebas, verificar permisos por rol en backend y recorrer móvil y escritorio.

El 22-10-2026 se ejecutó `docs/PLAN_CORRECCION_AUDITORIA.md` sobre la auditoría de `@reviewer` y `@tester`. Defecto funcional corregido: `FormularioCierre` reintenta la carga de aceptados (`intentoCarga` en las dependencias del efecto) en lugar de recargar el detalle. Accesibilidad: enlace «Saltar al contenido» en `AppShell` y `Dialog` que marca `inert` el shell y bloquea el scroll de fondo. Higiene: `horas()` se importa de `src/lib/trabajos.js`, `Panel` usa `fechaVisible` y `NOMBRES_ROL`, y se eliminaron `src/pages/SeccionPendiente.jsx`, `src/config/vistas.js` y su prueba. `todasLasDelTrabajo` falla explícitamente si la respuesta no trae `meta`. `audit_bridge.mjs --all` sale con código 1 ante hallazgos `deny` y CI lo ejecuta antes de lint. Vitest usa `pool: 'threads'` y `maxWorkers: 4`, y los siete archivos que no tocan DOM declaran `@vitest-environment node`: 19 archivos y 135 pruebas en ~18 s, cinco pasadas consecutivas sin el timeout de worker. Se añadieron pruebas de `AdminUsuarios`, `ProtectedRoute`, `Login`, `ChangePassword`, `Field`, paginación multipágina y errores 204/422/500 del cliente. Pendiente conocido: `ApiError.detalles` se transporta y se prueba, pero ningún formulario los asigna aún a campos concretos.

El 19-10-2026, en la rama `sergio`, Playwright verificó el frontend contra la API y PostgreSQL locales con los tres roles. Recorrió resumen, publicación de trabajo, lista de trabajos, postulación, decisión de aceptación, cierre con asistencia, progreso e historial; las 1,5 horas acreditadas coincidieron en las vistas de estudiante, encargado y supervisión ADMIN. Revisó escritorio (1280 px) y móvil (320 px), sin desbordamiento de página; las tablas y la navegación conservan desplazamiento interno. La revisión detectó y corrigió el encabezado genérico `Sesión` en rutas de trabajo, el ancho mínimo de 320 px que causaba scroll horizontal con la barra vertical y el desbordamiento de campos de fecha y botones en formularios móviles. Las cuentas y el trabajo temporales se eliminaron; la contraseña del admin y el estado de cambio obligatorio se restauraron y se confirmó la pantalla de cambio al volver a iniciar sesión. No hubo errores ni advertencias de consola. Durante la verificación previa se corrigió además una carrera que podía hacer que el manejador de `401` leyera un estado de sesión obsoleto. Docker corre en local; la API MiBeca está en `127.0.0.1:3001` y PostgreSQL en `127.0.0.1:5434` porque 3000 y 5432 estaban ocupados por otros contenedores. Pasaron `npm run lint`, `npm run build` y `npm test` (33 pruebas). No hubo despliegue.
