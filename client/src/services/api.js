// Función auxiliar para obtener el token
const getAuthToken = () => {
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Función auxiliar para obtener los headers comunes
const getHeaders = (contentType = false) => {
  const headers = {
    Authorization: `Bearer ${getAuthToken()}`,
  };

  if (contentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
};

// Obtener todos los estados de productos
export const getAllProductStatus = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/status", {
      headers: getHeaders(),
    });
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
        headers: getHeaders(true),
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

// Obtener todos los productos del catálogo
export const getAllCatalogProducts = async () => {
  try {
    console.log("Obteniendo productos del catálogo...");
    console.log("Token disponible:", !!getAuthToken());

    const response = await fetch("http://localhost:5000/api/catalog", {
      headers: getHeaders(),
    });

    console.log("Respuesta del servidor:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al obtener el catálogo");
    }

    return await response.json();
  } catch (error) {
    console.error("Error completo:", error);
    throw error;
  }
};

export const deleteProductStatus = async (productId) => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/status/${productId}`,
      {
        method: "DELETE",
        headers: getHeaders(),
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
