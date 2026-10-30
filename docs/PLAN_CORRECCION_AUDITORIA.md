# Plan de corrección — auditoría de frontend (2026-10-22)

Fuente: informes de `@reviewer` y `@tester` sobre el commit actual. Cada tarea indica
archivo:línea, criterio de aceptación y comando de verificación.

Regla de trabajo: **no re-auditar el repo completo**. Cada fase verifica solo sus archivos.
El motor `audit_code --all` se ejecuta una vez al cerrar la fase 5.

Orden por riesgo real, no por severidad nominal: primero el bloqueo de compatibilidad,
luego el único defecto funcional confirmado, luego los agujeros de test que dejan los
flujos críticos sin red.

---

## Fase 0 — Bloqueante: fijar la revisión del contrato

**T0.1 Contrato único.** Hoy hay tres revisiones declaradas:

| Archivo | Dice |
|---|---|
| `src/lib/trabajos.js:1` | OpenAPI **1.4.0** |
| `src/api/endpoints.js:3` | OpenAPI **1.3.0** |
| `docs/AI_CONTEXT.md:15` | OpenAPI **1.3.0** |

- Acción: leer `openapi.yaml` del repositorio backend y anotar la revisión realmente
  consumida en los tres archivos a la vez. Si sigue en 1.3.0, revertir el comentario de
  `trabajos.js`; si ya es 1.4.0, actualizar `endpoints.js` y `AI_CONTEXT.md`.
- Aceptación: `grep -rn "OpenAPI\|openapi.yaml" src docs` devuelve **una sola** revisión.
- Bloquea: cualquier afirmación de compatibilidad y la tarea T2.3 (`/me/history`).

## Fase 1 — Defecto funcional y barrera local

**T1.1 Reintento del cierre irrecuperable.** `src/pages/Control.jsx:120-127` y `:160-161`.
El botón «Actualizar trabajo» recarga el detalle, no `cargarAceptados()`; el efecto solo
depende de `trabajo.id`, que no cambia, así que el error persiste sin recargar la página.

- Acción: extraer la carga a una función reutilizable y cablearla a un botón «Reintentar»
  propio, o añadir un contador de intento a las deps del efecto.
- Aceptación: con la API caída, pulsar «Reintentar» vuelve a llamar a
  `GET /jobs/{id}/applications` y, al restablecer la API, la lista aparece sin recargar.
- Verificación: test nuevo en `test/control.test.jsx` (ver T2.4).

**T1.2 Instalar el hook local.** `git config core.hooksPath` está vacío: `.githooks/pre-commit`
nunca corre, que es exactamente lo que advierte `AGENTS.md`.

- Acción: `git config core.hooksPath .githooks`. Documentar el comando en `README.md`
  como paso obligatorio tras `npm ci`.
- Aceptación: `git config --get core.hooksPath` devuelve `.githooks` y un commit de prueba
  con un `.env` preparado se rechaza.
- Nota: el hook solo detecta secretos; no corre lint ni tests (ver T5.3).

## Fase 2 — Tests de los flujos críticos (hoy con 0 cobertura)

**T2.1 `AdminUsuarios`** — `src/pages/AdminUsuarios.jsx` (354 líneas, 0 tests). Casos mínimos:
alta BECARIO verificando `metaMinutos = horas × 60` (:312); alta ENCARGADO; alta fallida
muestra error; reset muestra la contraseña temporal **una sola vez** y no desmonta la tabla
(:94-96); desactivar pide confirmación; **un admin no puede desactivarse a sí mismo**
(`esPropia`, :159); cambiar filtro reinicia a página 1 (:205-208).

**T2.2 `ProtectedRoute`** — `src/components/ProtectedRoute.jsx` (29 líneas, 0 tests). Sin
sesión → `/login` con `state.desde`; `requiereCambioPassword` → `/change-password`; rol
incorrecto → `/`; cargando → `role="status"`.

