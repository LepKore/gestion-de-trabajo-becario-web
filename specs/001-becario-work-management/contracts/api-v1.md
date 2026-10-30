# Contrato de integración web

## Fuente canónica

`gestion-de-trabajo-becario-backend/openapi.yaml`, actualmente verificado en revisión
`1.6.0` (actualización local del backend, pendiente de commit). Este archivo resume reglas de consumo; no reemplaza ni duplica el OpenAPI.

## Capacidades disponibles

- Auth: login, logout, sesión actual y cambio de contraseña.
- Usuarios: gestión administrativa.
- Trabajos: listar, crear, editar y consultar.
- Postulaciones: crear, listar, aceptar y rechazar.
- Control: cerrar trabajo, consultar asistencia, progreso, dashboard e historial.
- Supervisión: progreso e historial de estudiantes para `ADMIN`.

## Reglas obligatorias del cliente

- Prefijo API `/api/v1`; las rutas se declaran únicamente en `src/api/endpoints.js`.
- Escrituras autenticadas envían `X-CSRF-Token`.
- El cierre envía `Idempotency-Key` de 8 a 128 caracteres.
- Éxitos usan `{ data }`; listados usan `{ data, meta }`.
- Errores usan `{ error: { code, message, detalles? } }`.
- La interfaz oculta o muestra acciones por comodidad, pero el backend decide autorización.

## Calificaciones disponibles

El backend publicó en `openapi.yaml` v1.6.0:

- `POST /applications/{id}/evaluation`: solo `ENCARGADO` propietario de un trabajo
  `CERRADO`, con postulación aceptada y asistencia confirmada. Requiere CSRF. Responde
  `201` con `data` y puede responder `400/401/403/404/409`.
- `GET /me/rating`: solo `BECARIO`; responde `data.rating`, `trabajosRealizados`,
  `evaluacionesConsideradas` y `message`.
- `EvaluacionInput`: `responsabilidad`, `puntualidad`, `proactividad` y `comunicacion`,
  enteros entre 1 y 5.
- `Evaluacion`: agrega `id`, `postulacionId`, `promedio` y `creadoEn`.
- `RatingBecario`: `rating` puede ser `null`; si hay menos de 10 trabajos realizados,
  `message` es `faltan realizar trabajos`.

No existe edición ni eliminación de evaluaciones. Las evaluaciones no cambian horas.

### Lectura autorizada de evaluaciones guardadas

En v1.6.0, la asistencia de un trabajo cerrado y el historial del encargado incluyen `evaluation: Evaluacion | null`. Solo se devuelve al encargado propietario. Los historiales de becarios y las rutas administrativas no incluyen evaluaciones. Tras un `409` por duplicado, la interfaz vuelve a consultar la asistencia y muestra el promedio ya persistido.