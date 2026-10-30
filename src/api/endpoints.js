// Endpoints de la API de MiBeca en un único lugar.
//
// Contrato de referencia: `backend/openapi.yaml`, revisión 1.4.0 (commit 8ed9226).
// La sesión vive en una cookie HttpOnly; el token CSRF, las cookies y el
// manejo de errores son responsabilidad de `src/lib/api.js`.
//
// Regla del proyecto: ninguna ruta de la API se construye fuera de este
// archivo. Las páginas importan `RUTAS` para las lecturas que resuelve
// `useRecurso` y las funciones de dominio para el resto de operaciones.

import { apiRequest } from '../lib/api.js'

const trozo = (valor) => encodeURIComponent(String(valor))

/** Rutas de la API. Única fuente de verdad de las URLs. */
export const RUTAS = {
  sesion: {
    actual: '/auth/me',
    ingreso: '/auth/login',
    salida: '/auth/logout',
    cambioPassword: '/auth/change-password',
  },
  usuarios: {
    lista: '/users',
    creacion: '/users',
    restablecerPassword: (id) => `/users/${trozo(id)}/reset-password`,
    reactivar: (id) => `/users/${trozo(id)}/reactivate`,
    desactivar: (id) => `/users/${trozo(id)}/deactivate`,
  },
  trabajos: {
    lista: '/jobs',
    propios: '/me/jobs',
    detalle: (id) => `/jobs/${trozo(id)}`,
    postulaciones: (id) => `/jobs/${trozo(id)}/applications`,
    cierre: (id) => `/jobs/${trozo(id)}/close`,
    asistencia: (id) => `/jobs/${trozo(id)}/attendance`,
  },
  postulaciones: {
    mias: '/me/applications',
    aceptar: (id) => `/applications/${trozo(id)}/accept`,
    rechazar: (id) => `/applications/${trozo(id)}/reject`,
    evaluacion: (id) => `/applications/${trozo(id)}/evaluation`,
  },
  estudiantes: {
    progreso: '/students/progress',
    historial: (id) => `/students/${trozo(id)}/history`,
  },
  yo: {
    panel: '/me/dashboard',
    progreso: '/me/progress',
    historial: '/me/history',
    rating: '/me/rating',
  },
}

// --- Sesión ---------------------------------------------------------------

export const sesionApi = {
  actual: () => apiRequest(RUTAS.sesion.actual),
  iniciarSesion: (correo, password) =>
    apiRequest(RUTAS.sesion.ingreso, { metodo: 'POST', cuerpo: { correo, password } }),
  cerrarSesion: () => apiRequest(RUTAS.sesion.salida, { metodo: 'POST' }),
  cambiarContrasena: (cuerpo) =>
    apiRequest(RUTAS.sesion.cambioPassword, { metodo: 'POST', cuerpo }),
}

// --- Usuarios (ADMIN) -----------------------------------------------------

export const usuariosApi = {
  listar: (query) => apiRequest(RUTAS.usuarios.lista, { query }),
  crear: (cuerpo) => apiRequest(RUTAS.usuarios.creacion, { metodo: 'POST', cuerpo }),
  // El backend no espera cuerpo en estas acciones, pero se envía `{}` para
  // conservar el `Content-Type` y el encabezado CSRF de toda escritura.
  restablecerPassword: (id) =>
    apiRequest(RUTAS.usuarios.restablecerPassword(id), { metodo: 'POST', cuerpo: {} }),
  reactivar: (id) => apiRequest(RUTAS.usuarios.reactivar(id), { metodo: 'POST', cuerpo: {} }),
  desactivar: (id) => apiRequest(RUTAS.usuarios.desactivar(id), { metodo: 'POST', cuerpo: {} }),
}

// --- Trabajos -------------------------------------------------------------

export const trabajosApi = {
  crear: (cuerpo) => apiRequest(RUTAS.trabajos.lista, { metodo: 'POST', cuerpo }),
  actualizar: (id, cuerpo) =>
    apiRequest(RUTAS.trabajos.detalle(id), { metodo: 'PATCH', cuerpo }),
  // La clave de idempotencia la calcula el componente de cierre: depende del
  // contenido del intento, no del endpoint.
  cerrar: (id, attendance, claveIdempotencia) =>
    apiRequest(RUTAS.trabajos.cierre(id), {
      metodo: 'POST',
      cuerpo: { attendance },
      idempotencyKey: claveIdempotencia,
    }),
}

// --- Postulaciones --------------------------------------------------------

// El contrato solo expone postulantes por trabajo; esta función recorre los
// trabajos propios y devuelve una sola lista, cada postulación con su trabajo.
async function todasLasDelTrabajo(trabajo) {
  const postulaciones = []
  for (let page = 1; ; page += 1) {
    const { data, meta } = await apiRequest(RUTAS.trabajos.postulaciones(trabajo.id), {
      query: { page, pageSize: 50 },
    })
    if (!meta) throw new Error('La API no devolvió paginación de postulaciones.')
    postulaciones.push(...data)
    if (page >= meta.totalPages) break
  }
  return postulaciones.map((postulacion) => ({ ...postulacion, trabajo }))
}

export const postulacionesApi = {
  listarDeTrabajo: (id, query) => apiRequest(RUTAS.trabajos.postulaciones(id), { query }),
  postular: (id) =>
    apiRequest(RUTAS.trabajos.postulaciones(id), { metodo: 'POST', cuerpo: {} }),
  // shortcut: tope de 50 trabajos propios, paginar si un encargado supera ese número.
  deMisTrabajos: async () => {
    const { data: trabajos } = await apiRequest(RUTAS.trabajos.propios, {
      query: { page: 1, pageSize: 50 },
    })
    const listas = await Promise.all(trabajos.map(todasLasDelTrabajo))
    return listas.flat()
  },
  decidir: (id, accion) => {
    if (accion !== 'accept' && accion !== 'reject') {
      throw new Error(`Decisión de postulación no válida: ${accion}`)
    }
    const ruta = accion === 'accept' ? RUTAS.postulaciones.aceptar(id) : RUTAS.postulaciones.rechazar(id)
    return apiRequest(ruta, { metodo: 'POST', cuerpo: {} })
  },
  crearEvaluacion: (postulacionId, cuerpo) =>
    apiRequest(RUTAS.postulaciones.evaluacion(postulacionId), { metodo: 'POST', cuerpo }),
}
