// Reglas puras de auditoria de codigo; no depende de OpenCode.
//
// Motor determinista: recibe ruta y texto y devuelve hallazgos. Sin red, sin
// modelo, sin escritura. El plugin `.opencode/plugin/code-audit.js` lo conecta
// a OpenCode y `test/code-audit.test.js` lo verifica.
//
// Tipos de regla:
//   linea   -> se evalua por linea (salta comentarios si `saltarComentarios`)
//   archivo -> se evalua sobre el texto completo y reporta la linea del match
//   bloques -> recorre bloques `useEffect(...)` con llaves balanceadas
//   ruta    -> se evalua sobre la ruta, sin leer contenido
//
// Campos opcionales:
//   soloEn / soloFueraDe : prefijos de ruta (relativa al repo, con `/`)
//   requiere / unless    : regex que debe / no debe aparecer en la misma linea
//   extensiones          : regex sobre la ruta

export const AREAS = ["contrato", "seguridad", "a11y", "tema", "react", "higiene"];

export const SEVERIDADES = ["deny", "warn", "info"];

export const WRITE_TOOLS = new Set(["write", "edit", "multiedit", "patch", "apply_patch"]);

const PESO = { deny: 0, warn: 1, info: 2 };

const RUTAS_IGNORADAS = [
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)coverage\//,
  /(^|\/)\.git\//,
  /(^|\/)\.opencode\//,
  /package-lock\.json$/,
];

const CODIGO = /\.(?:jsx?|mjs|css)$/;

