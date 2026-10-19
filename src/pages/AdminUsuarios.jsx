import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../lib/api.js'
import { useAuth } from '../auth/useAuth.js'
import { Alert, Dialog, EmptyTable, Field, Paginado } from '../components/ui.jsx'

const ROLES = [
  { valor: 'BECARIO', etiqueta: 'Estudiante becario' },
  { valor: 'ENCARGADO', etiqueta: 'Encargado' },
  { valor: 'ADMIN', etiqueta: 'Administrador' },
]

const CONTEXTOS = [
  { valor: 'MATERIA', etiqueta: 'Materia' },
  { valor: 'FACULTAD', etiqueta: 'Facultad' },
  { valor: 'AREA', etiqueta: 'Área' },
]

const COLUMNAS = ['Nombre', 'Correo', 'Rol', 'Detalle', 'Estado', 'Contraseña', 'Acciones']

const NOMBRE_ROL = { BECARIO: 'Estudiante', ENCARGADO: 'Encargado', ADMIN: 'Administrador' }

const FORMULARIO_VACIO = {
  nombre: '',
  correo: '',
  rol: 'BECARIO',
  estudiante: { codigo: '', carrera: '', semestre: '', metaHoras: '' },
  encargado: { contextoTipo: 'MATERIA', contextoNombre: '' },
}

function detalleDe(usuario) {
  if (usuario.estudiante) {
    return `Código ${usuario.estudiante.codigo} · ${usuario.estudiante.carrera} · sem. ${usuario.estudiante.semestre}`
  }
  if (usuario.encargado) {
    return `${usuario.encargado.contextoTipo} · ${usuario.encargado.contextoNombre}`
  }
  return '—'
}

function EstadoContraseña({ usuario }) {
  if (!usuario.requiereCambioPassword) return <span className="status status--success">Definida</span>
  return <span className="status status--warning">Temporal</span>
}

function ListaUsuarios({ filtros, pagina, setPagina }) {
  const [datos, setDatos] = useState({ usuarios: [], meta: null })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const respuesta = await apiRequest('/users', {
        query: {
          rol: filtros.rol,
          activo: filtros.activo,
          q: filtros.q,
          page: pagina,
          pageSize: 10,
        },
      })
      setDatos({ usuarios: respuesta.data, meta: respuesta.meta })
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setCargando(false)
    }
  }, [filtros.rol, filtros.activo, filtros.q, pagina])

  useEffect(() => {
    // Carga diferida un turno: evita el render en cascada que dispara la regla
    // react-hooks/set-state-in-effect al cambiar filtros o página.
    const temporizador = setTimeout(cargar, 0)
    return () => clearTimeout(temporizador)
  }, [cargar])

  return (
    <section className="panel">
      <header className="panel-head">
        <h2>Usuarios de la plataforma</h2>
        <span className="status status--muted">{datos.meta ? `${datos.meta.total} en total` : ''}</span>
      </header>
      <div className="panel-body" aria-busy={cargando}>
        {error && <Alert tipo="error">{error}</Alert>}
        {cargando && datos.usuarios.length === 0 ? (
          <p className="loading" role="status">Cargando usuarios…</p>
        ) : datos.usuarios.length === 0 ? (
          <EmptyTable
            headers={COLUMNAS}
            title="Sin usuarios que coincidan"
            text="Ajusta los filtros o crea la primera cuenta desde el botón «Crear usuario»."
          />
        ) : (
          <>
            {/* La tabla permanece montada al recargar: si se desmontara, cada
                fila perdería el aviso de contraseña temporal recién emitida. */}
            {cargando && <p className="loading" role="status">Actualizando…</p>}
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>{COLUMNAS.map((columna) => <th scope="col" key={columna}>{columna}</th>)}</tr>
                </thead>
                <tbody>
                  {datos.usuarios.map((usuario) => (
                    <FilaUsuario key={usuario.id} usuario={usuario} onRecargar={cargar} />
                  ))}
                </tbody>
              </table>
            </div>
            <Paginado meta={datos.meta} onCambiarPagina={setPagina} />
          </>
        )}
      </div>
    </section>
  )
}

