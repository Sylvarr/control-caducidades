/**
 * Valida los datos de un producto antes de clasificarlo
 * @param {Object} data - Datos del producto a validar
 * @returns {Object} Resultado de la validación { isValid: boolean, errors: string[] }
 */
export function validateProductData(data) {
  const errors = [];

  // Validar fecha de frente
  if (!data.fechaFrente) {
    errors.push("La fecha de frente es requerida");
  } else if (isNaN(new Date(data.fechaFrente).getTime())) {
    errors.push("La fecha de frente no es válida");
  }

  // Validar fecha de almacén si existe
  if (data.fechaAlmacen && isNaN(new Date(data.fechaAlmacen).getTime())) {
    errors.push("La fecha de almacén no es válida");
  }

  // Validar fechas adicionales de almacén
  if (data.fechasAlmacen) {
    if (!Array.isArray(data.fechasAlmacen)) {
      errors.push("Las fechas de almacén deben ser un array");
    } else {
      data.fechasAlmacen.forEach((fecha, index) => {
        if (isNaN(new Date(fecha).getTime())) {
          errors.push(`La fecha de almacén #${index + 1} no es válida`);
        }
      });
    }
  }

  // Validar caja única
  if (
    typeof data.cajaUnica !== "undefined" &&
    typeof data.cajaUnica !== "boolean"
  ) {
    errors.push("El campo cajaUnica debe ser un booleano");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida los datos de un producto del catálogo
 * @param {Object} data - Datos del producto del catálogo a validar
 * @returns {Object} Resultado de la validación { isValid: boolean, errors: string[] }
 */
export function validateCatalogProduct(data) {
  const errors = [];

  // Validar nombre
  if (!data.nombre) {
    errors.push("El nombre del producto es requerido");
  } else if (typeof data.nombre !== "string") {
    errors.push("El nombre del producto debe ser un texto");
  } else if (data.nombre.trim().length === 0) {
    errors.push("El nombre del producto no puede estar vacío");
  }

  // Validar tipo
  if (data.tipo && !["permanente", "promocional"].includes(data.tipo)) {
    errors.push("El tipo de producto debe ser 'permanente' o 'promocional'");
  }

  // Validar estado activo
  if (typeof data.activo !== "undefined" && typeof data.activo !== "boolean") {
    errors.push("El campo activo debe ser un booleano");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
