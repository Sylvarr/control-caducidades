import { http } from "./api";
import IndexedDB from "./indexedDB";
import OfflineDebugger from "./offlineDebugger";
import FeatureManager from "./featureManager";
import IdGenerator from "./idGenerator";

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
        const serverProducts = await http.getAllProductStatus();
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
      OfflineDebugger.log("UPDATE_PRODUCT_STATUS", { productId, data });

      if (this.isOnline && !this.isOfflineMode) {
        // Online mode: update server and IndexedDB
        const result = await http.updateProductStatus(productId, data);
        await IndexedDB.saveProductStatus(result);
        return result;
      }

      // Offline mode
      OfflineDebugger.log("OFFLINE_UPDATE", { productId });

      // 1. Get current product from IndexedDB
      const currentProduct = await IndexedDB.getProductStatus(productId);

      // 2. Get catalog product if not present
      let producto = currentProduct?.producto;
      if (!producto) {
        const catalogProduct = await IndexedDB.getCatalogProduct(productId);
        if (!catalogProduct) {
          throw new Error("Producto no encontrado en el catálogo local");
        }
        producto = catalogProduct;
      }

      // 3. Create updated version
      const updatedProduct = {
        ...currentProduct,
        ...data,
        producto, // Asegurar que el producto del catálogo está presente
        version: currentProduct ? currentProduct.version : 1,
        updatedAt: new Date().toISOString(),
        _isLocalUpdate: true,
      };

      // 4. Save to IndexedDB without updating from server
      await IndexedDB.saveProductStatus(updatedProduct);

      // 5. Add to pending changes
      await IndexedDB.addPendingChange({
        type: "UPDATE",
        productId,
        data: updatedProduct,
        localVersion: updatedProduct.version,
        timestamp: new Date().toISOString(),
      });

      return updatedProduct;
    } catch (error) {
      OfflineDebugger.error("UPDATE_PRODUCT_ERROR", error);
      throw error;
    }
  }

  async deleteProductStatus(productId) {
    try {
      OfflineDebugger.log("DELETE_PRODUCT_STATUS", { productId });

      if (this.isOnline && !this.isOfflineMode) {
        const result = await http.deleteProductStatus(productId);
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
        const data = await http.getAllCatalogProducts();
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
    if (this.syncInProgress) {
      OfflineDebugger.warn("SYNC_IN_PROGRESS");
      return;
    }

    try {
      this.syncInProgress = true;
      OfflineDebugger.log("SYNC_STARTED");

      const changes = await IndexedDB.getPendingChanges();
      if (!changes.length) {
        OfflineDebugger.log("NO_PENDING_CHANGES");
        return;
      }

      OfflineDebugger.log("PENDING_CHANGES_FOUND", { count: changes.length });

      // Agrupar cambios por tipo
      const changesByType = changes.reduce((acc, change) => {
        if (!acc[change.type]) acc[change.type] = [];
        acc[change.type].push(change);
        return acc;
      }, {});

      // Procesar primero los cambios del catálogo
      if (changesByType.CREATE_CATALOG) {
        for (const change of changesByType.CREATE_CATALOG) {
          try {
            OfflineDebugger.log("PROCESSING_CATALOG_CREATE", {
              tempId: change.tempId,
              data: change.data,
            });

            let result;
            try {
              result = await http.createCatalogProduct(change.data);
            } catch (error) {
              // Si el error es de duplicación, intentar obtener el producto existente
              if (
                error.message.includes("duplicate key error") &&
                error.message.includes("nombre")
              ) {
                OfflineDebugger.log("PRODUCT_EXISTS_UPDATING_INSTEAD", {
                  nombre: change.data.nombre,
                });
                // Buscar el producto por nombre
                const products = await http.getAllCatalogProducts();
                const existingProduct = products.find(
                  (p) => p.nombre === change.data.nombre
                );

                if (existingProduct) {
                  // Actualizar el producto existente
                  result = await http.updateCatalogProduct(
                    existingProduct._id,
                    change.data
                  );
                } else {
                  throw error; // Si no lo encontramos, propagar el error original
                }
              } else {
                throw error;
              }
            }

            await IndexedDB.saveCatalogProduct({
              ...result,
              syncStatus: "synced",
            });

            await IndexedDB.removePendingChange(change.id);

            // Actualizar el mapeo de IDs
            if (change.tempId) {
              await IndexedDB.updateIdMapping(change.tempId, result._id);
            }

            OfflineDebugger.log("CATALOG_CREATE_PROCESSED", {
              tempId: change.tempId,
              permanentId: result._id,
            });
          } catch (error) {
            OfflineDebugger.error("CATALOG_CREATE_ERROR", error, {
              change,
            });
          }
        }
      }

      if (changesByType.UPDATE_CATALOG) {
        for (const change of changesByType.UPDATE_CATALOG) {
          try {
            OfflineDebugger.log("PROCESSING_CATALOG_UPDATE", {
              productId: change.productId,
              data: change.data,
            });

            const result = await http.updateCatalogProduct(
              change.productId,
              change.data
            );
            await IndexedDB.saveCatalogProduct({
              ...result,
              syncStatus: "synced",
            });
            await IndexedDB.removePendingChange(change.id);

            OfflineDebugger.log("CATALOG_UPDATE_PROCESSED", {
              productId: change.productId,
            });
          } catch (error) {
            OfflineDebugger.error("CATALOG_UPDATE_ERROR", error, {
              change,
            });
          }
        }
      }

      // Procesar el resto de los cambios
      for (const change of changes) {
        if (
          change.type === "CREATE_CATALOG" ||
          change.type === "UPDATE_CATALOG"
        ) {
          continue; // Ya procesados
        }

        try {
          if (change.conflictData) {
            OfflineDebugger.warn("SKIPPING_CONFLICTED_CHANGE", { change });
            continue;
          }

          let serverProduct;
          let result;

          switch (change.type) {
            case "UPDATE":
              serverProduct = await http.getProductStatus(change.productId);

              if (serverProduct.version > change.data.version) {
                // El servidor tiene una versión más reciente
                await IndexedDB.saveProductStatus({
                  ...serverProduct,
                  syncStatus: "synced",
                });
                await IndexedDB.removePendingChange(change.id);
              } else {
                result = await http.updateProductStatus(
                  change.productId,
                  change.data
                );
                await IndexedDB.saveProductStatus({
                  ...result,
                  syncStatus: "synced",
                });
                await IndexedDB.removePendingChange(change.id);
              }
              break;

            case "DELETE":
              await http.deleteProductStatus(change.productId);
              await IndexedDB.deleteProductStatus(change.productId);
              await IndexedDB.removePendingChange(change.id);
              break;

            default:
              OfflineDebugger.warn("UNKNOWN_CHANGE_TYPE", {
                type: change.type,
              });
          }
        } catch (error) {
          OfflineDebugger.error("SYNC_ERROR", error, { change });
        }
      }

      OfflineDebugger.log("SYNC_COMPLETED");
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
          return await http.updateProductStatus(change.productId, change.data);
        case "DELETE":
          return await http.deleteProductStatus(change.productId);
        case "CREATE_CATALOG":
          result = await http.createCatalogProduct(change.data);
          return result;
        case "UPDATE_CATALOG":
          return await http.updateCatalogProduct(change.productId, change.data);
        case "DELETE_CATALOG":
          return await http.deleteCatalogProduct(change.productId);
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
        const result = await http.createCatalogProduct(productData);
        await IndexedDB.saveCatalogProduct(result);
        return result;
      }

      // Generar un ID temporal usando el nuevo servicio
      OfflineDebugger.log("GENERATING_TEMP_ID");
      const tempId = IdGenerator.generateTempId(
        IdGenerator.entityTypes.CATALOG_PRODUCT
      );
      OfflineDebugger.log("TEMP_ID_GENERATED", { tempId });

      const productToSave = {
        _id: tempId,
        ...productData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      OfflineDebugger.log("SAVING_PRODUCT_TO_INDEXEDDB", {
        product: productToSave,
      });
      await IndexedDB.saveCatalogProduct(productToSave);
      OfflineDebugger.log("PRODUCT_SAVED_TO_INDEXEDDB", { tempId });

      // Crear estado inicial como "sin clasificar"
      const initialStatus = {
        producto: productToSave,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
        version: 1,
        updatedAt: new Date().toISOString(),
      };
      await IndexedDB.saveProductStatus(initialStatus);

      OfflineDebugger.log("CREATING_PENDING_CHANGE", { tempId });
      await IndexedDB.addPendingChange({
        type: "CREATE_CATALOG",
        tempId: tempId,
        data: productData,
        timestamp: new Date().toISOString(),
      });
      OfflineDebugger.log("PENDING_CHANGE_CREATED", { tempId });

      // Emitir evento de actualización del catálogo
      if (window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent("catalogUpdate", {
            detail: {
              type: "create",
              product: productToSave,
            },
          })
        );
      }

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
        const result = await http.updateCatalogProduct(productId, data);
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
        const result = await http.deleteCatalogProduct(productId);
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

  async clearPendingChanges() {
    try {
      OfflineDebugger.log("CLEARING_PENDING_CHANGES");
      await IndexedDB.clearPendingChanges();
      OfflineDebugger.log("PENDING_CHANGES_CLEARED");
      return true;
    } catch (error) {
      OfflineDebugger.error("CLEAR_PENDING_CHANGES_ERROR", error);
      throw error;
    }
  }
}

export default new OfflineManager();
