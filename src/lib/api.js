// Cliente HTTP de MiBeca. La sesión vive en una cookie HttpOnly: nunca se
// guarda el token en JavaScript. Solo se conserva el token CSRF, que el
// servidor entrega en el inicio de sesión y en GET /auth/me.

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

const CSRF_HEADER = 'X-CSRF-Token'
const CSRF_STORAGE_KEY = 'mibeca.csrf'

let csrfToken = null
let alRecibir401 = null

function leerCsrfGuardado() {
  if (csrfToken) return csrfToken
  try {
    csrfToken = window.sessionStorage.getItem(CSRF_STORAGE_KEY)
  } catch {
    csrfToken = null
  }
  return csrfToken
}

export function guardarCsrfToken(token) {
  csrfToken = token || null
  try {
    if (token) window.sessionStorage.setItem(CSRF_STORAGE_KEY, token)
    else window.sessionStorage.removeItem(CSRF_STORAGE_KEY)
  } catch {
    // Sin sessionStorage disponible: el token sigue vivo en memoria.
  }
}

export function leerCsrfToken() {
  return leerCsrfGuardado()
}

/**
 * Registra el callback que se invoca cuando la API responde 401, para que la
 * aplicación pueda cerrar la sesión en memoria y volver al inicio de sesión.
 */
export function registrarManejadorNoAutorizado(callback) {
  alRecibir401 = callback
}

export class ApiError extends Error {
  constructor(estado, cuerpo) {
    const error = cuerpo && cuerpo.error ? cuerpo.error : null
    super((error && error.message) || 'No fue posible completar la solicitud.')
    this.name = 'ApiError'
    this.estado = estado
    this.code = (error && error.code) || 'error_desconocido'
    this.detalles = (error && error.detalles) || []
  }
}

async function leerCuerpo(respuesta) {
  if (respuesta.status === 204) return null
  const texto = await respuesta.text()
  if (!texto) return null
  try {
    return JSON.parse(texto)
  } catch {
    return null
  }
}

export async function apiRequest(ruta, { metodo = 'GET', cuerpo, query } = {}) {
  const url = new URL(BASE_URL + ruta, window.location.origin)
  if (query) {
    for (const [clave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(clave, String(valor))
      }
    }
  }

  const cabeceras = { Accept: 'application/json' }
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'
  if (metodo !== 'GET' && metodo !== 'HEAD') {
    const token = leerCsrfGuardado()
    if (token) cabeceras[CSRF_HEADER] = token
  }

  let respuesta
  try {
    respuesta = await fetch(url.toString(), {
      method: metodo,
      headers: cabeceras,
      credentials: 'include',
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ApiError(0, { error: { code: 'red_no_disponible', message: 'No hay conexión con el servidor de MiBeca.' } })
  }

  const datos = await leerCuerpo(respuesta)
  if (!respuesta.ok) {
    if (respuesta.status === 401 && alRecibir401) alRecibir401()
    throw new ApiError(respuesta.status, datos)
  }
  return datos
}