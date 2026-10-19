import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AuthContext } from './auth-context.js'
import { apiRequest, guardarCsrfToken, registrarManejadorNoAutorizado } from '../lib/api.js'

const ESTADOS = {
  cargando: 'cargando',
  autenticado: 'autenticado',
 anonimo: 'anonimo',
}

/**
 * Estado de sesión del frontend. Al arrancar recupera la sesión con
 * GET /auth/me; la cookie es la única prueba de autenticación. Si el usuario
 * tiene `requiereCambioPassword`, solo puede usar el cambio de contraseña y las
 * rutas de sesión.
 */
export function AuthProvider({ children }) {
  const [estado, setEstado] = useState(ESTADOS.cargando)
  const [usuario, setUsuario] = useState(null)
  const [requiereCambioPassword, setRequiereCambioPassword] = useState(false)
  const [errorSesion, setErrorSesion] = useState('')
  const montado = useRef(true)
  // Espejo del estado para que el manejador de 401 sepa si había una sesión
  // previa: en el primer arranque un 401 de /auth/me no es una revocación.
  const estadoRef = useRef(estado)
  useEffect(() => {
    estadoRef.current = estado
  }, [estado])

  const limpiar = useCallback(() => {
    guardarCsrfToken(null)
    setUsuario(null)
    setRequiereCambioPassword(false)
    setEstado(ESTADOS.anonimo)
  }, [])

  const recuperarSesion = useCallback(async () => {
    try {
      const respuesta = await apiRequest('/auth/me')
      if (!montado.current) return
      guardarCsrfToken(respuesta.data.csrfToken)
      setUsuario(respuesta.data.usuario)
      setRequiereCambioPassword(Boolean(respuesta.data.requiereCambioPassword))
      setEstado(ESTADOS.autenticado)
    } catch {
      if (!montado.current) return
      limpiar()
    }
  }, [limpiar])

  useEffect(() => {
    montado.current = true
    registrarManejadorNoAutorizado(() => {
      if (!montado.current) return
      const habiaSesion = estadoRef.current === ESTADOS.autenticado
      limpiar()
      if (habiaSesion) setErrorSesion('Tu sesión terminó o fue revocada. Inicia sesión nuevamente.')
    })
    // La recuperación se difiere un turno: así el primer render solo muestra el
    // estado «cargando» y no se encadena un render en cascada al montar.
    const temporizador = setTimeout(() => recuperarSesion(), 0)
    return () => {
      clearTimeout(temporizador)
      montado.current = false
    }
  }, [limpiar, recuperarSesion])

  const iniciarSesion = useCallback(async (correo, password) => {
    const respuesta = await apiRequest('/auth/login', {
      metodo: 'POST',
      cuerpo: { correo, password },
    })
    guardarCsrfToken(respuesta.data.csrfToken)
    setUsuario(respuesta.data.usuario)
    setRequiereCambioPassword(Boolean(respuesta.data.requiereCambioPassword))
    setEstado(ESTADOS.autenticado)
    setErrorSesion('')
    return respuesta.data
  }, [])

  const cerrarSesion = useCallback(async () => {
    try {
      await apiRequest('/auth/logout', { metodo: 'POST' })
    } catch {
      // Si el servidor ya no reconoce la sesión, el cierre local es válido.
    }
    limpiar()
    setErrorSesion('')
  }, [limpiar])

  const cambiarContrasena = useCallback(async (payload) => {
    const respuesta = await apiRequest('/auth/change-password', {
      metodo: 'POST',
      cuerpo: payload,
    })
    guardarCsrfToken(respuesta.data.csrfToken)
    setUsuario(respuesta.data.usuario)
    setRequiereCambioPassword(Boolean(respuesta.data.requiereCambioPassword))
    return respuesta.data
  }, [])

  const valor = useMemo(
    () => ({
      estado,
      cargando: estado === ESTADOS.cargando,
      autenticado: estado === ESTADOS.autenticado,
      usuario,
      requiereCambioPassword,
      errorSesion,
      limpiarErrorSesion: () => setErrorSesion(''),
      iniciarSesion,
      cerrarSesion,
      cambiarContrasena,
      recuperarSesion,
    }),
    [estado, usuario, requiereCambioPassword, errorSesion, iniciarSesion, cerrarSesion, cambiarContrasena, recuperarSesion],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
