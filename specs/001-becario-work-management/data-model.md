# Modelo de datos consumido por la web

La web no persiste estas entidades; representa las respuestas del backend.

## Entidades

- **Usuario**: identidad, rol y estado activo. El rol es `ADMIN`, `ENCARGADO` o `BECARIO`.
- **Trabajo**: trabajo publicado con fechas UTC, duración en minutos, cupos y estado
  `PUBLICADO` o `CERRADO`.
- **Postulación**: vínculo único entre becario y trabajo; `PENDIENTE`, `ACEPTADA` o
  `RECHAZADA`.
- **Asistencia**: resultado inmutable del cierre, con `attended` y `awardedMinutes`.
- **Progreso**: `targetMinutes`, `accreditedMinutes`, `remainingMinutes` y `excessMinutes`.
- **Evaluación**: cuatro criterios de 1 a 5, `promedio`, `postulacionId`, `id` y `creadoEn`.
  No modifica asistencia ni progreso.

## Reglas de representación

- Los listados paginados siempre requieren `data` y `meta`.
- Los minutos son enteros múltiplos de 6; no convertir `4.6` como 4 horas y 60 minutos.
- Las fechas se reciben como instantes UTC y se muestran en la zona institucional.
- La ausencia de una evaluación no equivale a cero.
- Menos de 10 trabajos realizados muestra `faltan realizar trabajos`.

## Dependencia completada

El backend terminó la dependencia correspondiente. El contrato publicado define
`POST /applications/{id}/evaluation` y `GET /me/rating`; la web puede implementar la
integración contra esos shapes y reglas.
