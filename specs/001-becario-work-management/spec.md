# Feature Specification: Gestión de trabajos y horas becarias

**Feature Branch**: `001-becario-work-management`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Aplicación web para que los becarios de la UPB encuentren trabajos becarios y gestionen sus horas; los encargados publiquen trabajos, seleccionen becarios y califiquen su participación; y los administradores controlen el cumplimiento de horas."

## Clarifications

### Session 2026-10-29

- Q: ¿Debe el frontend incluir la funcionalidad de calificación definida en el spec de backend? → A: Sí. La web debe incluir calificaciones sincronizadas con el backend: cuatro criterios de 1 a 5, registradas después del cierre y solo para asistentes; no alteran las horas y no son visibles para administradores.

### Session 2026-10-30

- Q: ¿Dónde debe mostrarse una evaluación ya guardada para un becario evaluado? → A: En la lista de asistentes del trabajo cerrado.
- Q: ¿Cómo debe mostrarse un becario que todavía puede ser evaluado frente a uno que ya fue evaluado? → A: Mostrar “Evaluar” si falta la evaluación y “Evaluado” junto con su promedio cuando ya exista; no permitir reemplazarla.
- Q: ¿Cómo deben distinguirse el promedio individual y la calificación agregada? → A: Usar “Promedio de evaluación” para un trabajo específico y “Rating general” para el resultado agregado del becario.
- Q: ¿Qué debe ocurrir si falla el envío de una evaluación por un error de red? → A: Conservar los valores, mostrar el error y permitir reintentar manualmente; los duplicados se rechazan sin modificar la evaluación existente.
- Q: ¿Qué criterios mínimos de accesibilidad deben aplicarse? → A: Teclado completo, etiquetas asociadas, foco visible, errores vinculados a campos, mensajes anunciables y diseño responsive.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Encontrar y cumplir horas becarias (Priority: P1)

Como becario de la UPB, quiero consultar trabajos disponibles, postularme y ver mis horas realizadas y faltantes para cumplir mi obligación becaria.

**Why this priority**: Es el objetivo principal de la aplicación y proporciona valor directo al estudiante.

**Independent Test**: Un becario puede consultar un trabajo, postularse y verificar que el resultado de su participación actualiza su progreso.

**Acceptance Scenarios**:

1. **Given** un becario activo y un trabajo publicado con cupos disponibles, **When** consulta la oferta, **Then** puede ver sus condiciones y postularse.
2. **Given** una postulación aceptada y una actividad finalizada, **When** el encargado registra la asistencia, **Then** las horas correspondientes aparecen en el historial del becario.
3. **Given** un becario con historial de actividades, **When** consulta su progreso, **Then** ve horas cumplidas, faltantes y el detalle de sus participaciones.

---

### User Story 2 - Publicar y administrar trabajos (Priority: P1)

Como encargado, quiero publicar trabajos becarios, revisar postulaciones, seleccionar participantes, registrar quién asistió y calificar a los becarios asistentes para controlar la actividad.

**Why this priority**: Sin la gestión del encargado no existe una fuente confiable para asignar trabajos ni acreditar horas.

**Independent Test**: Un encargado puede publicar un trabajo, aceptar postulantes, cerrar la actividad registrando asistencia y evaluar a los becarios asistentes.

**Acceptance Scenarios**:

1. **Given** un encargado autorizado, **When** crea un trabajo con fecha, duración y cupos válidos, **Then** el trabajo queda visible para becarios.
2. **Given** postulaciones a un trabajo, **When** el encargado acepta o rechaza participantes, **Then** cada postulante ve el estado de su postulación y los cupos se actualizan correctamente.
3. **Given** una actividad que terminó, **When** el encargado registra asistentes y cierra el trabajo, **Then** solo los asistentes reciben las horas definidas y el trabajo deja de aceptar cambios incompatibles.
4. **Given** un trabajo cerrado con un becario asistente, **When** el encargado registra la evaluación, **Then** puede guardar Responsabilidad, Puntualidad, Proactividad y Comunicación con valores de 1 a 5, sin modificar las horas acreditadas.
5. **Given** un becario con menos de 10 trabajos realizados, **When** consulta su calificación, **Then** la interfaz muestra que faltan realizar trabajos; con 10 o más, muestra el promedio de las evaluaciones disponibles de sus últimos 10 trabajos realizados.
6. **Given** un trabajo cerrado con asistentes, **When** el encargado consulta la lista, **Then** cada asistente sin evaluación muestra “Evaluar” y cada asistente evaluado muestra “Evaluado” y su “Promedio de evaluación”.

