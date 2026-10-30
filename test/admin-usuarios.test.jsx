import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { usuariosApi } from '../src/api/endpoints.js'
import { AdminUsuarios } from '../src/pages/AdminUsuarios.jsx'

vi.mock('../src/api/endpoints.js', () => ({
  usuariosApi: {
    listar: vi.fn(),
    crear: vi.fn(),
    restablecerPassword: vi.fn(),
    reactivar: vi.fn(),
    desactivar: vi.fn(),
  },
}))
vi.mock('../src/auth/useAuth.js', () => ({ useAuth: () => ({ usuario: { id: 'admin-1', rol: 'ADMIN' } }) }))

const ana = {
  id: 'u-2',
  nombre: 'Ana Pérez',
  correo: 'ana@upb.edu',
  rol: 'BECARIO',
  activo: true,
  requiereCambioPassword: false,
  estudiante: { codigo: '00123', carrera: 'Sistemas', semestre: 4 },
}
const yo = { ...ana, id: 'admin-1', nombre: 'Admin', correo: 'admin@upb.edu', rol: 'ADMIN', estudiante: undefined }

const pagina = (usuarios, meta = {}) => ({ data: usuarios, meta: { page: 1, pageSize: 10, total: usuarios.length, totalPages: 1, ...meta } })

function montar() {
  return render(<AdminUsuarios />)
}

