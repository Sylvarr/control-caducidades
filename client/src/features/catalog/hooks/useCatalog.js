import { useCallback, useEffect } from "react";
import { useQuery, useMutation } from "../../../core/hooks/useQuery";
import useCatalogStore from "../../../core/stores/catalogStore";
import { useSocket } from "../../../hooks/useSocket";
import OfflineDebugger from "../../../shared/utils/debugger";

export const useCatalog = () => {
  const { socket } = useSocket();
  const catalogStore = useCatalogStore();

  // Query para cargar productos
  const {
    data: products = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery("catalog", () => catalogStore.loadProducts(), {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 30 * 60 * 1000, // 30 minutos
  });

  // Mutación para crear producto
  const createMutation = useMutation(
    (productData) => catalogStore.createProduct(productData),
    {
      onSuccess: (newProduct) => {
        socket?.emit("catalogUpdate", {
          type: "create",
          product: newProduct,
        });
      },
    }
  );

  // Mutación para actualizar producto
  const updateMutation = useMutation(
    ({ productId, updates }) => catalogStore.updateProduct(productId, updates),
    {
      onSuccess: (updatedProduct) => {
        socket?.emit("catalogUpdate", {
          type: "update",
          product: updatedProduct,
        });
      },
    }
  );

  // Mutación para eliminar producto
  const deleteMutation = useMutation(
    (productId) => catalogStore.deleteProduct(productId),
    {
      onSuccess: (_, productId) => {
        socket?.emit("catalogUpdate", {
          type: "delete",
          productId,
        });
      },
    }
  );

  // Manejador de actualizaciones del servidor
  const handleServerUpdate = useCallback(
    (update) => {
      try {
        catalogStore.handleServerUpdate(update);
        refetch();
      } catch (err) {
        OfflineDebugger.error("CATALOG_SERVER_UPDATE_ERROR", err, { update });
      }
    },
    [catalogStore, refetch]
  );

  // Suscribirse a actualizaciones del servidor
  useEffect(() => {
    if (!socket) return;

    socket.on("catalogUpdate", handleServerUpdate);

    return () => {
      socket.off("catalogUpdate", handleServerUpdate);
    };
  }, [socket, handleServerUpdate]);

  return {
    // Estado
    products,
    isLoading,
    isError,
    error,

    // Acciones
    refetch,
    createProduct: createMutation.mutate,
    updateProduct: updateMutation.mutate,
    deleteProduct: deleteMutation.mutate,

    // Estado de mutaciones
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,

    // Errores de mutaciones
    createError: createMutation.error,
    updateError: updateMutation.error,
    deleteError: deleteMutation.error,
  };
};
