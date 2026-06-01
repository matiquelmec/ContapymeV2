/**
 * Feriados legales de Chile.
 *
 * Incluye los feriados de fecha fija más Viernes y Sábado Santo (calculados con
 * el algoritmo de Pascua de Meeus/Jones/Butcher). No modela los traslados a
 * lunes de la Ley 19.973 ni feriados regionales; para el conteo de días hábiles
 * de feriado legal esto es suficiente y muy superior a ignorar los festivos.
 */

// Feriados de fecha fija (MM-DD)
const FIXED_HOLIDAYS = [
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "05-21", // Glorias Navales
  "06-20", // Día de los Pueblos Indígenas
  "06-29", // San Pedro y San Pablo
  "07-16", // Virgen del Carmen
  "08-15", // Asunción de la Virgen
  "09-18", // Independencia Nacional
  "09-19", // Glorias del Ejército
  "10-12", // Encuentro de Dos Mundos
  "10-31", // Día de las Iglesias Evangélicas
  "11-01", // Día de Todos los Santos
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
]

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

/** Domingo de Pascua del año dado (algoritmo de Meeus/Jones/Butcher). */
function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = marzo, 4 = abril
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day, 12, 0, 0)
}

/** Conjunto de feriados (YYYY-MM-DD) para un año. */
export function getChileHolidays(year: number): Set<string> {
  const set = new Set<string>()
  for (const md of FIXED_HOLIDAYS) {
    set.add(`${year}-${md}`)
  }
  const easter = easterSunday(year)
  const goodFriday = new Date(easter)
  goodFriday.setDate(easter.getDate() - 2)
  const holySaturday = new Date(easter)
  holySaturday.setDate(easter.getDate() - 1)
  set.add(`${goodFriday.getFullYear()}-${pad(goodFriday.getMonth() + 1)}-${pad(goodFriday.getDate())}`)
  set.add(`${holySaturday.getFullYear()}-${pad(holySaturday.getMonth() + 1)}-${pad(holySaturday.getDate())}`)
  return set
}

export function isChileHoliday(date: Date): boolean {
  const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return getChileHolidays(date.getFullYear()).has(key)
}

/**
 * Cuenta los días hábiles (lunes a viernes, excluyendo feriados legales) entre
 * dos fechas inclusive. Devuelve 0 si el rango es inválido.
 */
export function countBusinessDays(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0
  const start = new Date(`${startISO.slice(0, 10)}T12:00:00`)
  const end = new Date(`${endISO.slice(0, 10)}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0

  // Cachear los feriados por año del rango.
  const holidaysByYear = new Map<number, Set<string>>()
  const holidaysFor = (year: number) => {
    let h = holidaysByYear.get(year)
    if (!h) {
      h = getChileHolidays(year)
      holidaysByYear.set(year, h)
    }
    return h
  }

  let count = 0
  const cur = new Date(start.getTime())
  while (cur <= end) {
    const dow = cur.getDay()
    const key = `${cur.getFullYear()}-${pad(cur.getMonth() + 1)}-${pad(cur.getDate())}`
    if (dow !== 0 && dow !== 6 && !holidaysFor(cur.getFullYear()).has(key)) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}
