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
