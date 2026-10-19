import { useContext } from 'react'
import { AuthContext } from './auth-context.js'

export function useAuth() {
  const valor = useContext(AuthContext)
  if (!valor) throw new Error('useAuth debe usarse dentro de AuthProvider.')
  return valor
}