// API Base URL basada en el entorno
const API_BASE_URL = import.meta.env.PROD
  ? `${window.location.origin}/api` // URL de producción
  : "http://localhost:5000/api"; // URL de desarrollo

console.log("Entorno actual:", {
  VITE_PROD: import.meta.env.PROD,
  API_BASE_URL,
  ORIGIN: window.location.origin,
});

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

// Función auxiliar para manejar errores de la API
const handleApiError = async (response) => {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || errorData.message || "Error en la petición"
    );
  }
  throw new Error("Error en la petición");
};

// Obtener todos los estados de productos
export const getAllProductStatus = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getAllProductStatus:", error);
    throw error;
  }
};

// Actualizar estado de un producto
export const updateProductStatus = async (productId, data) => {
  try {
    console.log(`Enviando actualización para producto ${productId}:`, data);

    const response = await fetch(`${API_BASE_URL}/status/${productId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await handleApiError(response);
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

    const response = await fetch(`${API_BASE_URL}/catalog`, {
      headers: getHeaders(),
    });

    console.log("Respuesta del servidor:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en getAllCatalogProducts:", error);
    throw error;
  }
};

export const deleteProductStatus = async (productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/status/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en deleteProductStatus:", error);
    throw error;
  }
};

// Eliminar un producto del catálogo
export const deleteProduct = async (productId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/catalog/${productId}`, {
      method: "DELETE",
      headers: getHeaders(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    return await response.json();
  } catch (error) {
    console.error("Error en deleteProduct:", error);
    throw error;
  }
};
