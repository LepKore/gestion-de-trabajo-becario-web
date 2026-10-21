import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { Alert, Metric } from '../components/ui.jsx'
import { useRecurso } from '../lib/useRecurso.js'
import { RUTAS } from '../api/endpoints.js'
import { ProgresoBecario } from './Control.jsx'

function EstadoCarga({ recurso, children }) {
  if (recurso.cargando) return <p className="loading" role="status">Cargando resumen…</p>
  if (recurso.error) return <Alert tipo="error">No se pudo cargar este resumen: {recurso.error}</Alert>
  return children(recurso.respuesta)
}

function PanelBecario() {
  const total = useRecurso(RUTAS.postulaciones.mias, { page: 1, pageSize: 1 })
  const pendientes = useRecurso(RUTAS.postulaciones.mias, { estado: 'PENDIENTE', page: 1, pageSize: 1 })
  return <>
    <ProgresoBecario />
    <section className="panel">
      <header className="panel-head"><h2>Postulaciones e historial</h2><Link className="button button--secondary" to="/mis-postulaciones">Ver postulaciones</Link></header>
      <div className="metrics metrics--summary">
        <EstadoCarga recurso={total}>{({ meta }) => <Metric label="Postulaciones" value={String(meta.total)} hint="Todas tus solicitudes" />}</EstadoCarga>
        <EstadoCarga recurso={pendientes}>{({ meta }) => <Metric label="Pendientes" value={String(meta.total)} hint="No reservan cupo hasta ser aceptadas" tone="warning" />}</EstadoCarga>
      </div>
      <div className="row-actions"><Link className="button button--secondary" to="/historial">Consultar historial y horas</Link><Link className="button button--primary" to="/trabajos-disponibles">Explorar trabajos</Link></div>
    </section>
  </>
}

function PanelEncargado() {
  const recurso = useRecurso(RUTAS.yo.panel)
  return <section className="panel" aria-labelledby="titulo-resumen-encargado">
    <header className="panel-head"><div><h2 id="titulo-resumen-encargado">Tus trabajos y postulantes</h2><p>Resumen de tus publicaciones, decisiones y cierres pendientes.</p></div></header>
    <EstadoCarga recurso={recurso}>{({ data }) => <>
      <div className="metrics metrics--summary">
        <Metric label="Trabajos propios" value={String(data.totalJobs)} hint={`${data.publishedJobs} publicados · ${data.closedJobs} cerrados`} />
        <Metric label="Postulaciones pendientes" value={String(data.pendingApplications)} hint="Esperan tu decisión" tone="warning" />
        <Metric label="Estudiantes aceptados" value={String(data.acceptedStudents)} hint="En tus trabajos publicados" tone="success" />
        <Metric label="Pendientes de cierre" value={String(data.pendingCloseJobs)} hint="Ya alcanzaron su fin previsto" tone="warning" />
      </div>
      <div className="row-actions"><Link className="button button--primary" to="/mis-trabajos">Gestionar trabajos</Link><Link className="button button--secondary" to="/postulaciones">Revisar postulaciones</Link><Link className="button button--secondary" to="/cierre-y-horas">Cierres e historial de asistencia</Link></div>
    </>}</EstadoCarga>
  </section>
}

