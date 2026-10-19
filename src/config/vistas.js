// Estados vacíos de las secciones que todavía no tienen API (fases 3 y 4).
// Se muestran sin datos simulados, como exige el plan del MVP.
export const VISTAS_VACIAS = {
  '/trabajos-disponibles': {
    headers: ['Trabajo', 'Encargado', 'Inicio', 'Duración', 'Cupos', 'Estado'],
    title: 'Sin trabajos para mostrar',
    text: 'La lista se cargará desde el backend cuando exista la API de trabajos; aquí podrás ver detalles y postularte.',
  },
  '/mis-postulaciones': {
    headers: ['Trabajo', 'Fecha', 'Estado', 'Cupos'],
    title: 'Sin postulaciones para mostrar',
    text: 'Una solicitud pendiente no reserva un cupo. El encargado decide su aceptación.',
  },
  '/historial': {
    headers: ['Trabajo', 'Asistencia', 'Horas acreditadas', 'Responsable', 'Fecha'],
    title: 'Sin historial para mostrar',
    text: 'Se conservarán también los trabajos en los que no hayas asistido.',
  },
  '/mis-trabajos': {
    headers: ['Trabajo', 'Inicio', 'Cupos', 'Estado', 'Acciones'],
    title: 'Sin trabajos publicados',
    text: 'Solo podrás editar tus trabajos antes del inicio y antes de aceptar postulantes.',
  },
  '/postulaciones': {
    headers: ['Estudiante', 'Trabajo', 'Solicitud', 'Estado', 'Decisión'],
    title: 'Sin postulaciones por revisar',
    text: 'Solo las aceptaciones ocuparán cupo; el servidor verificará el límite.',
  },
  '/cierre-y-horas': {
    headers: ['Trabajo', 'Fin previsto', 'Aceptados', 'Estado', 'Cierre'],
    title: 'Sin cierres disponibles',
    text: 'Tras el fin previsto marcarás asistencia de todos los aceptados antes de acreditar una sola vez.',
  },
  '/admin/trabajos': {
    headers: ['Trabajo', 'Encargado', 'Inicio', 'Cupos', 'Estado'],
    title: 'Sin trabajos para mostrar',
    text: 'Podrás supervisar publicaciones, sin modificar trabajos ajenos.',
  },
  '/admin/supervision': {
    headers: ['Estudiante', 'Meta', 'Acreditadas', 'Pendientes', 'Excedentes'],
    title: 'Sin progreso para mostrar',
    text: 'El progreso se calculará con la meta individual y el historial real.',
  },
}