export const REGLAS = [
  // --- Seguridad ---------------------------------------------------------
  {
    id: "SEC-01",
    area: "seguridad",
    sev: "deny",
    tipo: "linea",
    test: /(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bghp_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAKIA[0-9A-Z]{16}\b|\bAIza[0-9A-Za-z_-]{30,})/,
    msg: "secreto incrustado: retiralo y usa una variable de entorno fuera del repositorio",
  },
  {
    id: "SEC-02",
    area: "seguridad",
    sev: "deny",
    tipo: "ruta",
    test: /(^|\/)\.env(?!\.example$)(\.[^/]*)?$|(^|\/)[^/]*firebase-adminsdk[^/]*\.json$|(^|\/)[^/]*(?:service[-_]?account|credenciales|credentials)[^/]*\.json$|\.(?:pem|p12|pfx|key)$/i,
    msg: "archivo de credenciales: no se versiona ni se escribe desde el agente",
  },
  {
    id: "SEC-03",
    area: "seguridad",
    sev: "deny",
    tipo: "linea",
    test: /(?:local|session)Storage\.(?:setItem|set)\s*\(/,
    requiere: /(sesion|session|auth|jwt|bearer|refresh|access_token|token)/i,
    unless: /csrf/i,
    msg: "la sesion es cookie HttpOnly: no guardes tokens de sesion en el almacenamiento del navegador",
  },
  {
    id: "SEC-04",
    area: "seguridad",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    test: /(dangerouslySetInnerHTML|\.innerHTML\s*=|\bnew Function\s*\(|document\.write\s*\(|\beval\s*\()/,
    msg: "ejecucion o insercion de HTML sin sanitizar",
  },
  {
    id: "SEC-05",
    area: "seguridad",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    test: /\bVITE_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|KEY)[A-Z0-9_]*\b/,
    msg: "toda variable VITE_ se publica en el bundle: no puede contener secretos",
  },
  {
    id: "SEC-06",
    area: "seguridad",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    test: /\bconsole\.\w+\s*\(/,
    requiere: /(password|contrasen|contrase|token|sesion|session|localStorage|credencial)/i,
    msg: "no registres datos de sesion o credenciales en consola",
  },

  // --- Contrato API ------------------------------------------------------
  {
    id: "API-01",
    area: "contrato",
    sev: "deny",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    soloFueraDe: ["src/api/endpoints.js"],
    test: /['"`]\/(?:auth|users|jobs|applications|me|students)\b/,
    msg: "ruta de API literal: declarala en src/api/endpoints.js (RUTAS)",
  },
  {
    id: "API-02",
    area: "contrato",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    soloFueraDe: ["src/lib/api.js", "src/lib/useRecurso.js", "src/api/endpoints.js"],
    test: /\bapiRequest\b/,
    msg: "apiRequest solo se importa desde src/lib/api.js y src/lib/useRecurso.js",
  },
  {
    id: "API-03",
    area: "contrato",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/pages/", "src/components/"],
    test: /\bfetch\s*\(/,
    msg: "usa el cliente unico (apiRequest o el hook de recurso) en lugar de fetch directo",
  },
  {
    id: "API-04",
    area: "contrato",
    sev: "warn",
    tipo: "archivo",
    soloEn: ["src/lib/api.js"],
    test: /X-CSRF-Token/g,
    requiereArchivo: /export\s+(?:async\s+)?function\s+apiRequest|await\s+fetch\s*\(/,
    invertida: true,
    msg: "el cliente debe enviar X-CSRF-Token en toda escritura",
  },
  {
    id: "API-05",
    area: "contrato",
    sev: "warn",
    tipo: "archivo",
    soloEn: ["src/lib/api.js"],
    test: /\bIdempotency-Key\b/g,
    requiereArchivo: /export\s+(?:async\s+)?function\s+apiRequest/,
    invertida: true,
    msg: "el cliente debe seguir admitiendo Idempotency-Key para el cierre de trabajo",
  },
  {
    id: "API-06",
    area: "contrato",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    test: /['"`]http:\/\//,
    unless: /(127\.0\.0\.1|localhost)/,
    msg: "transporte sin TLS fuera de desarrollo local",
  },

  // --- Accesibilidad -----------------------------------------------------
  {
    id: "A11Y-01",
    area: "a11y",
    sev: "warn",
    tipo: "archivo",
    extensiones: CODIGO,
    test: /<img\b[^>]*>/g,
    unless: /\balt=/,
    msg: "imagen sin atributo alt",
  },
  {
    id: "A11Y-02",
    area: "a11y",
    sev: "warn",
    tipo: "archivo",
    extensiones: CODIGO,
    test: /<button\b[^>]*>\s*<\/button>/g,
    unless: /aria-label|aria-labelledby/,
    msg: "boton sin texto accesible: agrega texto o aria-label",
  },
  {
    id: "A11Y-03",
    area: "a11y",
    sev: "warn",
    tipo: "archivo",
    extensiones: CODIGO,
    test: /<(?:div|span)\b[^>]*\bonClick\b[^>]*>/g,
    unless: /\brole=|\btabIndex\b|\bonKeyDown\b/,
    msg: "onClick en un elemento no interactivo: usa button o agrega role, tabIndex y onKeyDown",
  },
  {
    id: "A11Y-04",
    area: "a11y",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    extensiones: CODIGO,
    test: /\btabIndex=\{?["']?[1-9]/,
    msg: "tabIndex positivo rompe el orden natural de foco",
  },
  {
    id: "A11Y-05",
    area: "a11y",
    sev: "warn",
    tipo: "etiquetas",
    extensiones: CODIGO,
    test: /<(?:input|select|textarea)\b[^>]*>/g,
    unless: /aria-label|aria-labelledby|\bid=|type=["'](?:hidden|submit|button|checkbox|radio|file)["']/,
    msg: "campo sin etiqueta asociada: agrega label, aria-label o id",
  },
  {
    id: "A11Y-06",
    area: "a11y",
    sev: "info",
    tipo: "linea",
    saltarComentarios: true,
    extensiones: CODIGO,
    test: /\bautoFocus\b/,
    msg: "autoFocus desplaza el foco al montar; revisa el flujo de teclado",
  },
  {
    id: "A11Y-07",
    area: "a11y",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    extensiones: /\.css$/,
    test: /outline:\s*(?:none|0)\b/,
    unless: /focus-visible|focus\b/,
    contextoPrevio: /:focus-visible|:focus\b/,
    msg: "quitar el outline sin :focus-visible deja la interfaz sin foco visible",
  },

  // --- Identidad visual --------------------------------------------------
  {
    id: "CSS-01",
    area: "tema",
    sev: "warn",
    tipo: "archivo",
    soloEn: ["src/"],
    soloFueraDe: ["src/styles/theme.css"],
    extensiones: CODIGO,
    test: /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b|\brgba?\(|\bhsla?\(/g,
    unless: /url\(\s*#/,
    msg: "color literal: usa las variables de src/styles/theme.css",
  },
  {
    id: "CSS-02",
    area: "tema",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    soloFueraDe: ["src/styles/theme.css"],
    extensiones: /\.css$/,
    test: /!important/,
    unless: /prefers-reduced-motion/,
    msg: "!important fuera del tema: corrige la especificidad en lugar de forzarla",
  },
  {
    id: "CSS-03",
    area: "tema",
    sev: "info",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    soloFueraDe: ["src/styles/theme.css"],
    extensiones: /\.css$/,
    test: /font-size:\s*\d+(?:\.\d+)?px/,
    msg: "el tema define --font-*; usa la escala compartida",
  },

  // --- Calidad React -----------------------------------------------------
  {
    id: "REACT-01",
    area: "react",
    sev: "warn",
    tipo: "bloques",
    soloEn: ["src/"],
    extensiones: CODIGO,
    msg: "efecto con suscripcion o temporizador sin funcion de limpieza",
  },
  {
    id: "REACT-02",
    area: "react",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    extensiones: CODIGO,
    test: /\bkey=\{(?:index|i|idx)\}/,
    msg: "key por indice en listas que cambian de orden",
  },
  {
    id: "REACT-03",
    area: "react",
    sev: "info",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    extensiones: CODIGO,
    test: /useEffect\(\(\)\s*=>\s*\{?\s*set[A-Z]\w*\(\s*props?\./,
    msg: "estado derivado de props con useEffect: calculalo durante el render",
  },
  {
    id: "REACT-04",
    area: "react",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    extensiones: CODIGO,
    test: /\b(?:mock|Mock|datosSimulados|MOCK_[A-Z_]+)\b/,
    unless: /(demostra|demo\b|DEMO)/,
    contextoPrevio: /(demostra|demo\b|DEMO)/,
    msg: "dato simulado sin marcar como demostracion (regla de AGENTS.md)",
  },

  // --- Higiene y supresiones --------------------------------------------
  {
    id: "HYG-01",
    area: "higiene",
    sev: "warn",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    test: /\bconsole\.(?:log|debug)\s*\(|^\s*debugger\b/,
    msg: "resto de depuracion en el codigo de la aplicacion",
  },
  {
    id: "HYG-02",
    area: "higiene",
    sev: "info",
    tipo: "linea",
    saltarComentarios: true,
    soloEn: ["src/"],
    test: /\b(?:TODO|FIXME)\b/,
    msg: "pendiente declarado en el codigo: registralo en la documentacion o resolvelo",
  },
  {
    id: "SUP-01",
    area: "higiene",
    sev: "warn",
    tipo: "linea",
    soloFueraDe: ["test/"],
    test: /eslint-disable|@ts-ignore|@ts-expect-error/,
    justificacion: true,
    msg: "supresion de lint o de tipos sin justificar: explica el motivo o corrige la causa",
  },
];

// --- utilidades ----------------------------------------------------------

function normalizarRuta(valor) {
  return String(valor || "").replace(/\\/g, "/").replace(/^\.\//, "");
}

export function esIgnorada(ruta) {
  return RUTAS_IGNORADAS.some((patron) => patron.test(ruta));
}

function aplica(regla, ruta) {
  if (esIgnorada(ruta)) return false;
  if (regla.soloEn && !regla.soloEn.some((prefijo) => ruta.startsWith(prefijo))) return false;
  if (regla.soloFueraDe && regla.soloFueraDe.includes(ruta)) return false;
  if (regla.extensiones && !regla.extensiones.test(ruta)) return false;
  return true;
}

function esComentario(linea) {
  const t = linea.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

function lineaDe(texto, indice) {
  return texto.slice(0, indice).split(/\r?\n/).length;
}

function hallazgo(regla, ruta, linea) {
  return { id: regla.id, area: regla.area, sev: regla.sev, path: ruta, linea, msg: regla.msg };
}

export function claveDe(f) {
  return `${f.id}:${f.path}:${f.linea}`;
}

export function esDenegado(f) {
  return f.sev === "deny";
}

export function ordenar(hallazgos) {
  return [...hallazgos].sort(
    (a, b) => PESO[a.sev] - PESO[b.sev] || a.path.localeCompare(b.path) || a.linea - b.linea,
  );
}

// --- evaluadores ---------------------------------------------------------

function evaluarLinea(regla, ruta, lineas) {
  const salida = [];
  lineas.forEach((texto, indice) => {
    if (regla.saltarComentarios && esComentario(texto)) return;
    if (regla.requiere && !regla.requiere.test(texto)) return;
    if (regla.unless && regla.unless.test(texto)) return;
    if (regla.contextoPrevio) {
      const desde = Math.max(0, indice - 3);
      const previas = lineas.slice(desde, indice).join("\n");
      if (regla.contextoPrevio.test(previas)) return;
    }
    if (regla.justificacion) {
      const previa = indice > 0 ? lineas[indice - 1].trim() : "";
      const comentarioPrevio = previa.startsWith("//") && !/eslint-disable|@ts-/.test(previa);
      if (/--/.test(texto) || comentarioPrevio) return;
    }
    if (!regla.test.test(texto)) return;
    regla.test.lastIndex = 0;
    salida.push(hallazgo(regla, ruta, indice + 1));
  });
  return salida;
}

function evaluarArchivo(regla, ruta, texto) {
  if (regla.requiereArchivo && !regla.requiereArchivo.test(texto)) return [];
  const patron = new RegExp(regla.test.source, regla.test.flags.includes("g") ? regla.test.flags : `${regla.test.flags}g`);
  const coincidencias = [];
  let match;
  while ((match = patron.exec(texto)) !== null) {
    coincidencias.push(match);
    if (match.index === patron.lastIndex) patron.lastIndex += 1;
  }
  if (regla.invertida) {
    return coincidencias.length ? [] : [hallazgo(regla, ruta, 1)];
  }
  return coincidencias
    .filter((match) => !(regla.unless && regla.unless.test(match[0])))
    .map((match) => hallazgo(regla, ruta, lineaDe(texto, match.index)));
}

function bloquesUseEffect(texto) {
  const bloques = [];
  const patron = /useEffect\s*\(\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/g;
  let match;
  while ((match = patron.exec(texto)) !== null) {
    const inicio = match.index + match[0].length - 1;
    let profundidad = 0;
    let fin = inicio;
    for (; fin < texto.length; fin++) {
      if (texto[fin] === "{") profundidad += 1;
      else if (texto[fin] === "}") {
        profundidad -= 1;
        if (profundidad === 0) break;
      }
    }
    bloques.push({ inicio: match.index, fin, cuerpo: texto.slice(inicio, fin + 1) });
  }
  return bloques;
}

function evaluarEtiquetas(regla, ruta, texto) {
  const patron = new RegExp(regla.test.source, "g");
  const salida = [];
  let match;
  while ((match = patron.exec(texto)) !== null) {
    const etiqueta = match[0];
    if (regla.unless && regla.unless.test(etiqueta)) continue;
    const antes = texto.slice(0, match.index);
    const abre = antes.lastIndexOf("<label");
    const cierra = antes.lastIndexOf("</label>");
    const envuelto = abre !== -1 && abre > cierra && match.index - abre < 400;
    if (envuelto) continue;
    if (etiquetadoPorComponente(antes)) continue;
    salida.push(hallazgo(regla, ruta, lineaDe(texto, match.index)));
    if (match.index === patron.lastIndex) patron.lastIndex += 1;
  }
  return salida;
}

// Los campos de MiBeca se renderizan dentro de componentes propios que inyectan
// `id`/`aria-label` por `{...props}`: `<Field label="Correo">{(props) => <input {...props} />}</Field>`.
// Si el componente abierto mas cercano declara `label=`, el campo esta etiquetado.
function etiquetadoPorComponente(antes) {
  const ventana = antes.slice(-300);
  const inicio = ventana.search(/<(?:Field|Campo|Label|Input|TextInput)\b/);
  if (inicio === -1) return false;
  return /(?:^|[\s{])label\s*=/.test(ventana.slice(inicio));
}

function evaluarBloques(regla, ruta, texto) {
  if (regla.id !== "REACT-01") return [];
  const salida = [];
  for (const bloque of bloquesUseEffect(texto)) {
    if (!/addEventListener|setInterval|setTimeout|\.subscribe\s*\(/.test(bloque.cuerpo)) continue;
    if (/return\s*(?:\(\)|function|\()/.test(bloque.cuerpo)) continue;
    salida.push(hallazgo(regla, ruta, lineaDe(texto, bloque.inicio)));
  }
  return salida;
}

// --- API publica ---------------------------------------------------------

/** Audita la ruta sin leer contenido (credenciales, extensiones sensibles). */
export function auditPath(rutaCruda) {
  const ruta = normalizarRuta(rutaCruda);
  if (!ruta || esIgnorada(ruta)) return [];
  return REGLAS
    .filter((regla) => regla.tipo === "ruta" && aplica(regla, ruta) && regla.test.test(ruta))
    .map((regla) => hallazgo(regla, ruta, 1));
}

/** Audita un texto ya cargado. Devuelve hallazgos ordenados por severidad. */
export function auditText({ path, text }) {
  const ruta = normalizarRuta(path);
  const contenido = typeof text === "string" ? text : "";
  if (!ruta || !contenido || esIgnorada(ruta)) return [];
  const lineas = contenido.split(/\r?\n/);
  const salida = [];
  for (const regla of REGLAS) {
    if (!aplica(regla, ruta)) continue;
    if (regla.tipo === "linea") salida.push(...evaluarLinea(regla, ruta, lineas));
    else if (regla.tipo === "archivo") salida.push(...evaluarArchivo(regla, ruta, contenido));
    else if (regla.tipo === "bloques") salida.push(...evaluarBloques(regla, ruta, contenido));
    else if (regla.tipo === "etiquetas") salida.push(...evaluarEtiquetas(regla, ruta, contenido));
  }
  return ordenar(salida);
}

/** Audita varias entradas `{ path, text }` y deduplica por regla, ruta y linea. */
export function auditEntries(entradas) {
  const vistos = new Set();
  const salida = [];
  for (const entrada of entradas) {
    for (const f of auditText(entrada)) {
      const clave = claveDe(f);
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      salida.push(f);
    }
  }
  return ordenar(salida);
}

/** Hallazgos que justifican un rechazo de escritura. */
export function auditDenegado(entradas) {
  return auditEntries(entradas).filter(esDenegado);
}

export function mensajeRechazo(f) {
  return (
    `Hook local MiBeca: escritura rechazada por ${f.id} (${f.area}).\n` +
    `Archivo: ${f.path}:${f.linea}\n` +
    `Motivo: ${f.msg}.\n` +
    "Corrige el contenido; el agente no puede desactivar este control para pasar."
  );
}

export function resumenTexto(hallazgos, { maximo = 20 } = {}) {
  const lista = ordenar(hallazgos);
  if (!lista.length) return "";
  const mostrados = lista.slice(0, maximo);
  const lineas = mostrados.map((f) => `- ${f.id} ${f.path}:${f.linea} ${f.msg}`);
  const resto = lista.length - mostrados.length;
  return [
    `[auditoria MiBeca] ${lista.length} hallazgo(s) de la ultima escritura:`,
    ...lineas,
    ...(resto > 0 ? [`- y ${resto} mas; ejecuta /auditar para el detalle completo`] : []),
    "Corrige o justifica antes de cerrar la tarea.",
  ].join("\n");
}

export function tablaTexto(hallazgos) {
  if (!hallazgos.length) return "Auditoria MiBeca: sin hallazgos.";
  const filas = hallazgos.map((f) => `| ${f.sev} | ${f.id} | ${f.path}:${f.linea} | ${f.msg} |`);
  return [
    "| Severidad | Regla | Ubicacion | Hallazgo |",
    "| --- | --- | --- | --- |",
    ...filas,
    "",
    `Total: ${hallazgos.length} (deny ${contar(hallazgos, "deny")}, warn ${contar(hallazgos, "warn")}, info ${contar(hallazgos, "info")}).`,
  ].join("\n");
}

function contar(hallazgos, severidad) {
  return hallazgos.filter((f) => f.sev === severidad).length;
}

/** Normaliza una ruta absoluta o relativa a la forma relativa al repo. */
export function rutaRelativa(root, archivo) {
  const base = normalizarRuta(root);
  const destino = normalizarRuta(archivo);
  if (!destino) return "";
  if (!/^[A-Za-z]:\//.test(destino) && !destino.startsWith("/")) return destino;
  if (destino === base) return "";
  if (destino.startsWith(`${base}/`)) return destino.slice(base.length + 1);
  const partesBase = base.split("/");
  const partesDestino = destino.split("/");
  let comun = 0;
  while (comun < partesBase.length && partesBase[comun] === partesDestino[comun]) comun += 1;
  const subida = partesBase.length - comun;
  return [...Array(subida).fill(".."), ...partesDestino.slice(comun)].join("/");
}
