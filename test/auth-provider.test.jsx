import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from '../src/auth/AuthProvider.jsx'
import { useAuth } from '../src/auth/useAuth.js'
import { apiRequest, guardarCsrfToken, leerCsrfToken } from '../src/lib/api.js'

function Probe() {
  const auth = useAuth()
  return (
    <section>
      <p>Estado: {auth.estado}</p>
      {auth.errorSesion && <p role="alert">{auth.errorSesion}</p>}
      <button type="button" onClick={() => auth.iniciarSesion('ana@uni.edu', 'clave-segura')}>Iniciar prueba</button>
      <button type="button" onClick={() => apiRequest('/jobs').catch(() => {})}>Solicitar recurso</button>
    </section>
  )
}

function respuesta(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('sesión de la aplicación', () => {
  beforeEach(() => {
    guardarCsrfToken(null)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    guardarCsrfToken(null)
  })

  it('inicia en anónimo y limpia la sesión cuando una llamada protegida expira', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).endsWith('/auth/login')) {
        return respuesta(200, { data: {
          usuario: { id: 'student-id', nombre: 'Ana', correo: 'ana@uni.edu', rol: 'BECARIO' },
          requiereCambioPassword: false,
          csrfToken: 'csrf-de-prueba',
        } })
      }
      if (String(url).endsWith('/auth/me')) {
        return respuesta(401, { error: { code: 'unauthenticated', message: 'Debes iniciar sesión.' } })
      }
      return respuesta(401, { error: { code: 'unauthenticated', message: 'Debes iniciar sesión.' } })
    })

    render(<AuthProvider><Probe /></AuthProvider>)
    await waitFor(() => expect(screen.getByText('Estado: anonimo')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Iniciar prueba' }))
    await waitFor(() => expect(screen.getByText('Estado: autenticado')).toBeInTheDocument())
    expect(leerCsrfToken()).toBe('csrf-de-prueba')

    fireEvent.click(screen.getByRole('button', { name: 'Solicitar recurso' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión terminó o fue revocada'))
    expect(screen.getByText('Estado: anonimo')).toBeInTheDocument()
    expect(leerCsrfToken()).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
