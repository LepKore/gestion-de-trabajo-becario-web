import { useCallback, useState } from 'react'
import { useRecurso } from '../lib/useRecurso.js'
import { Alert, Dialog, EmptyState } from '../components/ui.jsx'
import { fechaVisible, horas } from '../lib/trabajos.js'
import { RUTAS } from '../api/endpoints.js'

function EstadoCarga({ recurso, children }) {
  if (recurso.cargando) return <p className="loading" role="status">Cargando…</p>
  if (recurso.error) return <><Alert tipo="error">{recurso.error}</Alert><button className="button button--secondary" type="button" onClick={recurso.recargar}>Reintentar</button></>
  if (!recurso.respuesta?.meta || !Array.isArray(recurso.respuesta?.data)) {
    return <><Alert tipo="error">No se pudo verificar la paginación de los resultados.</Alert><button className="button button--secondary" type="button" onClick={recurso.recargar}>Reintentar</button></>
  }
  return children(recurso.respuesta)
}

function HistorialEstudiante({ estudiante, onCerrar }) {
  const [pagina, setPagina] = useState(1)
  const recurso = useRecurso(RUTAS.estudiantes.historial(estudiante.id), { page: pagina, pageSize: 10 })
  return (
    <Dialog
      titulo={`Historial de ${estudiante.name}`}
      descripcion={`Código ${estudiante.code} · ${estudiante.career}. Se incluyen postulaciones, asistencias y ausencias.`}
      onCerrar={onCerrar}
    >
      <EstadoCarga recurso={recurso}>{({ data, meta }) => <>
        {data.length === 0 ? <EmptyState title="Sin historial">Este estudiante todavía no tiene postulaciones.</EmptyState> : data.map(item => (
          <article className="history-item" key={item.applicationId}>
            <h3>{item.job.titulo}</h3>
            <p>{item.job.encargadoNombre} · {item.job.ubicacion}</p>
            <dl className="history-facts">
              <div><dt>Inicio</dt><dd>{fechaVisible(item.job.inicioPrevisto)}</dd></div>
              <div><dt>Estado</dt><dd>{item.applicationStatus}</dd></div>
              <div><dt>Asistencia</dt><dd>{item.attended === true ? 'Asistió' : item.attended === false ? 'No asistió' : 'Pendiente'}</dd></div>
              <div><dt>Horas acreditadas</dt><dd>{horas(item.awardedMinutes)}</dd></div>
            </dl>
          </article>
        ))}
        {meta.totalPages > 1 && <nav className="paginacion" aria-label="Paginación del historial">
          <button className="button button--secondary" type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {meta.page} de {meta.totalPages} · {meta.total} registros</span>
          <button className="button button--secondary" type="button" disabled={pagina >= meta.totalPages} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </nav>}
      </>}</EstadoCarga>
      <div className="dialog-actions"><button className="button button--secondary" type="button" onClick={onCerrar}>Cerrar historial</button></div>
    </Dialog>
  )
}

export function AdminSupervision() {
  const [pagina, setPagina] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [consulta, setConsulta] = useState('')
  const [pendientes, setPendientes] = useState('true')
  const [seleccionado, setSeleccionado] = useState(null)
  const cerrarHistorial = useCallback(() => setSeleccionado(null), [])
  const recurso = useRecurso(RUTAS.estudiantes.progreso, {
    q: consulta,
    conHorasPendientes: pendientes,
    page: pagina,
    pageSize: 20,
  })

  function buscar(evento) {
    evento.preventDefault()
    setConsulta(busqueda.trim())
    setPagina(1)
  }

  return <>
    <section className="panel">
      <header className="panel-head"><div><h2>Progreso de estudiantes</h2><p>Consulta metas y horas acreditadas a partir de cierres registrados.</p></div></header>
      <form className="form-grid form-grid--filters" onSubmit={buscar}>
        <label className="form-field"><span>Buscar estudiante</span><input type="search" value={busqueda} onChange={evento => setBusqueda(evento.target.value)} placeholder="Nombre, correo, código o carrera" /></label>
        <label className="form-field"><span>Horas pendientes</span><select value={pendientes} onChange={evento => { setPendientes(evento.target.value); setPagina(1) }}>
          <option value="true">Con horas pendientes</option><option value="false">Meta alcanzada o excedida</option><option value="">Todos</option>
        </select></label>
        <button className="button button--secondary" type="submit">Buscar</button>
      </form>
    </section>
    <section className="panel" aria-labelledby="resultados-estudiantes">
      <header className="panel-head"><h2 id="resultados-estudiantes">Resultados</h2></header>
      <div aria-busy={recurso.cargando}>
        <EstadoCarga recurso={recurso}>{({ data, meta }) => <>
          {data.length === 0 ? <EmptyState title="Sin estudiantes para mostrar">Prueba otros filtros; el progreso solo cuenta horas acreditadas al cierre.</EmptyState> : <div className="table-scroll" role="region" aria-label="Progreso de estudiantes" tabIndex={0}>
            <table>
              <thead><tr><th scope="col">Estudiante</th><th scope="col">Meta</th><th scope="col">Acreditadas</th><th scope="col">Pendientes</th><th scope="col">Excedentes</th><th scope="col">Cumplimiento</th><th scope="col">Historial</th></tr></thead>
              <tbody>{data.map(estudiante => <tr key={estudiante.id}>
                <th scope="row"><span>{estudiante.name}</span><small className="table-subtext">{estudiante.code} · {estudiante.career} · sem. {estudiante.semester}</small></th>
                <td>{horas(estudiante.targetMinutes)}</td><td>{horas(estudiante.accreditedMinutes)}</td>
                <td><span className={`status ${estudiante.remainingMinutes ? 'status--warning' : 'status--success'}`}>{horas(estudiante.remainingMinutes)}</span></td>
                <td>{horas(estudiante.excessMinutes)}</td>
                <td>{estudiante.remainingMinutes > 0 ? 'Pendiente' : estudiante.excessMinutes > 0 ? 'Meta excedida' : 'Meta completada'}</td>
                <td><button className="button button--secondary" type="button" onClick={() => setSeleccionado(estudiante)}>Ver historial</button></td>
              </tr>)}</tbody>
            </table>
          </div>}
          {meta.totalPages > 1 && <nav className="paginacion" aria-label="Paginación de estudiantes">
            <button className="button button--secondary" type="button" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <span>Página {meta.page} de {meta.totalPages} · {meta.total} estudiantes</span>
            <button className="button button--secondary" type="button" disabled={pagina >= meta.totalPages} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
          </nav>}
        </>}</EstadoCarga>
      </div>
    </section>
    {seleccionado && <HistorialEstudiante estudiante={seleccionado} onCerrar={cerrarHistorial} />}
  </>
}
