# Research: sincronización frontend-backend

## Decision: backend primero y contrato canónico obligatorio

- **Decisión**: backend terminó su spec, sus tareas de evaluación y el contrato técnico;
  web consume ahora `openapi.yaml` v1.6.0 sin crear un contrato paralelo.
- **Razón**: el contrato expone la creación inmutable y el rating agregado, con autorización
  y respuestas verificables. Sin embargo, no expone la evaluación guardada en las lecturas
  del encargado, por lo que no permite reconstruir `Evaluado` tras recargar.
- **Alternativas consideradas**: implementar mocks o asumir un campo no documentado en web
  (rechazado: duplicaría el contrato); solicitar al backend una lectura autorizada de la
  evaluación antes de completar la visualización persistente.

## Decision: consumo del contrato existente

- **Decisión**: usar `src/lib/api.js` y declarar todas las rutas en
  `src/api/endpoints.js`.
- **Razón**: es la convención existente y una prueba del repositorio rechaza rutas literales
  fuera de ese archivo.
- **Alternativas consideradas**: llamadas directas desde páginas (rechazada: rompe la regla
  de integración y dificulta cambiar el contrato).

## Decision: progreso y horas

- **Decisión**: la UI trabaja con minutos enteros múltiplos de 6 y muestra horas solo como
  representación; usa `targetMinutes`, `accreditedMinutes`, `remainingMinutes` y
  `excessMinutes`.
- **Razón**: coincide con el contrato backend y evita errores de precisión decimal.

## Decision: calificaciones

- **Decisión**: implementar formulario y visualización contra `POST /applications/{id}/evaluation`
  y `GET /me/rating`.
- **Razón**: backend ya publica `EvaluacionInput`, `Evaluacion` y `RatingBecario`, además
  de los permisos y errores `201/400/401/403/404/409`.