**T2.3 `Login` y `ChangePassword`** — `Login.jsx:23-36`, `ChangePassword.jsx:33-45`.
`requiereCambioPassword: true` navega a `/change-password` (Login.jsx:30); error de sesión
como warning; 401 al cambiar contraseña; payload `{passwordActual, passwordNuevo,
passwordNuevoConfirmacion}`.

**T2.4 Reintento de aceptados** — cubre T1.1 en `test/control.test.jsx`.

**T2.5 Bucle multipágina** — `src/api/endpoints.js:98-108`. `todasLasDelTrabajo` con
`totalPages > 1`; y `decidir` con acción inválida (:122-125).

**T2.6 `Field`** — `src/components/ui.jsx:5-18`, componente más reutilizado, sin tests:
`aria-describedby` a hint y error, `aria-invalid`, `role="alert"`, label asociado.

- Aceptación de fase: los cinco flujos ejecutan al menos un caso de fallo, no solo camino feliz.
- Verificación: `npx vitest run test/admin-usuarios.test.jsx test/protected-route.test.jsx
  test/login.test.jsx test/control.test.jsx test/endpoints.test.js`

## Fase 3 — Estabilizar Vitest (CI rojo intermitente)

**T3.1 Pool y entorno.** `vitest.config.js` aplica `jsdom` a los 15 archivos; la salida del
run confirma *«Environment jsdom was created 15 times · 78% of tracked time»*.

- Acción: `pool: 'threads'`, `maxWorkers: 4`, `minWorkers: 1`, `teardownTimeout: 20000`,
  `clearMocks: true`, `restoreMocks: true`.
- Añadir `// @vitest-environment node` en los 8 tests sin DOM: `api`, `config`, `endpoints`,
  `deploy-env`, `docker-guard`, `code-audit`, `codex-audit`, `setup`.
- No usar `isolate: false`: rompe los mocks mutables (`rolActual` en `jobs.test.jsx`,
  `crypto` en `control.test.jsx`).
- Aceptación: `npm test` 5 veces seguidas, todas exit 0, sin
  `[vitest-pool] Timeout waiting for worker to respond`.

**T3.2 Sacar el temporal de `src/`.** `test/codex-audit.test.js:128` escribe
`src/lib/__tmp_codex_audit.js` dentro de `src/`; si el proceso muere queda y
`endpoints.test.js` lo escanea. Moverlo a un directorio temporal fuera de `src/`.

**T3.3 `.vitest/` a `.gitignore`** (artefacto untracked generado por el wrapper `rtk.exe`).

## Fase 4 — Accesibilidad

**T4.1 Enlace de salto** — `src/components/AppShell.jsx:58-107`. Añadir
`<a href="#contenido" class="skip-link">Saltar al contenido</a>` visible al foco y
`id="contenido"` en `<main>`. Criterio WCAG 2.4.1.

**T4.2 Aislar el `Dialog`** — `src/components/ui.jsx:84-132`. Hoy atrapa foco y cierra con
Escape, pero el fondo sigue accesible al lector de pantalla. Aplicar `inert` (o
`aria-hidden`) al contenedor de la app mientras está abierto y `overflow: hidden` en `body`.
Aceptación: con el diálogo abierto el lector no alcanza el fondo; al cerrar se restaura.

- Verificación: `npx vitest run test/dialog-accessibility.test.jsx` + comprobación manual de Tab.

## Fase 5 — Higiene y contrato de errores

**T5.1 Mapear `ApiError.detalles`** — `src/lib/api.js:52` lo construye y ningún componente lo
lee. En `ui.jsx:20` y los formularios de alta/publicación, mostrar los errores por campo
que devuelve el backend en 422. Reporta a fase 2: añadir test con `ApiError` real (no
`new Error`), incluyendo 403, 409, 500 sin JSON y 204.

**T5.2 Limpieza de duplicados** (una sola pasada):
- `horas()` duplicada: `src/lib/trabajos.js:4`, `src/pages/Control.jsx:8`,
  `src/pages/AdminSupervision.jsx:7` → importar de `lib/trabajos.js`.
