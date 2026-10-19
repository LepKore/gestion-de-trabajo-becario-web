import { createContext } from 'react'

// Contexto separado del componente para mantener la regla de react-refresh:
// este archivo no exporta componentes y el provider vive en AuthProvider.jsx.
export const AuthContext = createContext(null)