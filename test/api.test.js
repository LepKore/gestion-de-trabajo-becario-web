import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest, guardarCsrfToken } from '../src/lib/api.js'

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