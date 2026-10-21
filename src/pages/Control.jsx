import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RUTAS, postulacionesApi, trabajosApi } from '../api/endpoints.js'
import { useRecurso } from '../lib/useRecurso.js'
import { fechaVisible, ZONA_UNIVERSITARIA } from '../lib/trabajos.js'
import { Alert, EmptyState, Metric } from '../components/ui.jsx'

function horas(minutos) {
  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(minutos / 60) + ' h'
}

function EstadoCarga({ recurso, children }) {
  if (recurso.cargando) return <p className="loading" role="status">Cargando…</p>
  if (recurso.error) return <><Alert tipo="error">{recurso.error}</Alert><button className="button button--secondary" type="button" onClick={recurso.recargar}>Reintentar</button></>
  return children(recurso.respuesta)
}

function Paginacion({ meta, cambiar }) {
  if (!meta || meta.totalPages <= 1) return null
  return <nav className="paginacion" aria-label="Paginación de historial">
    <button className="button button--secondary" type="button" disabled={meta.page <= 1} onClick={() => cambiar(meta.page - 1)}>Anterior</button>
    <span>Página {meta.page} de {meta.totalPages} · {meta.total} resultados</span>
    <button className="button button--secondary" type="button" disabled={meta.page >= meta.totalPages} onClick={() => cambiar(meta.page + 1)}>Siguiente</button>
  </nav>
}

export function ProgresoBecario() {
  const recurso = useRecurso(RUTAS.yo.progreso)
  return <section className="panel" aria-labelledby="titulo-progreso">
    <h2 id="titulo-progreso">Mi progreso</h2>
    <EstadoCarga recurso={recurso}>{({ data }) => <>
      <div className="metrics metrics--progress">
        <Metric label="Meta" value={horas(data.targetMinutes)} hint="Meta asignada por administración" />
        <Metric label="Acreditadas" value={horas(data.accreditedMinutes)} hint="Solo trabajos cerrados con asistencia" tone="success" />
        <Metric label="Faltantes" value={horas(data.remainingMinutes)} hint="Hasta alcanzar la meta" />
        <Metric label="Excedentes" value={horas(data.excessMinutes)} hint="Por encima de la meta" />
      </div>
      <div className="progress-track" role="progressbar" aria-label="Progreso de horas acreditadas" aria-valuemin={0} aria-valuemax={data.targetMinutes || 1} aria-valuenow={Math.min(data.accreditedMinutes, data.targetMinutes || 1)}>
        <span style={{ width: `${data.targetMinutes > 0 ? Math.min(100, data.accreditedMinutes / data.targetMinutes * 100) : 0}%` }} />
      </div>
      <p className="progress-caption">El progreso se calcula con las horas acreditadas al cerrar trabajos.</p>
    </>}</EstadoCarga>
  </section>
}

function asistenciaTexto(item) {
  if (item.attended === true) return 'Asistió'
  if (item.attended === false) return 'No asistió'
  if (item.applicationStatus === 'RECHAZADA') return 'No corresponde'
  return 'Pendiente de cierre'
}

export function HistorialBecario() {
  const [pagina, setPagina] = useState(1)
  const recurso = useRecurso(RUTAS.yo.historial, { page: pagina, pageSize: 20 })
  return <>
    <ProgresoBecario />
    <section className="panel">
      <h2>Historial de postulaciones y horas</h2>
      <p>Incluye postulaciones abiertas, trabajos cerrados y ausencias. Fechas en {ZONA_UNIVERSITARIA}.</p>
      <EstadoCarga recurso={recurso}>{({ data, meta }) => <>
        {data.length === 0 ? <EmptyState title="Sin historial">Tus postulaciones aparecerán aquí cuando participes en un trabajo.</EmptyState> : data.map((item) => <article className="history-item" key={item.applicationId}>
          <h3><Link to={`/trabajos/${item.job.id}`}>{item.job.titulo}</Link></h3>
          <p>{item.job.encargadoNombre} · {item.job.ubicacion}</p>
          <p>Inicio: {fechaVisible(item.job.inicioPrevisto)} · Fin previsto: {fechaVisible(item.job.finPrevisto)}</p>
          <dl className="history-facts">
            <div><dt>Postulación</dt><dd>{item.applicationStatus}</dd></div>
            <div><dt>Trabajo</dt><dd>{item.job.estado}</dd></div>
            <div><dt>Asistencia</dt><dd>{asistenciaTexto(item)}</dd></div>
            <div><dt>Horas acreditadas</dt><dd>{horas(item.awardedMinutes)}</dd></div>
          </dl>
        </article>)}
        <Paginacion meta={meta} cambiar={setPagina} />
      </>}</EstadoCarga>
    </section>
  </>
}

