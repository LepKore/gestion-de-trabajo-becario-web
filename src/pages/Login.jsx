import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Alert, Field } from '../components/ui.jsx'

export function Login() {
  const { autenticado, cargando, iniciarSesion, errorSesion, limpiarErrorSesion } = useAuth()
  const navegar = useNavigate()
  const ubicacion = useLocation()
  const [formulario, setFormulario] = useState({ correo: '', password: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const destino = ubicacion.state && ubicacion.state.desde ? ubicacion.state.desde : '/'

  if (cargando) return null
  if (autenticado) return <Navigate to={destino} replace />

  function actualizar(campo) {
    return (evento) => setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }))
  }

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')
    limpiarErrorSesion()
    setEnviando(true)
    try {
      const datos = await iniciarSesion(formulario.correo.trim(), formulario.password)
      navegar(datos.requiereCambioPassword ? '/change-password' : destino, { replace: true })
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-brand">
        <img src="/upb-logo.png" width="580" height="290" alt="Logo de la UPB" />
        <h1>MiBeca</h1>
        <p>Plataforma de gestión de trabajo becario</p>
        <ul>
          <li>Las cuentas las crea la administración de la plataforma.</li>
          <li>La primera contraseña es temporal y caduca en el primer ingreso.</li>
          <li>Cada estudiante gestiona sus horas con su supervisor.</li>
        </ul>
      </div>
      <div className="login-panel">
        <form className="login-card" onSubmit={alEnviar} noValidate>
          <h2>Iniciar sesión</h2>
          <p className="form-note">Ingresa con el correo institucional con el que te registraron.</p>
          {error && <Alert tipo="error">{error}</Alert>}
          {!error && errorSesion && <Alert tipo="warning">{errorSesion}</Alert>}
          <Field
            name="correo"
            label="Correo institucional"
            type="email"
            inputMode="email"
            autoComplete="username"
            required
            value={formulario.correo}
            onChange={actualizar('correo')}
          />
          <Field
            name="password"
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            required
            value={formulario.password}
            onChange={actualizar('password')}
          />
          <button className="button button--primary" type="submit" disabled={enviando}>
            {enviando ? 'Verificando…' : 'Ingresar'}
          </button>
          <p className="footnote">¿No tienes cuenta? Solicítala a la administración de MiBeca.</p>
        </form>
      </div>
    </div>
  )
}
