import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Alert, Field } from '../components/ui.jsx'

const MINIMO = 10

/**
 * Cambio de contraseña. Es obligatorio cuando el usuario tiene una contraseña
 * temporal; el servidor revoca todas las sesiones y renueva la cookie.
 */
export function ChangePassword() {
  const { usuario, autenticado, cargando, cambiarContrasena } = useAuth()
  const navegar = useNavigate()
  const [formulario, setFormulario] = useState({
    passwordActual: '',
    passwordNuevo: '',
    passwordNuevoConfirmacion: '',
  })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) return null
  if (!autenticado) return <Navigate to="/login" replace />

  function actualizar(campo) {
    return (evento) => setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }))
  }

  const longitudInsuficiente = formulario.passwordNuevo.length > 0 && formulario.passwordNuevo.length < MINIMO
  const noCoincide = formulario.passwordNuevoConfirmacion.length > 0 && formulario.passwordNuevo !== formulario.passwordNuevoConfirmacion
  const incompleto = !formulario.passwordActual || !formulario.passwordNuevo || !formulario.passwordNuevoConfirmacion

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')
    setEnviando(true)
    try {
      await cambiarContrasena(formulario)
      navegar('/', { replace: true })
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-panel">
        <form className="login-card" onSubmit={alEnviar} noValidate>
          <span className="eyebrow">MiBeca · {usuario.nombre}</span>
          <h2>Cambiar contraseña</h2>
          <p className="form-note">
            {usuario.requiereCambioPassword
              ? 'Tu contraseña temporal caduca en este paso. Al cambiarla se cerrarán todas tus sesiones abiertas.'
              : 'Al cambiarla se cerrarán todas tus sesiones abiertas, incluida esta.'}
          </p>
          {error && <Alert tipo="error">{error}</Alert>}
          <Field
            name="passwordActual"
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            required
            value={formulario.passwordActual}
            onChange={actualizar('passwordActual')}
          />
          <Field
            name="passwordNuevo"
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            minLength={MINIMO}
            hint={`Mínimo ${MINIMO} caracteres y distinta de la actual.`}
            error={longitudInsuficiente ? `Debe tener al menos ${MINIMO} caracteres.` : ''}
            value={formulario.passwordNuevo}
            onChange={actualizar('passwordNuevo')}
          />
          <Field
            name="passwordNuevoConfirmacion"
            label="Repetir nueva contraseña"
            type="password"
            autoComplete="new-password"
            required
            error={noCoincide ? 'Las contraseñas no coinciden.' : ''}
            value={formulario.passwordNuevoConfirmacion}
            onChange={actualizar('passwordNuevoConfirmacion')}
          />
          <button
            className="button button--primary"
            type="submit"
            disabled={enviando || incompleto || longitudInsuficiente || noCoincide}
          >
            {enviando ? 'Guardando…' : 'Guardar contraseña'}
          </button>
          
        </form>
      </div>
    </div>
  )
}