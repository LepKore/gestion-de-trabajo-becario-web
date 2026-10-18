import { useState } from 'react'
import './App.css'

const roles = {
  BECARIO: { name: 'Estudiante becario', description: 'Consulta trabajos, postulaciones y el avance de tus horas.', menu: ['Resumen', 'Trabajos disponibles', 'Mis postulaciones', 'Historial'] },
  ENCARGADO: { name: 'Encargado', description: 'Publica trabajos, revisa postulaciones y registra asistencia al cierre.', menu: ['Resumen', 'Mis trabajos', 'Postulaciones', 'Cierre y horas'] },
  ADMIN: { name: 'Administrador', description: 'Crea cuentas, define metas y consulta el cumplimiento general.', menu: ['Resumen', 'Usuarios', 'Trabajos', 'Supervisión'] },
}

const emptyViews = {
  'Trabajos disponibles': { headers: ['Trabajo', 'Encargado', 'Inicio', 'Duración', 'Cupos', 'Estado'], title: 'Sin trabajos para mostrar', text: 'La lista se cargará desde el backend; aquí podrás ver detalles y postularte.' },
  'Mis postulaciones': { headers: ['Trabajo', 'Fecha', 'Estado', 'Cupos'], title: 'Sin postulaciones para mostrar', text: 'Una solicitud pendiente no reserva un cupo. El encargado decide su aceptación.' },
  Historial: { headers: ['Trabajo', 'Asistencia', 'Horas acreditadas', 'Responsable', 'Fecha'], title: 'Sin historial para mostrar', text: 'Se conservarán también los trabajos en los que no hayas asistido.' },
  'Mis trabajos': { headers: ['Trabajo', 'Inicio', 'Cupos', 'Estado', 'Acciones'], title: 'Sin trabajos publicados', text: 'Solo podrás editar tus trabajos antes del inicio y antes de aceptar postulantes.' },
  Postulaciones: { headers: ['Estudiante', 'Trabajo', 'Solicitud', 'Estado', 'Decisión'], title: 'Sin postulaciones por revisar', text: 'Solo las aceptaciones ocuparán cupo; el servidor verificará el límite.' },
  'Cierre y horas': { headers: ['Trabajo', 'Fin previsto', 'Aceptados', 'Estado', 'Cierre'], title: 'Sin cierres disponibles', text: 'Tras el fin previsto marcarás asistencia de todos los aceptados antes de acreditar una sola vez.' },
  Usuarios: { headers: ['Nombre', 'Correo', 'Rol', 'Estado', 'Acciones'], title: 'Sin usuarios para mostrar', text: 'El administrador podrá crear, editar y desactivar cuentas sin borrar su historial.' },
  Trabajos: { headers: ['Trabajo', 'Encargado', 'Inicio', 'Cupos', 'Estado'], title: 'Sin trabajos para mostrar', text: 'Podrás supervisar publicaciones, sin modificar trabajos ajenos.' },
  Supervisión: { headers: ['Estudiante', 'Meta', 'Acreditadas', 'Pendientes', 'Excedentes'], title: 'Sin progreso para mostrar', text: 'El progreso se calculará con la meta individual y el historial real.' },
}

function Logo() {
  return <span className="brand"><img src="/upb-logo.png" width="580" height="290" alt="Logo de la UPB" /><span>MiBeca</span></span>
}

function EmptyState({ title, children }) {
  return <div className="empty"><span className="empty__symbol" aria-hidden="true">○</span><h3>{title}</h3><p>{children}</p></div>
}

