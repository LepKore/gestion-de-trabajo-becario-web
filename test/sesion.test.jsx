import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '../src/components/ProtectedRoute.jsx'
import { Login } from '../src/pages/Login.jsx'
import { ChangePassword } from '../src/pages/ChangePassword.jsx'

vi.mock('../src/auth/useAuth.js', () => ({ useAuth: () => sesion }))

let sesion = {}

const base = {
  cargando: false,
  autenticado: true,
  requiereCambioPassword: false,
  errorSesion: '',
  usuario: { nombre: 'Ana', rol: 'BECARIO', requiereCambioPassword: false },
  iniciarSesion: vi.fn(),
  limpiarErrorSesion: vi.fn(),
  cambiarContrasena: vi.fn(),
}

function montar(elemento, ruta = '/') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/" element={<p>inicio</p>} />
        <Route path="/login" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/privada" element={elemento} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  sesion = { ...base, iniciarSesion: vi.fn(), limpiarErrorSesion: vi.fn(), cambiarContrasena: vi.fn() }
})
afterEach(cleanup)

describe('ProtectedRoute', () => {
  it('muestra el estado de verificación mientras carga la sesión', () => {
    sesion.cargando = true
    montar(<ProtectedRoute><p>secreto</p></ProtectedRoute>, '/privada')
    expect(screen.getByRole('status')).toHaveTextContent('Verificando sesión')
    expect(screen.queryByText('secreto')).toBeNull()
  })

  it('manda a /login cuando no hay sesión', () => {
    sesion.autenticado = false
    montar(<ProtectedRoute><p>secreto</p></ProtectedRoute>, '/privada')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.queryByText('secreto')).toBeNull()
  })

  it('fuerza el cambio de contraseña pendiente', () => {
    sesion.requiereCambioPassword = true
    montar(<ProtectedRoute><p>secreto</p></ProtectedRoute>, '/privada')
    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument()
  })

  it('no bloquea /change-password consigo mismo', () => {
    sesion.requiereCambioPassword = true
    montar(<ProtectedRoute><p>secreto</p></ProtectedRoute>, '/change-password')
    expect(screen.getByRole('heading', { name: 'Cambiar contraseña' })).toBeInTheDocument()
  })

  it('expulsa a / si el rol no está permitido y deja pasar si lo está', () => {
    montar(<ProtectedRoute roles={['ADMIN']}><p>secreto</p></ProtectedRoute>, '/privada')
    expect(screen.getByText('inicio')).toBeInTheDocument()
    expect(screen.queryByText('secreto')).toBeNull()
    cleanup()
    montar(<ProtectedRoute roles={['BECARIO']}><p>secreto</p></ProtectedRoute>, '/privada')
    expect(screen.getByText('secreto')).toBeInTheDocument()
  })
})

describe('Login', () => {
  beforeEach(() => {
    sesion.autenticado = false
  })

  it('muestra el mensaje del servidor y reactiva el botón si falla el ingreso', async () => {
    sesion.iniciarSesion.mockRejectedValue(new Error('Credenciales inválidas'))
    montar(<Login />, '/login')
    fireEvent.change(screen.getByLabelText('Correo institucional'), { target: { value: ' ana@upb.edu ' } })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('Credenciales inválidas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
    expect(sesion.iniciarSesion).toHaveBeenCalledWith('ana@upb.edu', 'secreta')
  })

  it('navega al inicio al ingresar', async () => {
    sesion.iniciarSesion.mockResolvedValue({ requiereCambioPassword: false })
    montar(<Login />, '/login')
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    await screen.findByText('inicio')
  })

  it('desvía a cambio de contraseña si es obligatorio', async () => {
    sesion.iniciarSesion.mockResolvedValue({ requiereCambioPassword: true })
    // Ruta marcador: ChangePassword exige sesión, que aquí no se simula.
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/change-password" element={<p>cambio obligatorio</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByText('cambio obligatorio')).toBeInTheDocument()
  })

  it('avisa con warning cuando la sesión anterior expiró', () => {
    sesion.errorSesion = 'Tu sesión expiró'
    montar(<Login />, '/login')
    expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión expiró')
  })
})

describe('ChangePassword', () => {
  function enviar(actual, nuevo, repetido) {
    fireEvent.change(screen.getByLabelText('Contraseña actual'), { target: { value: actual } })
    fireEvent.change(screen.getByLabelText('Nueva contraseña'), { target: { value: nuevo } })
    fireEvent.change(screen.getByLabelText('Repetir nueva contraseña'), { target: { value: repetido } })
  }

  it('no permite enviar con contraseña corta ni con confirmación distinta', () => {
    montar(<ChangePassword />, '/change-password')
    const guardar = screen.getByRole('button', { name: 'Guardar contraseña' })
    expect(guardar).toBeDisabled()
    enviar('actual', 'corta', 'corta')
    expect(screen.getByText('Debe tener al menos 10 caracteres.')).toBeInTheDocument()
    expect(guardar).toBeDisabled()
    enviar('actual', 'unaClaveLarga', 'otraClaveLarga')
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument()
    expect(guardar).toBeDisabled()
    enviar('actual', 'unaClaveLarga', 'unaClaveLarga')
    expect(guardar).toBeEnabled()
  })

  it('envía los tres campos y navega al inicio al guardar', async () => {
    sesion.cambiarContrasena.mockResolvedValue()
    montar(<ChangePassword />, '/change-password')
    enviar('actual', 'unaClaveLarga', 'unaClaveLarga')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    await screen.findByText('inicio')
    expect(sesion.cambiarContrasena).toHaveBeenCalledWith({
      passwordActual: 'actual',
      passwordNuevo: 'unaClaveLarga',
      passwordNuevoConfirmacion: 'unaClaveLarga',
    })
  })

  it('muestra el error del servidor y no navega', async () => {
    sesion.cambiarContrasena.mockRejectedValue(new Error('Contraseña actual incorrecta'))
    montar(<ChangePassword />, '/change-password')
    enviar('actual', 'unaClaveLarga', 'unaClaveLarga')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar contraseña' }))
    expect(await screen.findByText('Contraseña actual incorrecta')).toBeInTheDocument()
    expect(screen.queryByText('inicio')).toBeNull()
  })

  it('manda a /login sin sesión', () => {
    sesion.autenticado = false
    montar(<ChangePassword />, '/change-password')
    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
