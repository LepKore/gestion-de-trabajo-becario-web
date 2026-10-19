import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { NOMBRES_ROL, SECCIONES, seccionesDe } from '../config/navegacion.js'

const DESCRIPCIONES = {
  '/': 'Resumen de tu actividad en MiBeca.',
  '/change-password': 'Debes cambiar la contraseña temporal antes de continuar.',
}

function Logo() {
  return (
    <span className="brand">
      <img src="/upb-logo.png" width="580" height="290" alt="Logo de la UPB" />
      <span>MiBeca</span>
    </span>
  )
}

/** Estructura común: navegación del rol, identidad de la sesión y salida. */
export function AppShell() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const secciones = seccionesDe(usuario.rol)
  const activa = SECCIONES.find((seccion) => seccion.ruta === pathname)
  const etiquetaActual = activa ? activa.etiqueta : 'Sesión'

  async function alCerrarSesion() {
    await cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navegación principal">
        <Logo />
        <div className="sidebar-caption">PLATAFORMA ACADÉMICA</div>
        <nav aria-label={`Opciones de ${NOMBRES_ROL[usuario.rol]}`}>
          {secciones.map((seccion) => (
            <NavLink
              key={seccion.ruta}
              to={seccion.ruta}
              end={seccion.ruta === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="nav-dot" aria-hidden="true" />
              {seccion.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          MiBeca
          <small>{NOMBRES_ROL[usuario.rol]}</small>
        </div>
      </aside>
      <div className="main-column">
        <header className="topbar">
          <span className="breadcrumb">MiBeca / {etiquetaActual}</span>
          <div className="topbar-actions">
            <span className="session-identity">
              <strong>{usuario.nombre}</strong>
              <small>{usuario.correo}</small>
            </span>
            <button className="button button--secondary" type="button" onClick={alCerrarSesion}>Cerrar sesión</button>
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <span className="eyebrow">{NOMBRES_ROL[usuario.rol]} · MiBeca</span>
              <h1>{etiquetaActual}</h1>
              <p>{DESCRIPCIONES[pathname] || ''}</p>
            </div>
            <span className="status status--success">Sesión activa</span>
          </div>
          <Outlet />
          <footer className="content-footer">MiBeca · Plataforma de gestión de trabajo becario</footer>
        </main>
      </div>
    </div>
  )
}