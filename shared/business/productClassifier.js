import { PRODUCT_STATES } from "../models/Product.js";
import { validateProductData } from "../validators/productValidators.js";

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

  // Convertir fechas a timestamps para comparación
  const frontDate = new Date(fechaFrente).setHours(0, 0, 0, 0);
  const storageDate = new Date(fechaAlmacen).setHours(0, 0, 0, 0);

  // Si las fechas son diferentes, es "frente-cambia"
  if (frontDate !== storageDate) {
    return PRODUCT_STATES.FRENTE_CAMBIA;
  }

  // Si las fechas coinciden
  if (frontDate === storageDate) {
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

  // Retornar objeto completo
  return {
    ...data,
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

  if (localResult.estado !== serverResult.estado) {
    differences.push({
      field: "estado",
      local: localResult.estado,
      server: serverResult.estado,
      description:
        "El estado calculado localmente no coincide con el del servidor",
    });
  }

  // Comparar fechas (convertidas a timestamp para evitar problemas de formato)
  const compareDates = (local, server, fieldName) => {
    if (!local && !server) return;
    if (!local || !server) {
      differences.push({
        field: fieldName,
        local: local ? new Date(local).toISOString() : null,
        server: server ? new Date(server).toISOString() : null,
        description: `La fecha ${fieldName} no coincide`,
      });
      return;
    }
    const localDate = new Date(local).setHours(0, 0, 0, 0);
    const serverDate = new Date(server).setHours(0, 0, 0, 0);
    if (localDate !== serverDate) {
      differences.push({
        field: fieldName,
        local: new Date(local).toISOString(),
        server: new Date(server).toISOString(),
        description: `La fecha ${fieldName} no coincide`,
      });
    }
  };

  compareDates(
    localResult.fechaFrente,
    serverResult.fechaFrente,
    "fechaFrente"
  );
  compareDates(
    localResult.fechaAlmacen,
    serverResult.fechaAlmacen,
    "fechaAlmacen"
  );

  // Comparar arrays de fechas
  if (
    Array.isArray(localResult.fechasAlmacen) &&
    Array.isArray(serverResult.fechasAlmacen)
  ) {
    if (
      localResult.fechasAlmacen.length !== serverResult.fechasAlmacen.length
    ) {
      differences.push({
        field: "fechasAlmacen",
        local: localResult.fechasAlmacen,
        server: serverResult.fechasAlmacen,
        description: "El número de fechas de almacén no coincide",
      });
    } else {
      localResult.fechasAlmacen.forEach((fecha, index) => {
        compareDates(
          fecha,
          serverResult.fechasAlmacen[index],
          `fechasAlmacen[${index}]`
        );
      });
    }
  }

  return {
    match: differences.length === 0,
    differences,
  };
}

export { classifyProduct, processProduct, compareClassifications };
