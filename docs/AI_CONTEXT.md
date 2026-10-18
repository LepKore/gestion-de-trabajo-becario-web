# Contexto de agentes: frontend MiBeca

## 1. Propósito y alcance

Este repositorio contiene React/Vite, estilos y Firebase Hosting. El backend y el contrato API viven en `gestion-de-trabajo-becario-backend`. El coordinador de la raíz asigna archivos y evita ediciones simultáneas.

## 2. Stack y estructura comprobados

React con JavaScript, Vite y ESLint. `src/App.jsx` presenta vistas preliminares para becario, encargado y administrador, con estados vacíos y formularios de trabajo y usuario sin envío. `src/styles/theme.css` centraliza colores y tipografía. El selector de rol es solo demostrativo. Firebase Hosting publica `dist` mediante workflows existentes, que no se modificaron en esta etapa.

## 3. Instalación y comandos

Consultar `README.md` y `package.json`; los comandos previstos son `npm ci`, `npm run lint`, `npm run build` y `npm run dev`. El 18-10-2026 se ejecutaron lint y build con Node de Windows; la verificación visual en navegador sigue pendiente.

## 4. Reglas y contrato

Leer el plan canónico en `../gestion-de-trabajo-becario-backend/docs/PLAN_MVP_MIBECA.md` desde la raíz común; esta carpeta conserva una copia idéntica para compañeros que clonan solo frontend. El contrato canónico futuro será `backend/openapi.yaml`; hoy `backend/docs/api-v1.md` es un borrador alineado en alcance, pero aún incompleto como contrato técnico. Anotar en cada PR el commit/tag del contrato backend usado; mientras está sin commit, declarar “borrador no fijado”. No copiar un contrato alternativo aquí. Los mocks deben identificarse como tales.

## 5. Estado y verificaciones

La interfaz no autentica, no consume API y no guarda datos. La navegación por rol no constituye autorización. Las acciones que requieren backend aparecen deshabilitadas o señalan que son una vista preliminar. El backend solo expone `/health` y `/ready`; `openapi.yaml` todavía no existe y `docs/api-v1.md` es un borrador sin esquemas completos. El 18-10-2026 se ejecutaron `npm run lint` y `npm run build` con Node de Windows; ambos finalizaron correctamente. No consta verificación de ejecuciones reales de Firebase ni gate de lint. Python 3.11.9 está disponible como `python` en el PowerShell del usuario; los hooks se ajustaron para usarlo. El hook Git, idéntico al de backend, permitió un commit temporal inocuo y bloqueó un `.env`; el script Codex pasó simulaciones, pero su activación real en el cliente no se verificó. Los cambios previos de `.agents` y `.claude` son ajenos a esta etapa.

## 6. Límites y siguientes tareas

No modificar configuración Firebase ni publicar por iniciativa del perfil. Al acordar el contrato, implementar adaptador API y pantallas reales según el plan, con pruebas de acceso y estados; no presentar datos simulados como reales. Entregar al coordinador rutas, resultados y dependencia exacta del backend.