function EmptyTable({ view }) {
  return <div className="table-scroll"><table><thead><tr>{view.headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr></thead><tbody><tr><td colSpan={view.headers.length}><EmptyState title={view.title}>{view.text}</EmptyState></td></tr></tbody></table></div>
}

function Metric({ label, hint, tone = 'brand' }) {
  return <article className={'metric metric--' + tone}><span>{label}</span><strong aria-label={label + ': sin datos'}>—</strong><small>{hint}</small></article>
}

function Field({ name, label, hint, children, ...inputProps }) {
  const hintId = hint ? `${name}-hint` : undefined
  return <div className="form-field"><label htmlFor={name}>{label}</label>{children || <input id={name} name={name} aria-describedby={hintId} {...inputProps} />}{hint && <small id={hintId}>{hint}</small>}</div>
}

function PreviewNote() {
  return <p className="form-note" role="note">Vista de formulario. Los datos no se guardan. El envío se habilitará cuando exista la API del MVP.</p>
}

function Login({ onBack }) {
  const [submitted, setSubmitted] = useState(false)
  return <div className="login-page"><div className="login-brand"><Logo /></div><main className="login-card">
    <span className="eyebrow">Acceso a la plataforma</span><h1>Bienvenido a MiBeca</h1><p>El administrador crea las cuentas. No existe registro público.</p>
    <form onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}>
      <Field name="email" label="Correo electrónico" type="email" autoComplete="username" placeholder="nombre@universidad.edu" required />
      <Field name="password" label="Contraseña" type="password" autoComplete="current-password" required />
      <button className="button button--primary" type="submit">Iniciar sesión</button>
    </form>
    {submitted && <p className="alert alert--warning" role="status">El acceso todavía no está conectado al backend. No se envió tu contraseña.</p>}
    <button className="text-button" type="button" onClick={onBack}>Volver a la vista preliminar</button>
  </main><p className="footnote">Vista preliminar de diseño. No ingreses credenciales reales.</p></div>
}

function Summary({ role, navigate }) {
  const metrics = role === 'BECARIO'
    ? [['Horas acreditadas', 'Asistencia validada', 'success'], ['Horas pendientes', 'Según tu meta', 'warning'], ['Meta de horas', 'Asignada por administración']]
    : role === 'ENCARGADO'
      ? [['Mis trabajos', 'Publicaciones propias'], ['Postulaciones', 'Por revisar', 'warning'], ['Cierres pendientes', 'Tras el fin previsto', 'success']]
      : [['Usuarios', 'Cuentas administradas'], ['Trabajos', 'Publicados en MiBeca'], ['Progreso', 'Consulta general', 'success']]
  const destination = { BECARIO: 'Trabajos disponibles', ENCARGADO: 'Mis trabajos', ADMIN: 'Usuarios' }[role]
  return <><div className="metrics">{metrics.map(([label, hint, tone]) => <Metric key={label} label={label} hint={hint} tone={tone} />)}</div>
    {role === 'BECARIO' && <section className="panel"><div className="panel-heading"><div><h2>Tu progreso</h2><p>La meta la define el administrador. Las horas se acreditan al cerrar un trabajo con asistencia.</p></div><span className="status status--neutral">Sin datos</span></div><div className="progress-track" aria-label="Progreso no disponible" /><div className="progress-caption"><span>Acreditadas: —</span><span>Pendientes: —</span><span>Meta: —</span></div></section>}
    <section className="panel"><div className="panel-heading"><div><h2>{role === 'BECARIO' ? 'Explora trabajos' : role === 'ENCARGADO' ? 'Gestiona tus trabajos' : 'Gestiona usuarios'}</h2><p>El flujo del MVP estará disponible cuando la API y la base de datos estén listas.</p></div><button className="button button--secondary" type="button" onClick={() => navigate(destination)}>Abrir {destination.toLowerCase()}</button></div><EmptyState title="Aún no hay datos reales">Esta vista no utiliza registros simulados.</EmptyState></section>
  </>
}

function JobForm() {
  return <section className="panel"><h2>Preparar un trabajo</h2><p>Un trabajo corresponde a una sola actividad. Inicio futuro, fin posterior y cupos positivos.</p><div className="form-grid">
    <Field name="job-title" label="Título" type="text" placeholder="Nombre de la actividad" /><Field name="job-location" label="Ubicación" type="text" placeholder="Lugar de realización" />
    <Field name="job-start" label="Inicio" type="datetime-local" /><Field name="job-end" label="Fin previsto" type="datetime-local" />
    <Field name="job-hours" label="Duración acreditable (horas)" type="text" inputMode="decimal" placeholder="Ej. 4,5" hint="Máximo un decimal. Se convertirá a minutos antes del envío." /><Field name="job-capacity" label="Cupos" type="number" min="1" step="1" placeholder="Ej. 3" />
    <div className="form-field form-field--wide"><label htmlFor="job-description">Descripción</label><textarea id="job-description" rows="3" placeholder="Tareas y requisitos de la actividad" /></div>
  </div><PreviewNote /><button className="button button--primary" type="button" disabled>Publicar trabajo</button></section>
}

