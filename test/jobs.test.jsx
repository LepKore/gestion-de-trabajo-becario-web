import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { apiRequest } from '../src/lib/api.js'
import { fechaUTC, horasAMinutos } from '../src/lib/trabajos.js'
import * as fechas from '../src/lib/trabajos.js'
import { DetalleTrabajo, FormularioTrabajo, Trabajos } from '../src/pages/Trabajos.jsx'

vi.mock('../src/lib/api.js', () => ({ apiRequest: vi.fn() }))
vi.mock('../src/auth/useAuth.js', () => ({ useAuth: () => ({ usuario: { id: 'owner', rol: rolActual } }) }))
let rolActual = 'ENCARGADO'
const trabajo = { id: 'job', encargadoId: 'owner', titulo: 'Apoyo biblioteca', descripcion: 'Ordenar libros', ubicacion: 'Biblioteca', inicioPrevisto: '2099-10-20T12:00:00Z', finPrevisto: '2099-10-20T18:00:00Z', duracionMinutos: 276, cupos: 1, cuposDisponibles: 1, aceptados: 0, estado: 'PUBLICADO', faseTemporal: 'PROXIMO', encargadoNombre: 'Ana', contextoNombre: 'Biblioteca' }
const lista = (data, page = 1, totalPages = 1) => ({ data, meta: { page, pageSize: 20, total: data.length, totalPages } })
function montar(elemento, ruta = '/') { return render(<MemoryRouter initialEntries={[ruta]}><Routes><Route path="/" element={elemento} /><Route path="/trabajos/:id" element={<DetalleTrabajo />} /></Routes></MemoryRouter>) }
beforeEach(() => { vi.resetAllMocks(); rolActual = 'ENCARGADO' })
afterEach(cleanup)
describe('Duración exacta', () => {
  it('admite coma y convierte décimas sin redondear', () => {
    expect(horasAMinutos('4,6')).toBe(276)
    expect(horasAMinutos('0.1')).toBe(6)
    for (const valor of ['3.61', '0', '-1', '1e2', 'Infinity']) expect(() => horasAMinutos(valor)).toThrow()
  })
})
it('publica convirtiendo horas y fechas de Bolivia a UTC', async () => {
  apiRequest.mockResolvedValue({ data: trabajo })
  montar(<FormularioTrabajo />)
  for (const [label, value] of [['Título', 'Apoyo biblioteca'], ['Descripción', 'Ordenar libros'], ['Ubicación', 'Biblioteca'], ['Inicio previsto (America/La_Paz)', '2099-10-20T12:00'], ['Fin previsto (America/La_Paz)', '2099-10-20T18:00'], ['Duración acreditable (horas)', '4,6'], ['Cupos', '1']]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
  fireEvent.click(screen.getByRole('button', { name: 'Publicar trabajo' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/jobs', expect.objectContaining({ metodo: 'POST', cuerpo: expect.objectContaining({ duracionMinutos: 276, inicioPrevisto: '2099-10-20T16:00:00.000Z' }) })))
})
it('pagina trabajos y muestra el fallo del servidor', async () => {
  apiRequest.mockResolvedValueOnce(lista([trabajo], 1, 2)).mockRejectedValueOnce(new Error('Sin conexión'))
  montar(<Trabajos modo="propios" />)
  await screen.findByText('Apoyo biblioteca')
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
  await screen.findByText('Sin conexión')
  expect(apiRequest).toHaveBeenLastCalledWith('/me/jobs', expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }))
})
it('becario postula sin reservar cupo y muestra conflicto', async () => {
  rolActual = 'BECARIO'
  apiRequest.mockResolvedValueOnce({ data: trabajo }).mockRejectedValueOnce(new Error('Ya tienes una postulación'))
  montar(null, '/trabajos/job')
  fireEvent.click(await screen.findByRole('button', { name: 'Postularme' }))
  await screen.findByText('Ya tienes una postulación')
  expect(screen.getByText(/pendiente no reserva cupo/)).toBeInTheDocument()
  expect(apiRequest).toHaveBeenCalledWith('/jobs/job/applications', { metodo: 'POST', cuerpo: {} })
})
it('presenta los datos del trabajo como bloques etiquetados y no como texto corrido', async () => {
  rolActual = 'BECARIO'
  apiRequest.mockResolvedValue({ data: trabajo })
  montar(null, '/trabajos/job')
  expect(await screen.findByText('Apoyo biblioteca')).toBeInTheDocument()
  expect(screen.getByText('Estado')).toBeInTheDocument()
  expect(screen.getByText('Ubicación')).toBeInTheDocument()
  expect(screen.getByText('Horas acreditables')).toBeInTheDocument()
  expect(screen.getByText('Fecha y horario')).toBeInTheDocument()
  expect(screen.getByText('Cupos')).toBeInTheDocument()
  expect(screen.getByText('Encargado')).toBeInTheDocument()
})
it('mantiene visibles las acciones de postulantes también en la tarjeta móvil', async () => {
  const postulacion = { id: 'app', estado: 'PENDIENTE', estudiante: { nombre: 'Luis', codigo: '00123', carrera: 'Sistemas' } }
  apiRequest.mockImplementation(async ruta => {
    if (ruta === '/jobs/job') return { data: trabajo }
    if (ruta === '/jobs/job/applications') return lista([postulacion])
  })
  montar(null, '/trabajos/job')
  expect(await screen.findAllByText('Luis')).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: 'Aceptar a Luis' })).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: 'Rechazar a Luis' })).toHaveLength(2)
  expect(screen.getAllByText('Código')).toHaveLength(2)
  expect(screen.getAllByText('Carrera')).toHaveLength(2)
})
it('propietario confirma una aceptación irreversible', async () => {
  const postulacion = { id: 'app', estado: 'PENDIENTE', estudiante: { nombre: 'Luis', codigo: '00123', carrera: 'Sistemas' } }
  apiRequest.mockImplementation(async (ruta, opciones) => {
    if (ruta === '/jobs/job') return { data: trabajo }
    if (ruta === '/jobs/job/applications') return lista([postulacion])
    if (opciones?.metodo === 'POST') return { data: { ...postulacion, estado: 'ACEPTADA' } }
  })
  montar(null, '/trabajos/job')
  fireEvent.click((await screen.findAllByRole('button', { name: 'Aceptar a Luis' }))[0])
  expect(apiRequest).not.toHaveBeenCalledWith('/applications/app/accept', expect.anything())
  fireEvent.click(screen.getByRole('button', { name: 'Confirmar aceptación' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/applications/app/accept', { metodo: 'POST', cuerpo: {} }))
})
it('administrador consulta sin acciones ni datos de postulantes', async () => {
  rolActual = 'ADMIN'
  apiRequest.mockResolvedValue({ data: trabajo })
  montar(null, '/trabajos/job')
  await screen.findByText('Apoyo biblioteca')
  expect(screen.queryByRole('button', { name: 'Postularme' })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Editar trabajo' })).not.toBeInTheDocument()
  expect(apiRequest).toHaveBeenCalledTimes(1)
})

it('convierte 12:41 de Bolivia a 16:41 UTC para la API', () => {
  expect(fechaUTC('2026-10-19T12:41')).toBe('2026-10-19T16:41:00.000Z')
})

it('permite publicar hoy a una hora futura en la zona universitaria', async () => {
  const reloj = vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-19T15:30:00Z'))
  apiRequest.mockResolvedValue({ data: trabajo })
  try {
    montar(<FormularioTrabajo />)
    for (const [label, value] of [
      ['Título', 'Apoyo biblioteca'], ['Descripción', 'Ordenar libros'], ['Ubicación', 'Biblioteca'],
      ['Inicio previsto (America/La_Paz)', '2026-10-19T12:41'], ['Fin previsto (America/La_Paz)', '2026-10-19T12:43'],
      ['Duración acreditable (horas)', '1'], ['Cupos', '1'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
    fireEvent.click(screen.getByRole('button', { name: 'Publicar trabajo' }))
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/jobs', expect.objectContaining({
      cuerpo: expect.objectContaining({ inicioPrevisto: '2026-10-19T16:41:00.000Z', finPrevisto: '2026-10-19T16:43:00.000Z' }),
    })))
  } finally {
    reloj.mockRestore()
  }
})
it('muestra en edición la hora de la zona y conserva el instante UTC', async () => {
  expect(fechas.fechaFormulario?.('2026-10-19T16:41:00.000Z')).toBe('2026-10-19T12:41')
  apiRequest.mockResolvedValue({ data: trabajo })
  montar(<FormularioTrabajo trabajo={trabajo} />)
  expect(screen.getByLabelText(/Inicio previsto/)).toHaveValue('2099-10-20T08:00')
  expect(screen.getByLabelText(/Fin previsto/)).toHaveValue('2099-10-20T14:00')
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
  await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/jobs/job', expect.objectContaining({
    metodo: 'PATCH',
    cuerpo: expect.objectContaining({ inicioPrevisto: new Date(trabajo.inicioPrevisto).toISOString(), finPrevisto: new Date(trabajo.finPrevisto).toISOString() }),
  })))
})

it('rechaza una fecha imposible y una hora inexistente en una zona con cambio horario', () => {
  expect(() => fechaUTC('2026-02-30T12:41')).toThrow()
  expect(() => fechaUTC('2026-03-08T02:30', 'America/New_York')).toThrow()
})
it('conserva segundos y milisegundos del instante original al editar otros campos', () => {
  expect(fechaUTC('2026-10-20T12:41', 'America/La_Paz', '2026-10-20T16:41:37.500Z'))
    .toBe('2026-10-20T16:41:37.500Z')
})
