// Obtener todos los estados de productos
export const getAllProductStatus = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/status");
    if (!response.ok) {
      throw new Error("Error al obtener los estados");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

// Actualizar estado de un producto
export const updateProductStatus = async (productId, data) => {
  try {
    console.log(`Enviando actualización para producto ${productId}:`, data);

    const response = await fetch(
      `http://localhost:5000/api/status/${productId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en la actualización");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en updateProductStatus:", error);
    throw error;
  }
};

// Añadir esta nueva función
export const getAllCatalogProducts = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/catalog");
    if (!response.ok) {
      throw new Error("Error al obtener el catálogo");
    }
    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

export const deleteProductStatus = async (productId) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/status/${productId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error("Error al desclasificar el producto");
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};
