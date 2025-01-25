import { useState, useCallback } from "react";
import { INITIAL_PRODUCTS_STATE } from "../constants/productConstants";
import {
  getAllProductStatus,
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
          IndexedDB.getAllCatalog(),
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

      const allProducts = [...statusData, ...unclassifiedProducts];
      const groupedProducts = groupProductsByState(allProducts);

      setProducts(groupedProducts);
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar productos:", error);
      setError(error.message);
      setLoading(false);
    }
  }, []);

  const groupProductsByState = useCallback((productList) => {
    return productList.reduce((acc, product) => {
      const estado = product.estado || "sin-clasificar";
      if (!acc[estado]) {
        acc[estado] = [];
      }
      acc[estado].push(product);
      return acc;
    }, {});
  }, []);

  const updateProductInState = useCallback((productData) => {
    console.log("Actualizando producto en estado:", productData);

    setProducts((prevProducts) => {
      // 1. Crear una copia profunda del estado actual
      const newState = { ...prevProducts };

      // 2. Asegurar que existen todas las categorías necesarias
      const requiredCategories = [
        "sin-clasificar",
        "frente-agota",
        "frente-cambia",
        "abierto-cambia",
        "abierto-agota",
      ];
      requiredCategories.forEach((category) => {
        if (!newState[category]) {
          newState[category] = [];
        }
      });

      // 3. Remover el producto de todas las categorías
      Object.keys(newState).forEach((category) => {
        newState[category] = newState[category].filter(
          (p) => p.producto._id !== productData.producto._id
        );
      });

      // 4. Añadir el producto a su nueva categoría
      const category = productData.estado || "sin-clasificar";
      newState[category] = [...newState[category], productData];

      console.log("Nuevo estado después de actualización:", newState);
      return newState;
    });

    // Marcar como último actualizado brevemente
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
    console.log("Añadiendo producto al estado:", productData);

    setProducts((prevProducts) => {
      // 1. Crear una copia profunda del estado actual
      const newState = { ...prevProducts };

      // 2. Asegurar que existen todas las categorías necesarias
      const requiredCategories = [
        "sin-clasificar",
        "frente-agota",
        "frente-cambia",
        "abierto-cambia",
        "abierto-agota",
      ];
      requiredCategories.forEach((category) => {
        if (!newState[category]) {
          newState[category] = [];
        }
      });

      // 3. Verificar si el producto ya existe en alguna categoría
      const existsInAnyCategory = Object.values(newState).some(
        (categoryProducts) =>
          categoryProducts.some(
            (p) => p.producto._id === productData.producto._id
          )
      );

      if (existsInAnyCategory) {
        // 4a. Si existe, actualizar en todas las categorías
        Object.keys(newState).forEach((category) => {
          newState[category] = newState[category].filter(
            (p) => p.producto._id !== productData.producto._id
          );
        });
      }

      // 4b. Añadir el producto a su categoría correspondiente
      const category = productData.estado || "sin-clasificar";
      newState[category] = [...newState[category], productData];

      return newState;
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

      addToast(
        `${productToDelete.producto.nombre} desclasificado correctamente.`,
        "success",
        { productId: productToDelete.producto._id }
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
      if (
        !lastDeletedProduct ||
        lastDeletedProduct.producto._id !== productId
      ) {
        throw new Error(
          !lastDeletedProduct
            ? "No hay producto para restaurar"
            : "El producto no coincide con el último eliminado"
        );
      }

      const updateData = {
        fechaFrente: lastDeletedProduct.fechaFrente,
        fechaAlmacen: lastDeletedProduct.fechaAlmacen,
        fechasAlmacen: lastDeletedProduct.fechasAlmacen || [],
        cajaUnica: lastDeletedProduct.cajaUnica || false,
        estado: lastDeletedProduct.estado,
      };

      const updatedProduct = await updateProductStatus(productId, updateData);
      updateProductInState(updatedProduct);

      setLastDeletedProduct(null);
      addToast(
        `${lastDeletedProduct.producto.nombre} restaurado correctamente.`,
        "success"
      );
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
