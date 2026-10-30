// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import process from 'node:process'
import { describe, expect, it } from 'vitest'
import { RUTAS } from '../src/api/endpoints.js'

const SRC = resolve(process.cwd(), 'src')
const ENDPOINTS = join(SRC, 'api', 'endpoints.js')

function archivosFuente(directorio = SRC) {
  return readdirSync(directorio).flatMap((nombre) => {
    const ruta = join(directorio, nombre)
    if (statSync(ruta).isDirectory()) return archivosFuente(ruta)
    return /\.jsx?$/.test(nombre) ? [ruta] : []
  })
}

function lineasConCoincidencia(patron, excluidos = [ENDPOINTS]) {
  return archivosFuente()
    .filter((ruta) => !excluidos.includes(ruta))
    .flatMap((ruta) => readFileSync(ruta, 'utf8').split('\n')
      .map((linea, indice) => ({ texto: linea.trim(), numero: indice + 1 }))
      // Los comentarios documentan rutas sin construirlas.
      .filter(({ texto }) => !texto.startsWith('//') && !texto.startsWith('*'))
      .filter(({ texto }) => patron.test(texto))
      .map(({ texto, numero }) => `${relative(SRC, ruta)}:${numero}: ${texto}`))
}

describe('endpoints de la API', () => {
  it('declara las rutas fijas del contrato', () => {
    expect([
      RUTAS.sesion.actual,
      RUTAS.sesion.ingreso,
      RUTAS.sesion.salida,
      RUTAS.sesion.cambioPassword,
      RUTAS.usuarios.lista,
      RUTAS.trabajos.lista,
      RUTAS.trabajos.propios,
      RUTAS.postulaciones.mias,
      RUTAS.estudiantes.progreso,
      RUTAS.yo.panel,
      RUTAS.yo.progreso,
      RUTAS.yo.historial,
      RUTAS.yo.rating,
    ]).toEqual([
      '/auth/me',
      '/auth/login',
      '/auth/logout',
      '/auth/change-password',
      '/users',
      '/jobs',
      '/me/jobs',
      '/me/applications',
      '/students/progress',
      '/me/dashboard',
      '/me/progress',
      '/me/history',
      '/me/rating',
    ])
  })

  it('construye rutas con identificador', () => {
    expect(RUTAS.usuarios.restablecerPassword('u1')).toBe('/users/u1/reset-password')
    expect(RUTAS.usuarios.reactivar('u1')).toBe('/users/u1/reactivate')
    expect(RUTAS.usuarios.desactivar('u1')).toBe('/users/u1/deactivate')
    expect(RUTAS.trabajos.detalle('j1')).toBe('/jobs/j1')
    expect(RUTAS.trabajos.postulaciones('j1')).toBe('/jobs/j1/applications')
    expect(RUTAS.trabajos.cierre('j1')).toBe('/jobs/j1/close')
    expect(RUTAS.trabajos.asistencia('j1')).toBe('/jobs/j1/attendance')
    expect(RUTAS.postulaciones.aceptar('a1')).toBe('/applications/a1/accept')
    expect(RUTAS.postulaciones.rechazar('a1')).toBe('/applications/a1/reject')
    expect(RUTAS.estudiantes.historial('e1')).toBe('/students/e1/history')
    expect(RUTAS.postulaciones.evaluacion('a1')).toBe('/applications/a1/evaluation')
  })

  it('codifica los identificadores antes de interpolarlos', () => {
    expect(RUTAS.trabajos.detalle('a/b c')).toBe('/jobs/a%2Fb%20c')
    expect(RUTAS.estudiantes.historial('x?y')).toBe('/students/x%3Fy/history')
  })

  it('no construye rutas de la API fuera de src/api/endpoints.js', () => {
    const rutas = lineasConCoincidencia(/['"`]\/(auth|users|jobs|applications|me|students)\b/)
    expect(rutas).toEqual([])
  })

  it('solo el módulo de endpoints importa apiRequest', () => {
    const importaciones = lineasConCoincidencia(/\bapiRequest\b/, [ENDPOINTS, join(SRC, 'lib', 'api.js'), join(SRC, 'lib', 'useRecurso.js')])
    expect(importaciones).toEqual([])
  })
})
