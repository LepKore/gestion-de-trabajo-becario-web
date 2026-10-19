import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// En hosting estático las rutas de la aplicación no existen como archivos: se
// sirve public/404.html, que guarda la ruta solicitada y reenvía a index.html.
// Aquí se restaura esa ruta para que el enrutador del cliente la muestre.
const rutaRestaurada = sessionStorage.getItem('mibeca.ruta404')
if (rutaRestaurada) {
  sessionStorage.removeItem('mibeca.ruta404')
  window.history.replaceState({}, '', rutaRestaurada + window.location.search)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
