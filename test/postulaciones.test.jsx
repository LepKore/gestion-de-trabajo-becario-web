import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { Postulaciones } from '../src/pages/Postulaciones.jsx'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))

const trabajo = (id, titulo, extra = {}) => ({ id, titulo, estado: 'PUBLICADO', faseTemporal: 'PROXIMO', cuposDisponibles: 1, aceptados: 0, ...extra })
const postulacion = (id, nombre, jobId, extra = {}) => ({
  id, estado: 'PENDIENTE', trabajoId: jobId, creadoEn: '2026-10-20T12:00:00Z', actualizadoEn: '2026-10-20T12:00:00Z',
  estudiante: { nombre, codigo: '00123', carrera: 'Sistemas', semester: 4, targetMinutes: 28800, accreditedMinutes: 7200, remainingMinutes: 21600 }, ...extra,
})
const lista = (data) => ({ data, meta: { page: 1, pageSize: 50, total: data.length, totalPages: 1 } })

const biblioteca = trabajo('j1', 'Apoyo biblioteca')
const fisica = trabajo('j2', 'Monitor de física')

function escenario(postulacionesDe) {
  apiRequest.mockImplementation(async (ruta, opciones) => {
    if (opciones?.metodo === 'POST') return { data: {} }
    if (ruta === '/me/jobs') return lista([biblioteca, fisica])
    if (ruta === '/jobs/j1/applications') return lista(postulacionesDe.j1)
    if (ruta === '/jobs/j2/applications') return lista(postulacionesDe.j2)
    throw new Error(`ruta inesperada: ${ruta}`)
  })
}

// Tabla y tarjetas se renderizan siempre; en móvil el CSS oculta la tabla.
const montar = (ruta = '/postulaciones') => render(
  <MemoryRouter initialEntries={[ruta]}><Routes><Route path="/postulaciones" element={<Postulaciones />} /></Routes></MemoryRouter>,
)

beforeEach(() => {
  vi.resetAllMocks()
  escenario({
    j1: [postulacion('a1', 'Luis', 'j1'), postulacion('a2', 'Ana', 'j1', { estado: 'ACEPTADA' })],
    j2: [postulacion('a3', 'Beto', 'j2')],
  })
})
afterEach(cleanup)

describe('pantalla de postulaciones del encargado', () => {
  it('reúne los postulantes de todos sus trabajos con sus datos', async () => {
    montar()
    expect(await screen.findAllByText('Luis')).toHaveLength(2)
    expect(screen.getAllByText('Beto')).toHaveLength(2)
    expect(screen.getAllByText('Código 00123').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sistemas').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('link', { name: 'Monitor de física' })[0]).toHaveAttribute('href', '/trabajos/j2')
    expect(apiRequest).toHaveBeenCalledWith('/me/jobs', expect.objectContaining({ query: expect.objectContaining({ page: 1 }) }))
    expect(apiRequest).toHaveBeenCalledWith('/jobs/j2/applications', expect.objectContaining({ query: expect.objectContaining({ page: 1 }) }))
  })

  it('cuenta las postulaciones por estado en el tablero', async () => {
    montar()
    await screen.findAllByText('Luis')
    const metrica = (etiqueta) => within(screen.getByText(etiqueta).closest('article')).getAllByText(/\d+/)[0]
    expect(metrica('Total postulaciones')).toHaveTextContent('3')
    expect(metrica('Pendientes')).toHaveTextContent('2')
    expect(metrica('Aceptadas')).toHaveTextContent('1')
    expect(metrica('Rechazadas')).toHaveTextContent('0')
  })

  it('filtra por trabajo desde la URL', async () => {
    montar('/postulaciones?trabajo=j2')
    expect(await screen.findAllByText('Beto')).toHaveLength(2)
    expect(screen.queryByText('Luis')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Trabajo')).toHaveValue('j2')
  })

  it('filtra por estado con los chips y por nombre', async () => {
    montar()
    await screen.findAllByText('Luis')
    fireEvent.click(screen.getByRole('button', { name: 'Aceptadas (1)' }))
    expect(screen.queryByText('Luis')).not.toBeInTheDocument()
    expect(screen.getAllByText('Ana')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Todas (3)' }))
    fireEvent.change(screen.getByLabelText('Buscar estudiante'), { target: { value: 'bet' } })
    expect(screen.getAllByText('Beto')).toHaveLength(2)
    expect(screen.queryByText('Luis')).not.toBeInTheDocument()
  })

  it('acepta una postulación solo después de confirmar y recarga la lista', async () => {
    montar()
    fireEvent.click((await screen.findAllByRole('button', { name: 'Aceptar a Luis' }))[0])
    expect(apiRequest).not.toHaveBeenCalledWith('/applications/a1/accept', expect.anything())
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar aceptación' }))
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/applications/a1/accept', { metodo: 'POST', cuerpo: {} }))
    await waitFor(() => expect(apiRequest.mock.calls.filter(([ruta]) => ruta === '/me/jobs')).toHaveLength(2))
  })

  it('deshabilita aceptar cuando el trabajo ya no tiene cupos', async () => {
    apiRequest.mockImplementation(async (ruta) => {
      if (ruta === '/me/jobs') return lista([trabajo('j1', 'Apoyo biblioteca', { cuposDisponibles: 0 })])
      return lista([postulacion('a1', 'Luis', 'j1')])
    })
    montar()
    expect((await screen.findAllByRole('button', { name: 'Aceptar a Luis' }))[0]).toBeDisabled()
    expect(screen.getAllByRole('button', { name: 'Rechazar a Luis' })[0]).toBeEnabled()
  })

  it('informa del fallo del servidor y permite reintentar', async () => {
    apiRequest.mockRejectedValue(new Error('Sin conexión'))
    montar()
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(2))
  })

  it('muestra semestre y progreso de beca del postulante', async () => {
    montar()
    await screen.findAllByText('Luis')
    expect(screen.getAllByText('Semestre 4').length).toBeGreaterThan(0)
    expect(screen.getAllByText('120 h de 480 h').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Faltan 360 h').length).toBeGreaterThan(0)
    expect(screen.getAllByRole('progressbar', { name: 'Progreso de beca de Luis' })[0]).toHaveAttribute('aria-valuenow', '7200')
  })

  it('no inventa progreso si el contrato anterior no lo envía', async () => {
    escenario({ j1: [postulacion('a9', 'Nora', 'j1', { estudiante: { nombre: 'Nora', codigo: '00123', carrera: 'Sistemas' } })], j2: [] })
    montar()
    await screen.findAllByText('Nora')
    expect(screen.getAllByText('Sin datos').length).toBeGreaterThan(0)
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