function UserForm() {
  const [newRole, setNewRole] = useState('BECARIO')
  return <section className="panel"><h2>Preparar una cuenta</h2><p>Cada usuario tiene un único rol. El servidor generará una contraseña temporal que se entregará personalmente.</p><div className="form-grid">
    <Field name="user-name" label="Nombre completo" type="text" autoComplete="name" /><Field name="user-email" label="Correo electrónico" type="email" autoComplete="email" />
    <Field name="user-role" label="Rol"><select id="user-role" value={newRole} onChange={(event) => setNewRole(event.target.value)}><option value="BECARIO">Estudiante becario</option><option value="ENCARGADO">Encargado</option><option value="ADMIN">Administrador</option></select></Field>
    {newRole === 'BECARIO' && <><Field name="student-code" label="Código académico" type="text" inputMode="numeric" maxLength="5" minLength="5" pattern="[0-9]{5}" placeholder="5 dígitos" /><Field name="student-program" label="Carrera" type="text" /><Field name="student-semester" label="Semestre" type="number" min="1" step="1" /><Field name="student-goal" label="Meta de horas" type="text" inputMode="decimal" placeholder="Ej. 40" hint="Máximo un decimal; se guardará en minutos." /></>}
    {newRole === 'ENCARGADO' && <><Field name="context-type" label="Tipo de contexto"><select id="context-type"><option value="MATERIA">Materia</option><option value="FACULTAD">Facultad</option><option value="AREA">Área</option></select></Field><Field name="context-name" label="Nombre del contexto" type="text" /></>}
  </div><PreviewNote /><button className="button button--primary" type="button" disabled>Crear cuenta</button></section>
}

function DetailView({ role, section }) {
  const view = emptyViews[section]
  return <><section className="panel"><div className="panel-heading"><div><h2>{section}</h2><p>{view.text}</p></div></div>{section === 'Cierre y horas' && <div className="alert alert--info" role="note">El cierre exigirá marcar asistencia o ausencia de todos los aceptados y confirmar la acreditación única.</div>}<EmptyTable view={view} /></section>
    {role === 'ENCARGADO' && section === 'Mis trabajos' && <JobForm />}
    {role === 'ADMIN' && section === 'Usuarios' && <UserForm />}
  </>
}

function App() {
  const [role, setRole] = useState('BECARIO')
  const [section, setSection] = useState('Resumen')
  const [showLogin, setShowLogin] = useState(false)
  if (showLogin) return <Login onBack={() => setShowLogin(false)} />
  return <div className="app-shell"><aside className="sidebar" aria-label="Navegación principal"><Logo /><div className="sidebar-caption">PLATAFORMA ACADÉMICA</div><nav aria-label={'Opciones de ' + roles[role].name}>{roles[role].menu.map((item) => <button key={item} className={'nav-item ' + (section === item ? 'nav-item--active' : '')} type="button" aria-current={section === item ? 'page' : undefined} onClick={() => setSection(item)}><span className="nav-dot" aria-hidden="true" />{item}</button>)}</nav><div className="sidebar-bottom">MiBeca <small>Vista preliminar · MVP</small></div></aside>
    <div className="main-column"><header className="topbar"><span className="breadcrumb">MiBeca / {section}</span><div className="topbar-actions"><label htmlFor="role-preview">Vista de rol</label><select id="role-preview" aria-label="Vista de rol para revisar el diseño" value={role} onChange={(event) => { setRole(event.target.value); setSection('Resumen') }}>{Object.entries(roles).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select><button className="button button--ghost" type="button" onClick={() => setShowLogin(true)}>Ver acceso</button></div></header>
      <main className="content"><div className="page-heading"><div><span className="eyebrow">{roles[role].name} · MiBeca</span><h1>{section}</h1><p>{roles[role].description}</p></div><span className="status status--info">Vista preliminar</span></div><div className="alert alert--info" role="note"><strong>Interfaz en desarrollo.</strong> El selector de rol solo permite revisar pantallas. No inicia sesión ni concede permisos. La información real llegará de la API.</div>
        {section === 'Resumen' ? <Summary role={role} navigate={setSection} /> : <DetailView role={role} section={section} />}
        <footer className="content-footer">MiBeca · Plataforma de gestión de trabajo becario</footer></main></div></div>
}

export default App
