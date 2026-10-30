import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { useAuth } from '../src/auth/useAuth.js'
import { Panel } from '../src/pages/Panel.jsx'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))
vi.mock('../src/auth/useAuth.js', () => ({ useAuth: vi.fn() }))
vi.mock('../src/pages/Control.jsx', () => ({ ProgresoBecario: () => <section aria-label="Progreso del estudiante">Progreso estudiantil</section> }))

beforeEach(() => { vi.resetAllMocks() })
afterEach(cleanup)

function montar(usuario) {
  useAuth.mockReturnValue({ usuario })
  return render(<MemoryRouter><Panel /></MemoryRouter>)
}

/** Métrica concreta: evita que un número cualquiera de la página haga pasar la aserción. */
function metrica(label) {
  return screen.getByText(label).closest('article')
}

describe('resumen por rol', () => {
  it('resume progreso, postulaciones e historial para el becario', async () => {
    const usuario = { id: 'student', rol: 'BECARIO', activo: true, requiereCambioPassword: false, nombre: 'Ana', correo: 'ana@uni.edu', creadoEn: '2026-10-01T00:00:00Z', estudiante: { carrera: 'Sistemas', semestre: 4, metaMinutos: 120, codigo: '00731' } }
    apiRequest.mockImplementation(async (ruta, { query } = {}) => {
      if (ruta === '/me/rating') return { data: { rating: null, trabajosRealizados: 2, evaluacionesConsideradas: 0, message: 'faltan realizar trabajos' } }
      return { data: [], meta: { page: 1, pageSize: query.pageSize, total: query.estado === 'PENDIENTE' ? 2 : 5, totalPages: 1 } }
    })
    montar(usuario)
    expect(await screen.findByText('Progreso estudiantil')).toBeInTheDocument()
    expect(screen.getByText('Todas tus solicitudes')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consultar historial y horas' })).toHaveAttribute('href', '/historial')
    expect(await screen.findByText('faltan realizar trabajos')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/me/applications', expect.objectContaining({ query: expect.objectContaining({ pageSize: 1 }) }))
  })

  it('muestra el rating general cuando existe', async () => {
    apiRequest.mockImplementation(async ruta => ruta === '/me/rating'
      ? { data: { rating: 4.5, trabajosRealizados: 10, evaluacionesConsideradas: 8, message: null } }
      : { data: [], meta: { page: 1, pageSize: 1, total: 0, totalPages: 1 } })
    montar({ id: 'student', rol: 'BECARIO', activo: true, requiereCambioPassword: false, nombre: 'Ana', correo: 'ana@uni.edu', creadoEn: '2026-10-01T00:00:00Z', estudiante: { carrera: 'Sistemas', semestre: 4, metaMinutos: 120, codigo: '00731' } })
    expect(await screen.findByText('Rating general')).toBeInTheDocument()
    expect(await screen.findByText('4.5 / 5')).toBeInTheDocument()
  })

  it('permite reintentar el rating y muestra el mensaje contractual cuando no hay rating', async () => {
    let intentosRating = 0
    apiRequest.mockImplementation(async (ruta, { query } = {}) => {
      if (ruta === '/me/rating') {
        intentosRating += 1
        if (intentosRating === 1) throw new Error('Sin conexión')
        return { data: { rating: null, trabajosRealizados: 3, evaluacionesConsideradas: 0, message: 'faltan realizar trabajos' } }
      }
      return { data: [], meta: { page: 1, pageSize: query.pageSize, total: 0, totalPages: 1 } }
    })
    montar({ id: 'student', rol: 'BECARIO', activo: true, requiereCambioPassword: false, nombre: 'Ana', correo: 'ana@uni.edu', creadoEn: '2026-10-01T00:00:00Z', estudiante: { carrera: 'Sistemas', semestre: 4, metaMinutos: 120, codigo: '00731' } })

    expect(await screen.findByText('No se pudo cargar este resumen: Sin conexión')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('faltan realizar trabajos')).toBeInTheDocument()
    expect(intentosRating).toBe(2)
  })

  it('resume trabajos, postulaciones y cierres propios del encargado', async () => {
    apiRequest.mockResolvedValue({ data: { totalJobs: 7, publishedJobs: 5, closedJobs: 2, pendingCloseJobs: 1, pendingApplications: 3, acceptedStudents: 4 } })
    montar({ id: 'owner', rol: 'ENCARGADO', activo: true, requiereCambioPassword: false, nombre: 'Luis', correo: 'luis@uni.edu', creadoEn: '2026-10-01T00:00:00Z', encargado: { contextoTipo: 'AREA', contextoNombre: 'Biblioteca' } })
    await screen.findByText('Trabajos propios')
    expect(within(metrica('Trabajos propios')).getByText('7')).toBeInTheDocument()
    expect(within(metrica('Postulaciones pendientes')).getByText('3')).toBeInTheDocument()
    expect(within(metrica('Pendientes de cierre')).getByText('1')).toBeInTheDocument()
    expect(within(metrica('Trabajos propios')).getByText('5 publicados · 2 cerrados')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/me/dashboard', expect.anything())
    expect(screen.getByRole('link', { name: 'Cierres e historial de asistencia' })).toHaveAttribute('href', '/cierre-y-horas')
  })

  it('resume cuentas, trabajos y estudiantes para el administrador', async () => {
    apiRequest.mockImplementation(async ruta => {
      const total = ruta === '/users' ? 9 : ruta === '/jobs' ? 6 : 4
      return { data: [], meta: { page: 1, pageSize: 1, total, totalPages: total } }
    })
    montar({ id: 'admin', rol: 'ADMIN', activo: true, requiereCambioPassword: false, nombre: 'Admin', correo: 'admin@uni.edu', creadoEn: '2026-10-01T00:00:00Z' })
    await screen.findByText('Cuentas')
    expect(within(metrica('Cuentas')).getByText('9')).toBeInTheDocument()
    expect(within(metrica('Trabajos')).getByText('6')).toBeInTheDocument()
    expect(within(metrica('Estudiantes')).getByText('4')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Consultar progreso e historial' })).toHaveAttribute('href', '/admin/supervision')
  })
})
