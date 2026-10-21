import { describe, expect, it } from 'vitest'
import {
  AREAS,
  REGLAS,
  auditDenegado,
  auditEntries,
  auditPath,
  auditText,
  claveDe,
  resumenTexto,
  rutaRelativa,
  tablaTexto,
} from '../.opencode/lib/code-audit-rules.js'

const ids = (hallazgos) => hallazgos.map((h) => h.id)

// Las pruebas de las reglas `deny` arman sus casos en tiempo de ejecucion: el
// archivo no puede contener los patrones literales que el propio hook bloquea.
const CLAVE_FALSA = ['-----BEGIN', 'RSA PRIVATE KEY-----'].join(' ')
const TOKEN_FALSO = ['ghp', '0123456789abcdefghijklmn'].join('_')
const ALMACEN = ['local', 'Storage'].join('')

describe('catálogo de reglas', () => {
  it('declara identificadores únicos y áreas conocidas', () => {
    const declarados = REGLAS.map((regla) => regla.id)
    expect(new Set(declarados).size).toBe(declarados.length)
    for (const regla of REGLAS) {
      expect(AREAS).toContain(regla.area)
      expect(['deny', 'warn', 'info']).toContain(regla.sev)
      expect(typeof regla.msg).toBe('string')
    }
  })

  it('solo cuatro reglas deniegan la escritura', () => {
    expect(REGLAS.filter((regla) => regla.sev === 'deny').map((regla) => regla.id).sort())
      .toEqual(['API-01', 'SEC-01', 'SEC-02', 'SEC-03'])
  })
})

describe('bloqueos duros', () => {
  it('SEC-01 detecta secretos incrustados', () => {
    const texto = `const clave = "${CLAVE_FALSA}"\nconst t = "${TOKEN_FALSO}"\n`
    expect(ids(auditText({ path: 'src/lib/x.js', text: texto }))).toContain('SEC-01')
  })

  it('SEC-01 no se dispara con texto corriente', () => {
    const texto = 'const clave = import.meta.env.VITE_API_URL\nconst t = tokenGuardado\n'
    expect(ids(auditText({ path: 'src/lib/x.js', text: texto }))).not.toContain('SEC-01')
  })

  it('SEC-02 bloquea credenciales por ruta', () => {
    expect(ids(auditPath('.env'))).toContain('SEC-02')
    expect(ids(auditPath('.env.local'))).toContain('SEC-02')
    expect(ids(auditPath('credentials/service-account.json'))).toContain('SEC-02')
    expect(ids(auditPath('certificados/firma.p12'))).toContain('SEC-02')
  })

  it('SEC-02 permite .env.example y archivos normales', () => {
    expect(ids(auditPath('.env.example'))).not.toContain('SEC-02')
    expect(ids(auditPath('src/pages/Trabajos.jsx'))).not.toContain('SEC-02')
  })

  it('SEC-03 bloquea tokens de sesión en el navegador', () => {
    const texto = `${ALMACEN}.setItem("mibeca.sesion", token)\n${ALMACEN}.setItem("auth_session", jwt)\n`
    expect(ids(auditText({ path: 'src/lib/sesion.js', text: texto }))).toContain('SEC-03')
  })

  it('SEC-03 no se dispara con el token CSRF, que sí vive en sessionStorage', () => {
    const texto = [
      "const CSRF_STORAGE_KEY = 'mibeca.csrf'",
      'window.sessionStorage.setItem(CSRF_STORAGE_KEY, token)',
    ].join('\n')
    expect(ids(auditText({ path: 'src/lib/api.js', text: texto }))).not.toContain('SEC-03')
  })

  it('API-01 bloquea rutas de API literales fuera de endpoints.js', () => {
    const texto = "const listado = await apiRequest('/jobs')\n"
    expect(ids(auditText({ path: 'src/pages/Trabajos.jsx', text: texto }))).toContain('API-01')
    expect(ids(auditText({ path: 'src/api/endpoints.js', text: texto }))).not.toContain('API-01')
  })

  it('API-01 no se dispara en comentarios documentales', () => {
    const texto = '// Registra el callback cuando /auth/me responde 401\n * GET /users devuelve el listado\n'
    expect(ids(auditText({ path: 'src/lib/api.js', text: texto }))).not.toContain('API-01')
  })

  it('auditDenegado reúne los rechazos entre varias entradas', () => {
    const entradas = [
      { path: 'src/pages/A.jsx', text: "apiRequest('/me')\n" },
      { path: 'src/pages/B.jsx', text: 'const color = "#06175D"\n' },
    ]
    expect(ids(auditDenegado(entradas))).toEqual(['API-01'])
  })
})

