import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../contexts/AuthContext";
import ToastContainer from "./ToastContainer";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import { useSocket } from "../hooks/useSocket";
import usePreventScroll from "../hooks/usePreventScroll";
import useToasts from "../hooks/useToasts";
import SearchBar from "./SearchBar";
import UpdateModal from "./UpdateModal";
import ExpiringModal from "./ExpiringModal";
import HeaderSection from "./HeaderSection";
import CategorySection from "./CategorySection";
import ModalContainer from "./ModalContainer";
import ProductListContainer from "./ProductListContainer";
import LoadingErrorContainer from "./LoadingErrorContainer";
import { useProductManagement } from "../hooks/useProductManagement";
import { useModalManagement } from "../hooks/useModalManagement";
import { useExpiringProducts } from "../hooks/useExpiringProducts";
import { isExpiringSoon } from "../utils/dateUtils";
import { classifyProduct } from "@shared/business/productClassifier";
import IndexedDB from "../services/indexedDB";
import OfflineManager from "../services/offlineManager";
import OfflineDebugger from "../services/offlineDebugger";
import ConflictResolutionModal from "./ConflictResolutionModal";

const ProductList = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    setIsAuthenticated,
    setUser,
  } = useContext(AuthContext);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToasts();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    fechaAlmacen2: "",
    fechaAlmacen3: "",
    cajaUnica: false,
    showSecondDate: false,
    showThirdDate: false,
    noHayEnAlmacen: false,
  });
  const [changes, setChanges] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isConflictModalClosing, setIsConflictModalClosing] = useState(false);

  // Custom Hooks
  const {
    products,
    loading,
    error,
    lastUpdatedProductId,
    loadAllProducts,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUndoDelete,
    filterProducts,
    removeProductFromState,
    addProductToState,
    updateProductInState,
  } = useProductManagement((message, type, data) =>
    addToast(message, type, data)
  );

  const {
    isUpdateModalOpen,
    isExpiringModalOpen,
    showUnclassified,
    isUserManagementOpen,
    showCatalogManagement,
    isClosingUnclassified,
    isClosingUpdateModal,
    isClosingExpiringModal,
    setIsUpdateModalOpen,
    setIsExpiringModalOpen,
    setShowUnclassified,
    setIsUserManagementOpen,
    setShowCatalogManagement,
    handleCloseUnclassified,
    handleCloseUpdateModal,
    handleCloseExpiringModal,
  } = useModalManagement();

  const { calculateExpiringProducts, getGroupedExpiringProducts } =
    useExpiringProducts(products);

  // Prevenir scroll cuando los modales están abiertos
  usePreventScroll(isUpdateModalOpen && !isClosingUpdateModal);
  usePreventScroll(showUnclassified && !isClosingUnclassified);
  usePreventScroll(isExpiringModalOpen && !isClosingExpiringModal);

  // Funciones de utilidad
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  // Manejadores de eventos
  const handleProductClick = useCallback((product) => {
    setSelectedProduct((current) => {
      const newSelected =
        current?.producto?._id === product.producto?._id ? null : product;

      if (newSelected) {
        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${product.producto?._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        }, 100);
      }

      return newSelected;
    });
  }, []);

  const handleUpdateClick = useCallback(
    (product, e) => {
      e?.stopPropagation();
      setEditingProduct(product);

      // Extraer fechas adicionales si existen
      const fechas = product.fechasAlmacen || [];
      const [primeraFecha, segundaFecha, terceraFecha] = fechas;

      setUpdateForm({
        fechaFrente: product.fechaFrente
          ? new Date(product.fechaFrente).toISOString().split("T")[0]
          : "",
        fechaAlmacen:
          product.estado === "frente-agota"
            ? ""
            : primeraFecha
            ? new Date(primeraFecha).toISOString().split("T")[0]
            : product.fechaAlmacen
            ? new Date(product.fechaAlmacen).toISOString().split("T")[0]
            : "",
        fechaAlmacen2: segundaFecha
          ? new Date(segundaFecha).toISOString().split("T")[0]
          : "",
        fechaAlmacen3: terceraFecha
          ? new Date(terceraFecha).toISOString().split("T")[0]
          : "",
        cajaUnica: product.cajaUnica || false,
        showSecondDate: Boolean(segundaFecha),
        showThirdDate: Boolean(terceraFecha),
        noHayEnAlmacen: product.estado === "frente-agota",
      });

      setIsUpdateModalOpen(true);
    },
    [setIsUpdateModalOpen]
  );

  const handleSubmitUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const fechasAlmacen = [];
      if (!updateForm.noHayEnAlmacen) {
        if (updateForm.fechaAlmacen) {
          fechasAlmacen.push(updateForm.fechaAlmacen);
        }
        if (updateForm.showSecondDate && updateForm.fechaAlmacen2) {
          fechasAlmacen.push(updateForm.fechaAlmacen2);
        }
        if (updateForm.showThirdDate && updateForm.fechaAlmacen3) {
          fechasAlmacen.push(updateForm.fechaAlmacen3);
        }
      }

      const productData = {
        fechaFrente: updateForm.fechaFrente,
        fechaAlmacen: updateForm.noHayEnAlmacen
          ? null
          : updateForm.fechaAlmacen,
        fechasAlmacen,
        cajaUnica: Boolean(updateForm.cajaUnica),
      };

      const estado = classifyProduct(productData);

      const updatedProduct = await handleUpdateProduct(
        editingProduct.producto._id,
        {
          ...productData,
          estado,
        }
      );

      if (updatedProduct) {
        handleCloseUpdateModal();
        addToast("Producto actualizado correctamente", "success");
      }
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      addToast(error.message || "Error al actualizar el producto", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (product, e) => {
    e.stopPropagation();
    const success = await handleDeleteProduct(product.producto?._id);
    if (success) {
      setSelectedProduct(null);
      setSearchTerm("");
    }
  };

  const navigateToProduct = useCallback(
    (product) => {
      setIsExpiringModalOpen(false);
      setTimeout(() => {
        setSelectedProduct(product);
        setSearchTerm(product.producto.nombre);

        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${product.producto._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }, 300);
    },
    [setIsExpiringModalOpen]
  );

  // Efectos
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("http://localhost:5000/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error("Error al cargar usuario:", error);
      }
    };

    loadUser();
  }, [setUser]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const productCard = event.target.closest(".product-card");

      if (selectedProduct && !productCard) {
        setSelectedProduct(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct]);

  useEffect(() => {
    const handleProductStatusUpdate = async (data) => {
      console.log("Recibida actualización de estado:", data);

      if (data.type === "update" && data.productStatus) {
        updateProductInState(data.productStatus);
      } else if (data.type === "delete" && data.productId) {
        removeProductFromState(data.productId);
      } else if (data.type === "create" && data.productStatus) {
        addProductToState(data.productStatus);
      }
    };

    const handleCatalogUpdate = (data) => {
      console.log("Recibida actualización de catálogo:", data);

      if (data.type === "create" || data.type === "update") {
        const unclassifiedProduct = {
          producto: data.product,
          estado: "sin-clasificar",
          fechaFrente: null,
          fechaAlmacen: null,
          fechasAlmacen: [],
          cajaUnica: false,
        };
        addProductToState(unclassifiedProduct);
      } else if (data.type === "delete") {
        removeProductFromState(data.productId);
      }
    };

    const handleOfflineCatalogUpdate = (event) => {
      console.log("Recibida actualización offline del catálogo:", event.detail);
      handleCatalogUpdate(event.detail);
    };

    if (socket) {
      socket.on("productStatusUpdate", handleProductStatusUpdate);
      socket.on("catalogUpdate", handleCatalogUpdate);
    }

    window.addEventListener("catalogUpdate", handleOfflineCatalogUpdate);

    return () => {
      if (socket) {
        socket.off("productStatusUpdate", handleProductStatusUpdate);
        socket.off("catalogUpdate", handleCatalogUpdate);
      }
      window.removeEventListener("catalogUpdate", handleOfflineCatalogUpdate);
    };
  }, [socket, updateProductInState, removeProductFromState, addProductToState]);

  useEffect(() => {
    const loadPendingChanges = async () => {
      try {
        const pendingChanges = await IndexedDB.getPendingChanges();
        setChanges(pendingChanges);
      } catch (error) {
        console.error("Error al cargar cambios pendientes:", error);
      }
    };

    loadPendingChanges();
  }, []);

  useEffect(() => {
    const syncPendingChangesIfOnline = async () => {
      try {
        if (OfflineManager.isOnline) {
          OfflineDebugger.log("ATTEMPTING_AUTO_SYNC");
          await OfflineManager.syncChanges();
          // Recargar los cambios pendientes después de sincronizar
          const pendingChanges = await IndexedDB.getPendingChanges();
          setChanges(pendingChanges);
          // Si no hay errores y los cambios se sincronizaron, recargar productos
          if (pendingChanges.length === 0) {
            loadAllProducts();
          }
        }
      } catch (error) {
        console.error("Error en sincronización automática:", error);
        addToast("Error al sincronizar cambios pendientes", "error");
      }
    };

    syncPendingChangesIfOnline();
  }, [loadAllProducts, addToast]);

  const handleClearPendingChanges = async () => {
    try {
      await OfflineManager.clearPendingChanges();
      setChanges([]); // Limpiar el estado local
      addToast("Cambios pendientes eliminados correctamente", "success");
      // Recargar productos para asegurar que tenemos el estado más reciente
      loadAllProducts();
    } catch (error) {
      console.error("Error al limpiar cambios pendientes:", error);
      addToast("Error al limpiar los cambios pendientes", "error");
    }
  };

  const groupedProducts = getGroupedExpiringProducts();
  const hasExpiredProducts = groupedProducts.expired.products.length > 0;

  const handleCloseConflictModal = () => {
    setIsConflictModalClosing(true);
    setTimeout(() => {
      setIsConflictModalOpen(false);
      setIsConflictModalClosing(false);
    }, 300);
  };

  const handleResolveConflicts = async (resolutions) => {
    try {
      for (const [conflictId, resolution] of Object.entries(resolutions)) {
        const conflict = conflicts.find((c) => c.id === conflictId);
        if (!conflict) continue;

        let resolvedData;
        switch (resolution) {
          case "local":
            resolvedData = conflict.data;
            break;
          case "server":
            resolvedData = conflict.conflictData.serverState;
            break;
          case "merge":
            // Combinar datos manteniendo las fechas más recientes
            resolvedData = {
              ...conflict.conflictData.serverState,
              fechaFrente:
                conflict.data.fechaFrente ||
                conflict.conflictData.serverState.fechaFrente,
              fechaAlmacen:
                conflict.data.fechaAlmacen ||
                conflict.conflictData.serverState.fechaAlmacen,
              fechasAlmacen: [
                ...new Set([
                  ...(conflict.data.fechasAlmacen || []),
                  ...(conflict.conflictData.serverState.fechasAlmacen || []),
                ]),
              ],
              version:
                Math.max(
                  conflict.data.version,
                  conflict.conflictData.serverVersion
                ) + 1,
            };
            break;
          default:
            continue;
        }

        // Actualizar el producto con los datos resueltos
        await handleUpdateProduct(conflict.productId, resolvedData);
        // Eliminar el cambio pendiente
        await IndexedDB.removePendingChange(conflictId);
      }

      // Recargar cambios pendientes y productos
      const pendingChanges = await IndexedDB.getPendingChanges();
      setChanges(pendingChanges);
      loadAllProducts();

      addToast("Conflictos resueltos correctamente", "success");
    } catch (error) {
      console.error("Error al resolver conflictos:", error);
      addToast("Error al resolver los conflictos", "error");
    }
  };

  useEffect(() => {
    const loadConflicts = async () => {
      try {
        const pendingChanges = await IndexedDB.getPendingChanges();
        const conflictChanges = pendingChanges.filter(
          (change) => change.conflictData
        );
        setConflicts(conflictChanges);

        if (conflictChanges.length > 0 && !isConflictModalOpen) {
          setIsConflictModalOpen(true);
        }
      } catch (error) {
        console.error("Error al cargar conflictos:", error);
      }
    };

    loadConflicts();
  }, [changes]);

  return (
    <LoadingErrorContainer
      loading={loading}
      error={error}
      onRetry={loadAllProducts}
    >
      <div className="max-w-md mx-auto p-4 bg-[#f8f8f8]">
        <ToastContainer
          toasts={toasts}
          removeToast={removeToast}
          onUndo={handleUndoDelete}
        />

        <HeaderSection
          user={authUser}
          expiringCount={calculateExpiringProducts()}
          hasExpiredProducts={hasExpiredProducts}
          onLogout={handleLogout}
          onUserManagementClick={() => setIsUserManagementOpen(true)}
          onCatalogManagementClick={() => setShowCatalogManagement(true)}
          onExpiringClick={() => setIsExpiringModalOpen(true)}
        />

        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-2">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              unclassifiedCount={products["sin-clasificar"].length}
              onUnclassifiedClick={() => setShowUnclassified(!showUnclassified)}
            />
          </div>
          {changes.length > 0 && (
            <button
              onClick={handleClearPendingChanges}
              className="w-full py-2 px-3 text-sm font-medium text-red-600
                bg-red-50 hover:bg-red-100 rounded-lg transition-colors
                flex items-center justify-center gap-2"
            >
              <span>Limpiar cambios pendientes</span>
              <span className="text-xs bg-red-100 px-2 py-0.5 rounded-full">
                {changes.length}
              </span>
            </button>
          )}
        </div>

        {/* Lista de productos sin clasificar */}
        {showUnclassified && (
          <ModalContainer
            isOpen={showUnclassified}
            isClosing={isClosingUnclassified}
            onClose={handleCloseUnclassified}
            title={`Productos Sin Clasificar (${products["sin-clasificar"].length})`}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <CategorySection
                category="sin-clasificar"
                products={products["sin-clasificar"]}
                selectedProduct={selectedProduct}
                isExpiringSoon={isExpiringSoon}
                lastUpdatedProductId={lastUpdatedProductId}
                onProductClick={(p) => {
                  handleProductClick(p);
                  handleUpdateClick(p);
                }}
                onUpdateClick={handleUpdateClick}
                onDeleteClick={handleDeleteClick}
              />
            </div>
          </ModalContainer>
        )}

        {/* Lista de productos clasificados */}
        <ProductListContainer
          filteredProducts={filterProducts(searchTerm)}
          selectedProduct={selectedProduct}
          isExpiringSoon={isExpiringSoon}
          lastUpdatedProductId={lastUpdatedProductId}
          onProductClick={handleProductClick}
          onUpdateClick={handleUpdateClick}
          onDeleteClick={handleDeleteClick}
          searchTerm={searchTerm}
        />

        {/* Modales */}
        <UpdateModal
          isOpen={isUpdateModalOpen}
          isClosing={isClosingUpdateModal}
          editingProduct={editingProduct}
          updateForm={updateForm}
          setUpdateForm={setUpdateForm}
          isUpdating={isUpdating}
          onClose={handleCloseUpdateModal}
          onSubmit={handleSubmitUpdate}
          setShowUnclassified={setShowUnclassified}
        />

        <ExpiringModal
          isOpen={isExpiringModalOpen}
          isClosing={isClosingExpiringModal}
          groupedProducts={groupedProducts}
          onClose={handleCloseExpiringModal}
          onProductClick={navigateToProduct}
        />

        <UserManagement
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={authUser}
        />

        <CatalogManagement
          isOpen={showCatalogManagement}
          onClose={() => setShowCatalogManagement(false)}
        />

        <ConflictResolutionModal
          isOpen={isConflictModalOpen}
          isClosing={isConflictModalClosing}
          conflicts={conflicts}
          onClose={handleCloseConflictModal}
          onResolveConflicts={handleResolveConflicts}
        />
      </div>
    </LoadingErrorContainer>
  );
};
export default ProductList;
