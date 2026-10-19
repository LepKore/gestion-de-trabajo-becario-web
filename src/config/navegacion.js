// Navegación por rol. Cada sección apunta a una ruta real: el menú ya no es una
// vista preliminar sin backend. La supervisión administrativa se habilita en la fase 5.
export const SECCIONES = [
  { ruta: '/', etiqueta: 'Resumen', roles: ['ADMIN', 'ENCARGADO', 'BECARIO'] },
  { ruta: '/trabajos-disponibles', etiqueta: 'Trabajos disponibles', roles: ['BECARIO'] },
  { ruta: '/mis-postulaciones', etiqueta: 'Mis postulaciones', roles: ['BECARIO'] },
  { ruta: '/historial', etiqueta: 'Historial', roles: ['BECARIO'] },
  { ruta: '/mis-trabajos', etiqueta: 'Mis trabajos', roles: ['ENCARGADO'] },
  { ruta: '/postulaciones', etiqueta: 'Postulaciones', roles: ['ENCARGADO'] },
  { ruta: '/cierre-y-horas', etiqueta: 'Cierre y horas', roles: ['ENCARGADO'] },
  { ruta: '/admin/usuarios', etiqueta: 'Usuarios', roles: ['ADMIN'] },
  { ruta: '/admin/trabajos', etiqueta: 'Trabajos', roles: ['ADMIN'] },
  { ruta: '/admin/supervision', etiqueta: 'Supervisión', roles: ['ADMIN'] },
]

export const NOMBRES_ROL = {
  BECARIO: 'Estudiante becario',
  ENCARGADO: 'Encargado',
  ADMIN: 'Administrador',
}

export function seccionesDe(rol) {
  return SECCIONES.filter((seccion) => seccion.roles.includes(rol))
}