function FilaUsuario({ usuario, onRecargar }) {
  const [error, setError] = useState('')
  const [temporal, setTemporal] = useState('')
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const { usuario: actual } = useAuth()
  const esPropia = Boolean(actual && actual.id === usuario.id)

  async function accion(ruta, cuerpo) {
    setError('')
    setTemporal('')
    setConfirmando(false)
    setOcupado(true)
    try {
      const respuesta = await apiRequest(`/users/${usuario.id}${ruta}`, { metodo: 'POST', cuerpo })
      if (respuesta && respuesta.data && respuesta.data.passwordTemporal) {
        setTemporal(respuesta.data.passwordTemporal)
      }
      await onRecargar()
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setOcupado(false)
    }
  }

  return (
    <tr>
      <th scope="row">{usuario.nombre}</th>
      <td>{usuario.correo}</td>
      <td><span className={`status status--${usuario.rol === 'ADMIN' ? 'info' : 'muted'}`}>{NOMBRE_ROL[usuario.rol]}</span></td>
      <td>{detalleDe(usuario)}</td>
      <td>{usuario.activo ? <span className="status status--success">Activo</span> : <span className="status status--muted">Inactivo</span>}</td>
      <td><EstadoContraseña usuario={usuario} /></td>
      <td className="row-actions">
        <button className="button button--secondary" type="button" disabled={ocupado} onClick={() => accion('/reset-password', {})}>
          Nueva contraseña
        </button>
        {usuario.activo ? (
          <button
            className="button button--danger"
            type="button"
            disabled={ocupado || esPropia}
            title={esPropia ? 'No puedes desactivar tu propia cuenta' : ''}
            onClick={() => setConfirmando(true)}
          >
            Desactivar
          </button>
        ) : (
          <button className="button button--secondary" type="button" disabled={ocupado} onClick={() => accion('/reactivate', {})}>
            Reactivar
          </button>
        )}
        {error && <span className="field-error" role="alert">{error}</span>}
        {temporal && (
          <span className="temporary-inline">
            Contraseña temporal (se muestra una vez): <code>{temporal}</code>
          </span>
        )}
      </td>
      {confirmando && (
        <Dialog
          titulo="Desactivar usuario"
          descripcion="Es una baja lógica: se conserva el historial y se revocan sus sesiones."
          onCerrar={() => setConfirmando(false)}
        >
          <p>
            ¿Desactivar a <strong>{usuario.nombre}</strong> ({usuario.correo})? No podrá iniciar sesión hasta que se reactive.
          </p>
          <div className="dialog-actions">
            <button className="button button--secondary" type="button" onClick={() => setConfirmando(false)}>Cancelar</button>
            <button className="button button--danger" type="button" disabled={ocupado} onClick={() => accion('/deactivate', {})}>
              Desactivar
            </button>
          </div>
        </Dialog>
      )}
    </tr>
  )
}

