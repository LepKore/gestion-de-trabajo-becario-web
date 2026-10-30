---
description: "Task list for MiBeca frontend implementation synchronized with the completed backend contract"
---

# Tasks: Gestión de trabajos y horas becarias

**Input**: Design documents from `/specs/001-becario-work-management/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Required by the project constitution and the frontend quality gates.

**Backend prerequisite**: The canonical API is OpenAPI v1.6.0. Owner-only attendance and owner history expose `evaluation: Evaluacion | null`; student and admin views remain without evaluation data. No frontend task may invent or change this contract.

**Existing capabilities**: Authentication, user administration, hour targets, jobs,
applications, closure, attendance, and backend audit logging already exist. This task
list validates their frontend integration where relevant; it does not recreate them.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel when it uses different files and has no incomplete dependency.
- **[Story]**: User story label required for story tasks.
- Every task names the exact repository-relative file path it changes or validates.

## Path Conventions

- Source: `src/`
- Tests: `test/`
- API routes and domain wrappers: `src/api/endpoints.js`
- Shared theme: `src/styles/theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the completed backend contract and establish frontend regression coverage.

- [X] T001 Record backend contract revision `openapi.yaml` v1.6.0 and completed backend dependency in `specs/001-becario-work-management/contracts/api-v1.md`
- [X] T002 [P] Add endpoint constants and domain function placeholders for `GET /me/rating` and `POST /applications/{id}/evaluation` in `src/api/endpoints.js`, matching the canonical OpenAPI paths and response envelope
- [X] T003 [P] Add frontend contract regression assertions for rating and evaluation routes in `test/endpoints.test.js`
- [X] T004 [P] Add test fixtures for `EvaluacionInput`, `Evaluacion`, and `RatingBecario` shapes in `test/api.test.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Prepare shared API, formatting, authorization, and accessible UI behavior before story work.

**CRITICAL**: No user story implementation starts until this phase passes.

- [X] T005 Implement reusable rating and evaluation API wrappers in `src/api/endpoints.js`, sending `X-CSRF-Token` for evaluation creation and preserving `{ data }` and canonical error handling
- [X] T006 [P] Add minute-to-hours display helpers and rating formatting helpers in `src/lib/trabajos.js`, preserving integer-minute backend values and `null` rating states
- [X] T007 [P] Add shared evaluation field labels, range validation, and accessible error text in `src/lib/trabajos.js` and `src/components/ui.jsx`
- [X] T008 [P] Add loading, empty, and API error test coverage for the new shared helpers in `test/api.test.js` and `test/form-field.test.jsx`
- [X] T009 Verify the backend authorization boundary in frontend route configuration and protected navigation without treating hidden controls as security in `src/components/ProtectedRoute.jsx` and `src/config/navegacion.js`

**Checkpoint**: API wrappers, shared formatting, validation, and regression tests are ready.

---

## Phase 3: User Story 1 - Encontrar y cumplir horas becarias (Priority: P1) MVP

**Goal**: Becarios consultan trabajos, se postulan y visualizan progreso, historial y su calificación.

**Independent Test**: Un becario puede consultar trabajos, enviar una postulación, consultar
progreso/historial y consultar `GET /me/rating`; con menos de 10 trabajos realizados ve
`faltan realizar trabajos`.

### Tests for User Story 1

- [X] T010 [P] [US1] Add rating request, null-rating, last-10 display, and API-error tests in `test/panel.test.jsx`
- [X] T011 [P] [US1] Add becario application and progress regression tests for the completed backend response shapes in `test/jobs.test.jsx` and `test/postulaciones.test.jsx`

### Implementation for User Story 1

- [X] T012 [US1] Add becario rating loading and error state to `src/pages/Panel.jsx` using `GET /me/rating` and the `RatingBecario` fields
- [X] T013 [US1] Render rating as unavailable with the exact message `faltan realizar trabajos` when `rating` is null, and render numeric rating plus considered evaluations otherwise, in `src/pages/Panel.jsx`
- [X] T014 [US1] Verify application and progress views consume `targetMinutes`, `accreditedMinutes`, `remainingMinutes`, and `excessMinutes` without converting backend minutes incorrectly in `src/pages/Trabajos.jsx`, `src/pages/Postulaciones.jsx`, and `src/pages/Panel.jsx`
- [X] T015 [US1] Add accessible loading, empty, error, and keyboard-operable states for the becario rating and progress sections in `src/pages/Panel.jsx` and `src/styles/theme.css`

**Checkpoint**: US1 works independently with the completed backend and all US1 tests pass.

---

## Phase 4: User Story 2 - Publicar, cerrar y evaluar trabajos (Priority: P1)

**Goal**: Encargados gestionan trabajos, cierran asistencia y registran evaluaciones inmutables para asistentes.

**Independent Test**: Un encargado puede consultar postulantes de su trabajo cerrado,
registrar una evaluación válida mediante `POST /applications/{id}/evaluation`, ver la
respuesta creada y recibir errores claros para duplicados o datos fuera de 1–5.

### Tests for User Story 2

- [X] T016 [P] [US2] Add evaluation form validation tests for required integer values from 1 to 5 in `test/postulaciones.test.jsx`
- [X] T017 [P] [US2] Add owner, closed-job, attended-only, duplicate, network-retry, and API error tests for evaluation submission in `test/postulaciones.test.jsx`; assert that duplicate rejection does not replace the saved evaluation
- [X] T018 [P] [US2] Add regression tests proving evaluation submission does not alter attendance or credited minutes in `test/control.test.jsx`

### Implementation for User Story 2

- [X] T019 [US2] Add an evaluation form for Responsabilidad, Puntualidad, Proactividad, and Comunicación in `src/pages/Postulaciones.jsx`, with each value constrained to integer 1–5
- [X] T020 [US2] Display `Evaluar` only for an accepted attendee without evaluation and `Evaluado` plus `Promedio de evaluación` for a saved evaluation in the closed-job attendee list, while preserving backend authorization as the source of truth in `src/pages/Postulaciones.jsx`
- [X] T021 [US2] Submit evaluations through the canonical `postulacionesApi` or domain wrapper in `src/api/endpoints.js`, handling `201`, `400`, `401`, `403`, `404`, and `409` without changing attendance state
- [X] T022 [US2] Show immutable saved evaluation state and the returned `Promedio de evaluación` without exposing edit or delete controls in `src/pages/Postulaciones.jsx`
- [X] T023 [US2] Add responsive evaluation form and attendee-list requirements for complete keyboard operation, associated labels, visible focus, field-linked validation errors, announced status messages, and manual retry that preserves entered values in `src/pages/Postulaciones.jsx` and `src/styles/theme.css`

**Checkpoint**: US1 remains functional and US2 can submit one valid evaluation independently.

---

## Phase 5: User Story 3 - Supervisar cumplimiento institucional (Priority: P2)

**Goal**: Administradores consultan cumplimiento de horas sin recibir calificaciones.

**Independent Test**: Un administrador filtra progreso global y ve horas/meta/estado; la
respuesta y la interfaz no muestran campos de evaluación.

### Tests for User Story 3

- [X] T024 [P] [US3] Add admin compliance field and pagination tests for `students/progress` in `test/admin-supervision.test.jsx`
- [X] T025 [P] [US3] Add regression tests proving administrator views do not render rating or evaluation fields in `test/admin-supervision.test.jsx`

### Implementation for User Story 3

- [X] T026 [US3] Consume the canonical administrative progress and history endpoints with pagination metadata in `src/pages/AdminSupervision.jsx`
- [X] T027 [US3] Render completed, pending, and excess-minute states using backend progress fields without displaying evaluations in `src/pages/AdminSupervision.jsx`
- [X] T028 [US3] Add accessible filters, empty states, loading states, API errors, and responsive table behavior in `src/pages/AdminSupervision.jsx` and `src/styles/theme.css`

**Checkpoint**: All three stories are independently functional and administrator views exclude evaluations.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete synchronized frontend integration.

- [X] T029 [P] Run `npm test` and fix regressions in `test/`
- [X] T030 [P] Run `npm run lint` and resolve frontend lint issues without suppressions in `src/`
- [X] T031 [P] Run `npm run build` and verify the production bundle in `package.json` and `dist/`
- [X] T032 [P] Execute every scenario in `specs/001-becario-work-management/quickstart.md` against backend `openapi.yaml` v1.6.0 and record results in `specs/001-becario-work-management/quickstart.md`
- [X] T033 [P] Run the frontend accessibility and contract audit over changed files using the repository audit tooling in `src/` and `test/`
- [X] T034 Update `AI_CONTEXT.md` with the verified frontend/backend contract revision and completed feature status in `AI_CONTEXT.md`

## Phase 7: Convergence

- [X] T035 Resolve the incomplete backend dependency reported by `mibeca-backend-sync`, then re-verify the OpenAPI contract and synchronized task queues before further web integration per Constitution II (contradicts)

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 has no implementation dependency but requires backend contract v1.6.0 to remain available.
- Phase 2 depends on Phase 1 and blocks all user stories.
- US1 depends on Phase 2 and is the MVP slice.
- US2 depends on Phase 2 and the backend evaluation endpoints already completed.
- US3 depends on Phase 2 and can proceed independently of rating UI.
- Phase 6 depends on all desired user stories.

### User Story Dependencies

- US1: starts after Phase 2; no dependency on US2 or US3.
- US2: starts after Phase 2; depends on backend evaluation contract v1.6.0, already complete.
- US3: starts after Phase 2; no dependency on evaluation UI.

### Cross-Repository Blocking Rule

For every future task, if web requires an unfinished backend spec, implementation task,
or contract change, web is blocked. Continue in the backend repository from its next
unfinished task until the dependency and contract are complete; then resume web.

### Parallel Opportunities

- T002–T004 can run in parallel after contract verification.
- T006–T008 can run in parallel after T005 where files do not overlap.
- T010–T011 can run in parallel.
- T016–T018 can run in parallel.
- T024–T025 can run in parallel.
- T029–T033 can run in parallel after story checkpoints, avoiding shared-file conflicts.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete US1 (T010–T015).
3. Stop and validate becario discovery, progress, history, and rating.

### Incremental Delivery

1. Add US1 and validate independently.
2. Add US2 and validate evaluation ownership, immutability, and no-hour-change behavior.
3. Add US3 and validate administrative compliance without ratings.
4. Run Phase 6 quality gates.

## Notes

- `[P]` means different files and no incomplete dependency.
- Every API route must be declared only in `src/api/endpoints.js`.
- Do not add Firebase, mocks presented as real data, backend code, migrations, or alternate API contracts.
- Evaluation data never changes attendance or credited minutes.
