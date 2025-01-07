import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import {
  Search,
  RefreshCw,
  AlertCircle,
  Edit3,
  Trash2,
  Box,
  Clock,
  X,
  ChevronRight,
  LogOut,
  Users,
  Package,
} from "lucide-react";
import {
  getAllProductStatus,
  getAllCatalogProducts,
  updateProductStatus,
  deleteProductStatus,
} from "../services/api";
import ToastContainer from "./ToastContainer";
import PropTypes from "prop-types";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import { useSocket } from "../contexts/SocketContext";
import CustomDateInput from "./CustomDateInput";
import usePreventScroll from "../hooks/usePreventScroll";

// Constantes y funciones de utilidad
const CATEGORY_TITLES = {
  "sin-clasificar": "SIN CLASIFICAR",
  "frente-agota": "FRENTE Y AGOTA",
  "frente-cambia": "FRENTE Y CAMBIA",
  "abierto-cambia": "ABIERTO Y CAMBIA",
  "abierto-agota": "ABIERTO Y AGOTA",
};

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.getFullYear() !== new Date().getFullYear()
      ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${date.getFullYear()}`
      : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
  } catch {
    return "Fecha inválida";
  }
};

// Componente ProductSkeleton
const ProductSkeleton = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-[#ffb81c]/20">
    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
    <div className="space-y-2 border-t border-[#ffb81c]/10 pt-2">
      {[1, 2].map((index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-1" />
          <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      ))}
      <div className="space-y-2 mt-3">
        {[1, 2].map((index) => (
          <div
            key={index}
            className="h-10 bg-gray-200 rounded w-full animate-pulse"
          />
        ))}
      </div>
    </div>
  </div>
);

// Componentes auxiliares con PropTypes
const CustomCheckbox = ({ id, label, checked, disabled, onChange }) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-4 w-4 focus:ring-[#1d5030] border-gray-300 rounded
        ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "text-[#1d5030]"
        }`}
    />
    <label
      htmlFor={id}
      className={`ml-2 text-sm font-semibold
        ${disabled ? "text-gray-400" : "text-[#2d3748]"}`}
    >
      {label}
    </label>
  </div>
);

CustomCheckbox.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  disabled: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
};

