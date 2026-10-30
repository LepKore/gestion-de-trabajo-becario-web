// Contrato backend OpenAPI 1.6.0 (backend local, pendiente de commit).
export const ZONA_UNIVERSITARIA = import.meta.env.VITE_TIME_ZONE || 'America/La_Paz'

export function horas(minutos) {
  return `${new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 }).format(minutos / 60)} h`
}

export function horasAMinutos(valor) {
  const texto = String(valor).trim().replace(',', '.')
  if (!/^\d+(?:\.\d)?$/.test(texto)) throw new Error('Introduce horas positivas con un máximo de un decimal.')
  const [entero, decimal = '0'] = texto.split('.')
  const minutos = (Number(entero) * 10 + Number(decimal)) * 6
  if (!Number.isSafeInteger(minutos) || minutos <= 0 || minutos > 2147483647) throw new Error('La duración debe ser positiva y estar dentro del rango permitido.')
  return minutos
}

function fechaEnZona(instante, zona) {
  const partes = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(instante)).map(({ type, value }) => [type, value]))
  return `${partes.year}-${partes.month}-${partes.day}T${partes.hour}:${partes.minute}`
}

export function fechaVisible(valor) {
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium', timeStyle: 'short', timeZone: ZONA_UNIVERSITARIA }).format(new Date(valor))
}

export function fechaFormulario(valor, zona = ZONA_UNIVERSITARIA) {
  const instante = new Date(valor)
  if (!Number.isFinite(instante.getTime())) throw new Error('La fecha no es válida.')
  return fechaEnZona(instante.getTime(), zona)
}

// datetime-local no incluye zona. Resolvemos sus posibles offsets con Intl y
// comprobamos el resultado en la zona configurada antes de enviar UTC a la API.
export function fechaUTC(valor, zona = ZONA_UNIVERSITARIA, preferido) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) throw new Error('Completa las fechas.')
  const base = new Date(`${valor}:00Z`)
  if (!Number.isFinite(base.getTime()) || base.toISOString().slice(0, 16) !== valor) throw new Error('La fecha no es válida.')

  const anterior = new Date(preferido)
  if (Number.isFinite(anterior.getTime()) && fechaEnZona(anterior.getTime(), zona) === valor) return anterior.toISOString()

  const objetivo = base.getTime()
  const offsets = new Set([-86400000, 0, 86400000].map((desfase) => {
    const muestra = objetivo + desfase
    return Date.parse(`${fechaEnZona(muestra, zona)}:00Z`) - muestra
  }))
  const candidatos = [...offsets]
    .map((offset) => objetivo - offset)
    .filter((instante) => fechaEnZona(instante, zona) === valor)
    .sort((a, b) => a - b)

  if (candidatos.length === 0) throw new Error(`Esta hora no existe en ${zona}.`)
  if (candidatos.length > 1) throw new Error(`Esta hora es ambigua en ${zona}; elige otra hora.`)
  return new Date(candidatos[0]).toISOString()
}

export const CRITERIOS_EVALUACION = [
  ['responsabilidad', 'Responsabilidad'],
  ['puntualidad', 'Puntualidad'],
  ['proactividad', 'Proactividad'],
  ['comunicacion', 'Comunicación'],
]

export function validarEvaluacion(valor) {
  const numero = Number(valor)
  return Number.isInteger(numero) && numero >= 1 && numero <= 5
}

export function ratingVisible(valor) {
  return valor === null || valor === undefined ? 'Sin rating general' : `${Number(valor).toFixed(1)} / 5`
}
