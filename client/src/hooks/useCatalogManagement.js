import { useState, useCallback, useEffect } from "react";
import OfflineManager from "../services/offlineManager";
import { useSocket } from "./useSocket";

export const useCatalogManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useSocket();

  // Cargar productos
  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      console.log("Cargando productos del catálogo...");
      const data = await OfflineManager.getAllCatalogProducts();
      console.log("Productos del catálogo cargados:", data.length);
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar el catálogo:", err);
      setError(err.message || "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar producto localmente
  const handleProductUpdate = useCallback((updatedProduct) => {
    if (!updatedProduct) {
      console.warn("Intento de actualizar con un producto undefined");
      return;
    }

    console.log("Actualizando producto en catálogo:", updatedProduct);

    setProducts((prevProducts) => {
      const productIndex = prevProducts.findIndex(
        (p) => p._id === updatedProduct._id
      );

      if (productIndex === -1) {
        // Si es un producto nuevo, lo añadimos al final
        console.log("Añadiendo nuevo producto al catálogo");
        return [...prevProducts, updatedProduct];
      }

      // Si el producto existe, lo actualizamos manteniendo el orden
      console.log("Actualizando producto existente en el catálogo");
      const newProducts = [...prevProducts];
      newProducts[productIndex] = updatedProduct;
      return newProducts;
    });
  }, []);

  // Eliminar producto localmente
  const handleProductDelete = useCallback((productId) => {
    if (!productId) {
      console.warn("Intento de eliminar con un productId undefined");
      return;
    }

    console.log("Eliminando producto del catálogo:", productId);
    setProducts((prevProducts) =>
      prevProducts.filter((p) => p._id !== productId)
    );
  }, []);

  // Efecto para manejar eventos de WebSocket y DOM
  useEffect(() => {
    if (!socket) return;

    const handleCatalogUpdate = (data) => {
      console.log("Recibida actualización de catálogo:", data);

      if (!data) {
        console.warn("Recibida actualización sin datos");
        return;
      }

      if (data.type === "update" && data.product) {
        handleProductUpdate(data.product);
      } else if (data.type === "delete" && data.productId) {
        handleProductDelete(data.productId);
      } else if (data.type === "create" && data.product) {
        handleProductUpdate(data.product);
      } else {
        console.warn("Tipo de actualización no reconocido:", data.type);
      }
    };

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
  }, [socket, handleProductUpdate, handleProductDelete]);

  return {
    products,
    loading,
    error,
    loadProducts,
    handleProductUpdate,
    handleProductDelete,
  };
};
