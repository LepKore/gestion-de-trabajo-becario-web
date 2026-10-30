import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/useAuth.js'
import { RUTAS, postulacionesApi, trabajosApi } from '../api/endpoints.js'
import { useRecurso } from '../lib/useRecurso.js'
import { fechaFormulario, fechaUTC, fechaVisible, horasAMinutos, ZONA_UNIVERSITARIA } from '../lib/trabajos.js'
import { Alert, EmptyState, Field } from '../components/ui.jsx'
import { AsistenciaCerrada, FormularioCierre } from './Control.jsx'

function Paginacion({ meta, cambiar }) {
  if (!meta || meta.totalPages <= 1) return null
  return <nav className="paginacion" aria-label="Paginación de resultados">
    <button className="button button--secondary" disabled={meta.page <= 1} onClick={() => cambiar(meta.page - 1)}>Anterior</button>
    <span>Página {meta.page} de {meta.totalPages} · {meta.total} resultados</span>
    <button className="button button--secondary" disabled={meta.page >= meta.totalPages} onClick={() => cambiar(meta.page + 1)}>Siguiente</button>
  </nav>
}
function EstadoCarga({ recurso, children }) {
  if (recurso.cargando) return <p role="status" className="loading">Cargando…</p>
  if (recurso.error) return <><Alert tipo="error">{recurso.error}</Alert><button className="button button--secondary" onClick={recurso.recargar}>Reintentar</button></>
  return children(recurso.respuesta)
}
function DatosTrabajo({ trabajo }) {
  return <>
    <p>{trabajo.estado} · {trabajo.faseTemporal.replaceAll('_', ' ')}</p>
    <p>{trabajo.ubicacion} · {trabajo.duracionMinutos / 60} horas acreditables</p>
    <p>Inicio: {fechaVisible(trabajo.inicioPrevisto)} · Fin: {fechaVisible(trabajo.finPrevisto)}</p>
    <p>{trabajo.cuposDisponibles} de {trabajo.cupos} cupos disponibles · {trabajo.aceptados} aceptados</p>
    <p>{trabajo.encargadoNombre} · {trabajo.contextoTipo} · {trabajo.contextoNombre}</p>
  </>
}
export function Trabajos({ modo = 'disponibles' }) {
  const [pagina, setPagina] = useState(1)
  const [q, setQ] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState(modo === 'disponibles' ? 'PUBLICADO' : '')
  const propios = modo === 'propios'
  const recurso = useRecurso(propios ? RUTAS.trabajos.propios : RUTAS.trabajos.lista, { page: pagina, pageSize: 20, q, estado })
  return <section className="panel">
    <header className="panel-head"><h2>{propios ? 'Trabajos a tu cargo' : 'Consulta de trabajos'}</h2>
      {propios && <Link className="button button--primary" to="/mis-trabajos/nuevo">Publicar trabajo</Link>}
    </header>
    <p>Fechas en {ZONA_UNIVERSITARIA}. Una postulación pendiente no reserva cupo.</p>
    <form className="form-grid" onSubmit={(evento) => { evento.preventDefault(); setQ(busqueda.trim()); setPagina(1) }}>
      <Field label="Buscar trabajos" type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
      <Field label="Estado">{(props) => <select {...props} value={estado} onChange={(evento) => { setEstado(evento.target.value); setPagina(1) }}><option value="">Todos</option><option value="PUBLICADO">Publicado</option><option value="CERRADO">Cerrado</option></select>}</Field>
      <button className="button button--secondary" type="submit">Buscar</button>
    </form>
    <EstadoCarga recurso={recurso}>{({ data, meta }) => <>
      {data.length === 0 ? <EmptyState title="Sin trabajos">No hay trabajos que coincidan con los filtros.</EmptyState> : data.map((trabajo) => <article className="panel" key={trabajo.id}>
        <h3><Link to={`/trabajos/${trabajo.id}`}>{trabajo.titulo}</Link></h3><DatosTrabajo trabajo={trabajo} />
        <Link className="button button--secondary" to={`/trabajos/${trabajo.id}`}>{propios ? 'Ver trabajo' : 'Ver detalle'}</Link>
      </article>)}
      <Paginacion meta={meta} cambiar={setPagina} />
    </>}</EstadoCarga>
  </section>
}
export function DetalleTrabajo() {
  const { id } = useParams()
  const recurso = useRecurso(RUTAS.trabajos.detalle(id))
  return <EstadoCarga recurso={recurso}>{({ data }) => <DetalleContenido key={id} trabajo={data} recargar={recurso.recargar} />}</EstadoCarga>
}
function DetalleContenido({ trabajo, recargar }) {
  const { usuario } = useAuth()
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [postulado, setPostulado] = useState(false)
  const propio = usuario.rol === 'ENCARGADO' && usuario.id === trabajo.encargadoId
  const proximo = trabajo.estado === 'PUBLICADO' && trabajo.faseTemporal === 'PROXIMO'
  async function postular() {
    setOcupado(true); setError('')
    try { await postulacionesApi.postular(trabajo.id); setPostulado(true) }
    catch (fallo) { setError(fallo.message) }
    finally { setOcupado(false) }
  }
  return <>
    <section className="panel job-detail"><header className="panel-head"><h2>{trabajo.titulo}</h2><Link to={usuario.rol === 'ADMIN' ? '/admin/trabajos' : propio ? '/mis-trabajos' : '/trabajos-disponibles'}>Volver a trabajos</Link></header>
      <p className="job-description">{trabajo.descripcion}</p>
      <dl className="job-facts">
        <div><dt>Estado</dt><dd>{trabajo.estado} · {trabajo.faseTemporal.replaceAll('_', ' ')}</dd></div>
        <div><dt>Ubicación</dt><dd>{trabajo.ubicacion}</dd></div>
        <div><dt>Horas acreditables</dt><dd>{trabajo.duracionMinutos / 60} h</dd></div>
        <div><dt>Fecha y horario</dt><dd>Inicio: {fechaVisible(trabajo.inicioPrevisto)} · Fin: {fechaVisible(trabajo.finPrevisto)} ({ZONA_UNIVERSITARIA})</dd></div>
        <div><dt>Cupos</dt><dd>{trabajo.cuposDisponibles} de {trabajo.cupos} disponibles · {trabajo.aceptados} aceptados</dd></div>
        <div><dt>Encargado</dt><dd>{trabajo.encargadoNombre} · {trabajo.contextoTipo} · {trabajo.contextoNombre}</dd></div>
      </dl>
      <p className="job-rule">Una postulación pendiente no reserva cupo. Las decisiones son definitivas.</p>
      {error && <Alert tipo="error">{error}</Alert>}
      {postulado && <Alert conRol={false}>Postulación enviada. Consulta su estado en Mis postulaciones.</Alert>}
      {usuario.rol === 'BECARIO' && <><button className="button button--primary" disabled={ocupado || postulado || !proximo || trabajo.cuposDisponibles <= 0} onClick={postular}>{ocupado ? 'Enviando…' : 'Postularme'}</button> <Link to="/mis-postulaciones">Mis postulaciones</Link></>}
      {propio && <div className="row-actions">{proximo && trabajo.aceptados === 0 ? <Link className="button button--secondary" to={`/mis-trabajos/${trabajo.id}/editar`}>Editar trabajo</Link> : <p>Las condiciones solo se pueden editar antes del inicio y antes de la primera aceptación.</p>}<Link className="button button--secondary" to={`/postulaciones?trabajo=${trabajo.id}`}>Gestionar postulantes</Link></div>}
    </section>
    {propio && trabajo.estado === 'PUBLICADO' && trabajo.faseTemporal === 'FINALIZADO' && <FormularioCierre trabajo={trabajo} actualizarTrabajo={recargar} />}
    {propio && trabajo.estado === 'CERRADO' && <AsistenciaCerrada trabajoId={trabajo.id} trabajoEstado={trabajo.estado} />}
  </>
}
function FiltroPostulacion({ estado, cambiar }) {
  return <Field label="Estado de postulación">{(props) => <select {...props} value={estado} onChange={(evento) => cambiar(evento.target.value)}><option value="">Todos</option>{['PENDIENTE', 'ACEPTADA', 'RECHAZADA'].map((valor) => <option key={valor}>{valor}</option>)}</select>}</Field>
}
export function MisPostulaciones() {
  const [pagina, setPagina] = useState(1)
  const [estado, setEstado] = useState('')
  const recurso = useRecurso(RUTAS.postulaciones.mias, { page: pagina, pageSize: 20, estado })
  return <section className="panel"><h2>Mis postulaciones</h2><p className="section-intro">Una postulación pendiente no reserva cupo. Una vez enviada, no se puede retirar.</p>
    <FiltroPostulacion estado={estado} cambiar={(valor) => { setEstado(valor); setPagina(1) }} />
    <EstadoCarga recurso={recurso}>{({ data, meta }) => <>
      {data.length === 0 ? <EmptyState title="Sin postulaciones">Puedes consultar los trabajos disponibles para postularte.</EmptyState> : data.map((item) => <article className="panel" key={item.id}><h3><Link to={`/trabajos/${item.trabajoId}`}>{item.trabajo.titulo}</Link></h3><span className="status status--info">{item.estado}</span><DatosTrabajo trabajo={item.trabajo} /></article>)}
      <Paginacion meta={meta} cambiar={setPagina} />
    </>}</EstadoCarga>
  </section>
}
export function EditarTrabajo() {
  const { id } = useParams()
  const { usuario } = useAuth()
  const recurso = useRecurso(RUTAS.trabajos.detalle(id))
  return <EstadoCarga recurso={recurso}>{({ data }) => usuario.id !== data.encargadoId || data.estado !== 'PUBLICADO' || data.faseTemporal !== 'PROXIMO' || data.aceptados > 0 ? <Alert tipo="warning">Este trabajo no se puede editar. Debe ser propio, no haber iniciado y no tener aceptados.</Alert> : <FormularioTrabajo key={id} trabajo={data} />}</EstadoCarga>
}
export function FormularioTrabajo({ trabajo }) {
  const navegar = useNavigate()
  const [error, setError] = useState('')
  const [ocupado, setOcupado] = useState(false)
  async function guardar(evento) {
    evento.preventDefault(); setError('')
    const valores = Object.fromEntries(new FormData(evento.currentTarget))
    let cuerpo
    try {
      cuerpo = { titulo: valores.titulo.trim(), descripcion: valores.descripcion.trim(), ubicacion: valores.ubicacion.trim(), inicioPrevisto: fechaUTC(valores.inicioPrevisto, ZONA_UNIVERSITARIA, trabajo?.inicioPrevisto), finPrevisto: fechaUTC(valores.finPrevisto, ZONA_UNIVERSITARIA, trabajo?.finPrevisto), duracionMinutos: horasAMinutos(valores.horas), cupos: Number(valores.cupos) }
      if (new Date(cuerpo.inicioPrevisto).getTime() <= Date.now()) throw new Error('El inicio debe estar en el futuro.')
      if (cuerpo.finPrevisto <= cuerpo.inicioPrevisto) throw new Error('El fin debe ser posterior al inicio.')
      if (!Number.isSafeInteger(cuerpo.cupos) || cuerpo.cupos < 1) throw new Error('Los cupos deben ser un entero positivo.')
    } catch (fallo) { setError(fallo.message); return }
    setOcupado(true)
    try {
      const respuesta = trabajo ? await trabajosApi.actualizar(trabajo.id, cuerpo) : await trabajosApi.crear(cuerpo)
      navegar(`/trabajos/${respuesta.data.id}`)
    } catch (fallo) { setError(fallo.message); setOcupado(false) }
  }
  return <section className="panel"><h2>{trabajo ? 'Editar trabajo' : 'Publicar trabajo'}</h2><p className="section-intro">Introduce las fechas en la hora de {ZONA_UNIVERSITARIA}; la conversión a UTC se realiza automáticamente. La duración acreditable es independiente del intervalo de fechas.</p>
    {error && <Alert tipo="error">{error}</Alert>}
    <form onSubmit={guardar}><fieldset disabled={ocupado} style={{ border: 0, padding: 0, minWidth: 0 }}><legend>Condiciones del trabajo</legend><div className="form-grid">
      <Field label="Título" name="titulo" required maxLength={200} defaultValue={trabajo?.titulo || ''} />
      <Field label="Ubicación" name="ubicacion" required maxLength={300} defaultValue={trabajo?.ubicacion || ''} />
      <Field label="Descripción">{(props) => <textarea {...props} name="descripcion" required maxLength={5000} rows={4} defaultValue={trabajo?.descripcion || ''} />}</Field>
      <Field label="Duración acreditable (horas)" name="horas" inputMode="decimal" required hint="Máximo un decimal: 4,6 horas equivale a 276 minutos." defaultValue={trabajo ? String(trabajo.duracionMinutos / 60) : ''} />
      <Field label={'Inicio previsto (' + ZONA_UNIVERSITARIA + ')'} name="inicioPrevisto" type="datetime-local" required defaultValue={trabajo ? fechaFormulario(trabajo.inicioPrevisto) : ''} />
      <Field label={'Fin previsto (' + ZONA_UNIVERSITARIA + ')'} name="finPrevisto" type="datetime-local" required defaultValue={trabajo ? fechaFormulario(trabajo.finPrevisto) : ''} />
      <Field label="Cupos" name="cupos" type="number" min="1" step="1" required defaultValue={trabajo?.cupos || ''} />
    </div><div className="row-actions"><button className="button button--primary" type="submit">{ocupado ? 'Guardando…' : trabajo ? 'Guardar cambios' : 'Publicar trabajo'}</button><Link to={trabajo ? `/trabajos/${trabajo.id}` : '/mis-trabajos'}>Cancelar</Link></div></fieldset></form>
  </section>
}
