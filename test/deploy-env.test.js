import { describe, expect, it } from 'vitest'
import { validarApiPublica } from '../scripts/validate-deploy-env.js'

describe('validación previa a los despliegues', () => {
  it('acepta la URL pública HTTPS exacta del API v1', () => {
    expect(validarApiPublica('https://api.mibeca.example/api/v1'))
      .toBe('https://api.mibeca.example/api/v1')
  })

  it.each([
    ['', 'Define la variable pública VITE_API_URL'],
    ['http://api.mibeca.example/api/v1', 'debe usar HTTPS'],
    ['https://api.mibeca.example', 'la ruta /api/v1'],
    ['https://api.mibeca.example/api/v1/', 'la ruta /api/v1'],
    ['https://usuario:clave@api.mibeca.example/api/v1', 'sin credenciales'],
    ['https://api.mibeca.example/api/v1?token=privado', 'sin credenciales'],
  ])('rechaza configuración de publicación inválida: %s', (value, mensaje) => {
    expect(() => validarApiPublica(value)).toThrow(mensaje)
  })
})
