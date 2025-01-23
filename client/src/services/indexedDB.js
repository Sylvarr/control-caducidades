import OfflineDebugger from "../utils/debugger";

const DB_NAME = "control-caducidades";
const DB_VERSION = 3;

const STORES = {
  PRODUCTS: "products",
  PENDING_CHANGES: "pendingChanges",
  CATALOG: "catalog",
  LOCKS: "locks",
  RECOVERY_POINTS: "recoveryPoints",
  ID_MAPPING: "idMapping",
};

class IndexedDBService {
  constructor() {
    this.db = null;
    this.initPromise = null;
  }

  async init() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        OfflineDebugger.error("INDEXEDDB_ERROR", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        OfflineDebugger.log("INDEXEDDB_CONNECTED", { database: DB_NAME });
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para productos y sus estados
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, {
            keyPath: "producto._id",
          });
          productStore.createIndex("estado", "estado");
          productStore.createIndex("updatedAt", "updatedAt");
          productStore.createIndex("syncStatus", "syncStatus");
        }

        // Store para cambios pendientes de sincronización
        if (!db.objectStoreNames.contains(STORES.PENDING_CHANGES)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_CHANGES, {
            keyPath: "id",
            autoIncrement: true,
          });
          pendingStore.createIndex("timestamp", "timestamp");
          pendingStore.createIndex("type", "type");
          pendingStore.createIndex("productId", "productId");
          pendingStore.createIndex("status", "status");
          pendingStore.createIndex("recoveryPointId", "recoveryPointId");
        }

        // Store para el catálogo de productos
        if (!db.objectStoreNames.contains(STORES.CATALOG)) {
          const catalogStore = db.createObjectStore(STORES.CATALOG, {
            keyPath: "_id",
          });
          catalogStore.createIndex("nombre", "nombre");
          catalogStore.createIndex("tipo", "tipo");
          catalogStore.createIndex("updatedAt", "updatedAt");
          catalogStore.createIndex("syncStatus", "syncStatus");
        }

        // Store para locks
        if (!db.objectStoreNames.contains(STORES.LOCKS)) {
          const lockStore = db.createObjectStore(STORES.LOCKS, {
            keyPath: "productId",
          });
          lockStore.createIndex("timestamp", "timestamp");
          lockStore.createIndex("tabId", "tabId");
        }

        // Store para puntos de recuperación
        if (!db.objectStoreNames.contains(STORES.RECOVERY_POINTS)) {
          const recoveryStore = db.createObjectStore(STORES.RECOVERY_POINTS, {
            keyPath: ["productId", "timestamp"],
          });
          recoveryStore.createIndex("productId", "productId");
          recoveryStore.createIndex("timestamp", "timestamp");
        }

        // Nueva store para mapeo de IDs temporales a permanentes
        if (!db.objectStoreNames.contains(STORES.ID_MAPPING)) {
          const idMappingStore = db.createObjectStore(STORES.ID_MAPPING, {
            keyPath: "tempId",
          });
          idMappingStore.createIndex("permanentId", "permanentId");
          idMappingStore.createIndex("entityType", "entityType");
          idMappingStore.createIndex("createdAt", "createdAt");
          idMappingStore.createIndex("syncedAt", "syncedAt");
        }
      };
    });

    return this.initPromise;
  }

  async getStore(storeName, mode = "readonly") {
    await this.init();
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  // Métodos para productos y estados
  async getAllProductStatus() {
    const store = await this.getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getProductStatus(productId) {
    const store = await this.getStore(STORES.PRODUCTS);
    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveProductStatus(product) {
    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    product.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProductStatus(productId) {
    if (!productId) {
      OfflineDebugger.error("DELETE_PRODUCT_ERROR", "No product ID provided");
      throw new Error("No product ID provided");
    }

    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onsuccess = () => {
        OfflineDebugger.log("PRODUCT_DELETED", { productId });
        resolve();
      };
      request.onerror = () => {
        OfflineDebugger.error("DELETE_PRODUCT_ERROR", request.error);
        reject(request.error);
      };
    });
  }

  // Métodos para cambios pendientes
  async addPendingChange(change) {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    change.timestamp = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.add(change);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingChanges() {
    const store = await this.getStore(STORES.PENDING_CHANGES);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingChange(id) {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Métodos para el catálogo
  async getAllCatalog() {
    const store = await this.getStore(STORES.CATALOG);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCatalogProduct(product) {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    product.updatedAt = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const request = store.put(product);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getCatalogProduct(productId) {
    const store = await this.getStore(STORES.CATALOG);
    return new Promise((resolve, reject) => {
      const request = store.get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteCatalogProduct(productId) {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.delete(productId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Método para limpiar todos los datos
  async clearAll() {
    await this.init();
    const transaction = this.db.transaction(Object.values(STORES), "readwrite");

    const promises = Object.values(STORES).map(
      (storeName) =>
        new Promise((resolve, reject) => {
          const request = transaction.objectStore(storeName).clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(promises);
    OfflineDebugger.log("INDEXEDDB_CLEARED", { stores: Object.values(STORES) });
  }

  async clearPendingChanges() {
    const store = await this.getStore(STORES.PENDING_CHANGES, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("PENDING_CHANGES_CLEARED");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearCatalog() {
    const store = await this.getStore(STORES.CATALOG, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("CATALOG_CLEARED");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clearProductStatus() {
    const store = await this.getStore(STORES.PRODUCTS, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        OfflineDebugger.log("PRODUCT_STATUS_CLEARED");
        resolve();
      };
      request.onerror = () => {
        OfflineDebugger.error("CLEAR_PRODUCT_STATUS_ERROR", request.error);
        reject(request.error);
      };
    });
  }

  // Nuevos métodos para el mapeo de IDs
  async saveIdMapping(mapping) {
    const store = await this.getStore(STORES.ID_MAPPING, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...mapping,
        createdAt: mapping.createdAt || new Date().toISOString(),
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getIdMapping(tempId) {
    const store = await this.getStore(STORES.ID_MAPPING);
    return new Promise((resolve, reject) => {
      const request = store.get(tempId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateIdMapping(tempId, permanentId) {
    const store = await this.getStore(STORES.ID_MAPPING, "readwrite");
    return new Promise((resolve, reject) => {
      const request = store.get(tempId);
      request.onsuccess = () => {
        const mapping = request.result;
        if (mapping) {
          mapping.permanentId = permanentId;
          mapping.syncedAt = new Date().toISOString();
          store.put(mapping).onsuccess = () => resolve(mapping);
        } else {
          reject(new Error(`No mapping found for tempId: ${tempId}`));
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllPendingMappings() {
    const store = await this.getStore(STORES.ID_MAPPING);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        // Filtrar solo los mappings que no tienen permanentId
        const pendingMappings = request.result.filter(
          (mapping) => !mapping.permanentId
        );
        resolve(pendingMappings);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export default new IndexedDBService();
