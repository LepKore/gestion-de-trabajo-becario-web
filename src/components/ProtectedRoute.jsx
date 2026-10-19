import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'

/**
 * Guarda de ruta: exige sesión activa, redirect si el usuario tiene pendiente el
 * cambio de contraseña y, si se indican roles, que el usuario los tenga.
 */
export function ProtectedRoute({ roles, children }) {
  const { cargando, autenticado, usuario, requiereCambioPassword } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="loading-screen" role="status">
        <span className="loading-dot" aria-hidden="true" />
        <span className="loading-dots" aria-hidden="true" />
        Verificando sesión…
      </div>
    )
  }

  if (!autenticado) {
    return <Navigate to="/login" replace state={{ desde: ubicacion.pathname }} />
  }

  if (requiereCambioPassword && ubicacion.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/" replace />
  }

  return children
}