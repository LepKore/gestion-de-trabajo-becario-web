# Implementation Plan: Gestión de trabajos y horas becarias

**Branch**: `001-becario-work-management` | **Date**: 2026-10-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-becario-work-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

Sincronizar la interfaz MiBeca con el contrato canónico del backend para cubrir el flujo
de becarios, encargados y administradores, incluyendo calificaciones. El backend terminó
su spec y sus tareas correspondientes; por tanto, web puede continuar contra el contrato
OpenAPI actualizado y verificado.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript, React 19, Vite 8

**Primary Dependencies**: react-router-dom, Vitest, Testing Library, cliente HTTP existente

**Storage**: N/A en web; persistencia y PostgreSQL pertenecen al backend

**Testing**: Vitest, Testing Library, ESLint y build de Vite

**Target Platform**: Navegadores de escritorio y móvil; backend local según contrato

**Project Type**: Aplicación web frontend consumidora de API

**Performance Goals**: Consultas de trabajos y progreso visibles en un máximo de 3 segundos
en la carga de demostración; validación de backend: p95 definido por su contrato y pruebas.

**Constraints**: No URLs fuera de `src/api/endpoints.js`; respetar shapes, paginación,
CSRF, cookies, `Idempotency-Key` y errores del contrato backend; no duplicar autorización.

**Scale/Scope**: Flujo MVP para los tres roles y una institución; pantallas existentes se
extienden antes de crear abstracciones nuevas.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- PASS: el frontend consume el contrato canónico del backend y no crea contratos paralelos.
- PASS: toda dependencia entre repositorios se registra como bloqueo explícito.
- PASS: web y backend avanzan sincronizados; si una tarea web depende de backend, se
  continúa primero en backend desde su última tarea terminada hasta desbloquearla.
- PASS: cada slice debe incluir pruebas y conservar accesibilidad, seguridad y simplicidad.
- PASS: backend terminó las tareas de evaluación y publicó los endpoints/esquemas de
  calificación en `openapi.yaml` v1.4.0.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
src/
├── api/endpoints.js        # rutas y funciones de dominio del contrato
├── auth/                    # sesión y protección de rutas
├── components/             # shell, controles y UI reutilizable
├── config/                 # navegación y configuración
├── lib/                    # cliente HTTP y helpers
├── pages/                  # flujos por rol
└── styles/theme.css        # identidad visual compartida
test/                       # pruebas unitarias, integración y contrato
```

**Structure Decision**: mantener la estructura React/Vite existente. La web no incorpora
backend, modelos SQL ni migraciones; consume el repositorio hermano mediante el contrato
canónico versionado.

Las capacidades base de autenticación, usuarios, metas, trabajos, postulaciones y cierre
se consideran dependencias existentes. El alcance de implementación web de este spec se
centra en su consumo/regresión y en la integración de calificaciones; la auditoría queda
exclusivamente bajo responsabilidad del backend.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Ninguna | N/A | El backend ya terminó la spec, tareas y contrato requerido |