describe('contrato API', () => {
  it('API-02 avisa cuando apiRequest se importa fuera del cliente', () => {
    const texto = "import { apiRequest } from '../lib/api.js'\n"
    expect(ids(auditText({ path: 'src/pages/Trabajos.jsx', text: texto }))).toContain('API-02')
    expect(ids(auditText({ path: 'src/lib/useRecurso.js', text: 'const d = await apiRequest(ruta)\n' })))
      .not.toContain('API-02')
  })

  it('API-03 avisa de fetch directo en páginas y componentes', () => {
    const texto = "const r = await fetch('/api/v1/jobs')\n"
    expect(ids(auditText({ path: 'src/pages/Trabajos.jsx', text: texto }))).toContain('API-03')
    expect(ids(auditText({ path: 'src/lib/api.js', text: 'await fetch(url, opciones)\n' }))).not.toContain('API-03')
  })

  it('API-04 y API-05 vigilan CSRF e idempotencia del cliente', () => {
    const clienteSinCabeceras = 'export async function apiRequest(ruta) {\n  return fetch(ruta, { credentials: "include" })\n}\n'
    expect(ids(auditText({ path: 'src/lib/api.js', text: clienteSinCabeceras }))).toContain('API-04')
    expect(ids(auditText({ path: 'src/lib/api.js', text: clienteSinCabeceras }))).toContain('API-05')

    const clienteCompleto = [
      'export async function apiRequest(ruta) {',
      "  cabeceras['X-CSRF-Token'] = token",
      "  cabeceras['Idempotency-Key'] = idempotencyKey",
      '  return fetch(ruta, { headers: cabeceras, credentials: "include" })',
      '}',
    ].join('\n')
    const hallazgos = ids(auditText({ path: 'src/lib/api.js', text: clienteCompleto }))
    expect(hallazgos).not.toContain('API-04')
    expect(hallazgos).not.toContain('API-05')
  })

  it('API-06 tolera localhost y avisa del resto de http', () => {
    expect(ids(auditText({ path: 'src/lib/api.js', text: "const u = 'http://localhost:3000'\n" }))).not.toContain('API-06')
    expect(ids(auditText({ path: 'src/lib/api.js', text: "const u = 'http://api.mibeca.bo'\n" }))).toContain('API-06')
  })
})

describe('seguridad', () => {
  it('SEC-04 detecta inyección de HTML y eval', () => {
    const texto = '<div dangerouslySetInnerHTML={{ __html: datos }} />\n'
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: texto }))).toContain('SEC-04')
  })

  it('SEC-05 detecta variables VITE_ con nombre sensible', () => {
    expect(ids(auditText({ path: 'src/lib/api.js', text: 'const k = import.meta.env.VITE_API_SECRET\n' })))
      .toContain('SEC-05')
    expect(ids(auditText({ path: 'src/lib/api.js', text: 'const k = import.meta.env.VITE_API_URL\n' })))
      .not.toContain('SEC-05')
  })

  it('SEC-06 avisa de credenciales en consola', () => {
    expect(ids(auditText({ path: 'src/lib/api.js', text: 'console.log(sesion.token)\n' }))).toContain('SEC-06')
  })
})

