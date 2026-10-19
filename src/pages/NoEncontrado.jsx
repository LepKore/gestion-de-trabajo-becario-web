import { Link } from 'react-router-dom'

export function NoEncontrado() {
  return (
    <div className="empty-page">
      <h1>Página no encontrada</h1>
      <p>La dirección que buscas no existe o ya no está disponible.</p>
      <Link className="button button--primary" to="/">Volver al inicio</Link>
    </div>
  )
}