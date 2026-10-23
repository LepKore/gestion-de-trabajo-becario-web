// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { seccionesDe } from '../src/config/navegacion.js'

describe('configuración de navegación', () => {
  it('muestra únicamente las secciones permitidas para cada rol', () => {
    expect(seccionesDe('ADMIN').map(({ ruta }) => ruta)).toEqual([
      '/', '/admin/usuarios', '/admin/trabajos', '/admin/supervision',
    ])
    expect(seccionesDe('BECARIO').map(({ ruta }) => ruta)).toContain('/historial')
    expect(seccionesDe('BECARIO').map(({ ruta }) => ruta)).not.toContain('/admin/usuarios')
  })
})
