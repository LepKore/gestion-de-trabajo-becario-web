// `apiRequest` usa window.location.origin: este archivo necesita jsdom.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, guardarCsrfToken } from '../src/lib/api.js'
import { CRITERIOS_EVALUACION, ratingVisible, validarEvaluacion } from '../src/lib/trabajos.js'

describe('cliente API', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    guardarCsrfToken(null)
  })

  it('envía credenciales, JSON y CSRF en escrituras', async () => {
    guardarCsrfToken('csrf-de-prueba')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"data":{"ok":true}}', { status: 200 }))

    await apiRequest('/auth/change-password', {
      metodo: 'POST',
      cuerpo: { passwordNuevo: 'Nueva-clave-2026!' },
      query: { page: 2, vacio: '' },
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/auth/change-password?page=2'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'csrf-de-prueba',
        }),
        body: '{"passwordNuevo":"Nueva-clave-2026!"}',
      }),
    )
  })

  it('convierte respuestas de error del backend en ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: { code: 'unauthenticated', message: 'Debes iniciar sesión.', detalles: [] } }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    ))

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      name: 'ApiError', estado: 401, code: 'unauthenticated', message: 'Debes iniciar sesión.',
    })
    expect(new ApiError(500, null).code).toBe('error_desconocido')
  })

  it('expone un error estable cuando la red no está disponible', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('offline'))

    await expect(apiRequest('/auth/me')).rejects.toMatchObject({
      estado: 0, code: 'red_no_disponible',
    })
  })
})

it('envía la clave de idempotencia en el cierre', async () => {
  guardarCsrfToken('csrf-de-prueba')
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"data":{}}', { status: 200 }))
  await apiRequest('/jobs/job/close', {
    metodo: 'POST',
    cuerpo: { attendance: [] },
    idempotencyKey: 'cierre-prueba-123',
  })
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/api/v1/jobs/job/close'),
    expect.objectContaining({ headers: expect.objectContaining({
      'X-CSRF-Token': 'csrf-de-prueba',
      'Idempotency-Key': 'cierre-prueba-123',
    }) }),
  )
  fetchMock.mockRestore()
  guardarCsrfToken(null)
})

describe('respuestas del contrato y errores', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    guardarCsrfToken(null)
  })

  it('expone los detalles por campo de un 422', async () => {
    const detalles = [{ campo: 'correo', mensaje: 'Ya está registrado.' }]
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(
      JSON.stringify({ error: { code: 'validation_error', message: 'Revisa los datos.', detalles } }),
      { status: 422, headers: { 'Content-Type': 'application/json' } },
    ))
    await expect(apiRequest('/admin/users', { metodo: 'POST', cuerpo: {} })).rejects.toMatchObject({
      estado: 422, code: 'validation_error', detalles,
    })
  })

  it('acepta un 204 sin cuerpo', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    await expect(apiRequest('/auth/logout', { metodo: 'POST' })).resolves.toBeNull()
  })

  it('da un error estable si un 500 llega sin JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>error</html>', { status: 500 }))
    await expect(apiRequest('/auth/me')).rejects.toMatchObject({ estado: 500, code: 'error_desconocido' })
  })

  it('no envía CSRF en lecturas', async () => {
    guardarCsrfToken('csrf-de-prueba')
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{"data":{}}', { status: 200 }))
    await apiRequest('/auth/me')
    expect(fetchMock.mock.calls[0][1].headers['X-CSRF-Token']).toBeUndefined()
  })
})

describe('contrato de evaluaciones', () => {
  it('define los cuatro criterios y formatea rating nulo', () => {
    expect(CRITERIOS_EVALUACION).toHaveLength(4)
    expect(ratingVisible(null)).toBe('Sin rating general')
    expect(ratingVisible(4.5)).toBe('4.5 / 5')
  })

  it('valida valores enteros del uno al cinco', () => {
    expect(validarEvaluacion(1)).toBe(true)
    expect(validarEvaluacion(5)).toBe(true)
    expect(validarEvaluacion(0)).toBe(false)
    expect(validarEvaluacion(2.5)).toBe(false)
    expect(validarEvaluacion('x')).toBe(false)
  })
})
