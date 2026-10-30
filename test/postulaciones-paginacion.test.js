// @vitest-environment node
import { beforeEach, expect, it, vi } from 'vitest'
import { apiRequest } from '../src/lib/api.js'
import { postulacionesApi } from '../src/api/endpoints.js'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

const trabajo = (id) => ({ id, titulo: `Trabajo ${id}` })

it('recorre todas las páginas de postulantes de cada trabajo propio', async () => {
  apiRequest.mockImplementation(async (ruta, { query }) => {
    if (ruta.endsWith('/applications')) {
      const totalPages = 3
      return { data: [{ id: `a-${ruta}-${query.page}` }], meta: { page: query.page, totalPages } }
    }
    return { data: [trabajo('t1')], meta: { page: 1, totalPages: 1 } }
  })
  const resultado = await postulacionesApi.deMisTrabajos()
  expect(resultado).toHaveLength(3)
  expect(resultado.map((p) => p.id)).toEqual(['a-/jobs/t1/applications-1', 'a-/jobs/t1/applications-2', 'a-/jobs/t1/applications-3'])
  expect(resultado[0].trabajo.id).toBe('t1')
})

it('falla en vez de paginar sin fin cuando la respuesta no trae meta', async () => {
  apiRequest.mockImplementation(async (ruta) => {
    if (ruta.endsWith('/applications')) return { data: [{ id: 'a' }] }
    return { data: [trabajo('t1')], meta: { page: 1, totalPages: 1 } }
  })
  await expect(postulacionesApi.deMisTrabajos()).rejects.toThrow('no devolvió paginación')
  expect(apiRequest.mock.calls.filter(([ruta]) => ruta.endsWith('/applications'))).toHaveLength(1)
})
