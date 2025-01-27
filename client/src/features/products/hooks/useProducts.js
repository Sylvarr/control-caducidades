import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "../../../core/hooks/useQuery";
import useProductStore from "../../../core/stores/productStore";
import useSocket from "../../../core/hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useProducts = (initialFilters = {}) => {
  const socket = useSocket();
  const {
    products,
    selectedProduct,
    loading: storeLoading,
    error: storeError,
    filters,
    getFilteredProducts,
    setProducts,
    setSelectedProduct,
    updateProduct,
    deleteProduct,
    moveProduct,
    setFilters,
    clearFilters,
    clearError,
  } = useProductStore();

  // Query para cargar productos
  const {
    data,
    loading: queryLoading,
    error: queryError,
    refetch,
  } = useQuery({
    key: "products",
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }
      return response.json();
    },
    config: {
      cacheTime: 1000 * 60 * 5, // 5 minutos
      staleTime: 1000 * 60, // 1 minuto
    },
  });

  // Actualizar productos cuando cambian los datos
  useEffect(() => {
    if (data) {
      setProducts(data);
    }
  }, [data, setProducts]);

  // Aplicar filtros iniciales
  useEffect(() => {
    if (Object.keys(initialFilters).length) {
      setFilters(initialFilters);
    }
  }, []);

  // Manejar actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      OfflineDebugger.log("PRODUCTS_SERVER_UPDATE", update);
      refetch();
    },
    [refetch]
  );

  // Suscribirse a eventos de socket
  useEffect(() => {
    if (!socket) return;

    socket.on("product:created", handleServerUpdate);
    socket.on("product:updated", handleServerUpdate);
    socket.on("product:deleted", handleServerUpdate);
    socket.on("product:moved", handleServerUpdate);

    return () => {
      socket.off("product:created", handleServerUpdate);
      socket.off("product:updated", handleServerUpdate);
      socket.off("product:deleted", handleServerUpdate);
      socket.off("product:moved", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  // Productos filtrados y ordenados
  const filteredProducts = useMemo(() => {
    return getFilteredProducts();
  }, [getFilteredProducts]);

  // Estados de carga y error
  const loading = queryLoading || storeLoading;
  const error = queryError || storeError;

  // Acciones con manejo de errores
  const handleUpdateProduct = useCallback(
    async (id, changes) => {
      try {
        await updateProduct({ id, changes, optimisticUpdate: true });
      } catch (error) {
        OfflineDebugger.error("PRODUCT_UPDATE_ERROR", {
          id,
          changes,
          error: error.message,
        });
        throw error;
      }
    },
    [updateProduct]
  );

  const handleDeleteProduct = useCallback(
    async (id) => {
      try {
        await deleteProduct(id);
      } catch (error) {
        OfflineDebugger.error("PRODUCT_DELETE_ERROR", {
          id,
          error: error.message,
        });
        throw error;
      }
    },
    [deleteProduct]
  );

  const handleMoveProduct = useCallback(
    async (id, newStatus) => {
      try {
        await moveProduct(id, newStatus);
      } catch (error) {
        OfflineDebugger.error("PRODUCT_MOVE_ERROR", {
          id,
          newStatus,
          error: error.message,
        });
        throw error;
      }
    },
    [moveProduct]
  );

  return {
    // Estado
    products: filteredProducts,
    selectedProduct,
    filters,
    loading,
    error,

    // Acciones
    selectProduct: setSelectedProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct,
    moveProduct: handleMoveProduct,
    setFilters,
    clearFilters,
    clearError,
    refetch,

    // Estados de operaciones
    isUpdating: products.some((p) => p.isUpdating),
    isDeleting: products.some((p) => p.isDeleting),
    isMoving: products.some((p) => p.isMoving),
  };
};

export default useProducts;
