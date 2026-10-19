---
name: frontend-accessibility
description: Revisa accesibilidad y comportamiento responsive de pantallas React de MiBeca. Usar al crear o modificar componentes, formularios, navegación, rutas protegidas o estados de carga y error.
---

# Accesibilidad del frontend

1. Conserva las variables y la identidad visual de `src/styles/theme.css`.
2. Comprueba nombres accesibles, foco visible, orden de teclado, mensajes de error y estados de carga.
3. Usa elementos HTML semánticos antes de añadir ARIA; cada atributo ARIA debe justificar su necesidad.
4. Comprueba móvil y escritorio, contraste, zoom y rutas desconocidas.
5. Usa Playwright para verificar el flujo real cuando exista un servidor local.
6. No presentes mocks como datos reales y no sustituyas la autorización del backend por ocultar controles.
7. Antes de entregar ejecuta `npm run lint`, `npm run build` y las pruebas disponibles.
