import { useLocation } from 'react-router-dom'
import { EmptyState, EmptyTable } from '../components/ui.jsx'
import { VISTAS_VACIAS } from '../config/vistas.js'

/**
 * Placeholder de las secciones de las fases 3 y 4. No inventa datos: explica
 * qué mostrará la sección cuando exista su API.
 */
export function SeccionPendiente() {
  const { pathname } = useLocation()
  const vista = VISTAS_VACIAS[pathname]
  if (!vista) return <EmptyState title="Sección no disponible">Esta sección todavía no está habilitada.</EmptyState>
  return (
    <section className="panel">
      <header className="panel-head">
        <h2>{vista.title}</h2>
        <span className="status status--muted">Próximamente</span>
      </header>
      <div className="panel-body">
        <EmptyTable headers={vista.headers} title={vista.title} text={vista.text} />
      </div>
    </section>
  )
}