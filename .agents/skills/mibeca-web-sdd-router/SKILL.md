---
name: mibeca-web-sdd-router
description: Enruta toda instrucción recibida en el frontend MiBeca hacia el flujo spec-driven development y la skill local adecuada. Usar SIEMPRE al iniciar cualquier tarea en este repositorio, antes de explorar o escribir código.
---

# Enrutador skill SDD del frontend MiBeca

Ante cualquier instrucción, clasifica la tarea en una fase del ciclo
**especificar → implementar → probar → desplegar** y carga las skills locales de
esa fase ANTES de escribir o modificar código.

## Skills locales (solo estas se nombran)

`mibeca-web-sdd-router` (esta), `spec-driven-development`, `vercel-react-best-practices`,
`vitest`, `api-integration-contract`, `frontend-accessibility`, `firebase-hosting-basics`.

- **Si ninguna local encaja**: solo entonces analiza las skills globales disponibles
  en tu entorno, elige la que mejor coincida con la instrucción y úsala, explicando
  la elección en una línea. Nunca menciones skills globales cuando una local aplique.
- **Si tampoco hay global que encaje**: implementa de forma normal sin skills y termina
  la respuesta anunciando: «No se usaron skills para esta tarea: ninguna skill aplicaba
  a [tipo de trabajo]».

## Clasificación con skills locales

| Instrucción típica | Skills locales a cargar |
|---|---|
| "implementa / añade la pantalla o funcionalidad X" | Sin spec previa: `spec-driven-development` desde fase Specify; con spec o "tarea N": implementación. Siempre añadir `vercel-react-best-practices` para los componentes y `api-integration-contract` si la pantalla consume la API (rutas solo en `src/api/endpoints.js`). Para accesibilidad y responsive: `frontend-accessibility`. |
| "modifica un endpoint consumido / formularios / errores de la API / sesiones" | `api-integration-contract` (no crear contratos paralelos; anotar la revisión del contrato del backend usada). Si el cambio toca componentes, añadir `frontend-accessibility`. |
| "arregla este bug / fallan los tests" | Si toca API: `api-integration-contract`. Si toca componentes o estilos: `frontend-accessibility`. Las pruebas corren con `vitest` en `npm test`. Prueba de regresión primero. |
| "despliega / publica el frontend" | `firebase-hosting-basics` SOLO con tarea expresa del responsable: el `AGENTS.md` prohíbe publicar o acceder a servicios externos por iniciativa propia. Conservar la configuración Firebase y los workflows actuales. |
| "explora / ¿cómo funciona X?" | Graph primero (codebase-memory), fallback a read/grep. No editar. |

## Skills locales del pack Firebase no aplicables en este MVP

`firebase-auth-basics`, `firebase-firestore`, `firebase-data-connect`, `firebase-ai-logic-basics`,
`firebase-crashlytics`, `firebase-security-rules-auditor`, `firestore-rules-creation`,
`firebase-remote-config-basics`, `firebase-app-hosting-basics`, `firebase-basics`,
`extension-to-functions-codebase`, `xcode-project-setup`: el frontend usa la API del backend
como fuente de autenticación y datos; nomontes Firestore, Auth de Firebase ni ningún servicio
 extra. Quedan instaladas como referencia futura; no las uses sin tarea expresa.

## Fuera de alcance explícito

- Backend, contratos de API y migraciones: viven en el repositorio
  `gestion-de-trabajo-becario-backend`. En este repo solo se consume el contrato.
- Mocks: consígnelos siempre como demostración; la autorización real de cada rol
  corresponde al backend.

## Reglas no negociables del repositorio (recordatorio)

- Mantén la identidad visual en `src/styles/theme.css` con variables compartidas;
  accesibilidad móvil y escritorio siempre.
- Toda ruta de API declarada en `src/api/endpoints.js` (`RUTAS` y funciones de dominio);
  `test/endpoints.test.js` falla si aparece una ruta literal fuera de ese archivo.
- Antes de PR: `npm run lint` y `npm run build`.
- Nunca te autoautorices ni edites controles para evitar un rechazo.