describe('accesibilidad', () => {
  it('A11Y-01 detecta imagen sin alt', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<img src={logo} />\n' }))).toContain('A11Y-01')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<img src={logo} alt="MiBeca" />\n' }))).not.toContain('A11Y-01')
  })

  it('A11Y-02 detecta botón vacío', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<button className="x"></button>\n' }))).toContain('A11Y-02')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<button aria-label="Cerrar"></button>\n' }))).not.toContain('A11Y-02')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<button type="submit">Buscar</button>\n' }))).not.toContain('A11Y-02')
  })

  it('A11Y-03 detecta onClick en elementos no interactivos', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<div className="x" onClick={abrir}>\n' }))).toContain('A11Y-03')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<div role="button" tabIndex={0} onClick={abrir} onKeyDown={tecla}>\n' })))
      .not.toContain('A11Y-03')
  })

  it('A11Y-04 detecta tabIndex positivo', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<div tabIndex={3}>x</div>\n' }))).toContain('A11Y-04')
  })

  it('A11Y-05 no marca campos envueltos en <label>', () => {
    const texto = [
      '<label className="form-field"><span>Buscar estudiante</span><input type="search" value={q} /></label>',
      '<label className="form-field"><span>Horas</span><select value={p}><option>Todos</option></select></label>',
    ].join('\n')
    expect(ids(auditText({ path: 'src/pages/AdminSupervision.jsx', text: texto }))).not.toContain('A11Y-05')
  })

  it('A11Y-05 marca un campo sin etiqueta ni id', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<input type="search" value={q} />\n' }))).toContain('A11Y-05')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '<input id="q" type="search" />\n' }))).not.toContain('A11Y-05')
  })

  it('A11Y-05 reconoce el componente Field que inyecta label por props', () => {
    const conLabel = [
      '<Field label="Correo" name="correo">',
      '  {(props) => <input {...props} type="email" />}',
      '</Field>',
    ].join('\n')
    expect(ids(auditText({ path: 'src/pages/AdminUsuarios.jsx', text: `${conLabel}\n` }))).not.toContain('A11Y-05')
    const sinLabel = [
      '<Field name="correo">',
      '  {(props) => <input {...props} type="email" />}',
      '</Field>',
    ].join('\n')
    expect(ids(auditText({ path: 'src/pages/AdminUsuarios.jsx', text: `${sinLabel}\n` }))).toContain('A11Y-05')
  })

  it('A11Y-07 avisa de outline quitado sin foco visible', () => {
    expect(ids(auditText({ path: 'src/App.css', text: '.boton { outline: none; }\n' }))).toContain('A11Y-07')
    const conFoco = '.boton:focus-visible { outline: 3px solid var(--focus); }\n.boton { outline: 0; }\n'
    expect(ids(auditText({ path: 'src/App.css', text: conFoco }))).not.toContain('A11Y-07')
  })
})

describe('identidad visual', () => {
  it('CSS-01 avisa de colores literales fuera del tema', () => {
    expect(ids(auditText({ path: 'src/App.css', text: '.x { color: #06175D; }\n' }))).toContain('CSS-01')
    expect(ids(auditText({ path: 'src/styles/theme.css', text: '.x { color: #06175D; }\n' }))).not.toContain('CSS-01')
    expect(ids(auditText({ path: 'src/App.css', text: '.x { fill: url(#gradiente); }\n' }))).not.toContain('CSS-01')
  })

  it('CSS-02 tolera prefers-reduced-motion', () => {
    const motion = '@media (prefers-reduced-motion: reduce) { * { animation-duration: 0.01ms !important; } }'
    expect(ids(auditText({ path: 'src/index.css', text: `${motion}\n` }))).not.toContain('CSS-02')
    expect(ids(auditText({ path: 'src/App.css', text: '.x { margin: 0 !important; }\n' }))).toContain('CSS-02')
  })

  it('CSS-03 informa de tamaños en píxeles', () => {
    const hallazgos = auditText({ path: 'src/App.css', text: '.x { font-size: 14px; }\n' })
    expect(hallazgos.find((h) => h.id === 'CSS-03')?.sev).toBe('info')
  })
})

