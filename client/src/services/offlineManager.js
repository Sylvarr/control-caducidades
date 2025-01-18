import FeatureManager from "../config/features";
import OfflineDebugger from "../utils/debugger";
import IndexedDB from "./indexedDB";
import { processProduct, compareClassifications } from "./productClassifier";
import * as api from "./api";

class OfflineManager {
  static instance = null;
  syncInProgress = false;

  get isOnline() {
    return navigator.onLine;
  }

  get isOfflineMode() {
    // Solo activar modo offline si:
    // 1. El feature flag está activado Y
    // 2. No hay conexión
    return FeatureManager.isEnabled("OFFLINE_MODE") && !this.isOnline;
  }

  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener("online", () => {
      OfflineDebugger.log("NETWORK_STATUS", { status: "online" });
      this.syncChanges();
    });

    window.addEventListener("offline", () => {
      OfflineDebugger.log("NETWORK_STATUS", { status: "offline" });
    });
  }

  // Métodos para productos y estados
  async getAllProductStatus() {
    try {
      OfflineDebugger.log("GET_PRODUCTS_START", {
        isOnline: this.isOnline,
        offlineMode: this.isOfflineMode,
      });

      if (this.isOnline && !this.isOfflineMode) {
        // Si estamos online y no en modo offline forzado, obtener del servidor
        const serverProducts = await api.http.getAllProductStatus();
        await this.saveToLocalStorage(serverProducts);
        return serverProducts;
      }

      // Modo offline - obtener de IndexedDB
      return await IndexedDB.getAllProductStatus();
    } catch (error) {
      OfflineDebugger.error("GET_PRODUCTS_ERROR", error);
      throw error;
    }
  }

  async updateProductStatus(productId, data) {
    try {
      // Procesar y validar datos localmente
      const processedData = processProduct(data);

      if (this.isOnline && !this.isOfflineMode) {
        const serverResult = await api.http.updateProductStatus(
          productId,
          processedData
        );

        // Comparar clasificación local con servidor
        const comparison = compareClassifications(processedData, serverResult);
        if (!comparison.match) {
          OfflineDebugger.log("CLASSIFICATION_MISMATCH", comparison);
        }

        await IndexedDB.saveProductStatus(serverResult);
        return serverResult;
      }

      // Modo offline - Obtener información del producto del catálogo y estado actual
      const [catalogProduct, currentStatus] = await Promise.all([
        IndexedDB.getCatalogProduct(productId),
        IndexedDB.getProductStatus(productId),
      ]);

      if (!catalogProduct) {
        throw new Error("Producto no encontrado en el catálogo local");
      }

      // Si ya existe un estado, verificar si hay cambios reales
      if (currentStatus) {
        const hasChanges = Object.entries(processedData).some(
          ([key, value]) => {
            // Comparar arrays de fechasAlmacen
            if (key === "fechasAlmacen") {
              if (!value)
                return currentStatus[key] && currentStatus[key].length > 0;
              if (!currentStatus[key]) return value.length > 0;
              if (value.length !== currentStatus[key].length) return true;
              return value.some(
                (date, index) => date !== currentStatus[key][index]
              );
            }
            return value !== currentStatus[key];
          }
        );

        if (!hasChanges) {
          OfflineDebugger.log("NO_CHANGES_DETECTED", {
            productId,
            current: currentStatus,
            new: processedData,
          });
          return currentStatus;
        }
      }

      // Modo offline - Combinar datos existentes con nuevos datos
      const productToSave = {
        ...(currentStatus || {}), // Mantener datos existentes si los hay
        producto: catalogProduct,
        ...processedData, // Sobrescribir con nuevos datos
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveProductStatus(productToSave);

      // Registrar cambio pendiente solo si hay cambios reales
      await IndexedDB.addPendingChange({
        type: "UPDATE",
        productId,
        data: processedData,
        timestamp: new Date().toISOString(),
      });

      return productToSave;
    } catch (error) {
      OfflineDebugger.error("UPDATE_PRODUCT_ERROR", error, {
        productId,
        data,
      });
      throw error;
    }
  }

  async deleteProductStatus(productId) {
    try {
      OfflineDebugger.log("DELETE_PRODUCT_STATUS", { productId });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await api.http.deleteProductStatus(productId);
        // Asegurar que se elimina de IndexedDB
        await IndexedDB.deleteProductStatus(productId);
        return result;
      }

      // En modo offline
      // 1. Verificar si el producto existe en IndexedDB
      const existingStatus = await IndexedDB.getProductStatus(productId);
      if (!existingStatus) {
        OfflineDebugger.log("PRODUCT_STATUS_NOT_FOUND", { productId });
        return { success: true };
      }

      // 2. Eliminar el estado
      await IndexedDB.deleteProductStatus(productId);

      // 3. Registrar el cambio pendiente
      await IndexedDB.addPendingChange({
        type: "DELETE",
        productId,
        timestamp: new Date().toISOString(),
      });

      // 4. Verificar y limpiar estados huérfanos
      const allStates = await IndexedDB.getAllProductStatus();
      OfflineDebugger.log("REMAINING_STATES", { count: allStates.length });

      return { success: true };
    } catch (error) {
      OfflineDebugger.error("DELETE_PRODUCT_ERROR", error, { productId });
      throw error;
    }
  }

  // Métodos para el catálogo
  async getAllCatalogProducts() {
    try {
      OfflineDebugger.log("GET_CATALOG_START", {
        isOnline: this.isOnline,
        offlineMode: this.isOfflineMode,
      });

      if (this.isOnline && !this.isOfflineMode) {
        const data = await api.http.getAllCatalogProducts();
        OfflineDebugger.log("CATALOG_SERVER_RESPONSE", { count: data.length });
        await this.saveCatalogToLocalStorage(data);
        return data;
      }

      const localData = await IndexedDB.getAllCatalog();
      OfflineDebugger.log("CATALOG_LOCAL_RESPONSE", {
        count: localData.length,
      });
      return localData;
    } catch (error) {
      OfflineDebugger.error("GET_CATALOG_ERROR", error);
      return await IndexedDB.getAllCatalog();
    }
  }

  // Métodos de sincronización
  async syncChanges() {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      OfflineDebugger.log("SYNC_STARTED", { timestamp: new Date() });
      const changes = await IndexedDB.getPendingChanges();

      if (changes.length === 0) {
        OfflineDebugger.log("SYNC_COMPLETED", { changes: 0 });
        return;
      }

      // Primero sincronizar productos del catálogo
      const catalogChanges = changes.filter(
        (change) => change.type === "CREATE_CATALOG"
      );

      // Mapa para guardar la relación entre IDs temporales y permanentes
      const idMapping = new Map();

      // Procesar creaciones de productos primero
      for (const change of catalogChanges) {
        try {
          const response = await this.processChange(change);
          if (response && response._id && change.tempId) {
            idMapping.set(change.tempId, response._id);
            await IndexedDB.removePendingChange(change.id);

            // Actualizar el producto en IndexedDB con su nuevo ID
            await IndexedDB.updateCatalogProduct(change.tempId, {
              ...response,
              _id: response._id,
            });
          }
        } catch (error) {
          OfflineDebugger.error("SYNC_CHANGE_ERROR", { change, error });
        }
      }

      // Actualizar referencias en estados pendientes
      const remainingChanges = changes.filter(
        (change) => !catalogChanges.includes(change)
      );
      for (const change of remainingChanges) {
        if (change.productId && change.productId.startsWith("temp_")) {
          const permanentId = idMapping.get(change.productId);
          if (permanentId) {
            // Actualizar tanto el productId como la referencia en los datos
            change.productId = permanentId;
            if (change.data && change.data.producto) {
              change.data.producto = permanentId;
            }
          } else {
            OfflineDebugger.log("SKIPPING_CHANGE", {
              reason: "No permanent ID found",
              change,
            });
            continue;
          }
        }

        try {
          await this.processChange(change);
          await IndexedDB.removePendingChange(change.id);
        } catch (error) {
          OfflineDebugger.error("SYNC_CHANGE_ERROR", { change, error });
        }
      }

      OfflineDebugger.log("SYNC_COMPLETED", { timestamp: new Date() });
    } catch (error) {
      OfflineDebugger.error("SYNC_ERROR", error);
    } finally {
      this.syncInProgress = false;
    }
  }

  async processChange(change) {
    try {
      let result;
      switch (change.type) {
        case "UPDATE":
          return await api.http.updateProductStatus(
            change.productId,
            change.data
          );
        case "DELETE":
          return await api.http.deleteProductStatus(change.productId);
        case "CREATE_CATALOG":
          result = await api.http.createCatalogProduct(change.data);
          return result;
        case "UPDATE_CATALOG":
          return await api.http.updateCatalogProduct(
            change.productId,
            change.data
          );
        case "DELETE_CATALOG":
          return await api.http.deleteCatalogProduct(change.productId);
        default:
          throw new Error(`Tipo de cambio no soportado: ${change.type}`);
      }
    } catch (error) {
      OfflineDebugger.error("PROCESS_CHANGE_ERROR", { error, change });
      throw error;
    }
  }

  // Métodos auxiliares
  async saveToLocalStorage(products) {
    OfflineDebugger.log("SAVING_TO_LOCAL", { count: products.length });

    // Primero limpiar todos los estados existentes
    await IndexedDB.clearProductStatus();

    // Luego guardar los nuevos estados
    for (const product of products) {
      if (!product._id) {
        OfflineDebugger.error("SAVE_TO_LOCAL_ERROR", "Product without ID", {
          product,
        });
        continue;
      }
      await IndexedDB.saveProductStatus(product);
    }

    // Verificar que el número de productos es correcto
    const finalProducts = await IndexedDB.getAllProductStatus();
    OfflineDebugger.log("FINAL_PRODUCTS", {
      count: finalProducts.length,
    });
  }

  async saveCatalogToLocalStorage(products) {
    OfflineDebugger.log("SAVING_CATALOG_TO_LOCAL", { count: products.length });

    // Primero limpiar el catálogo actual
    await IndexedDB.clearCatalog();

    // Luego guardar los nuevos productos
    for (const product of products) {
      await IndexedDB.saveCatalogProduct(product);
    }

    // Verificar que el número de productos es correcto
    const finalProducts = await IndexedDB.getAllCatalog();
    OfflineDebugger.log("FINAL_CATALOG_PRODUCTS", {
      count: finalProducts.length,
    });
  }

  // Nuevos métodos para el catálogo
  async createCatalogProduct(productData) {
    try {
      OfflineDebugger.log("CREATE_CATALOG_PRODUCT", { data: productData });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await api.http.createCatalogProduct(productData);
        await IndexedDB.saveCatalogProduct(result);
        return result;
      }

      // Generar un ID temporal para modo offline
      const tempId = `temp_${Date.now()}`;
      const productToSave = {
        _id: tempId,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveCatalogProduct(productToSave);
      await IndexedDB.addPendingChange({
        type: "CREATE_CATALOG",
        tempId: tempId,
        data: productData,
        timestamp: new Date().toISOString(),
      });

      return productToSave;
    } catch (error) {
      OfflineDebugger.error("CREATE_CATALOG_PRODUCT_ERROR", error, {
        productData,
      });
      throw error;
    }
  }

  async updateCatalogProduct(productId, data) {
    try {
      OfflineDebugger.log("UPDATE_CATALOG_PRODUCT", { productId, data });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await api.http.updateCatalogProduct(productId, data);
        await IndexedDB.saveCatalogProduct(result);
        return result;
      }

      const existingProduct = await IndexedDB.getCatalogProduct(productId);
      if (!existingProduct) {
        throw new Error("Producto no encontrado en el catálogo local");
      }

      const updatedProduct = {
        ...existingProduct,
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await IndexedDB.saveCatalogProduct(updatedProduct);
      await IndexedDB.addPendingChange({
        type: "UPDATE_CATALOG",
        productId,
        data,
        timestamp: new Date().toISOString(),
      });

      return updatedProduct;
    } catch (error) {
      OfflineDebugger.error("UPDATE_CATALOG_PRODUCT_ERROR", error, {
        productId,
        data,
      });
      throw error;
    }
  }

  async deleteCatalogProduct(productId) {
    try {
      OfflineDebugger.log("DELETE_CATALOG_PRODUCT", { productId });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await api.http.deleteCatalogProduct(productId);
        await IndexedDB.deleteCatalogProduct(productId);
        return result;
      }

      await IndexedDB.deleteCatalogProduct(productId);
      await IndexedDB.addPendingChange({
        type: "DELETE_CATALOG",
        productId,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      OfflineDebugger.error("DELETE_CATALOG_PRODUCT_ERROR", error, {
        productId,
      });
      throw error;
    }
  }
}

export default new OfflineManager();
