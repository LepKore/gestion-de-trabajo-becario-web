// Endpoints de la API de MiBeca en un único lugar.
//
// Contrato de referencia: `backend/openapi.yaml`, revisión 1.3.0.
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
  },
  estudiantes: {
    progreso: '/students/progress',
    historial: (id) => `/students/${trozo(id)}/history`,
  },
  yo: {
    panel: '/me/dashboard',
    progreso: '/me/progress',
    historial: '/me/history',
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

export const postulacionesApi = {
  listarDeTrabajo: (id, query) => apiRequest(RUTAS.trabajos.postulaciones(id), { query }),
  postular: (id) =>
    apiRequest(RUTAS.trabajos.postulaciones(id), { metodo: 'POST', cuerpo: {} }),
  decidir: (id, accion) => {
    if (accion !== 'accept' && accion !== 'reject') {
      throw new Error(`Decisión de postulación no válida: ${accion}`)
    }
    const ruta = accion === 'accept' ? RUTAS.postulaciones.aceptar(id) : RUTAS.postulaciones.rechazar(id)
    return apiRequest(ruta, { metodo: 'POST', cuerpo: {} })
  },
}
