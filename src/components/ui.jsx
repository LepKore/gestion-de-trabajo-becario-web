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

const TONOS = {
  brand: 'text-primary-container',
  success: 'text-success',
  warning: 'text-warning',
  neutral: 'text-neutral',
}

export function Metric({ label, hint, tone = 'brand', value = '—' }) {
  return (
    <article className="grid content-start gap-1.5 rounded-card border border-outline-variant bg-surface-container-lowest p-5 shadow-card">
      <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{label}</span>
      <strong className={`font-headline-md text-3xl leading-none tabular-nums ${TONOS[tone] || TONOS.brand}`}>{value}</strong>
      <small className="text-xs leading-snug text-on-surface-variant">{hint}</small>
    </article>
  )
}

/** Diálogo modal con foco inicial y cierre con Escape. */
export function Dialog({ titulo, descripcion, onCerrar, children }) {
  const tituloId = useId()
  const descripcionId = useId()
  const refDialogo = useRef(null)
  const cerrarRef = useRef(onCerrar)

  useEffect(() => {
    cerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    const anterior = document.activeElement
    refDialogo.current?.focus()
    function alPulsar(event) {
      if (event.key === 'Escape') {
        cerrarRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const dialogo = refDialogo.current
      const controles = dialogo?.querySelectorAll(
        'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
      )
      if (!dialogo || !controles?.length) {
        event.preventDefault()
        dialogo?.focus()
        return
      }

      const primero = controles[0]
      const ultimo = controles[controles.length - 1]
      if (event.shiftKey && (document.activeElement === primero || document.activeElement === dialogo)) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (document.activeElement === ultimo || document.activeElement === dialogo)) {
        event.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', alPulsar)
    return () => {
      document.removeEventListener('keydown', alPulsar)
      if (anterior instanceof HTMLElement) anterior.focus()
    }
  }, [])

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
