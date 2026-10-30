import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { AdminSupervision } from '../src/pages/AdminSupervision.jsx'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))

const estudiante = {
  id: '11111111-1111-4111-8111-111111111111', name: 'Ana Pérez', email: 'ana@uni.edu',
  code: '00731', career: 'Sistemas', semester: 4, targetMinutes: 120,
  accreditedMinutes: 60, remainingMinutes: 60, excessMinutes: 0,
}
const historia = {
  data: [{
    applicationId: '22222222-2222-4222-8222-222222222222', applicationStatus: 'ACEPTADA',
    attended: true, awardedMinutes: 60,
    job: { titulo: 'Apoyo de biblioteca', encargadoNombre: 'Luis Gómez', ubicacion: 'Biblioteca', inicioPrevisto: '2026-10-20T16:00:00Z' },
  }],
  meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
}

beforeEach(() => {
  vi.resetAllMocks()
  apiRequest.mockImplementation(async ruta => {
    if (ruta === '/students/progress') return { data: [estudiante], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }
    if (ruta === `/students/${estudiante.id}/history`) return historia
    throw new Error(`Ruta inesperada: ${ruta}`)
  })
})
afterEach(cleanup)

function montar() {
  return render(<MemoryRouter><AdminSupervision /></MemoryRouter>)
}

describe('supervisión administrativa de progreso', () => {
  it('muestra progreso real y abre el historial detallado del estudiante', async () => {
    montar()
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('00731 · Sistemas · sem. 4')).toBeInTheDocument()
    expect(screen.getByText('2 h')).toBeInTheDocument()
    expect(screen.getAllByText('1 h')).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial' }))
    expect(await screen.findByRole('dialog', { name: 'Historial de Ana Pérez' })).toBeInTheDocument()
    expect(await screen.findByText('Apoyo de biblioteca')).toBeInTheDocument()
    expect(screen.getByText('Asistió')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith(`/students/${estudiante.id}/history`, expect.objectContaining({ query: { page: 1, pageSize: 10 } }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar historial' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('envía filtros de horas pendientes y búsqueda al contrato', async () => {
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.change(screen.getByLabelText('Horas pendientes'), { target: { value: 'false' } })
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith('/students/progress', expect.objectContaining({ query: expect.objectContaining({ conHorasPendientes: 'false' }) })))
    fireEvent.change(screen.getByLabelText('Buscar estudiante'), { target: { value: '00731' } })
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith('/students/progress', expect.objectContaining({ query: expect.objectContaining({ q: '00731', conHorasPendientes: 'false' }) })))
  })
})

describe('cumplimiento y estados administrativos', () => {
  it('distingue pendientes, meta completada y excedida sin renderizar evaluaciones', async () => {
    apiRequest.mockResolvedValue({ data: [
      { ...estudiante, rating: 5, evaluation: { promedio: 5 } },
      { ...estudiante, id: 'completo', name: 'Completo', accreditedMinutes: 120, remainingMinutes: 0 },
      { ...estudiante, id: 'excedido', name: 'Excedido', accreditedMinutes: 180, remainingMinutes: 0, excessMinutes: 60 },
    ], meta: { page: 1, totalPages: 1, total: 3 } })
    montar()
    expect(await screen.findByText('Meta completada')).toBeInTheDocument()
    expect(screen.getByText('Meta excedida')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
    expect(screen.queryByText(/calificación|evaluación|promedio|rating/i)).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Progreso de estudiantes' })).toHaveAttribute('tabindex', '0')
  })

  it('pagina estudiantes y restablece la página al cambiar filtros', async () => {
    apiRequest.mockImplementation(async (_ruta, { query }) => ({ data: [estudiante], meta: { page: query.page, pageSize: 20, total: 21, totalPages: 2 } }))
    montar()
    await screen.findByText('Ana Pérez')
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2 · 21 estudiantes')
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Horas pendientes'), { target: { value: '' } })
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith('/students/progress', { query: { q: '', conHorasPendientes: '', page: 1, pageSize: 20 } }))
  })

  it('pagina el historial sin mostrar datos de evaluación', async () => {
    apiRequest.mockImplementation(async (ruta, { query }) => ruta === '/students/progress'
      ? { data: [estudiante], meta: { page: 1, totalPages: 1, total: 1 } }
      : { ...historia, data: historia.data.map(item => ({ ...item, evaluation: { promedio: 5 } })), meta: { page: query.page, totalPages: 2, total: 11 } })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Ver historial' }))
    await screen.findByText('Apoyo de biblioteca')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await screen.findByText('Página 2 de 2 · 11 registros')
    expect(screen.queryByText(/evaluación|promedio|rating/i)).not.toBeInTheDocument()
  })

  it('anuncia carga, muestra vacío y permite reintentar un error', async () => {
    let reject
    apiRequest.mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail }))
    montar()
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    reject(new Error('Sin conexión'))
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
    apiRequest.mockResolvedValue({ data: [], meta: { page: 1, totalPages: 0, total: 0 } })
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('Sin estudiantes para mostrar')).toBeInTheDocument()
  })

  it('rechaza una respuesta sin metadatos en lugar de ocultar páginas', async () => {
    apiRequest.mockResolvedValue({ data: [estudiante] })
    montar()
    expect(await screen.findByText('No se pudo verificar la paginación de los resultados.')).toBeInTheDocument()
  })
})