export function AdminUsuarios() {
  const [filtros, setFiltros] = useState({ rol: '', activo: '', q: '' })
  const [pagina, setPagina] = useState(1)
  const [creando, setCreando] = useState(false)
  const [nuevaCuenta, setNuevaCuenta] = useState(null)
  // Cada cambio de filtro vuelve a la primera página: se hace en el manejador,
  // no en un efecto que dispare un render en cascada.
  function cambiarFiltro(campo, valor) {
    setFiltros((anterior) => ({ ...anterior, [campo]: valor }))
    setPagina(1)
  }

  return (
    <>
      <section className="panel">
        <header className="panel-head">
          <h2>Alta de usuarios</h2>
          <button className="button button--primary" type="button" onClick={() => setCreando(true)}>Crear usuario</button>
        </header>
        <div className="panel-body">
          <p className="form-note">
            El rol se fija al crear la cuenta y no se modifica después. La contraseña temporal se muestra una sola vez y caduca en el primer ingreso.
          </p>
          <div className="form-grid form-grid--filters">
            <label className="form-field">
              <span>Buscar</span>
              <input
                type="search"
                value={filtros.q}
                placeholder="Nombre o correo"
                onChange={(evento) => cambiarFiltro('q', evento.target.value)}
              />
            </label>
            <label className="form-field">
              <span>Rol</span>
              <select value={filtros.rol} onChange={(evento) => cambiarFiltro('rol', evento.target.value)}>
                <option value="">Todos</option>
                {ROLES.map((rol) => <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Estado</span>
              <select value={filtros.activo} onChange={(evento) => cambiarFiltro('activo', evento.target.value)}>
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      <ListaUsuarios filtros={filtros} pagina={pagina} setPagina={setPagina} />

      {creando && (
        <DialogCrearUsuario
          onCerrar={() => setCreando(false)}
          onCreado={(cuenta) => {
            setCreando(false)
            setNuevaCuenta(cuenta)
          }}
        />
      )}

      {nuevaCuenta && (
        <Dialog
          titulo="Cuenta creada"
          descripcion="Entrega esta contraseña temporal ahora: no volverá a mostrarse."
          onCerrar={() => setNuevaCuenta(null)}
        >
          <p className="temporary-password">{nuevaCuenta.passwordTemporal}</p>
          <p className="form-note">
            {nuevaCuenta.nombre} ({nuevaCuenta.correo}) deberá cambiarla al iniciar sesión.
          </p>
          <div className="dialog-actions">
            <button className="button button--primary" type="button" onClick={() => setNuevaCuenta(null)}>Ya la entregué</button>
          </div>
        </Dialog>
      )}
    </>
  )
}

function DialogCrearUsuario({ onCerrar, onCreado }) {
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  function actualizar(campo) {
    return (evento) => setFormulario((anterior) => ({ ...anterior, [campo]: evento.target.value }))
  }

  function actualizarPerfil(perfil, campo) {
    return (evento) => setFormulario((anterior) => ({
      ...anterior,
      [perfil]: { ...anterior[perfil], [campo]: evento.target.value },
    }))
  }

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')
    const cuerpo = {
      nombre: formulario.nombre.trim(),
      correo: formulario.correo.trim(),
      rol: formulario.rol,
    }
    if (formulario.rol === 'BECARIO') {
      cuerpo.estudiante = {
        codigo: formulario.estudiante.codigo.trim(),
        carrera: formulario.estudiante.carrera.trim(),
        semestre: Number(formulario.estudiante.semestre),
        // El contrato persiste minutos enteros; la interfaz solicita la meta
        // semestral en horas y permite una décima (6 minutos).
        metaMinutos: Math.round(Number(String(formulario.estudiante.metaHoras).replace(',', '.')) * 60),
      }
    }
    if (formulario.rol === 'ENCARGADO') {
      cuerpo.encargado = {
        contextoTipo: formulario.encargado.contextoTipo,
        contextoNombre: formulario.encargado.contextoNombre.trim(),
      }
    }
    setEnviando(true)
    try {
      const respuesta = await apiRequest('/users', { metodo: 'POST', cuerpo })
      onCreado(respuesta.data)
    } catch (fallo) {
      setError(fallo.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Dialog
      titulo="Crear usuario"
      descripcion="Las cuentas se crean desde la administración; no hay registro público."
      onCerrar={onCerrar}
    >
      <form className="dialog-form" onSubmit={alEnviar} noValidate>
        {error && <Alert tipo="error">{error}</Alert>}
        <Field name="nombre" label="Nombre completo" required value={formulario.nombre} onChange={actualizar('nombre')} />
        <Field name="correo" label="Correo institucional" type="email" required value={formulario.correo} onChange={actualizar('correo')} />
        <Field name="rol" label="Rol" hint="El rol queda fijo tras el alta." value={formulario.rol} onChange={actualizar('rol')}>
          {(props) => (
            <select {...props} value={formulario.rol} onChange={actualizar('rol')}>
              {ROLES.map((rol) => <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>)}
            </select>
          )}
        </Field>

        {formulario.rol === 'BECARIO' && (
          <>
            <Field name="codigo" label="Código de estudiante" hint="Cinco dígitos, sin letra inicial." required value={formulario.estudiante.codigo} onChange={actualizarPerfil('estudiante', 'codigo')} />
            <Field name="carrera" label="Carrera" required value={formulario.estudiante.carrera} onChange={actualizarPerfil('estudiante', 'carrera')} />
            <Field name="semestre" label="Semestre" type="number" min="1" max="12" required value={formulario.estudiante.semestre} onChange={actualizarPerfil('estudiante', 'semestre')} />
            <Field name="metaHoras" label="Meta semestral (horas)" type="number" min="0.1" max="720" step="0.1" hint="Horas del semestre; se admiten décimas (por ejemplo 120 o 120.5)." required value={formulario.estudiante.metaHoras} onChange={actualizarPerfil('estudiante', 'metaHoras')} />
          </>
        )}

        {formulario.rol === 'ENCARGADO' && (
          <>
            <Field name="contextoTipo" label="Tipo de contexto" value={formulario.encargado.contextoTipo} onChange={actualizarPerfil('encargado', 'contextoTipo')}>
              {(props) => (
                <select {...props} value={formulario.encargado.contextoTipo} onChange={actualizarPerfil('encargado', 'contextoTipo')}>
                  {CONTEXTOS.map((contexto) => <option key={contexto.valor} value={contexto.valor}>{contexto.etiqueta}</option>)}
                </select>
              )}
            </Field>
            <Field name="contextoNombre" label="Nombre del contexto" hint="Materia, facultad o área a la que pertenece." required value={formulario.encargado.contextoNombre} onChange={actualizarPerfil('encargado', 'contextoNombre')} />
          </>
        )}

        <div className="dialog-actions">
          <button className="button button--secondary" type="button" onClick={onCerrar}>Cancelar</button>
          <button className="button button--primary" type="submit" disabled={enviando}>
            {enviando ? 'Creando…' : 'Crear y generar contraseña'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
