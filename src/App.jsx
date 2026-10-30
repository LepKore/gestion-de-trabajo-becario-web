import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.jsx'
import { AppShell } from './components/AppShell.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import { AdminUsuarios } from './pages/AdminUsuarios.jsx'
import { ChangePassword } from './pages/ChangePassword.jsx'
import { Login } from './pages/Login.jsx'
import { NoEncontrado } from './pages/NoEncontrado.jsx'
import { Trabajos, DetalleTrabajo, FormularioTrabajo, EditarTrabajo, MisPostulaciones } from './pages/Trabajos.jsx'
import { Postulaciones } from './pages/Postulaciones.jsx'
import { Panel } from './pages/Panel.jsx'
import { CierreYHoras, HistorialBecario } from './pages/Control.jsx'
import { AdminSupervision } from './pages/AdminSupervision.jsx'

/**
 * Rutas de MiBeca. El shell y sus páginas exigen sesión; el login y el cambio
 * de contraseña son las únicas rutas públicas. Los rutas de administración se
 * restringen por rol y el resto se declara en `src/config/navegacion.js`.
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/change-password"
            element={<ProtectedRoute><ChangePassword /></ProtectedRoute>}
          />

          <Route
            element={<ProtectedRoute><AppShell /></ProtectedRoute>}
          >
            <Route path="/" element={<Panel />} />
            <Route
              path="/admin/usuarios"
              element={<ProtectedRoute roles={['ADMIN']}><AdminUsuarios /></ProtectedRoute>}
            />
            <Route path="/trabajos-disponibles" element={<ProtectedRoute roles={['BECARIO']}><Trabajos /></ProtectedRoute>} />
            <Route path="/mis-postulaciones" element={<ProtectedRoute roles={['BECARIO']}><MisPostulaciones /></ProtectedRoute>} />
            <Route path="/trabajos/:id" element={<DetalleTrabajo />} />
            <Route path="/mis-trabajos/nuevo" element={<ProtectedRoute roles={['ENCARGADO']}><FormularioTrabajo /></ProtectedRoute>} />
            <Route path="/mis-trabajos/:id/editar" element={<ProtectedRoute roles={['ENCARGADO']}><EditarTrabajo /></ProtectedRoute>} />
            <Route path="/historial" element={<ProtectedRoute roles={['BECARIO']}><HistorialBecario /></ProtectedRoute>} />
            <Route path="/mis-trabajos" element={<ProtectedRoute roles={['ENCARGADO']}><Trabajos modo="propios" /></ProtectedRoute>} />
            <Route path="/postulaciones" element={<ProtectedRoute roles={['ENCARGADO']}><Postulaciones /></ProtectedRoute>} />
            <Route path="/cierre-y-horas" element={<ProtectedRoute roles={['ENCARGADO']}><CierreYHoras /></ProtectedRoute>} />
            <Route path="/admin/trabajos" element={<ProtectedRoute roles={['ADMIN']}><Trabajos modo="admin" /></ProtectedRoute>} />
            <Route path="/admin/supervision" element={<ProtectedRoute roles={['ADMIN']}><AdminSupervision /></ProtectedRoute>} />
          </Route>

          <Route path="/404" element={<NoEncontrado />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
