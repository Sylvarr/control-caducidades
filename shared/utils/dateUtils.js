/**
 * Normaliza una fecha para comparación, eliminando la hora
 * @param {Date|string|null} date - Fecha a normalizar
 * @returns {number|null} Timestamp de la fecha normalizada o null
 */
export function normalizeDate(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.setHours(0, 0, 0, 0);
}

/**
 * Compara dos fechas ignorando la hora
 * @param {Date|string|null} date1 - Primera fecha
 * @param {Date|string|null} date2 - Segunda fecha
 * @returns {boolean} true si las fechas son iguales
 */
export function areDatesEqual(date1, date2) {
  const normalized1 = normalizeDate(date1);
  const normalized2 = normalizeDate(date2);
  return normalized1 === normalized2;
}

/**
 * Compara dos arrays de fechas
 * @param {Array<Date|string>} dates1 - Primer array de fechas
 * @param {Array<Date|string>} dates2 - Segundo array de fechas
 * @returns {boolean} true si los arrays contienen las mismas fechas
 */
export function areDateArraysEqual(dates1 = [], dates2 = []) {
  if (dates1.length !== dates2.length) return false;

  const normalized1 = dates1.map(normalizeDate).filter(Boolean).sort();
  const normalized2 = dates2.map(normalizeDate).filter(Boolean).sort();

  return normalized1.every((date, index) => date === normalized2[index]);
}

/**
 * Convierte una fecha a formato ISO sin hora
 * @param {Date|string|null} date - Fecha a convertir
 * @returns {string|null} Fecha en formato ISO YYYY-MM-DD o null
 */
export function toISODateString(date) {
  if (!date) return null;
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().split("T")[0];
}
