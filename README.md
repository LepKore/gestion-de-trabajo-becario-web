# MiBeca · frontend

Aplicación React 19 y Vite para la plataforma de gestión de trabajo becario. Inicia sesión contra la API, aplica el cambio obligatorio de contraseña, navega por rutas según el rol, permite administrar cuentas y cubre trabajos, postulaciones, control e historial, paneles por rol y supervisión administrativa. La autorización final la hace el backend.

## Desarrollo local

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```

Tras `npm ci`, activa el hook local que revisa secretos antes de commitear:

```bash
git config core.hooksPath .githooks
```

Los hooks locales no sustituyen los controles compartidos en GitHub.

Firebase Hosting publica `dist`; los workflows conservan vista previa en PR y publicación live desde `main`. Antes de cada deploy ejecutan `npm ci`, lint, pruebas, build y una comprobación de salud de API. La CI de frontend también valida PR y las ramas `main`, `dev` y `sergio`. Define la variable pública de repositorio `VITE_API_URL` con el formato `https://api.midominio.edu/api/v1`; el workflow detiene el despliegue si falta o si `/ready` no responde. CORS del backend debe permitir el origen web exacto.

Para usar cookies de sesión en producción, el frontend y la API deben compartir un dominio de sitio configurado, CORS debe permitir el origen exacto y el backend debe usar `SESSION_SAME_SITE=none` junto con `COOKIE_SECURE=true` si la topología es cross-site. Firebase `web.app` y Supabase `supabase.co` son sitios distintos; políticas del navegador pueden bloquear cookies de terceros aunque SameSite y CORS estén configurados. No se declara autenticación de producción hasta verificarla con los dominios reales.

La verificación local y los límites de operación de fase 6 están en [docs/VERIFICACION_FASE_6.md](docs/VERIFICACION_FASE_6.md). No se despliega automáticamente desde `dev` ni desde `sergio`.

## Build y arranque en despliegue

| Comando | Qué hace |
| --- | --- |
| `npm ci` | Instala dependencias exactas desde `package-lock.json`. |
| `npm run build` | Compila a `dist/` (`index.html` y `assets/`). |
| `npm run start` | Sirve `dist/` con Vite en `0.0.0.0` y en el puerto de `PORT` (4173 si no existe). |
| `npm run preview` | Alias de Vite para revisar `dist/` en local. |

El frontend es una aplicación de una sola página con rutas del lado del cliente. Cualquier hosting que lo sirva como archivos estáticos debe devolver `index.html` para las rutas de la aplicación (`/login`, `/change-password`, `/admin/usuarios`, …) y servir además `404.html`, que es la copia que se usa para las rutas desconocidas.

En despliegue la API vive en otro origen: hay que definir `VITE_API_URL` con la URL pública del backend **antes** de compilar y hacer que `CORS_ORIGIN` del backend acepte exactamente el dominio del frontend. El proxy de `npm run dev` y de `npm run preview` solo sirve para trabajar contra `http://127.0.0.1:3000`.

Comprobado en local el 19-10-2026: `npm run start` con `PORT=4321` sirvió `dist/` en ese puerto, una ruta profunda (`/admin/usuarios`) devolvió la aplicación y el proxy `/api` respondió con el backend local.

## Identidad visual

El color más frecuente en el interior del fondo de la imagen PNG recibida es **`#06175D`** (conteo de píxeles). El píxel claro más frecuente es **`#FFFDFF`**; el símbolo tiene muchas variaciones casi blancas por suavizado y compresión, por lo que el tema usa **`#FFFFFF`** como blanco visual. Esta extracción no acredita una guía de marca oficial. El PNG recibido es opaco, sin píxeles transparentes; se conserva completo y con sus proporciones en [`public/upb-logo.png`](public/upb-logo.png).

Las decisiones visuales se centralizan en [`src/styles/theme.css`](src/styles/theme.css):

- `--brand`, `--brand-hover`, `--brand-active` y `--brand-soft`: azul, estados y fondo relacionado. Si cambias el azul, revisa también sus variantes y el `theme-color` de `index.html`.
- `--background`, `--surface`, `--field`: fondos.
- `--text`, `--text-muted`: textos.
- `--font-family` y `--font-*`: tipografía y tamaños.
- Colores de estado, borde, foco, espaciado, radios y sombras están en el mismo archivo.

Los tonos neutros y de estado son complementarios de diseño, no colores extraídos de la imagen. Los componentes usan variables del tema. El diseño contempla teclado, foco visible, tablas con desplazamiento horizontal, móvil y preferencia de movimiento reducido.

## Alcance siguiente

El flujo de MVP que falta es: encargado publica trabajo → estudiante se postula → encargado acepta → encargado cierra el trabajo registrando asistencia → el sistema acredita horas una sola vez → estudiante consulta su progreso. El alta de cuentas, el inicio de sesión y el cambio obligatorio de contraseña ya funcionan contra la API: el administrador crea las cuentas en «Usuarios» y la contraseña temporal se muestra una sola vez. El contrato canónico es `openapi.yaml` en el repositorio backend. Para trabajar con datos reales hay que levantar la API en `http://127.0.0.1:3000`; en desarrollo el proxy de Vite reenvía `/api` a esa dirección, y `VITE_API_URL` permite apuntar a otro origen si la CORS del backend lo permite.
