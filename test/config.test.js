import { describe, expect, it } from 'vitest'
import { seccionesDe } from '../src/config/navegacion.js'
import { VISTAS_VACIAS } from '../src/config/vistas.js'

describe('configuración de navegación', () => {
  it('muestra únicamente las secciones permitidas para cada rol', () => {
    expect(seccionesDe('ADMIN').map(({ ruta }) => ruta)).toEqual([
      '/', '/admin/usuarios', '/admin/trabajos', '/admin/supervision',
    ])
    expect(seccionesDe('BECARIO').map(({ ruta }) => ruta)).toContain('/historial')
    expect(seccionesDe('BECARIO').map(({ ruta }) => ruta)).not.toContain('/admin/usuarios')
  })

  it('mantiene estados vacíos explícitos para módulos aún no implementados', () => {
    expect(VISTAS_VACIAS['/cierre-y-horas'].title).toBe('Sin cierres disponibles')
    expect(VISTAS_VACIAS['/admin/supervision'].headers).toContain('Acreditadas')
  })
})
