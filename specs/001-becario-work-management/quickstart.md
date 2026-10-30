# Guía de validación de integración

## Prerrequisitos

1. Backend terminado para la tarea correspondiente y contrato OpenAPI actualizado a v1.6.0.
2. API y PostgreSQL levantados según la guía del backend.
3. Dependencias web instaladas con `npm ci`.

## Validación local

Desde el repositorio web:

```text
npm test
npm run lint
npm run build
```

## Flujo principal

1. Iniciar sesión con un usuario de cada rol.
2. Como `BECARIO`, consultar trabajos, postularse y verificar progreso e historial.
3. Como `ENCARGADO`, aceptar/rechazar, cerrar con asistencia exhaustiva y consultar
   asistentes.
4. Como `ENCARGADO`, valorar asistentes con los cuatro criterios y verificar la respuesta
   `201` de evaluación. Recargar la asistencia y el historial; confirmar que `evaluation` y
   su promedio siguen disponibles para el propietario después de la recarga.
5. Como `BECARIO`, consultar `GET /me/rating` y verificar el promedio de los últimos 10
   trabajos realizados o el mensaje `faltan realizar trabajos`.
6. Como `ADMIN`, consultar progreso y horas pendientes sin visualizar evaluaciones.
7. Verificar estados de carga, vacío, error, permisos, paginación y navegación por teclado.

## Regla de bloqueo entre repositorios

La regla sigue vigente para futuras capacidades: si una tarea web requiere una tarea
backend no terminada, se detiene la tarea web y se continúa en backend desde la siguiente
tarea pendiente. Para esta feature, la dependencia de evaluación ya está terminada y
verificada en `openapi.yaml` v1.6.0.


## Verificación de cierre (2026-10-30)

Contrato comprobado: backend `130d2c9`, `openapi.yaml` 1.6.0. Frontend base `c47f85b`.
T024–T034 completadas: 158/158 pruebas en 19 archivos; lint, build y auditoría
`node .codex/hooks/audit_bridge.mjs --all` aprobados. `git diff --check` sin errores.

Pruebas administrativas: paginación de estudiantes e historial, reinicio al filtrar,
meta pendiente/completada/excedida, exclusión de evaluación aunque llegue en una
respuesta, carga, vacío, error y reintento. Una respuesta sin metadatos se rechaza
visiblemente. La tabla tiene región enfocable para desplazamiento por teclado.

Recorrido real con Chromium headless, Vite temporal en 5175 y PostgreSQL local
descartable validado por `assertTestDatabase` (sin mocks ni bases remotas):

| Escenario | Resultado y alcance |
|---|---|
| Login de tres roles | Correcto desde la interfaz |
| Publicar, postular, aceptar y cerrar | Fixture creada a través de la API real; reloj ajustado por SQL solo en la base descartable para permitir cierre |
| Encargado evalúa | Formulario real de asistencia del trabajo cerrado, cuatro criterios 4; promedio persistente después de recargar; historial visible |
| Becario consulta | Panel muestra `faltan realizar trabajos`; historial muestra el trabajo acreditado |
| ADMIN supervisa | Meta/horas/estado visibles; sin promedio de evaluación; abre historial |
| Móvil y teclado | A 390 px sin desbordamiento de página; región de tabla enfocable; diálogo abre y cierra con Escape |
| Carga, vacío, error y paginación | Pruebas Vitest de integración de componentes; no se forzaron errores del servidor real |

Repetir el recorrido desde web con una `TEST_DATABASE_URL` local descartable:
`node --env-file=../gestion-de-trabajo-becario-backend/.env scripts/verify-integration.mjs`.
Requiere las dependencias backend y web, Python Playwright con Chromium y el puerto
5175 libre. Recrea el esquema de TEST_DATABASE_URL; no usar una base con datos a conservar.
No se verificó un despliegue público ni cookies entre dominios de producción.
