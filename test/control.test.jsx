import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { FormularioCierre, HistorialBecario, ProgresoBecario, AsistenciaCerrada } from '../src/pages/Control.jsx'
import { horas } from '../src/lib/trabajos.js'

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
  const metrica = (label) => screen.getByText(label).closest('article')
  expect(within(metrica('Meta')).getByText('10 h')).toBeInTheDocument()
  expect(within(metrica('Faltantes')).getByText('10 h')).toBeInTheDocument()
  expect(within(metrica('Acreditadas')).getByText('0 h')).toBeInTheDocument()
  expect(apiRequest).toHaveBeenCalledWith('/me/progress', { query: {} })
  expect(apiRequest).toHaveBeenCalledWith('/me/history', { query: { page: 1, pageSize: 20 } })
})

it('presenta los cuatro campos de progreso como minutos del contrato', async () => {
  apiRequest.mockResolvedValue({ data: { targetMinutes: 510, accreditedMinutes: 546, remainingMinutes: 0, excessMinutes: 36 } })
  render(<MemoryRouter><ProgresoBecario /></MemoryRouter>)
  await screen.findByText('Excedentes')
  const metrica = (label) => screen.getByText(label).closest('article')
  expect(within(metrica('Meta')).getByText(horas(510))).toBeInTheDocument()
  expect(within(metrica('Acreditadas')).getByText(horas(546))).toBeInTheDocument()
  expect(within(metrica('Faltantes')).getByText(horas(0))).toBeInTheDocument()
  expect(within(metrica('Excedentes')).getByText(horas(36))).toBeInTheDocument()
  expect(screen.getByRole('progressbar', { name: 'Progreso de horas acreditadas' })).toHaveAttribute('aria-valuemax', '510')
  expect(screen.getByRole('progressbar', { name: 'Progreso de horas acreditadas' })).toHaveAttribute('aria-valuenow', '510')
})

it('envía una evaluación del asistente sin modificar asistencia ni minutos acreditados', async () => {
  const evaluacion = { ...({ id: 'evaluation-1', postulacionId: 'application-1', promedio: 4.25 }), responsabilidad: 5, puntualidad: 4, proactividad: 4, comunicacion: 4, creadoEn: '2026-10-30T12:00:00Z' }
  apiRequest.mockImplementation(async (ruta) => {
    if (ruta === '/jobs/job/attendance') return { data: [{
      applicationId: 'application-1', attended: true, awardedMinutes: 276,
      student: { name: 'Ana', code: '00123', career: 'Sistemas' },
      evaluation: null,
    }] }
    if (ruta === '/applications/application-1/evaluation') return { data: evaluacion }
    throw new Error(`ruta inesperada: ${ruta}`)
  })
  render(<MemoryRouter><AsistenciaCerrada trabajoId="job" trabajoEstado="CERRADO" /></MemoryRouter>)
  expect(await screen.findByText('Asistió')).toBeInTheDocument()
  expect(screen.getByText(horas(276))).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Evaluar a Ana' }))
  for (const [etiqueta, valor] of [['Responsabilidad', '5'], ['Puntualidad', '4'], ['Proactividad', '4'], ['Comunicación', '4']]) {
    fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } })
  }
  fireEvent.click(screen.getByRole('button', { name: 'Guardar evaluación' }))
  expect(await screen.findByText('Evaluado')).toBeInTheDocument()
  expect(screen.getByText(horas(276))).toBeInTheDocument()
  expect(apiRequest).toHaveBeenCalledWith('/applications/application-1/evaluation', expect.objectContaining({ metodo: 'POST' }))
  expect(apiRequest).not.toHaveBeenCalledWith('/jobs/job/close', expect.anything())
  expect(apiRequest.mock.calls.filter(([ruta]) => ruta === '/jobs/job/attendance')).toHaveLength(1)
})