---

### User Story 3 - Supervisar cumplimiento institucional (Priority: P2)

Como administrador, quiero consultar becarios, metas y horas acumuladas para identificar quién cumplió y quién aún tiene horas pendientes.

**Why this priority**: Permite a la universidad supervisar el cumplimiento global y detectar casos que requieren atención.

**Independent Test**: Un administrador puede consultar una lista de becarios con su progreso y distinguir cumplimiento y horas faltantes.

**Acceptance Scenarios**:

1. **Given** estudiantes con metas e historial, **When** el administrador consulta el control institucional, **Then** puede filtrar o identificar quienes cumplieron y quienes tienen horas pendientes.
2. **Given** un usuario sin rol administrador, **When** intenta acceder al control institucional, **Then** la operación es rechazada y no expone información administrativa.

### Edge Cases

- Un becario no puede postularse dos veces al mismo trabajo ni postularse si está inactivo.
- Una postulación pendiente no debe consumir un cupo hasta ser aceptada.
- No se puede aceptar a más becarios que los cupos disponibles, incluso ante acciones concurrentes.
- El cierre exige una decisión explícita de asistencia o ausencia para cada participante aceptado.
- Un trabajo cerrado no puede acreditar horas nuevamente ni modificar silenciosamente su historial.
- Solo se puede evaluar a un becario que asistió a un trabajo cerrado; una evaluación guardada no se puede editar ni eliminar.
- La ausencia de una evaluación en un trabajo realizado no se interpreta como una calificación de cero.
- Si el becario tiene menos de 10 trabajos realizados, la calificación visible es nula y se muestra el mensaje `faltan realizar trabajos`.
- Las evaluaciones guardadas se muestran en la lista de asistentes del trabajo cerrado; no se permite editarlas ni reemplazarlas.
- El formulario conserva sus valores ante un error de red, muestra el error y permite reintento manual.
- Si no hay trabajos, postulaciones o historial, la interfaz debe mostrar un estado vacío comprensible.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST permitir autenticación y cierre de sesión para usuarios con roles Administrador, Encargado o Becario.
- **FR-002**: System MUST permitir al administrador crear, activar, desactivar y consultar usuarios, sin revelar credenciales.
- **FR-003**: System MUST permitir al administrador asignar a cada becario una meta de horas para el periodo vigente.
- **FR-004**: System MUST permitir a un encargado autorizado crear, consultar y editar sus trabajos antes de que comiencen y antes de que existan aceptaciones.
- **FR-005**: System MUST permitir a los becarios activos consultar trabajos publicados y postularse a trabajos no iniciados con cupo disponible.
- **FR-006**: System MUST permitir al encargado aceptar o rechazar postulaciones y reservar cupos únicamente para postulaciones aceptadas.
- **FR-007**: System MUST permitir al encargado cerrar un trabajo registrando asistencia o ausencia de cada participante aceptado.
- **FR-008**: System MUST acreditar una sola vez la duración definida del trabajo a cada becario asistente y conservar el historial de ausencias.
- **FR-009**: System MUST mostrar horas realizadas, faltantes y excedentes calculadas desde el historial de acreditaciones.
- **FR-010**: System MUST permitir al administrador consultar el progreso global básico de los becarios.
- **FR-011**: System MUST aplicar autorización por rol y propiedad del trabajo en cada operación protegida, no solo en la interfaz.
- **FR-012**: System MUST conservar un registro auditable de cambios sensibles, incluyendo metas, desactivaciones y cierres de trabajos.
- **FR-013**: System MUST mostrar estados de carga, vacío, validación y error con mensajes comprensibles y navegación accesible en móvil y escritorio.
- **FR-014**: System MUST permitir al encargado evaluar a cada becario asistente después del cierre del trabajo mediante Responsabilidad, Puntualidad, Proactividad y Comunicación, cada una con valores enteros de 1 a 5.
- **FR-015**: System MUST impedir evaluaciones para becarios ausentes, trabajos no cerrados o trabajos que no pertenezcan al encargado autenticado.
- **FR-016**: System MUST tratar las evaluaciones como inmutables y MUST NOT permitir editarlas o eliminarlas en esta entrega.
- **FR-016a**: System MUST show `Evaluar` for an attended participant without an evaluation and `Evaluado` plus the `Promedio de evaluación` for a participant with a saved evaluation in the closed-job attendance list.
- **FR-017**: System MUST calculate and display a becario's average rating using evaluations available among their last 10 trabajos realizados; a trabajo realizado is a closed job with confirmed attendance.
- **FR-018**: System MUST order trabajos realizados by closure time descending with application identifier ascending as a deterministic tie-breaker, select the first 10, average only existing evaluations, and never treat a missing evaluation as zero.
- **FR-019**: System MUST return no visible rating and the message `faltan realizar trabajos` when the becario has fewer than 10 trabajos realizados.
- **FR-020**: System MUST keep evaluations independent from hour accreditation, progress calculations and administrative hour-compliance reports.
- **FR-021**: System MUST label the individual result as `Promedio de evaluación` and the aggregate result from `GET /me/rating` as `Rating general`.
- **FR-022**: System MUST preserve entered evaluation values after a network failure, present an understandable error, and allow manual retry without creating a second evaluation.
- **FR-023**: System MUST provide keyboard-complete operation, associated labels, visible focus, field-linked validation errors, announced status messages, and responsive layouts for evaluation forms and attendee lists.