function ListaAsistencia({ attendance }) {
  if (attendance.length === 0) return <p>No hubo estudiantes aceptados.</p>
  return <div className="table-scroll"><table>
    <thead><tr><th scope="col">Estudiante</th><th scope="col">Código</th><th scope="col">Carrera</th><th scope="col">Asistencia</th><th scope="col">Acreditadas</th></tr></thead>
    <tbody>{attendance.map((item) => <tr key={item.applicationId}>
      <th scope="row">{item.student.name}</th><td>{item.student.code}</td><td>{item.student.career}</td>
      <td>{item.attended ? 'Asistió' : 'No asistió'}</td><td>{horas(item.awardedMinutes)}</td>
    </tr>)}</tbody>
  </table></div>
}

export function AsistenciaCerrada({ trabajoId }) {
  const recurso = useRecurso(RUTAS.trabajos.asistencia(trabajoId))
  return <section className="panel">
    <h2>Asistencia registrada</h2>
    <EstadoCarga recurso={recurso}>{({ data }) => <ListaAsistencia attendance={data} />}</EstadoCarga>
  </section>
}

async function cargarAceptados(trabajoId) {
  const aceptados = []
  let pagina = 1
  let paginas
  do {
    const respuesta = await postulacionesApi.listarDeTrabajo(trabajoId, { estado: 'ACEPTADA', page: pagina, pageSize: 50 })
    aceptados.push(...respuesta.data)
    paginas = respuesta.meta.totalPages
    pagina += 1
  } while (pagina <= paginas)
  return aceptados
}

export function FormularioCierre({ trabajo, actualizarTrabajo }) {
  const [aceptados, setAceptados] = useState(null)
  const [marcas, setMarcas] = useState({})
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [ocupado, setOcupado] = useState(false)
  const [hecho, setHecho] = useState(false)
  const intento = useRef(null)

  useEffect(() => {
    let vigente = true
    cargarAceptados(trabajo.id).then(
      (datos) => { if (vigente) { setAceptados(datos); setCargando(false) } },
      (fallo) => { if (vigente) { setError(fallo.message); setCargando(false) } },
    )
    return () => { vigente = false }
  }, [trabajo.id])

  function marcar(id, asistio) {
    setMarcas((actual) => ({ ...actual, [id]: asistio }))
    intento.current = null
  }

  async function cerrar(evento) {
    evento.preventDefault()
    if (!aceptados || aceptados.some((item) => typeof marcas[item.id] !== 'boolean')) return
    const attendance = aceptados.map((item) => ({ applicationId: item.id, attended: marcas[item.id] }))
    const contenido = JSON.stringify(attendance.slice().sort((a, b) => a.applicationId.localeCompare(b.applicationId)))
    if (intento.current?.contenido !== contenido) intento.current = { contenido, clave: crypto.randomUUID() }
    setOcupado(true)
    setError('')
    try {
      await trabajosApi.cerrar(trabajo.id, attendance, intento.current.clave)
      setHecho(true)
      actualizarTrabajo()
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
    }
  }

  if (hecho) return <section className="panel"><Alert conRol={false}>Trabajo cerrado. La asistencia y las horas quedaron registradas.</Alert></section>
  const completo = aceptados !== null && aceptados.every((item) => typeof marcas[item.id] === 'boolean')
  return <section className="panel" aria-labelledby="titulo-cierre">
    <h2 id="titulo-cierre">Cerrar trabajo y registrar asistencia</h2>
    <p>Marca asistencia o ausencia de cada estudiante aceptado. Cada asistente recibirá {horas(trabajo.duracionMinutos)}. Esta decisión no se puede modificar desde la aplicación.</p>
    {cargando ? <p className="loading" role="status">Cargando estudiantes aceptados…</p> : <>
      {error && <Alert tipo="error">{error}</Alert>}
      {aceptados === null ? <button className="button button--secondary" type="button" onClick={actualizarTrabajo}>Actualizar trabajo</button> : <form onSubmit={cerrar}>
        {aceptados.length === 0 && <p>No hay estudiantes aceptados. Puedes cerrar el trabajo sin asistencias; las postulaciones pendientes serán rechazadas.</p>}
        <div className="attendance-list">{aceptados.map((item) => <fieldset className="attendance-choice" key={item.id} disabled={ocupado}>
          <legend>{item.estudiante.nombre} · {item.estudiante.codigo} · {item.estudiante.carrera}</legend>
          <label><input type="radio" name={`asistencia-${item.id}`} checked={marcas[item.id] === true} onChange={() => marcar(item.id, true)} /> Asistió</label>
          <label><input type="radio" name={`asistencia-${item.id}`} checked={marcas[item.id] === false} onChange={() => marcar(item.id, false)} /> No asistió</label>
        </fieldset>)}</div>
        <div className="row-actions">
          <button className="button button--primary" type="submit" disabled={ocupado || !completo}>{ocupado ? 'Cerrando…' : 'Confirmar cierre y acreditar horas'}</button>
          <button className="button button--secondary" type="button" disabled={ocupado} onClick={actualizarTrabajo}>Actualizar estado</button>
        </div>
      </form>}
    </>}
  </section>
}

