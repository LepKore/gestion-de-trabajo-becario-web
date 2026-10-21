// Verificacion de paridad del motor de auditoria.
//
// Ejecuta la tabla canonica de casos contra `../lib/code-audit-rules.js` sin arrancar
// OpenCode. Uso: `node .opencode/plugin/code-audit.verify.mjs`
// Sale con codigo 1 si algun caso no coincide.

import { auditPath, auditText, claveDe } from "../lib/code-audit-rules.js"

// Los casos de reglas `deny` arman sus patrones en tiempo de ejecucion para que
// este archivo no contenga ellos mismos un secreto literal.
const CLAVE_FALSA = ["-----BEGIN", "RSA PRIVATE KEY-----"].join(" ")
const TOKEN_FALSO = ["ghp", "0123456789abcdefghijklmn"].join("_")
const ALMACEN = ["local", "Storage"].join("")

const CASES = [
  {
    nombre: "SEC-01 bloquea una clave privada pegada",
    ruta: "src/lib/config.js",
    texto: `export const k = "${CLAVE_FALSA}"\n`,
    esperado: ["SEC-01"],
  },
  {
    nombre: "SEC-01 bloquea un token de GitHub pegada",
    ruta: "src/lib/config.js",
    texto: `export const t = "${TOKEN_FALSO}"\n`,
    esperado: ["SEC-01"],
  },
  {
    nombre: "SEC-02 bloquea .env real",
    ruta: ".env",
    texto: "",
    esperado: ["SEC-02"],
  },
  {
    nombre: "SEC-02 permite .env.example",
    ruta: ".env.example",
    texto: "",
    esperado: [],
  },
  {
    nombre: "SEC-02 bloquea credenciales de servicio",
    ruta: "credenciales/firebase-adminsdk-prod.json",
    texto: "",
    esperado: ["SEC-02"],
  },
  {
    nombre: "SEC-03 bloquea token de sesion en el navegador",
    ruta: "src/lib/sesion.js",
    texto: `${ALMACEN}.setItem("mibeca.sesion", token)\n`,
    esperado: ["SEC-03"],
  },
  {
    nombre: "SEC-03 permite el token CSRF",
    ruta: "src/lib/api.js",
    texto: 'window.sessionStorage.setItem("mibeca.csrf", csrfToken)\n',
    esperado: [],
  },
  {
    nombre: "API-01 bloquea ruta literal en una pagina",
    ruta: "src/pages/Trabajos.jsx",
    texto: 'const r = await apiRequest("/jobs")\n',
    esperado: ["API-01", "API-02"],
  },
  {
    nombre: "API-01 permite la ruta dentro de endpoints.js",
    ruta: "src/api/endpoints.js",
    texto: 'export const RUTAS = { trabajos: "/jobs" }\n',
    esperado: [],
  },
  {
    nombre: "API-01 no se dispara en comentarios",
    ruta: "src/lib/api.js",
    texto: "// GET /auth/me renueva el CSRF\n",
    esperado: [],
  },
  {
    nombre: "A11Y-05 no marca el input envuelto en label",
    ruta: "src/pages/AdminSupervision.jsx",
    texto: '<label className="form-field"><span>Horas</span><input type="search" /></label>\n',
    esperado: [],
  },
  {
    nombre: "A11Y-01 marca una imagen sin alt",
    ruta: "src/pages/A.jsx",
    texto: "<img src={logo} />\n",
    esperado: ["A11Y-01"],
  },
  {
    nombre: "CSS-01 marca un color literal en un componente",
    ruta: "src/pages/A.jsx",
    texto: 'const estilo = { color: "#06175D" }\n',
    esperado: ["CSS-01"],
  },
  {
    nombre: "CSS-01 permite los colores del tema",
    ruta: "src/styles/theme.css",
    texto: ":root { --brand: #06175D; }\n",
    esperado: [],
  },
  {
    nombre: "CSS-02 tolera prefers-reduced-motion",
    ruta: "src/index.css",
    texto: "@media (prefers-reduced-motion: reduce) { * { transition-duration: 0.01ms !important; } }\n",
    esperado: [],
  },
  {
    nombre: "REACT-01 marca un intervalo sin limpieza",
    ruta: "src/pages/A.jsx",
    texto: "useEffect(() => {\n  const id = setInterval(tic, 1000)\n}, [])\n",
    esperado: ["REACT-01"],
  },
  {
    nombre: "SUP-01 exige justificar una supresion",
    ruta: "src/lib/x.js",
    texto: "// eslint-disable-next-line no-undef\n",
    esperado: ["SUP-01"],
  },
  {
    nombre: "SUP-01 acepta una supresion justificada",
    ruta: "src/lib/x.js",
    texto: "// eslint-disable-next-line no-undef -- llega desde el contrato\n",
    esperado: [],
  },
  {
    nombre: "el motor ignora dist",
    ruta: "dist/assets/index.js",
    texto: 'await apiRequest("/jobs")\n',
    esperado: [],
  },
  {
    nombre: "el motor ignora .opencode",
    ruta: ".opencode/lib/code-audit-rules.js",
    texto: 'await apiRequest("/jobs")\n',
    esperado: [],
  },
]

let fallos = 0

for (const caso of CASES) {
  const hallazgos = [...auditPath(caso.ruta), ...auditText({ path: caso.ruta, text: caso.texto })]
  const obtenido = [...new Set(hallazgos.map((h) => h.id))].sort()
  const esperado = [...new Set(caso.esperado)].sort()
  const ok = obtenido.length === esperado.length && obtenido.every((id, i) => id === esperado[i])
  if (ok) {
    console.log(`OK    ${caso.nombre}`)
    continue
  }
  fallos += 1
  console.log(`FALLA ${caso.nombre}`)
  console.log(`      esperado: ${esperado.join(", ") || "(sin hallazgos)"}`)
  console.log(`      obtenido: ${obtenido.join(", ") || "(sin hallazgos)"}`)
  for (const hallazgo of hallazgos) {
    console.log(`      detalle:  ${claveDe(hallazgo)}`)
  }
}

console.log("")
console.log(`${CASES.length - fallos}/${CASES.length} casos coinciden`)
process.exit(fallos === 0 ? 0 : 1)
