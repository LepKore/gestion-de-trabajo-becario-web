import { describe, expect, it } from 'vitest'
import { backendRoot, blocked } from '../.opencode/lib/docker-guard-rules.js'

describe('mibeca.docker-guard', () => {
  const frontend = 'C:\\VSCode\\Certi 1\\proyecto parcial\\gestion-de-trabajo-becario-web'
  const backend = backendRoot(frontend)

  it('detecta Compose MiBeca desde el frontend en Windows', () => {
    expect(blocked('docker compose down -v', frontend, backend, new Set())).toContain('MiBeca')
  })

  it('permite detener o bajar Compose sin borrar volúmenes', () => {
    expect(blocked('docker compose stop', frontend, backend, new Set())).toBeNull()
    expect(blocked('docker compose down', frontend, backend, new Set())).toBeNull()
  })

  it('bloquea el volumen de PostgreSQL de MiBeca', () => {
    expect(blocked('docker volume rm mibeca_pgdata', frontend, backend, new Set())).toContain('PostgreSQL')
  })

  it('solo permite prune cuando filtra explícitamente otro proyecto', () => {
    expect(blocked('docker volume prune', frontend, backend, new Set())).toContain('ambiguo')
    expect(blocked(
      'docker volume prune --filter label=com.docker.compose.project=otro',
      frontend,
      backend,
      new Set(),
    )).toBeNull()
  })
})