- `src/pages/Panel.jsx:106`: `toLocaleString('es-CO')` → `fechaVisible(...)` (es-BO + zona).
- `src/pages/Panel.jsx:76`: mostrar `NOMBRES_ROL` en vez del código `ADMIN`.
- Eliminar código muerto: `src/pages/SeccionPendiente.jsx`, `src/config/vistas.js` y el
  test `test/config.test.js:14-16` que solo valida ese código.
- `src/pages/AdminUsuarios.jsx:342,361`: dejar de pasar `value`/`onChange` a `Field` con
  `children` (la rama los descarta, `ui.jsx:5-18`).
- `test/setup.js:3-6`: borrar el `defineProperty` no-op.

**T5.3 Auditoría como gate real** — `audit_bridge.mjs --all` siempre sale con código 0.
Hacer que devuelva 1 con un hallazgo `deny` y añadir el paso a `.github/workflows/ci.yml`.

**T5.4 Confirmación de reseteo de contraseña** — `src/pages/AdminUsuarios.jsx:152-154`
ejecuta con un clic; reutilizar el patrón de `Dialog` que ya usa «Desactivar».

**T5.5 Bloquear envío inválido** — `src/pages/ChangePassword.jsx:30-31,50,90`: añadir
`disabled={enviando || longitudInsuficiente || noCoincide || !formulario.passwordActual}`.

**T5.6 Reforzar aserciones débiles** — `test/panel.test.jsx:34-36,47-49` y
`test/control.test.jsx:64` usan texto suelto; usar `within(metric)` como ya hace
`test/postulaciones.test.jsx:58`.

**T5.7 Defensa del bucle** — `src/api/endpoints.js:100-106`: validar `meta` y lanzar error
explícito en vez de encadenar peticiones si falta `totalPages`.

### No se toca (decisiones conscientes)

CSRF en `sessionStorage`; `apiRequest` importado en `useRecurso.js`; `setTimeout(0)` en
`AuthProvider` y `ListaUsuarios`; clases Tailwind generadas desde `@theme`; contrastes
AA ya verificados; ausencia de mocks activos.

---

## Cierre

1. `npm run lint`
2. `npm test` (5 veces, sin timeout de worker)
3. `npm run build`
4. `audit_code --all` → sin hallazgos
5. Actualizar la sección 6 de `docs/AI_CONTEXT.md` con lo completado.

Riesgo abierto al cerrar: **T0.1** no se puede resolver sin el `openapi.yaml` del
repositorio backend. Hasta entonces, la compatibilidad del frontend no está afirmada.

## Estado de ejecuci�n (22-10-2026)

Completado: F0 (contrato 1.4.0, commit 8ed9226 del backend), F1 (T1.1 reintento de aceptados, T1.2 hook local documentado y activado), F2 (pruebas de `AdminUsuarios`, `ProtectedRoute`, `Login`/`ChangePassword`, `Field` y paginaci�n multip�gina), F3 (`pool: 'threads'`, `maxWorkers: 4`, `@vitest-environment node` en siete archivos, temporal de `codex-audit` fuera de `src/`, `.vitest` ignorado), F4 (enlace de salto y `Dialog` con `inert` y scroll bloqueado) y F5 (`horas()` de `trabajos.js`, `Panel` con `fechaVisible` y `NOMBRES_ROL`, c�digo muerto eliminado, gate de auditor�a en CI, confirmaci�n del reset de contrase�a, env�o bloqueado en `ChangePassword`, aserciones de m�tricas con `within`).

Cierre verificado: lint limpio; `npm test` 19 archivos / 135 pruebas, cinco pasadas consecutivas sin timeout; build 334,86 kB; `audit_code --all` sin hallazgos.

Pendiente: `ApiError.detalles` se transporta y se prueba, pero ning�n formulario los mapea todav�a a campos concretos.