export function CierreYHoras() {
  const [paginaAbiertos, setPaginaAbiertos] = useState(1)
  const [paginaHistorial, setPaginaHistorial] = useState(1)
  const abiertos = useRecurso(RUTAS.trabajos.propios, { estado: 'PUBLICADO', page: paginaAbiertos, pageSize: 20 })
  const historial = useRecurso(RUTAS.yo.historial, { page: paginaHistorial, pageSize: 20 })
  return <>
    <section className="panel">
      <h2>Trabajos pendientes de cierre</h2>
      <p>El cierre está disponible desde el fin previsto. Fechas en {ZONA_UNIVERSITARIA}.</p>
      <EstadoCarga recurso={abiertos}>{({ data, meta }) => <>
        {data.length === 0 ? <EmptyState title="Sin cierres pendientes">No tienes trabajos publicados pendientes de cierre.</EmptyState> : data.map((trabajo) => <article className="history-item" key={trabajo.id}>
          <h3><Link to={`/trabajos/${trabajo.id}`}>{trabajo.titulo}</Link></h3>
          <p>Fin previsto: {fechaVisible(trabajo.finPrevisto)} · {trabajo.aceptados} aceptados</p>
          {new Date(trabajo.finPrevisto).getTime() <= Date.now()
            ? <Link className="button button--primary" to={`/trabajos/${trabajo.id}`}>Registrar asistencia y cerrar</Link>
            : <span className="status status--info">Aún no termina</span>}
        </article>)}
        <Paginacion meta={meta} cambiar={setPaginaAbiertos} />
      </>}</EstadoCarga>
    </section>
    <section className="panel">
      <h2>Trabajos cerrados</h2>
      <EstadoCarga recurso={historial}>{({ data, meta }) => <>
        {data.length === 0 ? <EmptyState title="Sin trabajos cerrados">Los cierres confirmados aparecerán aquí con sus asistentes.</EmptyState> : data.map((item) => <article className="history-item" key={item.job.id}>
          <h3><Link to={`/trabajos/${item.job.id}`}>{item.job.titulo}</Link></h3>
          <p>Cerrado: {fechaVisible(item.closedAt)} · Duración: {horas(item.job.duracionMinutos)}</p>
          <ListaAsistencia attendance={item.attendance} />
        </article>)}
        <Paginacion meta={meta} cambiar={setPaginaHistorial} />
      </>}</EstadoCarga>
    </section>
  </>
}