describe('calidad React', () => {
  it('REACT-01 avisa de efectos sin limpieza', () => {
    const sinLimpiar = 'useEffect(() => {\n  const id = setInterval(tic, 1000)\n}, [])\n'
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: sinLimpiar }))).toContain('REACT-01')

    const limpio = 'useEffect(() => {\n  const id = setInterval(tic, 1000)\n  return () => clearInterval(id)\n}, [])\n'
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: limpio }))).not.toContain('REACT-01')
  })

  it('REACT-02 avisa de key por índice y REACT-04 de mocks sin marca', () => {
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: 'datos.map((d, i) => <li key={i}>{d}</li>)\n' })))
      .toContain('REACT-02')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: 'const mock = { titulo: "x" }\n' }))).toContain('REACT-04')
    expect(ids(auditText({ path: 'src/pages/A.jsx', text: '// demo: mock de presentacion\nconst mock = { titulo: "x" }\n' })))
      .not.toContain('REACT-04')
  })
})

describe('higiene', () => {
  it('HYG-01 avisa de console.log y debugger', () => {
    expect(ids(auditText({ path: 'src/lib/x.js', text: 'console.log(1)\n' }))).toContain('HYG-01')
  })

  it('SUP-01 exige justificación en las supresiones', () => {
    expect(ids(auditText({ path: 'src/lib/x.js', text: '// eslint-disable-next-line no-undef\n' }))).toContain('SUP-01')
    expect(ids(auditText({ path: 'src/lib/x.js', text: '// eslint-disable-next-line no-undef -- llega desde el contrato\n' })))
      .not.toContain('SUP-01')
    expect(ids(auditText({ path: 'src/lib/x.js', text: '// el backend ya valida el campo\n// @ts-ignore\n' })))
      .not.toContain('SUP-01')
  })
})

describe('alcance del motor', () => {
  it('ignora dist, node_modules y el propio .opencode', () => {
    const texto = "const r = apiRequest('/jobs')\n"
    expect(auditText({ path: 'dist/assets/index.js', text: texto })).toEqual([])
    expect(auditText({ path: 'node_modules/x/index.js', text: texto })).toEqual([])
    expect(auditText({ path: '.opencode/lib/code-audit-rules.js', text: texto })).toEqual([])
  })

  it('aplica las reglas de src solo dentro de src', () => {
    expect(auditText({ path: 'scripts/build.js', text: "const r = apiRequest('/jobs')\n" })).toEqual([])
  })

  it('deduplica por regla, ruta y línea', () => {
    const entradas = [
      { path: 'src/pages/A.jsx', text: 'console.log(1)\n' },
      { path: 'src/pages/A.jsx', text: 'console.log(1)\n' },
    ]
    expect(auditEntries(entradas)).toHaveLength(1)
    expect(claveDe(auditEntries(entradas)[0])).toBe('HYG-01:src/pages/A.jsx:1')
  })

  it('normaliza rutas absolutas al repositorio', () => {
    const root = 'C:/VSCode/proyecto'
    expect(rutaRelativa(root, 'C:\\VSCode\\proyecto\\src\\pages\\A.jsx')).toBe('src/pages/A.jsx')
    expect(rutaRelativa(root, 'src/pages/A.jsx')).toBe('src/pages/A.jsx')
    expect(rutaRelativa(root, 'C:/otro/repo/src/index.css')).toBe('../../otro/repo/src/index.css')
  })

  it('resume hallazgos y produce tabla legible', () => {
    const hallazgos = auditText({ path: 'src/pages/A.jsx', text: 'console.log(1)\n' })
    expect(resumenTexto(hallazgos)).toContain('HYG-01 src/pages/A.jsx:1')
    expect(tablaTexto(hallazgos)).toContain('| warn | HYG-01 |')
    expect(tablaTexto([])).toBe('Auditoria MiBeca: sin hallazgos.')
  })
})
