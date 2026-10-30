import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import assert from 'node:assert/strict'
import { crearUsuario } from '../../gestion-de-trabajo-becario-backend/src/services/users.js'
import { createClient, datos, resetSchema, startTestServer, testEnv } from '../../gestion-de-trabajo-becario-backend/test/helpers.js'

const web = fileURLToPath(new URL('../', import.meta.url))
const ctx = await startTestServer(testEnv({ DB_SSL_MODE: 'disable', CORS_ORIGIN: 'http://127.0.0.1:5175' }))
let vite
try {
  await resetSchema(ctx.pool)
  const users = {}
  for (const [role, template] of Object.entries({ owner: datos.encargado, student: datos.becario, admin: datos.admin })) {
    const correo = `browser-${role}@uni.edu`
    const created = await crearUsuario(ctx.pool, { ...template, correo }, testEnv())
    await ctx.pool.query('UPDATE usuarios SET requiere_cambio_password=false WHERE id=$1', [created.usuario.id])
    const client = createClient(ctx.baseUrl)
    assert.equal((await client.post('/api/v1/auth/login', { correo, password: created.passwordTemporal })).status, 200)
    users[role] = { correo, password: created.passwordTemporal, client }
  }
  const created = await users.owner.client.post('/api/v1/jobs', {
    titulo: 'Recorrido navegador', descripcion: 'Verificacion local de integracion', ubicacion: 'Biblioteca',
    inicioPrevisto: new Date(Date.now() + 86400000).toISOString(), finPrevisto: new Date(Date.now() + 90000000).toISOString(), duracionMinutos: 60, cupos: 1,
  })
  assert.equal(created.status, 201)
  const jobId = created.body.data.id
  const applied = await users.student.client.post(`/api/v1/jobs/${jobId}/applications`, {})
  assert.equal(applied.status, 201)
  assert.equal((await users.owner.client.post(`/api/v1/applications/${applied.body.data.id}/accept`, {})).status, 200)
  await ctx.pool.query("UPDATE trabajos SET inicio_previsto=now()-interval '2 hours',fin_previsto=now()-interval '1 hour' WHERE id=$1", [jobId])
  assert.equal((await users.owner.client.post(`/api/v1/jobs/${jobId}/close`, { attendance: [{ applicationId: applied.body.data.id, attended: true }] }, { 'Idempotency-Key': `browser-${jobId}` })).status, 200)
  vite = spawn(process.execPath, [`${web}/node_modules/vite/bin/vite.js`, '--host', '127.0.0.1', '--port', '5175', '--strictPort'], {
    cwd: web, env: { ...process.env, VITE_API_URL: `${ctx.baseUrl}/api/v1` }, stdio: 'ignore', windowsHide: true,
  })
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch('http://127.0.0.1:5175')).ok) break } catch { /* wait for Vite */ }
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  const python = spawn('py', [fileURLToPath(new URL('./verify-integration.py', import.meta.url))], { stdio: ['pipe', 'inherit', 'inherit'], windowsHide: true })
  python.stdin.end(JSON.stringify({ users: Object.fromEntries(Object.entries(users).map(([role, user]) => [role, { correo: user.correo, password: user.password }])), jobId }))
  const code = await new Promise(resolve => python.on('exit', resolve))
  assert.equal(code, 0)
} finally {
  vite?.kill()
  await ctx.close()
}
