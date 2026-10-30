import { useEffect, useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { postulacionesApi } from '../api/endpoints.js'
import { CRITERIOS_EVALUACION, fechaVisible, horas, validarEvaluacion, ZONA_UNIVERSITARIA } from '../lib/trabajos.js'
import { Alert, EmptyState, Field, Metric } from '../components/ui.jsx'

const ESTADOS = ['PENDIENTE', 'ACEPTADA', 'RECHAZADA']
const ETIQUETAS = { PENDIENTE: 'Pendientes', ACEPTADA: 'Aceptadas', RECHAZADA: 'Rechazadas' }
const CLASES_ESTADO = { PENDIENTE: 'status--warning', ACEPTADA: 'status--success', RECHAZADA: 'status--muted' }
const ORDEN = { PENDIENTE: 0, ACEPTADA: 1, RECHAZADA: 2 }

// El listado se arma con varias peticiones (una por trabajo), así que no usa
// `useRecurso`; conserva su misma protección contra respuestas antiguas.
function usePostulaciones() {
  const [revision, setRevision] = useState(0)
  const [estado, setEstado] = useState(null)
  useEffect(() => {
    let vigente = true
    postulacionesApi.deMisTrabajos().then(
      (data) => { if (vigente) setEstado({ revision, data }) },
      (fallo) => { if (vigente) setEstado({ revision, error: fallo.message }) },
    )
    return () => { vigente = false }
  }, [revision])
  const actual = estado?.revision === revision ? estado : {}
  return { ...actual, cargando: !actual.data && !actual.error, recargar: () => setRevision((valor) => valor + 1) }
}

const decidible = (item) => item.estado === 'PENDIENTE' && item.trabajo.estado === 'PUBLICADO'
const puedeAceptar = (item) => item.trabajo.faseTemporal === 'PROXIMO' && item.trabajo.cuposDisponibles > 0

function Acciones({ item, ocupado, pedir }) {
  if (!decidible(item)) return <span className="texto-sutil">Sin acciones</span>
  const bloqueado = !puedeAceptar(item)
  return <div className="row-actions">
    <button className="button button--primary" type="button" disabled={ocupado || bloqueado}
      title={bloqueado ? 'El trabajo ya inició o no quedan cupos disponibles.' : undefined}
      aria-label={`Aceptar a ${item.estudiante.nombre}`}
      onClick={() => pedir({ id: item.id, nombre: item.estudiante.nombre, accion: 'accept' })}>Aceptar</button>
    <button className="button button--secondary" type="button" disabled={ocupado}
      aria-label={`Rechazar a ${item.estudiante.nombre}`}
      onClick={() => pedir({ id: item.id, nombre: item.estudiante.nombre, accion: 'reject' })}>Rechazar</button>
  </div>
}

function EstadoPostulacion({ estado }) {
  return <span className={`status ${CLASES_ESTADO[estado]}`}>{estado}</span>
}

function ProgresoBeca({ estudiante }) {
  // Una respuesta sin progreso no debe convertirse en cifras inventadas.
  if (estudiante.targetMinutes == null) return <span className="texto-sutil">Sin datos</span>
  const { nombre, semester, targetMinutes, accreditedMinutes, remainingMinutes } = estudiante
  return <div className="celda-beca">
    <small>Semestre {semester}</small>
    <span className="celda-beca__cifras">{`${horas(accreditedMinutes)} de ${horas(targetMinutes)}`}</span>
    <div className="progress-track" role="progressbar" aria-label={`Progreso de beca de ${nombre}`}
      aria-valuemin={0} aria-valuemax={targetMinutes} aria-valuenow={Math.min(accreditedMinutes, targetMinutes)}>
      <span style={{ width: `${Math.min(100, accreditedMinutes / targetMinutes * 100)}%` }} />
    </div>
    <span className={`status ${remainingMinutes ? 'status--warning' : 'status--success'}`}>
      {remainingMinutes ? `Faltan ${horas(remainingMinutes)}` : 'Meta alcanzada'}
    </span>
  </div>
}

function promedioVisible(valor) {
  return new Intl.NumberFormat('es-BO', { maximumFractionDigits: 2 }).format(Number(valor))
}

export function FormularioEvaluacion({ applicationId, nombre, onGuardado, onDuplicado, onCancelar }) {
  const [valores, setValores] = useState(() => Object.fromEntries(CRITERIOS_EVALUACION.map(([campo]) => [campo, ''])))
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState('')
  const [ocupado, setOcupado] = useState(false)

  async function guardar(evento) {
    evento.preventDefault()
    const invalidos = Object.fromEntries(CRITERIOS_EVALUACION
      .filter(([campo]) => !validarEvaluacion(valores[campo]))
      .map(([campo]) => [campo, 'Elige un valor entero entre 1 y 5.']))
    setErrores(invalidos)
    if (Object.keys(invalidos).length > 0) return

    const cuerpo = Object.fromEntries(CRITERIOS_EVALUACION.map(([campo]) => [campo, Number(valores[campo])]))
    setOcupado(true)
    setErrorApi('')
    try {
      const respuesta = await postulacionesApi.crearEvaluacion(applicationId, cuerpo)
      if (!respuesta?.data) throw new Error('La API no devolvió la evaluación guardada.')
      onGuardado(respuesta.data)
    } catch (fallo) {
      // Se conservan los valores para que el encargado pueda reintentar o corregirlos.
      setErrorApi(fallo.message)
      if (fallo.estado === 409) onDuplicado?.()
    } finally {
      setOcupado(false)
    }
  }

  function cambiar(campo, valor) {
    setValores((actuales) => ({ ...actuales, [campo]: valor }))
    setErrores((actuales) => ({ ...actuales, [campo]: '' }))
    setErrorApi('')
  }

  return <form className="evaluation-form" aria-label={`Evaluación de ${nombre}`} onSubmit={guardar} noValidate aria-busy={ocupado}>
    <fieldset className="evaluation-fields" disabled={ocupado}>
      <legend>Evalúa el trabajo de {nombre}</legend>
      {CRITERIOS_EVALUACION.map(([campo, etiqueta]) => <Field key={campo} label={etiqueta} error={errores[campo]} hint="Selecciona un entero del 1 al 5.">
        {(props) => <select {...props} name={campo} required value={valores[campo]} onChange={(evento) => cambiar(campo, evento.target.value)}>
          <option value="">Selecciona una calificación</option>
          {[1, 2, 3, 4, 5].map((valor) => <option key={valor} value={valor}>{valor}</option>)}
        </select>}
      </Field>)}
    </fieldset>
    {errorApi && <Alert tipo="error">{errorApi}</Alert>}
    <div className="row-actions">
      <button className="button button--primary" type="submit" disabled={ocupado}>{ocupado ? 'Guardando…' : errorApi ? 'Reintentar evaluación' : 'Guardar evaluación'}</button>
      <button className="button button--secondary" type="button" disabled={ocupado} onClick={onCancelar}>Cancelar</button>
    </div>
  </form>
}

export function AccionEvaluacion({ item, trabajoEstado, onActualizar }) {
  const id = useId()
  const [abierta, setAbierta] = useState(false)
  const [evaluacionLocal, setEvaluacionLocal] = useState(null)
  const evaluacion = item.evaluation ?? evaluacionLocal
  const tieneEstadoEvaluacion = Object.prototype.hasOwnProperty.call(item, 'evaluation')
  const elegible = trabajoEstado === 'CERRADO' && item.attended === true

  if (!elegible) return <span className="texto-sutil">No corresponde</span>
  if (!tieneEstadoEvaluacion) return <span className="texto-sutil" role="status">No se pudo consultar el estado de la evaluación.</span>
  if (evaluacion) return <div className="evaluation-saved" role="status">
    <span className="status status--success">Evaluado</span>
    <span><strong>Promedio de evaluación:</strong> {promedioVisible(evaluacion.promedio)} / 5</span>
  </div>
  return <div>
    <button className="button button--secondary" type="button" aria-expanded={abierta} aria-controls={`${id}-formulario`} aria-label={`${abierta ? 'Ocultar evaluación de' : 'Evaluar a'} ${item.student.name}`} onClick={() => setAbierta((actual) => !actual)}>
      {abierta ? 'Ocultar evaluación' : 'Evaluar'}
    </button>
    <div id={`${id}-formulario`}>
      {abierta && <FormularioEvaluacion applicationId={item.applicationId} nombre={item.student.name}
        onGuardado={(guardada) => { setEvaluacionLocal(guardada); setAbierta(false) }}
        onDuplicado={onActualizar}
        onCancelar={() => setAbierta(false)} />}
    </div>
  </div>
}

export function ListaAsistenciaCerrada({ attendance, trabajoEstado, onActualizar }) {
  if (!attendance.length) return <EmptyState title="Sin asistentes">No hubo estudiantes aceptados para este trabajo.</EmptyState>
  return <div className="attendance-records">
    {attendance.map((item) => <article className="attendance-record" key={item.applicationId}>
      <h3>{item.student.name}</h3>
      <dl className="attendance-facts">
        <div><dt>Código</dt><dd>{item.student.code}</dd></div>
        <div><dt>Carrera</dt><dd>{item.student.career}</dd></div>
        <div><dt>Asistencia</dt><dd><span className={`status ${item.attended ? 'status--success' : 'status--muted'}`}>{item.attended ? 'Asistió' : 'No asistió'}</span></dd></div>
        <div><dt>Horas acreditadas</dt><dd>{horas(item.awardedMinutes)}</dd></div>
      </dl>
      <div className="attendance-evaluation"><span className="attendance-evaluation__label">Evaluación</span><AccionEvaluacion item={item} trabajoEstado={trabajoEstado} onActualizar={onActualizar} /></div>
    </article>)}
  </div>
}

export function Postulaciones() {
  const [parametros, setParametros] = useSearchParams()
  const recurso = usePostulaciones()
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [decision, setDecision] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState('')

  const trabajoId = parametros.get('trabajo') || ''
  const postulaciones = recurso.data || []
  const trabajos = [...new Map(postulaciones.map((item) => [item.trabajo.id, item.trabajo])).values()]
  const cuenta = (valor) => postulaciones.filter((item) => item.estado === valor).length
  const texto = busqueda.trim().toLowerCase()
  const visibles = postulaciones
    .filter((item) => !trabajoId || item.trabajo.id === trabajoId)
    .filter((item) => !filtroEstado || item.estado === filtroEstado)
    .filter((item) => !texto || `${item.estudiante.nombre} ${item.estudiante.codigo}`.toLowerCase().includes(texto))
    .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || b.creadoEn.localeCompare(a.creadoEn))

  function filtrarPorEstado(valor) {
    setFiltroEstado(valor)
    setDecision(null)
  }

  function filtrarPorTrabajo(valor) {
    setDecision(null)
    setParametros(valor ? { trabajo: valor } : {})
  }

  async function decidir() {
    setOcupado(true)
    setError('')
    try {
      await postulacionesApi.decidir(decision.id, decision.accion)
      setDecision(null)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
      recurso.recargar()
    }
  }

  return <section className="panel" aria-labelledby="titulo-postulaciones">
    <header className="panel-head">
      <div>
        <h2 id="titulo-postulaciones">Postulaciones de tus trabajos</h2>
        <p>Una postulación pendiente no reserva cupo. Aceptar o rechazar es definitivo. Fechas en {ZONA_UNIVERSITARIA}.</p>
      </div>
      <Link className="button button--secondary" to="/mis-trabajos">Gestionar trabajos</Link>
    </header>

    <div className="metrics metrics--summary">
      <Metric label="Total postulaciones" value={String(postulaciones.length)} hint="En todos tus trabajos" />
      <Metric label="Pendientes" value={String(cuenta('PENDIENTE'))} hint="Esperan tu decisión" tone="warning" />
      <Metric label="Aceptadas" value={String(cuenta('ACEPTADA'))} hint="Cupos formalizados" tone="success" />
      <Metric label="Rechazadas" value={String(cuenta('RECHAZADA'))} hint="Desestimadas" tone="neutral" />
    </div>

    <div className="form-grid">
      <Field label="Buscar estudiante" type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} hint="Nombre o código." />
      <Field label="Trabajo">{(props) => <select {...props} value={trabajoId} onChange={(evento) => filtrarPorTrabajo(evento.target.value)}>
        <option value="">Todos mis trabajos</option>
        {trabajos.map((trabajo) => <option key={trabajo.id} value={trabajo.id}>{trabajo.titulo}</option>)}
      </select>}</Field>
    </div>

    <nav className="filtros-chips" aria-label="Filtrar por estado de postulación">
      <button className="chip" type="button" aria-pressed={filtroEstado === ''} onClick={() => filtrarPorEstado('')}>Todas ({postulaciones.length})</button>
      {ESTADOS.map((valor) => <button className="chip" type="button" key={valor} aria-pressed={filtroEstado === valor} onClick={() => filtrarPorEstado(valor)}>{ETIQUETAS[valor]} ({cuenta(valor)})</button>)}
    </nav>

    {error && <Alert tipo="error">{error}</Alert>}
    {decision && <div className="alert alert--warning" role="alert">
      <p>Vas a {decision.accion === 'accept' ? 'aceptar' : 'rechazar'} a {decision.nombre}. Esta decisión no se puede revertir.</p>
      <div className="row-actions">
        <button className="button button--primary" type="button" disabled={ocupado} onClick={decidir}>{decision.accion === 'accept' ? 'Confirmar aceptación' : 'Confirmar rechazo'}</button>
        <button className="button button--secondary" type="button" disabled={ocupado} onClick={() => setDecision(null)}>Cancelar</button>
      </div>
    </div>}

    {recurso.cargando && <p className="loading" role="status">Cargando postulaciones…</p>}
    {recurso.error && <><Alert tipo="error">{recurso.error}</Alert><button className="button button--secondary" type="button" onClick={recurso.recargar}>Reintentar</button></>}
    {recurso.data && (visibles.length === 0
      ? <EmptyState title="Sin postulaciones">No hay estudiantes que coincidan con los filtros.</EmptyState>
      : <>
        <div className="table-scroll postulaciones-table">
          <table>
            <thead><tr><th scope="col">Estudiante</th><th scope="col">Carrera</th><th scope="col">Beca</th><th scope="col">Trabajo</th><th scope="col">Postulación</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
            <tbody>{visibles.map((item) => <tr key={item.id}>
              <th scope="row"><span className="celda-estudiante"><strong>{item.estudiante.nombre}</strong><small>Código {item.estudiante.codigo}</small></span></th>
              <td>{item.estudiante.carrera}</td>
              <td><ProgresoBeca estudiante={item.estudiante} /></td>
              <td><Link to={`/trabajos/${item.trabajo.id}`}>{item.trabajo.titulo}</Link></td>
              <td>{fechaVisible(item.creadoEn)}</td>
              <td><EstadoPostulacion estado={item.estado} /></td>
              <td><Acciones item={item} ocupado={ocupado} pedir={setDecision} /></td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="postulantes-cards">{visibles.map((item) => <article className="postulante-card" key={item.id}>
          <h3>{item.estudiante.nombre}</h3>
          <dl className="postulante-facts">
            <div><dt>Código</dt><dd>{item.estudiante.codigo}</dd></div>
            <div><dt>Carrera</dt><dd>{item.estudiante.carrera}</dd></div>
            <div><dt>Beca</dt><dd><ProgresoBeca estudiante={item.estudiante} /></dd></div>
            <div><dt>Trabajo</dt><dd><Link to={`/trabajos/${item.trabajo.id}`}>{item.trabajo.titulo}</Link></dd></div>
            <div><dt>Postulación</dt><dd>{fechaVisible(item.creadoEn)}</dd></div>
            <div><dt>Estado</dt><dd><EstadoPostulacion estado={item.estado} /></dd></div>
          </dl>
          <Acciones item={item} ocupado={ocupado} pedir={setDecision} />
        </article>)}</div>
        <p className="texto-sutil">{visibles.length} de {postulaciones.length} postulaciones.</p>
      </>)}
  </section>
}