function PanelAdministrador() {
  const usuarios = useRecurso(RUTAS.usuarios.lista, { page: 1, pageSize: 1 })
  const trabajos = useRecurso(RUTAS.trabajos.lista, { page: 1, pageSize: 1 })
  const estudiantes = useRecurso(RUTAS.estudiantes.progreso, { page: 1, pageSize: 1 })
  return <section className="panel" aria-labelledby="titulo-resumen-admin">
    <header className="panel-head"><div><h2 id="titulo-resumen-admin">Supervisión de MiBeca</h2><p>Totales generales y acceso a la consulta individual de progreso.</p></div></header>
    <div className="metrics metrics--summary">
      <EstadoCarga recurso={usuarios}>{({ meta }) => <Metric label="Cuentas" value={String(meta.total)} hint="Usuarios registrados" />}</EstadoCarga>
      <EstadoCarga recurso={trabajos}>{({ meta }) => <Metric label="Trabajos" value={String(meta.total)} hint="Publicados en MiBeca" />}</EstadoCarga>
      <EstadoCarga recurso={estudiantes}>{({ meta }) => <Metric label="Estudiantes" value={String(meta.total)} hint="Con perfil académico" tone="success" />}</EstadoCarga>
    </div>
    <div className="row-actions"><Link className="button button--primary" to="/admin/supervision">Consultar progreso e historial</Link><Link className="button button--secondary" to="/admin/usuarios">Gestionar cuentas</Link></div>
  </section>
}

/** Resumen por rol, alimentado con consultas reales y limitadas por permisos. */
export function Panel() {
  const { usuario } = useAuth()

  const perfil = usuario.estudiante || usuario.encargado
  const contexto = usuario.estudiante
    ? `${usuario.estudiante.carrera} · semestre ${usuario.estudiante.semestre}`
    : usuario.encargado
      ? `${usuario.encargado.contextoTipo} · ${usuario.encargado.contextoNombre}`
      : ''
  const metaSemestralHoras = usuario.estudiante ? usuario.estudiante.metaMinutos / 60 : null

  return (
    <>
      <div className="metrics">
        <Metric label="Rol" value={usuario.rol} hint="El rol se define al crear la cuenta y no se modifica." />
        <Metric label="Estado de la cuenta" value={usuario.activo ? 'Activa' : 'Inactiva'} tone={usuario.activo ? 'success' : 'neutral'} hint={usuario.activo ? 'Puedes iniciar sesión.' : 'Contacta a la administración.'} />
        <Metric label="Contraseña" value={usuario.requiereCambioPassword ? 'Temporal' : 'Definida'} tone={usuario.requiereCambioPassword ? 'warning' : 'success'} hint={usuario.requiereCambioPassword ? 'Debes cambiarla para usar el sistema.' : 'No requiere cambios.'} />
        {perfil && <Metric label={usuario.estudiante ? 'Meta semestral' : 'Contexto'} value={usuario.estudiante ? `${metaSemestralHoras} h` : usuario.encargado.contextoTipo} hint={usuario.estudiante ? `${contexto} · Las horas se acumulan al cerrar trabajos.` : contexto} />}
      </div>
      {usuario.rol === 'BECARIO' && <PanelBecario />}
      {usuario.rol === 'ENCARGADO' && <PanelEncargado />}
      {usuario.rol === 'ADMIN' && <PanelAdministrador />}
      <section className="panel">
        <header className="panel-head">
          <h2>Tu cuenta</h2>
          <span className={`status ${usuario.activo ? 'status--success' : 'status--muted'}`}>{usuario.activo ? 'Activa' : 'Inactiva'}</span>
        </header>
        <div className="panel-body">
          <dl className="detail-list">
            <div><dt>Nombre</dt><dd>{usuario.nombre}</dd></div>
            <div><dt>Correo</dt><dd>{usuario.correo}</dd></div>
            <div><dt>Rol</dt><dd>{usuario.rol}</dd></div>
            {usuario.estudiante && (
              <>
                <div><dt>Código de estudiante</dt><dd>{usuario.estudiante.codigo}</dd></div>
                <div><dt>Meta semestral</dt><dd>{metaSemestralHoras} horas</dd></div>
              </>
            )}
            {usuario.encargado && (
              <>
                <div><dt>Tipo de contexto</dt><dd>{usuario.encargado.contextoTipo}</dd></div>
                <div><dt>Contexto</dt><dd>{usuario.encargado.contextoNombre}</dd></div>
              </>
            )}
            <div><dt>Cuenta creada</dt><dd>{new Date(usuario.creadoEn).toLocaleString('es-CO')}</dd></div>
          </dl>
        </div>
      </section>
    </>
  )
}
