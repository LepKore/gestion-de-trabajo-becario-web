# MiBeca · frontend

Aplicación React 19 y Vite para la plataforma de gestión de trabajo becario. La interfaz actual es una **vista preliminar**: permite recorrer pantallas de estudiante, encargado y administrador, pero aún no inicia sesión, consulta una API ni guarda datos. El selector de rol sirve solo para revisar el diseño; la autorización final debe hacerla el backend.

## Desarrollo local

```bash
npm ci
npm run dev
npm run lint
npm run build
```

Firebase Hosting ya está configurado para publicar `dist`; su configuración y workflows no se modificaron en este trabajo. El workflow de PR genera una vista previa y el de `main` publica en el canal live. En ambos casos se compila; actualmente no ejecutan lint ni pruebas. Una publicación del frontend no podrá consultar el backend local de un integrante: antes de conectar datos reales habrá que disponer de una URL pública de API y configurar CORS en el backend.

El 18-10-2026 `npm run lint` y `npm run build` finalizaron correctamente en local. Esto no verifica el despliegue Firebase ni un flujo conectado al backend.

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

El flujo real de MVP sigue pendiente: administrador crea usuarios → encargado publica trabajo → estudiante se postula → encargado acepta → encargado cierra el trabajo registrando asistencia → el sistema acredita horas una sola vez → estudiante consulta su progreso. La fuente de verdad propuesta del contrato y permisos está en los documentos versionados del repositorio backend. Al integrar la API se reemplazarán los estados vacíos por datos reales y el selector de rol de vista preliminar por el rol autenticado.
