import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

/** Etiqueta y control asociados, con ayuda opcional y error del servidor. */
export function Field({ name, label, hint, error, children, ...inputProps }) {
  const id = useId()
  const controlId = `${name || label}-${id}`
  const hintId = hint ? `${controlId}-hint` : undefined
  const errorId = error ? `${controlId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined
  return (
    <div className="form-field">
      <label htmlFor={controlId}>{label}</label>
      {children ? (
        <div>{children({ id: controlId, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}</div>
      ) : (
        <input id={controlId} name={name} aria-describedby={describedBy} aria-invalid={error ? true : undefined} {...inputProps} />
      )}
      {hint && <small id={hintId}>{hint}</small>}
      {error && <small className="field-error" id={errorId} role="alert">{error}</small>}
    </div>
  )
}

export function Alert({ tipo = 'info', children, conRol = true }) {
  return (
    <p className={`alert alert--${tipo}`} role={conRol ? 'alert' : 'status'}>{children}</p>
  )
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty">
      <span className="empty__symbol" aria-hidden="true">○</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  )
}

export function EmptyTable({ headers, title, text }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>{headers.map((header) => <th scope="col" key={header}>{header}</th>)}</tr>
        </thead>
        <tbody>
          <tr><td colSpan={headers.length}><EmptyState title={title}>{text}</EmptyState></td></tr>
        </tbody>
      </table>
    </div>
  )
}

export function Metric({ label, hint, tone = 'brand', value = '—' }) {
  return (
    <article className={`metric metric--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{hint}</small>
    </article>
  )
}

/** Diálogo modal con foco inicial y cierre con Escape. */
export function Dialog({ titulo, descripcion, onCerrar, children }) {
  const tituloId = useId()
  const descripcionId = useId()
  const refDialogo = useRef(null)

  useEffect(() => {
    const anterior = document.activeElement
    refDialogo.current?.focus()
    function alPulsar(event) {
      if (event.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [onCerrar])

  // El portal mantiene el HTML válido aunque el diálogo se abra desde una fila
  // de tabla y evita que el apilado del shell oculte el fondo.
  return createPortal(
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onCerrar() }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={tituloId} aria-describedby={descripcionId} ref={refDialogo} tabIndex={-1}>
        <h2 id={tituloId}>{titulo}</h2>
        <p id={descripcionId}>{descripcion}</p>
        {children}
      </div>
    </div>,
    document.body,
  )
}

export function Paginado({ meta, onCambiarPagina }) {
  if (!meta || meta.totalPages <= 1) return null
  return (
    <nav className="paginacion" aria-label="Paginación de usuarios">
      <button className="button button--secondary" type="button" disabled={meta.page <= 1} onClick={() => onCambiarPagina(meta.page - 1)}>Anterior</button>
      <span>Página {meta.page} de {meta.totalPages} · {meta.total} usuarios</span>
      <button className="button button--secondary" type="button" disabled={meta.page >= meta.totalPages} onClick={() => onCambiarPagina(meta.page + 1)}>Siguiente</button>
    </nav>
  )
}