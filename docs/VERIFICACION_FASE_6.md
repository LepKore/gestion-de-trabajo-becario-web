# Verificación de fase 6 — frontend y operación

**Estado:** controles locales implementados y verificados; validación de despliegue pendiente. No se añadieron dependencias ni se publicó el sitio.

## Prerrequisitos revisados y corregidos

- El repositorio tiene lockfile, dependencias, Vitest y CI frontend.
- Firebase Hosting ya tenía preview de PR y live desde `main`, con proyecto `mibeca`; agregué lint, pruebas y build como pasos obligatorios antes de ambas publicaciones.
- Activé CI para `main`, `dev` y `sergio`. Los workflows existentes de Hosting conservan sus triggers y guardas de PR de repositorio propio.
- No se comprobó acceso a secretos GitHub, URL pública de API, CORS ni dominios reales. No publiqué ni contacté Firebase.

## Implementado

- Corregido el estado anónimo de AuthProvider tras un 401 (antes quedaba indefinido).
- El diálogo modal ahora mantiene el foco dentro al tabular, cierra con Escape y devuelve el foco al control que lo abrió.
- Agregadas pruebas de expiración de sesión con el cliente HTTP del frontend y de apertura, cierre y foco del diálogo.
- Los workflows validan que `VITE_API_URL` sea HTTPS con ruta `/api/v1` y esperan un `/ready` exitoso antes de desplegar. Una variable ausente o API no disponible detiene preview/live en vez de publicar una interfaz desconectada.
- README y contexto de agentes actualizados con flujos vigentes, CI y límites de operación.

## Verificaciones ejecutadas

- `npm run lint`: correcto.
- `npm test`: **33/33** pruebas correctas.
- `npm run build`: correcto.
- `git diff --check`: correcto.

## Límites pendientes

- No se observó un resultado de GitHub Actions: la rama solo tiene commit local y no se publicó.
- No se hizo recorrido manual de navegador/teclado.
- El flujo de cookie de sesión entre dominios no puede verificarse hasta disponer de API pública, CORS, dominios y secretos. El deploy a Firebase requiere comprobar esos prerrequisitos y la configuración de secretos en GitHub.
- El preview dinámico de Firebase necesita una política CORS explícita para el origen que genere Firebase; no se añadió un comodín porque el backend valida orígenes exactos.
