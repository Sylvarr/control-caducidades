import { PRODUCT_STATES } from "../models/Product.js";
import { validateProductData } from "../validators/productValidators.js";
import { areDatesEqual, areDateArraysEqual } from "../utils/dateUtils.js";

/**
 * Clasifica un producto basado en sus fechas y estado
 * @param {Object} params - Parámetros para la clasificación
 * @param {Date|string} params.fechaFrente - Fecha del producto en el frente
 * @param {Date|string|null} params.fechaAlmacen - Fecha del producto en almacén
 * @param {Array<Date|string>} [params.fechasAlmacen=[]] - Lista de fechas adicionales en almacén
 * @param {boolean} [params.cajaUnica=false] - Indica si es la última caja
 * @returns {string} El estado del producto
 * @throws {Error} Si falta la fecha de frente
 */
function classifyProduct({
  fechaFrente,
  fechaAlmacen,
  fechasAlmacen = [],
  cajaUnica = false,
}) {
  // Validar fechas requeridas
  if (!fechaFrente) {
    throw new Error("La fecha de frente es requerida");
  }

  // Si no hay fecha de almacén, es "frente-agota"
  if (!fechaAlmacen) {
    return PRODUCT_STATES.FRENTE_AGOTA;
  }

  // Si las fechas son diferentes, es "frente-cambia"
  if (!areDatesEqual(fechaFrente, fechaAlmacen)) {
    return PRODUCT_STATES.FRENTE_CAMBIA;
  }

  // Si las fechas coinciden
  if (areDatesEqual(fechaFrente, fechaAlmacen)) {
    if (cajaUnica) {
      return PRODUCT_STATES.ABIERTO_AGOTA;
    } else if (fechasAlmacen && fechasAlmacen.length > 0) {
      return PRODUCT_STATES.ABIERTO_CAMBIA;
    } else {
      return PRODUCT_STATES.SIN_CLASIFICAR;
    }
  }

  // Por defecto, sin clasificar
  return PRODUCT_STATES.SIN_CLASIFICAR;
}

/**
 * Procesa y clasifica un producto, incluyendo validación
 * @param {Object} data - Datos del producto a procesar
 * @returns {Object} Producto procesado con su estado calculado
 * @throws {Error} Si la validación falla o si falta información requerida
 */
function processProduct(data) {
  // Validar datos
  const validation = validateProductData(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  // Clasificar producto
  const estado = classifyProduct(data);

  // Retornar objeto completo con fechas normalizadas
  return {
    ...data,
    fechaFrente: data.fechaFrente,
    fechaAlmacen: data.fechaAlmacen,
    fechasAlmacen: data.fechasAlmacen || [],
    cajaUnica: Boolean(data.cajaUnica),
    estado,
  };
}

/**
 * Compara la clasificación local con la del servidor para detectar discrepancias
 * @param {Object} localResult - Resultado de la clasificación local
 * @param {Object} serverResult - Resultado de la clasificación del servidor
 * @returns {Object} Resultado de la comparación { match: boolean, differences: Array }
 */
function compareClassifications(localResult, serverResult) {
  const differences = [];

  // Comparar estados
  if (localResult.estado !== serverResult.estado) {
    differences.push({
      field: "estado",
      local: localResult.estado,
      server: serverResult.estado,
      description:
        "El estado calculado localmente no coincide con el del servidor",
    });
  }

  // Comparar fechas individuales
  if (!areDatesEqual(localResult.fechaFrente, serverResult.fechaFrente)) {
    differences.push({
      field: "fechaFrente",
      local: localResult.fechaFrente,
      server: serverResult.fechaFrente,
      description: "La fecha de frente no coincide",
    });
  }

  if (!areDatesEqual(localResult.fechaAlmacen, serverResult.fechaAlmacen)) {
    differences.push({
      field: "fechaAlmacen",
      local: localResult.fechaAlmacen,
      server: serverResult.fechaAlmacen,
      description: "La fecha de almacén no coincide",
    });
  }

  // Comparar arrays de fechas
  if (
    !areDateArraysEqual(localResult.fechasAlmacen, serverResult.fechasAlmacen)
  ) {
    differences.push({
      field: "fechasAlmacen",
      local: localResult.fechasAlmacen,
      server: serverResult.fechasAlmacen,
      description: "Las fechas de almacén adicionales no coinciden",
    });
  }

  // Comparar caja única
  if (Boolean(localResult.cajaUnica) !== Boolean(serverResult.cajaUnica)) {
    differences.push({
      field: "cajaUnica",
      local: localResult.cajaUnica,
      server: serverResult.cajaUnica,
      description: "El estado de caja única no coincide",
    });
  }

  return {
    match: differences.length === 0,
    differences,
  };
}

export { classifyProduct, processProduct, compareClassifications };
