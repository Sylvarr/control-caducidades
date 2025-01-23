/**
 * @typedef {Object} ProductStatus
 * @property {string} _id - ID del estado del producto
 * @property {CatalogProduct} producto - Referencia al producto del catálogo
 * @property {Date} fechaFrente - Fecha del producto en el frente
 * @property {Date|null} fechaAlmacen - Fecha del producto en almacén
 * @property {Date[]} fechasAlmacen - Lista de fechas adicionales en almacén
 * @property {boolean} cajaUnica - Indica si es la última caja
 * @property {string} estado - Estado actual del producto
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * @typedef {Object} CatalogProduct
 * @property {string} _id - ID del producto en el catálogo
 * @property {string} nombre - Nombre del producto
 * @property {boolean} activo - Estado activo/inactivo del producto
 * @property {('permanente'|'promocional')} tipo - Tipo de producto
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * Estados posibles de un producto
 * @readonly
 * @enum {string}
 */
export const PRODUCT_STATES = {
  /** Producto sin clasificar */
  SIN_CLASIFICAR: "sin-clasificar",
  /** Producto en frente que se agota */
  FRENTE_AGOTA: "frente-agota",
  /** Producto en frente que cambia */
  FRENTE_CAMBIA: "frente-cambia",
  /** Producto abierto que cambia */
  ABIERTO_CAMBIA: "abierto-cambia",
  /** Producto abierto que se agota */
  ABIERTO_AGOTA: "abierto-agota",
};

/**
 * Tipos de productos del catálogo
 * @readonly
 * @enum {string}
 */
export const PRODUCT_TYPES = {
  /** Producto permanente en el catálogo */
  PERMANENTE: "permanente",
  /** Producto promocional */
  PROMOCIONAL: "promocional",
};