function rellenarBecario({ metaHoras = '120.5' } = {}) {
  for (const [label, value] of [
    ['Nombre completo', 'Luis Gómez'],
    ['Correo institucional', 'luis@upb.edu'],
    ['Código de estudiante', '00234'],
    ['Carrera', 'Sistemas'],
    ['Semestre', '5'],
    ['Meta semestral (horas)', metaHoras],
  ]) fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

beforeEach(() => {
  vi.resetAllMocks()
  usuariosApi.listar.mockResolvedValue(pagina([ana, yo]))
})
afterEach(cleanup)

describe('Alta de usuarios', () => {
  it('convierte la meta en horas a minutos enteros y el semestre a número', async () => {
    usuariosApi.crear.mockResolvedValue({ data: { nombre: 'Luis Gómez', correo: 'luis@upb.edu', passwordTemporal: 'Temp-123456' } })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    rellenarBecario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear y generar contraseña' }))
    await waitFor(() => expect(usuariosApi.crear).toHaveBeenCalledTimes(1))
    expect(usuariosApi.crear).toHaveBeenCalledWith({
      nombre: 'Luis Gómez',
      correo: 'luis@upb.edu',
      rol: 'BECARIO',
      estudiante: { codigo: '00234', carrera: 'Sistemas', semestre: 5, metaMinutos: 7230 },
    })
  })

  it('muestra la contraseña temporal una sola vez tras crear la cuenta', async () => {
    usuariosApi.crear.mockResolvedValue({ data: { nombre: 'Luis Gómez', correo: 'luis@upb.edu', passwordTemporal: 'Temp-123456' } })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    rellenarBecario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear y generar contraseña' }))
    expect(await screen.findByText('Temp-123456')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ya la entregué' }))
    expect(screen.queryByText('Temp-123456')).toBeNull()
  })

  it('envía el contexto del encargado y no datos de estudiante', async () => {
    usuariosApi.crear.mockResolvedValue({ data: { passwordTemporal: 'Temp-000000' } })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    const dialogo = screen.getByRole('dialog')
    fireEvent.change(within(dialogo).getByLabelText('Nombre completo'), { target: { value: 'Marta Ruiz' } })
    fireEvent.change(within(dialogo).getByLabelText('Correo institucional'), { target: { value: 'marta@upb.edu' } })
    fireEvent.change(within(dialogo).getByLabelText('Rol'), { target: { value: 'ENCARGADO' } })
    fireEvent.change(within(dialogo).getByLabelText('Nombre del contexto'), { target: { value: 'Biblioteca' } })
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Crear y generar contraseña' }))
    await waitFor(() => expect(usuariosApi.crear).toHaveBeenCalledWith({
      nombre: 'Marta Ruiz',
      correo: 'marta@upb.edu',
      rol: 'ENCARGADO',
      encargado: { contextoTipo: 'MATERIA', contextoNombre: 'Biblioteca' },
    }))
  })

  it('mantiene el diálogo abierto y muestra el error si la API rechaza el alta', async () => {
    usuariosApi.crear.mockRejectedValue(new Error('El correo ya está registrado'))
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Crear usuario' }))
    rellenarBecario()
    fireEvent.click(screen.getByRole('button', { name: 'Crear y generar contraseña' }))
    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument()
  })
})

describe('Acciones sobre la lista', () => {
  it('pide confirmación antes de resetear y muestra la temporal en la fila sin desmontar la tabla', async () => {
    usuariosApi.restablecerPassword.mockResolvedValue({ data: { passwordTemporal: 'Nueva-999' } })
    montar()
    await screen.findByText('Ana Pérez')
    const fila = screen.getByRole('row', { name: /Ana Pérez/ })
    fireEvent.click(within(fila).getByRole('button', { name: 'Nueva contraseña' }))
    expect(usuariosApi.restablecerPassword).not.toHaveBeenCalled()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Generar contraseña' }))
    expect(await within(fila).findByText('Nueva-999')).toBeInTheDocument()
    expect(usuariosApi.listar).toHaveBeenCalledTimes(2)
  })

  it('pide confirmación antes de desactivar y no llama a la API al cancelar', async () => {
    usuariosApi.desactivar.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Ana Pérez')
    const fila = screen.getByRole('row', { name: /Ana Pérez/ })
    fireEvent.click(within(fila).getByRole('button', { name: 'Desactivar' }))
    const dialogo = screen.getByRole('dialog')
    expect(dialogo).toHaveTextContent('¿Desactivar a Ana Pérez')
    expect(usuariosApi.desactivar).not.toHaveBeenCalled()
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(usuariosApi.desactivar).not.toHaveBeenCalled()
  })

  it('desactiva tras confirmar en el diálogo', async () => {
    usuariosApi.desactivar.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(within(screen.getByRole('row', { name: /Ana Pérez/ })).getByRole('button', { name: 'Desactivar' }))
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }))
    await waitFor(() => expect(usuariosApi.desactivar).toHaveBeenCalledWith('u-2'))
  })

  it('no deja que el administrador desactive su propia cuenta', async () => {
    montar()
    const fila = (await screen.findByText('admin@upb.edu')).closest('tr')
    const boton = within(fila).getByRole('button', { name: 'Desactivar' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('title', 'No puedes desactivar tu propia cuenta')
  })

  it('reactiva una cuenta inactiva', async () => {
    usuariosApi.listar.mockResolvedValue(pagina([{ ...ana, activo: false }]))
    usuariosApi.reactivar.mockResolvedValue({ data: {} })
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Reactivar' }))
    await waitFor(() => expect(usuariosApi.reactivar).toHaveBeenCalledWith('u-2'))
  })
})

describe('Filtros y paginación', () => {
  it('vuelve a la primera página al cambiar un filtro', async () => {
    usuariosApi.listar.mockResolvedValue(pagina([ana], { page: 1, total: 30, totalPages: 3 }))
    montar()
    await screen.findByText('Ana Pérez')
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    await waitFor(() => expect(usuariosApi.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })))
    fireEvent.change(screen.getByLabelText('Rol'), { target: { value: 'BECARIO' } })
    await waitFor(() => expect(usuariosApi.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, rol: 'BECARIO' })))
  })

  it('muestra el estado vacío y el error de carga', async () => {
    usuariosApi.listar.mockResolvedValue(pagina([]))
    montar()
    expect(await screen.findByText('Sin usuarios que coincidan')).toBeInTheDocument()
    cleanup()
    usuariosApi.listar.mockRejectedValue(new Error('Sin conexión'))
    montar()
    expect(await screen.findByText('Sin conexión')).toBeInTheDocument()
  })
})