Las capacidades de autenticación, gestión de usuarios, metas, trabajos, postulaciones y
cierre de asistencia ya existen en la aplicación y el backend. En esta entrega frontend
se conservan mediante regresiones y consumo del contrato; no se duplican tareas de
implementación para ellas.

### Key Entities *(include if feature involves data)*

- **Usuario**: Persona autenticada con nombre, correo, estado y uno de los roles del sistema.
- **Perfil de becario**: Usuario, código académico, carrera, semestre y meta de horas.
- **Perfil de encargado**: Usuario y contexto institucional desde el que publica trabajos.
- **Trabajo becario**: Actividad publicada por un encargado, con descripción, fechas, duración, ubicación, estado y cupos.
- **Postulación**: Relación entre becario y trabajo con estado pendiente, aceptada o rechazada.
- **Asistencia y acreditación**: Resultado del cierre de un trabajo, con asistencia, horas otorgadas, responsable y fecha.
- **Evaluación**: Evaluación inmutable de la participación de un becario asistente en un trabajo cerrado, con cuatro criterios de 1 a 5 y un promedio calculado.
- **Auditoría**: Registro de actor, acción, recurso y fecha para operaciones sensibles.

La auditoría se registra y autoriza en el backend. Esta entrega web no incluye una vista
ni operaciones para consultar o modificar registros de auditoría.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Al menos el 90% de los becarios de prueba puede encontrar un trabajo y enviar una postulación en menos de 3 minutos.
- **SC-002**: Al menos el 95% de los cierres de trabajos refleja correctamente asistencia y horas acreditadas sin duplicados.
- **SC-003**: Un administrador puede identificar a los becarios que cumplieron o tienen horas pendientes en menos de 2 minutos.
- **SC-004**: El sistema rechaza el 100% de las operaciones realizadas por usuarios sin permisos para el rol o recurso solicitado durante las pruebas de autorización.
- **SC-005**: El 100% de las pantallas principales ofrece una ruta operable con teclado, etiquetas comprensibles y adaptación a pantallas móviles.
- **SC-006**: Las consultas habituales de trabajos y progreso muestran un resultado o un estado vacío en un máximo de 3 segundos bajo la carga de demostración acordada.
- **SC-007**: El 100% de las evaluaciones válidas conserva los cuatro criterios y no cambia las horas acreditadas ni el progreso del becario.
- **SC-008**: El promedio visible coincide con las evaluaciones disponibles de los últimos 10 trabajos realizados y muestra `faltan realizar trabajos` cuando aún no existen 10.

## Assumptions

- El alcance inicial corresponde a la UPB y a un único periodo de horas becarias.
- Los roles son mutuamente excluyentes por cuenta: Administrador, Encargado o Becario.
- La autorización real y la persistencia pertenecen al backend; la web consume ese contrato y no sustituye sus controles.
- Las fechas se almacenan de forma consistente y se muestran en la zona horaria institucional configurada.
- Las calificaciones forman parte de esta entrega y deben consumir el contrato canónico definido por el backend.
- El administrador consulta cumplimiento de horas, pero no consulta calificaciones desde el flujo administrativo.
- No se incluyen en esta especificación notificaciones, correo, exportaciones, múltiples instituciones ni reportes avanzados.