const ProductList = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    setIsAuthenticated,
    setUser,
  } = useContext(AuthContext);
  const { socket } = useSocket();

  const handleLogout = () => {
    // Limpiar token
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");

    // Limpiar estado de autenticación
    setIsAuthenticated(false);
    setUser(null);

    // Redirigir al login
    navigate("/login");
  };

  // Estados
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [products, setProducts] = useState({
    "sin-clasificar": [],
    "frente-agota": [],
    "frente-cambia": [],
    "abierto-cambia": [],
    "abierto-agota": [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    cajaUnica: false,
    hayOtrasFechas: false,
    noHayEnAlmacen: false,
  });
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [showCatalogManagement, setShowCatalogManagement] = useState(false);
  const [lastUpdatedProductId, setLastUpdatedProductId] = useState(null);
  const [isClosingUnclassified, setIsClosingUnclassified] = useState(false);
  const [isClosingUpdateModal, setIsClosingUpdateModal] = useState(false);
  const [isClosingExpiringModal, setIsClosingExpiringModal] = useState(false);

  // Usar el hook para prevenir scroll en los modales
  usePreventScroll(isExpiringModalOpen);
  usePreventScroll(showUnclassified);
  usePreventScroll(isUpdateModalOpen);

  // Función mejorada para añadir toasts
  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((currentToasts) => [...currentToasts, { id, message, type }]);
  }, []);

  // Función para remover toasts
  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  // Función mejorada para validar fechas
  const isDateValid = useCallback((dateString) => {
    if (!dateString) return false;
    try {
      const selectedDate = new Date(dateString);
      if (isNaN(selectedDate.getTime())) return false;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    } catch {
      return false;
    }
  }, []);

  // Función optimizada para filtrar productos
  const filterProducts = useCallback((products, searchTerm) => {
    if (!searchTerm) {
      // eslint-disable-next-line no-unused-vars
      const { "sin-clasificar": _unused, ...rest } = products;
      return rest;
    }

    const searchTermLower = searchTerm.toLowerCase().trim();
    if (!searchTermLower) {
      // eslint-disable-next-line no-unused-vars
      const { "sin-clasificar": _unused, ...rest } = products;
      return rest;
    }

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
  }, []);

  // Efecto para cargar productos
  useEffect(() => {
    loadAllProducts();
  }, []);

  // Efecto para cargar usuario
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
  }, []);

  // Efecto para manejar clics fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchContainer = event.target.closest(".search-container");
      const productList = event.target.closest(".product-list-container");
      const productCard = event.target.closest(".product-card");

      if (selectedProduct && !productCard) {
        setSelectedProduct(null);
      }

      if (isFocused && !searchContainer && !productList && !productCard) {
        setIsFocused(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct, isFocused]);

  // Función para cargar todos los productos
  const loadAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statusData, catalogData] = await Promise.all([
        getAllProductStatus(),
        getAllCatalogProducts(),
      ]);

      const classifiedProductIds = new Set(
        statusData.map((product) => product.producto._id)
      );

      const unclassifiedProducts = catalogData
        .filter((product) => !classifiedProductIds.has(product._id))
        .map((product) => ({
          producto: product,
          estado: "sin-clasificar",
        }));

      const organizedProducts = {
        "sin-clasificar": [
          ...unclassifiedProducts,
          ...statusData.filter(
            (product) => product.estado === "sin-clasificar"
          ),
        ],
        "frente-agota": statusData.filter(
          (product) => product.estado === "frente-agota"
        ),
        "frente-cambia": statusData.filter(
          (product) => product.estado === "frente-cambia"
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
  };

  // Función para manejar el clic en un producto
  const handleProductClick = useCallback((product) => {
    setSelectedProduct((current) => {
      const newSelected =
        current?.producto?._id === product.producto?._id ? null : product;

      // Si se está seleccionando un producto (no deseleccionando)
      if (newSelected) {
        // Pequeño delay para permitir que el contenido se expanda
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

  // Función para manejar la actualización
  const handleUpdateClick = useCallback((product, e) => {
    e.stopPropagation();
    setEditingProduct(product);

    const defaultDate = product.fechaFrente
      ? new Date(product.fechaFrente).toISOString().split("T")[0]
      : `${new Date().getFullYear()}-MM-DD`;

    setUpdateForm({
      fechaFrente: product.fechaFrente
        ? new Date(product.fechaFrente).toISOString().split("T")[0]
        : defaultDate,
      fechaAlmacen: product.fechaAlmacen
        ? new Date(product.fechaAlmacen).toISOString().split("T")[0]
        : defaultDate,
      cajaUnica: product.cajaUnica || false,
      hayOtrasFechas: product.hayOtrasFechas || false,
      noHayEnAlmacen:
        product.estado !== "sin-clasificar" &&
        product.estado === "frente-agota",
    });

    setIsUpdateModalOpen(true);
  }, []);

  // Función para manejar el envío del formulario de actualización
  const handleSubmitUpdate = async () => {
    try {
      setIsUpdating(true);

      if (!editingProduct) {
        addToast("No hay producto seleccionado.", "error");
        return;
      }

      if (!updateForm.fechaFrente) {
        addToast("La fecha de frente es obligatoria.", "error");
        return;
      }

      if (!isDateValid(updateForm.fechaFrente)) {
        addToast("La fecha de frente no puede ser anterior a hoy.", "error");
        return;
      }

      if (!updateForm.noHayEnAlmacen && updateForm.fechaAlmacen) {
        if (!isDateValid(updateForm.fechaAlmacen)) {
          addToast("La fecha de almacén no puede ser anterior a hoy.", "error");
          return;
        }

        // Nueva validación: comparar fechas
        const fechaFrente = new Date(updateForm.fechaFrente);
        const fechaAlmacen = new Date(updateForm.fechaAlmacen);

        if (fechaFrente > fechaAlmacen) {
          addToast("Fecha de frente incorrecta.", "error");
          return;
        }
      }

      const updateData = {
        fechaFrente: updateForm.fechaFrente,
        fechaAlmacen: updateForm.noHayEnAlmacen
          ? null
          : updateForm.fechaAlmacen || null,
        cajaUnica: Boolean(updateForm.cajaUnica),
        hayOtrasFechas: Boolean(updateForm.hayOtrasFechas),
        estado: updateForm.noHayEnAlmacen ? "frente-agota" : "frente-cambia",
      };

      const catalogProductId = editingProduct.producto?._id;

      if (!catalogProductId) {
        addToast("No se pudo obtener el ID del producto.", "error");
        return;
      }

      await updateProductStatus(catalogProductId, updateData);
      await loadAllProducts();
      setIsUpdateModalOpen(false);
      setShowUnclassified(false);
      setEditingProduct(null);
      setSelectedProduct(null);
      setSearchTerm("");
      setLastUpdatedProductId(catalogProductId);

      // Limpiar el resaltado después de 3 segundos
      setTimeout(() => {
        setLastUpdatedProductId(null);
      }, 3000);

      // Scroll al producto actualizado
      setTimeout(() => {
        const productElement = document.querySelector(
          `[data-product-id="${catalogProductId}"]`
        );
        if (productElement) {
          productElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100); // Pequeño delay para asegurar que el DOM se ha actualizado

      addToast("Producto actualizado correctamente.", "success");
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  // Función para manejar el borrado de un producto
  const handleDeleteClick = async (product, e) => {
    e.stopPropagation();
    try {
      const productId = product.producto?._id || product._id;
      await deleteProductStatus(productId);
      await loadAllProducts();
      setSelectedProduct(null);
      setSearchTerm("");
      addToast("Producto desclasificado correctamente.", "success");
    } catch (error) {
      addToast(
        `Error al desclasificar el producto: ${error.message}.`,
        "error"
      );
    }
  };

  // Añadir una nueva función para calcular las notificaciones
  const calculateExpiringProducts = useCallback((products) => {
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    today.setHours(0, 0, 0, 0);
    twoWeeksFromNow.setHours(23, 59, 59, 999); // Incluir todo el día 14

    let count = 0;
    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
        const fechaFrente = new Date(product.fechaFrente);
        if (fechaFrente >= today && fechaFrente <= twoWeeksFromNow) {
          count++;
        }
      });
    });
    return count;
  }, []);

  // Añadir función auxiliar para verificar si un producto está próximo a caducar
  const isExpiringSoon = useCallback((date) => {
    if (!date) return false;
    const today = new Date();
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(today.getDate() + 14);

    today.setHours(0, 0, 0, 0);
    twoWeeksFromNow.setHours(23, 59, 59, 999);

    const productDate = new Date(date);
    // Ahora incluimos productos que ya han caducado
    return productDate <= twoWeeksFromNow;
  }, []);

  // Función para calcular días hasta caducidad
  const getDaysUntilExpiry = useCallback((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(date);
    expiryDate.setHours(0, 0, 0, 0);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, []);

  // Función para obtener productos próximos a caducar ordenados
  const getExpiringProducts = useCallback(() => {
    const expiringProducts = [];
    Object.values(products).forEach((productList) => {
      productList.forEach((product) => {
        const daysUntil = getDaysUntilExpiry(product.fechaFrente);
        // Incluir productos caducados (días negativos) y productos hasta 14 días
        if (daysUntil <= 14) {
          expiringProducts.push({
            ...product,
            daysUntilExpiry: daysUntil,
          });
        }
      });
    });
    return expiringProducts.sort(
      (a, b) => a.daysUntilExpiry - b.daysUntilExpiry
    );
  }, [products, getDaysUntilExpiry]);

  // Modificar la función para agrupar productos por días
  const getGroupedExpiringProducts = useCallback(() => {
    const products = getExpiringProducts();
    return {
      expired: {
        title: "Productos Caducados",
        color: "#991b1b",
        products: products.filter((p) => p.daysUntilExpiry <= 0),
      },
      urgent: {
        title: "Caduca en menos de 7 días",
        color: "#dc2626",
        products: products.filter(
          (p) => p.daysUntilExpiry > 0 && p.daysUntilExpiry < 7
        ),
      },
      warning: {
        title: "Caduca en 7-10 días",
        color: "#f97316",
        products: products.filter(
          (p) => p.daysUntilExpiry >= 7 && p.daysUntilExpiry <= 10
        ),
      },
      notice: {
        title: "Caduca en 11-14 días",
        color: "#ffb81c",
        products: products.filter(
          (p) => p.daysUntilExpiry >= 11 && p.daysUntilExpiry <= 14
        ),
      },
    };
  }, [getExpiringProducts]);

  // Añadir función para manejar la navegación a un producto
  const navigateToProduct = useCallback((product) => {
    setIsExpiringModalOpen(false);

    // Pequeño delay para permitir que el modal se cierre suavemente
    setTimeout(() => {
      setSelectedProduct(product);
      setSearchTerm(product.producto.nombre); // Añadir búsqueda automática

      // Encontrar y scrollear al producto
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
      }, 100); // Pequeño delay para asegurar que la búsqueda ha actualizado la lista
    }, 300);
  }, []);

  const handleCloseUnclassified = () => {
    setIsClosingUnclassified(true);
    setTimeout(() => {
      setShowUnclassified(false);
      setIsClosingUnclassified(false);
    }, 150);
  };

  const handleCloseUpdateModal = () => {
    setIsClosingUpdateModal(true);
    setTimeout(() => {
      setIsUpdateModalOpen(false);
      setEditingProduct(null);
      setIsClosingUpdateModal(false);
    }, 150);
  };

  const handleCloseExpiringModal = () => {
    setIsClosingExpiringModal(true);
    setTimeout(() => {
      setIsExpiringModalOpen(false);
      setIsClosingExpiringModal(false);
    }, 150);
  };

  // Efecto para manejar eventos de WebSocket
  useEffect(() => {
    if (!socket) return;

    // Manejar actualizaciones de estado de productos
    socket.on("productStatusUpdate", (data) => {
      console.log("Recibida actualización de estado:", data);

      if (data.type === "create" || data.type === "update") {
        // Asegurarse de que tenemos toda la información necesaria
        if (!data.productStatus || !data.productStatus.producto) {
          console.error("Datos de producto incompletos:", data);
          return;
        }

        // Actualizar el estado local con el nuevo estado del producto
        setProducts((prevProducts) => {
          const newProducts = { ...prevProducts };

          // Eliminar el producto de su categoría actual si existe
          Object.keys(newProducts).forEach((category) => {
            newProducts[category] = newProducts[category].filter(
              (p) => p.producto?._id !== data.productStatus.producto._id
            );
          });

          // Añadir el producto a su nueva categoría
          const targetCategory = data.productStatus.estado || "sin-clasificar";
          if (newProducts[targetCategory]) {
            // Asegurarse de que el producto tiene toda la información necesaria
            const completeProductStatus = {
              ...data.productStatus,
              producto: {
                ...data.productStatus.producto,
                nombre: data.productStatus.producto.nombre || "Sin nombre",
                tipo: data.productStatus.producto.tipo || "permanente",
                activo: data.productStatus.producto.activo ?? true,
              },
            };

            newProducts[targetCategory].push(completeProductStatus);
          }

          return newProducts;
        });
      } else if (data.type === "delete") {
        // Mover el producto a sin-clasificar
        setProducts((prevProducts) => {
          const newProducts = { ...prevProducts };

          // Encontrar y eliminar el producto de su categoría actual
          Object.keys(newProducts).forEach((category) => {
            if (category !== "sin-clasificar") {
              newProducts[category] = newProducts[category].filter(
                (p) => p.producto?._id !== data.productId
              );
            }
          });

          return newProducts;
        });
      }
    });

    // Limpiar suscripciones al desmontar
    return () => {
      socket.off("productStatusUpdate");
    };
  }, [socket]);

  // Renderizado condicional para estados de carga y error
  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        <ProductSkeleton />
        <ProductSkeleton />
        <ProductSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          Error al cargar los productos
        </h3>
        <p className="mt-1 text-gray-500">{error}</p>
        <button
          onClick={loadAllProducts}
          className="mt-4 px-4 py-2 bg-[#1d5030] text-white rounded-md hover:bg-[#1d5030]/90"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // Renderizado principal
  return (
    <div className="max-w-md mx-auto p-4 bg-[#f8f8f8]">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex flex-col items-center justify-center gap-1 mb-8">
        {/* Información del usuario y botones */}
        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-3">
          <span className="select-none">
            {authUser?.username} ·{" "}
            {authUser?.role === "supervisor"
              ? "Supervisor"
              : authUser?.role === "encargado"
              ? "Encargado"
              : "Gerente"}
          </span>
          <div className="flex items-center gap-2">
            {authUser?.role === "supervisor" && (
              <>
                <button
                  onClick={() => setShowCatalogManagement(true)}
                  className="p-2 text-gray-400 hover:text-[#1d5030]
                    hover:bg-[#1d5030]/10 rounded-md transition-colors"
                  title="Gestionar Catálogo"
                >
                  <Package className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsUserManagementOpen(true)}
                  className="p-2 text-gray-400 hover:text-[#1d5030]
                    hover:bg-[#1d5030]/10 rounded-md transition-colors"
                  title="Gestionar Usuarios"
                >
                  <Users className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-600
                hover:bg-red-50 rounded-md transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1d5030] font-['Noto Sans'] tracking-tight select-none">
            Lista de Caducidades
          </h1>
          {calculateExpiringProducts(products) > 0 && (
            <button
              onClick={() => setIsExpiringModalOpen(true)}
              className={`
                relative inline-flex items-center justify-center
                min-w-[24px] h-[24px]
                ${
                  getGroupedExpiringProducts().expired.products.length > 0
                    ? "bg-red-600 text-white"
                    : "bg-[#ffb81c] text-[#1a1a1a]"
                }
                rounded-full px-2
                font-['Noto Sans'] font-bold text-sm
                shadow-sm select-none
                transition-all duration-200
                hover:opacity-90 hover:shadow
                active:scale-95
                ${
                  getGroupedExpiringProducts().expired.products.length > 0
                    ? "animate-pulse"
                    : ""
                }
              `}
              aria-label="Ver productos próximos a caducar"
            >
              {calculateExpiringProducts(products)}
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {/* Buscador más compacto */}
        <div className="flex-1 relative search-container">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full h-10 pl-9 pr-9 rounded-lg border-0 
              focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
              font-['Noto Sans'] text-sm font-medium placeholder:text-gray-400
              bg-white shadow-sm"
          />
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1d5030] w-4 h-4" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1
                text-gray-400 hover:text-gray-600
                rounded-full hover:bg-gray-100
                transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Botón para productos sin clasificar */}
        <button
          onClick={() => setShowUnclassified(!showUnclassified)}
          className={`
            h-10 px-3 rounded-lg
            font-['Noto Sans'] text-sm font-medium select-none
            transition-colors duration-200
            flex items-center gap-2
            ${
              showUnclassified
                ? "bg-[#1d5030] text-white hover:bg-[#1d5030]/90"
                : "bg-white text-[#1d5030] hover:bg-gray-50"
            }
            shadow-sm
          `}
        >
          Sin Clasificar
          <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs select-none">
            {products["sin-clasificar"].length}
          </span>
        </button>
      </div>

      {/* Lista de productos sin clasificar */}
      {showUnclassified && (
        <div
          className={`
          fixed inset-0 z-50 flex items-start justify-center pt-20
          ${isClosingUnclassified ? "animate-fade-out" : "animate-fade-in"}
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseUnclassified();
            }
          }}
        >
          {/* Fondo oscuro clickeable */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-300"
            onClick={handleCloseUnclassified}
          />

          {/* Contenido del modal */}
          <div
            className={`
            relative w-full max-w-md mx-4
            bg-white rounded-lg shadow-xl
            max-h-[calc(100vh-8rem)] flex flex-col z-10
            ${isClosingUnclassified ? "animate-slide-up" : "animate-slide-down"}
            transition-all duration-300 ease-out
            overflow-hidden
            `}
            onClick={(e) => e.stopPropagation()}
            data-modal-content
          >
            <div className="flex-none sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1d5030]">
                  Productos Sin Clasificar
                  <span className="ml-2 text-sm font-medium text-gray-500 transition-all duration-200">
                    ({products["sin-clasificar"].length})
                  </span>
                </h2>
                <button
                  onClick={handleCloseUnclassified}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto overscroll-contain p-4"
              data-scrollable
            >
              <div className="space-y-2">
                {products["sin-clasificar"]
                  .sort((a, b) =>
                    a.producto?.nombre?.localeCompare(b.producto?.nombre)
                  )
                  .map((product) => {
                    const isSelected =
                      selectedProduct?.producto?._id === product.producto?._id;
                    return (
                      <div
                        key={product.producto?._id}
                        data-product-id={product.producto?._id}
                        onClick={(e) => {
                          handleProductClick(product);
                          handleUpdateClick(product, e);
                        }}
                        className={`
                        w-full text-left 
                        bg-white hover:bg-gray-50
                        rounded-lg
                        shadow-sm hover:shadow
                        transition-all duration-200
                        ${isSelected ? "ring-1 ring-[#1d5030]/30" : ""}
                        active:scale-[0.995]
                        p-4 product-card
                        cursor-pointer
                      `}
                      >
                        <span className="font-['Noto Sans'] font-semibold text-[#2d3748] text-base block transition-colors duration-200">
                          {product.producto?.nombre}
                        </span>
                      </div>
                    );
                  })}
              </div>
              <div className="h-4" />
            </div>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      <div className="product-list-container">
        {Object.entries(filterProducts(products, searchTerm)).map(
          ([category, productList], index) =>
            searchTerm && productList.length === 0 ? null : (
              <div
                key={category}
                className={`category-section ${index > 0 ? "mt-6" : ""}`}
              >
                {/* Header de categoría */}
                <h2
                  className="
                  bg-[#f3f4f6] 
                  border-l-4 border-[#1d5030] 
                  py-3 px-4
                  text-[14px] font-semibold 
                  text-[#1d5030]
                  uppercase tracking-wide
                  mb-3
                  select-none
                "
                >
                  {CATEGORY_TITLES[category]}
                </h2>

                {/* Lista de productos */}
                <div className="space-y-2 ml-2">
                  {productList.map((product) => {
                    const isSelected =
                      selectedProduct?.producto?._id === product.producto?._id;
                    return (
                      <div
                        key={product.producto?._id}
                        data-product-id={product.producto?._id}
                        onClick={() => handleProductClick(product)}
                        className={`
                          w-full text-left 
                          bg-white hover:bg-gray-50
                          rounded-lg
                          shadow-sm hover:shadow
                          transition-all duration-500
                          ${isSelected ? "ring-1 ring-[#1d5030]/30" : ""}
                          ${
                            lastUpdatedProductId === product.producto?._id
                              ? "animate-highlight bg-[#1d5030]/5"
                              : ""
                          }
                          active:scale-[0.995]
                          p-4 product-card
                          cursor-pointer
                        `}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-['Noto Sans'] font-semibold text-[#2d3748] text-base flex-1 select-none">
                            {product.producto?.nombre}
                          </span>
                          {isExpiringSoon(product.fechaFrente) && (
                            <div
                              className="
                              w-2 h-2 
                              rounded-full 
                              bg-[#ffb81c]
                              shadow-[0_0_6px_rgba(255,184,28,0.5)]
                              animate-pulse
                              transition-opacity duration-300
                            "
                            />
                          )}
                        </div>

                        {/* Contenido expandible */}
                        <div
                          className={`
                          transform transition-all duration-300
                          ${
                            isSelected
                              ? "max-h-[500px] opacity-100 mt-4"
                              : "max-h-0 opacity-0"
                          }
                          overflow-hidden
                        `}
                        >
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              {product.fechaFrente && (
                                <div className="bg-[#f8f8f8] rounded-md p-3">
                                  <div
                                    className="inline-block bg-[#1d5030]/10 px-2 py-1 rounded text-[#1d5030] 
                                    text-[14px] font-semibold mb-2 select-none"
                                  >
                                    FRENTE
                                  </div>
                                  <div className="text-xl font-bold text-[#1a1a1a] leading-tight select-none">
                                    {formatDate(product.fechaFrente)}
                                  </div>
                                </div>
                              )}
                              {product.fechaAlmacen && (
                                <div className="bg-[#f8f8f8] rounded-md p-3">
                                  <div
                                    className="inline-block bg-[#1d5030]/10 px-2 py-1 rounded text-[#1d5030] 
                                    text-[14px] font-semibold mb-2 select-none"
                                  >
                                    ALMACÉN
                                  </div>
                                  <div className="text-xl font-bold text-[#1a1a1a] leading-tight select-none">
                                    {formatDate(product.fechaAlmacen)}
                                  </div>
                                </div>
                              )}
                            </div>
                            {(product.hayOtrasFechas || product.cajaUnica) && (
                              <div className="flex flex-wrap gap-2">
                                {product.hayOtrasFechas && (
                                  <div
                                    className="inline-flex items-center px-2.5 py-1 rounded-md
                                    bg-[#1d5030]/5 text-[#1d5030] text-sm select-none"
                                  >
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    Hay otras fechas
                                  </div>
                                )}
                                {product.cajaUnica && (
                                  <div
                                    className="inline-flex items-center px-2.5 py-1 rounded-md
                                    bg-[#ffb81c]/5 text-[#1d5030] text-sm select-none"
                                  >
                                    <Box className="w-3.5 h-3.5 mr-1" />
                                    Última caja
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateClick(product, e);
                                }}
                                className="flex-1 py-2 text-white rounded-md
                                  bg-[#1d5030] hover:bg-[#1d5030]/90
                                  transition-colors duration-200
                                  font-medium text-sm select-none
                                  flex items-center justify-center gap-1.5
                                  shadow-sm hover:shadow
                                  mr-2"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Actualizar Estado
                              </button>
                              {(product.estado !== "sin-clasificar" ||
                                product.fechaFrente ||
                                product.fechaAlmacen) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(product, e);
                                  }}
                                  className="min-w-[48px] h-[40px] flex items-center justify-center
                                    text-gray-400 rounded-md
                                    hover:text-red-500 hover:bg-red-50
                                    transition-colors duration-200
                                    active:bg-red-100"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
        )}
      </div>

      {/* Modal de actualización */}
      {isUpdateModalOpen && (
        <div
          className={`
          fixed inset-0 flex items-center justify-center p-4 z-50
          ${isClosingUpdateModal ? "animate-fade-out" : "animate-fade-in"}
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseUpdateModal();
            }
          }}
        >
          {/* Fondo oscuro clickeable */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity duration-300"
            onClick={() => {
              setIsUpdateModalOpen(false);
              setEditingProduct(null);
            }}
          />

          <div
            className={`
            relative z-10 bg-white rounded-lg p-6 w-full max-w-md
            ${isClosingUpdateModal ? "animate-slide-out" : "animate-slide-in"}
            transform transition-all duration-300 ease-out
            `}
          >
            <h3 className="text-xl font-semibold text-[#2d3748] mb-6 select-none">
              Actualizar estado de {editingProduct?.producto?.nombre}
            </h3>

            <div className="space-y-5">
              <CustomDateInput
                label="Fecha Frente"
                value={updateForm.fechaFrente}
                onChange={(value) =>
                  setUpdateForm({ ...updateForm, fechaFrente: value })
                }
              />

              <CustomCheckbox
                id="noHayEnAlmacen"
                label="No hay producto en almacén"
                checked={updateForm.noHayEnAlmacen}
                onChange={(checked) =>
                  setUpdateForm({
                    ...updateForm,
                    noHayEnAlmacen: checked,
                    fechaAlmacen: checked ? "" : updateForm.fechaAlmacen,
                    cajaUnica: checked ? false : updateForm.cajaUnica,
                    hayOtrasFechas: checked ? false : updateForm.hayOtrasFechas,
                  })
                }
              />

              {!updateForm.noHayEnAlmacen && (
                <CustomDateInput
                  label="Fecha Almacén"
                  value={updateForm.fechaAlmacen}
                  onChange={(value) =>
                    setUpdateForm({ ...updateForm, fechaAlmacen: value })
                  }
                />
              )}

              <div className="space-y-3">
                <CustomCheckbox
                  id="cajaUnica"
                  label="Solo queda una caja"
                  checked={updateForm.cajaUnica}
                  disabled={
                    updateForm.noHayEnAlmacen || updateForm.hayOtrasFechas
                  }
                  onChange={(checked) =>
                    setUpdateForm({
                      ...updateForm,
                      cajaUnica: checked,
                      hayOtrasFechas: false,
                    })
                  }
                />

                <CustomCheckbox
                  id="hayOtrasFechas"
                  label="Hay más fechas"
                  checked={updateForm.hayOtrasFechas}
                  disabled={updateForm.noHayEnAlmacen || updateForm.cajaUnica}
                  onChange={(checked) =>
                    setUpdateForm({
                      ...updateForm,
                      hayOtrasFechas: checked,
                      cajaUnica: false,
                    })
                  }
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    handleCloseUpdateModal();
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#2d3748]
                    bg-gray-50 hover:bg-gray-100
                    rounded-lg transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitUpdate}
                  disabled={isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white
                    bg-[#1d5030] hover:bg-[#1d5030]/90
                    rounded-lg transition-colors duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Guardar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de productos próximos a caducar */}
      {isExpiringModalOpen && (
        <div
          className={`
          fixed inset-0 z-50 flex items-center justify-center p-4
          ${isClosingExpiringModal ? "animate-fade-out" : "animate-fade-in"}
          `}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseExpiringModal();
            }
          }}
        >
          {/* Fondo oscuro clickeable */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCloseExpiringModal}
          />

          {/* Contenido del modal */}
          <div
            className={`
              relative w-full max-w-md mx-auto bg-white rounded-2xl
              min-h-[320px] max-h-[70vh] overflow-hidden z-10
              ${
                isClosingExpiringModal
                  ? "animate-slide-out"
                  : "animate-slide-down"
              }
              transform transition-all duration-300
              shadow-xl
            `}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
              <div className="px-4 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#1d5030] select-none">
                  Próximas Caducidades
                </h2>
                <button
                  onClick={handleCloseExpiringModal}
                  className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Lista de productos agrupada */}
            <div className="overflow-y-auto" data-scrollable>
              {Object.entries(getGroupedExpiringProducts()).map(
                ([key, { title, color, products }]) =>
                  products.length > 0 && (
                    <div key={key} className="mb-6 last:mb-0">
                      {/* Header de sección */}
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                          {title}
                        </h3>
                      </div>

                      {/* Lista de productos */}
                      <div className="divide-y divide-gray-100">
                        {products
                          .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
                          .map((product) => (
                            <div
                              key={product.producto._id}
                              onClick={() => navigateToProduct(product)}
                              className={`
                                w-full text-left 
                                hover:bg-gray-50 active:bg-gray-100 
                                transition-colors duration-200
                                flex items-start gap-4 group
                                p-4 cursor-pointer
                                ${key === "expired" ? "bg-red-50" : ""} 
                              `}
                            >
                              {/* Barra indicadora de urgencia */}
                              <div
                                className={`
                                  w-1.5 self-stretch rounded-full
                                  ${key === "expired" ? "animate-pulse" : ""}
                                `}
                                style={{ backgroundColor: color }}
                              />

                              {/* Información del producto */}
                              <div className="flex-1 min-w-0">
                                {/* Nombre y días */}
                                <div className="flex items-start justify-between gap-3 mb-1">
                                  <h4
                                    className={`
                                    font-semibold truncate group-hover:text-[#1d5030] 
                                    transition-colors
                                    ${
                                      key === "expired"
                                        ? "text-red-700"
                                        : "text-[#2d3748]"
                                    }
                                  `}
                                  >
                                    {product.producto.nombre}
                                  </h4>
                                  <span
                                    className="text-sm font-medium whitespace-nowrap"
                                    style={{ color }}
                                  >
                                    {product.daysUntilExpiry < 0
                                      ? `Caducado hace ${Math.abs(
                                          product.daysUntilExpiry
                                        )} ${
                                          Math.abs(product.daysUntilExpiry) ===
                                          1
                                            ? "día"
                                            : "días"
                                        }`
                                      : `${product.daysUntilExpiry} ${
                                          product.daysUntilExpiry === 1
                                            ? "día"
                                            : "días"
                                        }`}
                                  </span>
                                </div>

                                {/* Fecha de caducidad */}
                                <p
                                  className={`
                                  text-sm font-medium
                                  ${
                                    key === "expired"
                                      ? "text-red-600"
                                      : "text-[#1d5030]"
                                  }
                                `}
                                >
                                  {formatDate(product.fechaFrente)}
                                </p>
                              </div>

                              {/* Indicador de acción */}
                              <div
                                className="text-gray-400 group-hover:text-[#1d5030] 
                                transition-colors self-center"
                              >
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )
              )}
              <div className="h-8" /> {/* Padding inferior aumentado */}
            </div>
          </div>
        </div>
      )}

      {/* User Management Modal */}
      <UserManagement
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        currentUser={authUser}
      />

      {/* Catalog Management Modal */}
      <CatalogManagement
        isOpen={showCatalogManagement}
        onClose={() => {
          setShowCatalogManagement(false);
          loadAllProducts(); // Recargar productos al cerrar el modal
        }}
      />
    </div>
  );
};

ProductList.propTypes = {
  // No necesita PropTypes ya que no recibe props directamente
};

export default ProductList;
