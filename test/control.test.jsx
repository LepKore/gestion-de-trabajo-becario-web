import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { FormularioCierre, HistorialBecario } from '../src/pages/Control.jsx'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))

const trabajo = {
  id: 'job', titulo: 'Biblioteca', duracionMinutos: 276,
  inicioPrevisto: '2026-10-18T12:00:00Z', finPrevisto: '2026-10-18T18:00:00Z',
  encargadoNombre: 'Ana', ubicacion: 'Biblioteca', estado: 'CERRADO',
}
const estudiante = (id, nombre) => ({ id, estado: 'ACEPTADA', estudiante: { nombre, codigo: '00123', carrera: 'Sistemas' } })

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('crypto', { randomUUID: () => 'fase4-intento-estable-1234' })
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('exige marcar a todos los aceptados y reutiliza la clave al reintentar el mismo cierre', async () => {
  const actualizar = vi.fn()
  let envios = 0
  apiRequest.mockImplementation(async (ruta, opciones) => {
    if (ruta === '/jobs/job/applications') {
      return { data: [opciones.query.page === 1 ? estudiante('a', 'Luis') : estudiante('b', 'María')], meta: { totalPages: 2 } }
    }
    if (ruta === '/jobs/job/close') {
      envios += 1
      if (envios === 1) throw new Error('Sin conexión')
      return { data: { job: trabajo, attendance: [], closedAt: '2026-10-19T00:00:00Z' } }
    }
  })
  render(<FormularioCierre trabajo={trabajo} actualizarTrabajo={actualizar} />)
  const boton = await screen.findByRole('button', { name: 'Confirmar cierre y acreditar horas' })
  await screen.findByText(/María/)
  expect(boton).toBeDisabled()
  fireEvent.click(screen.getAllByRole('radio', { name: 'Asistió' })[0])
  expect(boton).toBeDisabled()
  fireEvent.click(screen.getAllByRole('radio', { name: 'No asistió' })[1])
  expect(boton).toBeEnabled()
  fireEvent.click(boton)
  await screen.findByText('Sin conexión')
  fireEvent.click(boton)
  await waitFor(() => expect(actualizar).toHaveBeenCalledTimes(1))
  const cierres = apiRequest.mock.calls.filter(([ruta]) => ruta === '/jobs/job/close')
  expect(cierres).toHaveLength(2)
  expect(cierres[0][1]).toMatchObject({
    metodo: 'POST',
    cuerpo: { attendance: [{ applicationId: 'a', attended: true }, { applicationId: 'b', attended: false }] },
    idempotencyKey: 'fase4-intento-estable-1234',
  })
  expect(cierres[1][1]).toEqual(cierres[0][1])
})

it('muestra progreso real y conserva la ausencia en el historial del becario', async () => {
  apiRequest.mockImplementation(async (ruta) => {
    if (ruta === '/me/progress') return { data: { targetMinutes: 600, accreditedMinutes: 0, remainingMinutes: 600, excessMinutes: 0 } }
    if (ruta === '/me/history') return { data: [{ applicationId: 'a', applicationStatus: 'ACEPTADA', attended: false, awardedMinutes: 0, job: trabajo }], meta: { page: 1, totalPages: 1, total: 1 } }
  })
  render(<MemoryRouter><HistorialBecario /></MemoryRouter>)
  await screen.findByText('No asistió')
  expect(screen.getAllByText('10 h')).toHaveLength(2)
  expect(apiRequest).toHaveBeenCalledWith('/me/progress', { query: {} })
  expect(apiRequest).toHaveBeenCalledWith('/me/history', { query: { page: 1, pageSize: 20 } })
})
