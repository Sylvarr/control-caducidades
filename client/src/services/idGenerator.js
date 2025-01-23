import { v4 as uuidv4 } from "uuid";
import IndexedDB from "./indexedDB";
import OfflineDebugger from "../utils/debugger";

const ENTITY_TYPES = {
  CATALOG_PRODUCT: "CATALOG",
  PRODUCT_STATUS: "STATUS",
};

class IdGeneratorService {
  constructor() {
    this.entityTypes = ENTITY_TYPES;
  }

  /**
   * Genera un ID temporal único para una entidad
   * @param {string} entityType - Tipo de entidad (CATALOG o STATUS)
   * @returns {string} ID temporal único
   */
  generateTempId(entityType) {
    try {
      OfflineDebugger.log("ID_GENERATOR_START", { entityType });

      if (!Object.values(this.entityTypes).includes(entityType)) {
        const error = new Error(`Tipo de entidad no válido: ${entityType}`);
        OfflineDebugger.error("INVALID_ENTITY_TYPE", error);
        throw error;
      }

      const timestamp = Date.now();
      const uuid = uuidv4();
      const tempId = `temp_${entityType}_${timestamp}_${uuid}`;

      OfflineDebugger.log("TEMP_ID_CREATION", {
        entityType,
        timestamp,
        uuid,
        tempId,
      });

      // Registrar el ID temporal en IndexedDB
      IndexedDB.saveIdMapping({
        tempId,
        entityType,
        createdAt: new Date(timestamp).toISOString(),
      }).catch((error) => {
        OfflineDebugger.error("ERROR_SAVING_TEMP_ID", error, {
          tempId,
          entityType,
        });
      });

      return tempId;
    } catch (error) {
      OfflineDebugger.error("ID_GENERATOR_ERROR", error);
      throw error;
    }
  }

  /**
   * Verifica si un ID es temporal
   * @param {string} id - ID a verificar
   * @returns {boolean}
   */
  isTempId(id) {
    return typeof id === "string" && id.startsWith("temp_");
  }

  /**
   * Extrae el tipo de entidad de un ID temporal
   * @param {string} tempId - ID temporal
   * @returns {string|null} Tipo de entidad o null si no es válido
   */
  getEntityTypeFromTempId(tempId) {
    if (!this.isTempId(tempId)) return null;

    const parts = tempId.split("_");
    if (parts.length < 3) return null;

    const entityType = parts[1];
    return Object.values(this.entityTypes).includes(entityType)
      ? entityType
      : null;
  }

  /**
   * Obtiene el ID permanente para un ID temporal si existe
   * @param {string} tempId - ID temporal
   * @returns {Promise<string|null>} ID permanente o null si no existe
   */
  async getPermanentId(tempId) {
    try {
      const mapping = await IndexedDB.getIdMapping(tempId);
      return mapping?.permanentId || null;
    } catch (error) {
      OfflineDebugger.error("ERROR_GETTING_PERMANENT_ID", error);
      return null;
    }
  }

  /**
   * Registra un mapeo de ID temporal a permanente
   * @param {string} tempId - ID temporal
   * @param {string} permanentId - ID permanente
   * @returns {Promise<void>}
   */
  async registerPermanentId(tempId, permanentId) {
    try {
      await IndexedDB.updateIdMapping(tempId, permanentId);
      OfflineDebugger.log("ID_MAPPING_UPDATED", { tempId, permanentId });
    } catch (error) {
      OfflineDebugger.error("ERROR_UPDATING_ID_MAPPING", error);
      throw error;
    }
  }

  /**
   * Obtiene todos los mapeos de IDs pendientes de sincronización
   * @returns {Promise<Array>}
   */
  async getPendingMappings() {
    try {
      return await IndexedDB.getAllPendingMappings();
    } catch (error) {
      OfflineDebugger.error("ERROR_GETTING_PENDING_MAPPINGS", error);
      return [];
    }
  }
}

export default new IdGeneratorService();
