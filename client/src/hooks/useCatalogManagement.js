import { useCallback, useEffect } from "react";
import { useSocket } from "./useSocket";
import useCatalogStore from "../stores/catalogStore";

export const useCatalogManagement = () => {
  const { socket } = useSocket();
  const {
    products,
    loading,
    error,
    loadProducts,
    updateProduct,
    deleteProduct,
    addProduct,
  } = useCatalogStore();

  // Manejadores de eventos para WebSocket y actualizaciones offline
  const handleCatalogUpdate = useCallback(
    (data) => {
      console.log("Recibida actualización de catálogo:", data);

      if (!data) {
        console.warn("Recibida actualización sin datos");
        return;
      }

      if (data.type === "update" && data.product) {
        updateProduct(data.product);
      } else if (data.type === "delete" && data.productId) {
        deleteProduct(data.productId);
      } else if (data.type === "create" && data.product) {
        addProduct(data.product);
      } else {
        console.warn("Tipo de actualización no reconocido:", data.type);
      }
    },
    [updateProduct, deleteProduct, addProduct]
  );

  // Efecto para manejar eventos de WebSocket y DOM
  useEffect(() => {
    if (!socket) return;

    const handleOfflineCatalogUpdate = (event) => {
      console.log("Recibida actualización offline del catálogo:", event.detail);
      if (event.detail) {
        handleCatalogUpdate(event.detail);
      }
    };

    socket.on("catalogUpdate", handleCatalogUpdate);
    window.addEventListener("catalogUpdate", handleOfflineCatalogUpdate);

    return () => {
      socket.off("catalogUpdate", handleCatalogUpdate);
      window.removeEventListener("catalogUpdate", handleOfflineCatalogUpdate);
    };
  }, [socket, handleCatalogUpdate]);

  return {
    products,
    loading,
    error,
    loadProducts,
    updateProduct,
    deleteProduct,
    addProduct,
  };
};
