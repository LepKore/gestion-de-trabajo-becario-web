import { useAuth } from '../auth/useAuth.js'
import { Metric } from '../components/ui.jsx'
import { ProgresoBecario } from './Control.jsx'

/** Resumen por rol. En esta fase solo muestra datos del propio usuario. */
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
      {usuario.rol === 'BECARIO' && <ProgresoBecario />}
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
