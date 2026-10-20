import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

export function validarApiPublica(value) {
  if (!value) throw new Error('Define la variable pública VITE_API_URL antes de desplegar.')

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error('VITE_API_URL debe ser una URL absoluta HTTPS terminada en /api/v1.')
  }

  if (
    url.protocol !== 'https:'
    || url.username
    || url.password
    || url.search
    || url.hash
    || url.pathname !== '/api/v1'
  ) {
    throw new Error('VITE_API_URL debe usar HTTPS y la ruta /api/v1, sin credenciales ni sufijos.')
  }

  return url.toString()
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    validarApiPublica(process.env.VITE_API_URL)
    console.log('VITE_API_URL validada para despliegue.')
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
