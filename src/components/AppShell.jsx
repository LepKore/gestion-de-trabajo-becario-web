import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { NOMBRES_ROL, SECCIONES, seccionesDe } from '../config/navegacion.js'

const DESCRIPCIONES = {
  '/': 'Resumen de tu actividad en MiBeca.',
  '/change-password': 'Debes cambiar la contraseña temporal antes de continuar.',
}

const TITULOS_RUTA = {
  '/mis-trabajos/nuevo': 'Publicar trabajo',
}

function tituloDeRuta(pathname, activa) {
  if (activa) return activa.etiqueta
  if (TITULOS_RUTA[pathname]) return TITULOS_RUTA[pathname]
  if (pathname.startsWith('/trabajos/')) return 'Detalle del trabajo'
  if (pathname.endsWith('/editar')) return 'Editar trabajo'
  return 'Sesión'
}

function Logo() {
  return (
    <span className="brand">
      <img src="/upb-logo.png" width="580" height="290" alt="Logo de la UPB" />
      <span className="brand-copy"><strong>UPB | MiBeca</strong><small>Gestión de becas</small></span>
    </span>
  )
}

const ICONOS = {
  '/': 'space_dashboard',
  '/trabajos-disponibles': 'work_outline',
  '/mis-postulaciones': 'assignment_turned_in',
  '/historial': 'history',
  '/mis-trabajos': 'list_alt',
  '/postulaciones': 'how_to_reg',
  '/cierre-y-horas': 'verified',
  '/admin/usuarios': 'group',
  '/admin/trabajos': 'domain_verification',
  '/admin/supervision': 'clinical_notes',
}

/** Estructura común: navegación del rol, identidad de la sesión y salida. */
export function AppShell() {
  const { usuario, cerrarSesion } = useAuth()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const secciones = seccionesDe(usuario.rol)
  const activa = SECCIONES.find((seccion) => seccion.ruta === pathname)
  const etiquetaActual = tituloDeRuta(pathname, activa)

  async function alCerrarSesion() {
    await cerrarSesion()
    navegar('/login', { replace: true })
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#contenido">Saltar al contenido</a>
      <aside className="sidebar" aria-label="Navegación principal">
        <Logo />
        <div className="role-card">
          <span>Vista institucional activa</span>
          <strong><span className="material-symbols-outlined" aria-hidden="true">admin_panel_settings</span>{NOMBRES_ROL[usuario.rol]}</strong>
        </div>
        <nav aria-label={`Opciones de ${NOMBRES_ROL[usuario.rol]}`}>
          {secciones.map((seccion) => (
            <NavLink
              key={seccion.ruta}
              to={seccion.ruta}
              end={seccion.ruta === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
            >
              <span className="material-symbols-outlined nav-icon" aria-hidden="true">{ICONOS[seccion.ruta] || 'circle'}</span>
              {seccion.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-policy">
            <span className="material-symbols-outlined" aria-hidden="true">policy</span>
            <strong>Regla institucional</strong>
            <small>Una postulación pendiente no reserva cupo.</small>
          </div>
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
        <main className="content" id="contenido">
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
