---
name: api-integration-contract
description: Integra el frontend MiBeca con el contrato API real sin crear contratos paralelos. Usar al consumir o modificar endpoints, formularios, errores, sesiones o permisos.
---

# Integración con contrato API

1. Lee el `openapi.yaml` del backend y registra la revisión o commit consultado.
2. Usa `src/lib/api.js` como cliente HTTP único y respeta credenciales, CSRF y `ApiError`.
3. Comprueba cuerpos, códigos de estado, paginación y códigos de error contra el contrato.
4. Identifica explícitamente cualquier mock o estado vacío; no lo presentes como funcionalidad real.
5. Trata la autorización del backend como la autoridad; las rutas frontend no son un control de seguridad.
6. Verifica login, cierre de sesión, expiración, redirecciones y errores de red cuando el cambio los afecte.
7. Ejecuta `npm run lint`, `npm run build` y las pruebas disponibles antes de entregar.
