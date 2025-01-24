import { useState, useCallback } from "react";
import { INITIAL_PRODUCTS_STATE } from "../constants/productConstants";
import {
  getAllProductStatus,
  getAllCatalogProducts,
  updateProductStatus,
  deleteProductStatus,
} from "../services/api";
import IndexedDB from "../services/indexedDB";
import OfflineManager from "../services/offlineManager";

export const useProductManagement = (addToast) => {
  const [products, setProducts] = useState(INITIAL_PRODUCTS_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedProductId, setLastUpdatedProductId] = useState(null);
  const [lastDeletedProduct, setLastDeletedProduct] = useState(null);

  const loadAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let statusData;
      let catalogData;

      if (OfflineManager.isOnline && !OfflineManager.isOfflineMode) {
        // Online mode: get data from server
        [statusData, catalogData] = await Promise.all([
          getAllProductStatus(),
          getAllCatalogProducts(),
        ]);
      } else {
        // Offline mode: get data from IndexedDB
        [statusData, catalogData] = await Promise.all([
          IndexedDB.getAllProductStatus(),
          IndexedDB.getAllCatalog(),
        ]);
      }

      const classifiedProductIds = new Set(
        statusData.map((product) => product.producto._id)
      );

      const unclassifiedProducts = catalogData
        .filter((product) => !classifiedProductIds.has(product._id))
        .map((product) => ({
          producto: product,
          estado: "sin-clasificar",
          fechaFrente: null,
          fechaAlmacen: null,
          fechasAlmacen: [],
          cajaUnica: false,
        }));

      const organizedProducts = {
        "sin-clasificar": [
          ...unclassifiedProducts,
          ...statusData.filter(
            (product) => product.estado === "sin-clasificar"
          ),
        ],
        "frente-cambia": statusData.filter(
          (product) => product.estado === "frente-cambia"
        ),
        "frente-agota": statusData.filter(
          (product) => product.estado === "frente-agota"
        ),
        "abierto-cambia": statusData.filter(
          (product) => product.estado === "abierto-cambia"
        ),
        "abierto-agota": statusData.filter(
          (product) => product.estado === "abierto-agota"
        ),
      };

      setProducts(organizedProducts);
    } catch (err) {
      setError(err.message || "Error al cargar los productos");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProductInState = useCallback((productData) => {
    setProducts((prevProducts) => {
      const newProducts = Object.entries(prevProducts).reduce(
        (acc, [category, productList]) => {
          acc[category] = productList.filter(
            (p) => p.producto._id !== productData.producto._id
          );
          return acc;
        },
        { ...prevProducts }
      );

      const category = productData.estado || "sin-clasificar";
      newProducts[category] = [...newProducts[category], productData];

      return newProducts;
    });

    setLastUpdatedProductId(productData.producto._id);
    setTimeout(() => setLastUpdatedProductId(null), 3000);
  }, []);

  const removeProductFromState = useCallback((productId) => {
    setProducts((prevProducts) => {
      return Object.entries(prevProducts).reduce(
        (acc, [category, productList]) => {
          acc[category] = productList.filter(
            (p) => p.producto._id !== productId
          );
          return acc;
        },
        { ...prevProducts }
      );
    });
  }, []);

  const addProductToState = useCallback((productData) => {
    setProducts((prevProducts) => {
      const category = productData.estado || "sin-clasificar";
      return {
        ...prevProducts,
        [category]: [...prevProducts[category], productData],
      };
    });

    setLastUpdatedProductId(productData.producto._id);
    setTimeout(() => setLastUpdatedProductId(null), 3000);
  }, []);

  const handleUpdateProduct = async (productId, updateData) => {
    try {
      const productToUpdate = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToUpdate) {
        throw new Error("Producto no encontrado");
      }

      const updatedProduct = await updateProductStatus(productId, updateData);
      updateProductInState(updatedProduct);

      addToast(
        `${productToUpdate.producto.nombre} actualizado correctamente.`,
        "success"
      );
      return true;
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
      return false;
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const productToDelete = Object.values(products)
        .flat()
        .find((p) => p.producto._id === productId);

      if (!productToDelete) {
        throw new Error("Producto no encontrado");
      }

      setLastDeletedProduct({
        ...productToDelete,
        producto: { ...productToDelete.producto },
      });

      await deleteProductStatus(productId);
      removeProductFromState(productId);

      const unclassifiedProduct = {
        producto: productToDelete.producto,
        estado: "sin-clasificar",
        fechaFrente: null,
        fechaAlmacen: null,
        fechasAlmacen: [],
        cajaUnica: false,
      };
      addProductToState(unclassifiedProduct);

      const toastData = {
        productId: productToDelete.producto._id,
      };

      addToast(
        `${productToDelete.producto.nombre} desclasificado correctamente.`,
        "success",
        toastData
      );
      return true;
    } catch (error) {
      console.error("Error al desclasificar:", error);
      addToast(
        `Error al desclasificar el producto: ${error.message}.`,
        "error"
      );
      return false;
    }
  };

  const handleUndoDelete = async (productId) => {
    try {
      console.log("Intentando restaurar producto:", {
        productId,
        lastDeletedProduct,
        hasLastDeleted: !!lastDeletedProduct,
      });

      if (!lastDeletedProduct) {
        throw new Error("No hay producto para restaurar");
      }

      if (lastDeletedProduct.producto._id !== productId) {
        throw new Error("El producto no coincide con el último eliminado");
      }

      const updateData = {
        fechaFrente: lastDeletedProduct.fechaFrente,
        fechaAlmacen: lastDeletedProduct.fechaAlmacen,
        fechasAlmacen: lastDeletedProduct.fechasAlmacen || [],
        cajaUnica: lastDeletedProduct.cajaUnica || false,
        estado: lastDeletedProduct.estado,
      };

      console.log("Datos de restauración:", updateData);

      await updateProductStatus(productId, updateData);
      await loadAllProducts();

      const nombreProducto = lastDeletedProduct.producto.nombre;
      setLastDeletedProduct(null);

      addToast(`${nombreProducto} restaurado correctamente.`, "success");
      return true;
    } catch (error) {
      console.error("Error al deshacer:", error);
      addToast(`Error al deshacer: ${error.message}`, "error");
      return false;
    }
  };

  const filterProducts = useCallback(
    (searchTerm) => {
      if (!searchTerm) {
        // eslint-disable-next-line no-unused-vars
        const { "sin-clasificar": _unused, ...rest } = products;
        return rest;
      }

      const searchTermLower = searchTerm.toLowerCase().trim();
      return Object.entries(products).reduce(
        (filteredProducts, [category, productList]) => {
          const filtered = productList.filter((product) =>
            product.producto?.nombre?.toLowerCase().includes(searchTermLower)
          );

          if (filtered.length > 0 || category !== "sin-clasificar") {
            filteredProducts[category] = filtered;
          }

          return filteredProducts;
        },
        {}
      );
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    lastUpdatedProductId,
    loadAllProducts,
    handleUpdateProduct,
    handleDeleteProduct,
    handleUndoDelete,
    filterProducts,
    updateProductInState,
    removeProductFromState,
    addProductToState,
  };
};
