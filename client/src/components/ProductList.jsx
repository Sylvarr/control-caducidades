import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import { AlertCircle, X, LogOut, Users, Package } from "lucide-react";
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
import usePreventScroll from "../hooks/usePreventScroll";
import SearchBar from "./SearchBar";
import ProductCard from "./ProductCard";
import UpdateModal from "./UpdateModal";
import ExpiringModal from "./ExpiringModal";

// Constantes y funciones de utilidad
const CATEGORY_TITLES = {
  "sin-clasificar": "SIN CLASIFICAR",
  "frente-cambia": "FRENTE Y CAMBIA",
  "frente-agota": "FRENTE Y AGOTA",
  "abierto-cambia": "ABIERTO Y CAMBIA",
  "abierto-agota": "ABIERTO Y AGOTA",
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
  <div className="flex items-center py-2.5 px-3 my-1.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors duration-200">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`w-4.5 h-4.5 focus:ring-[#1d5030] border-gray-300 rounded
        ${
          disabled
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : "text-[#1d5030]"
        }`}
    />
    <label
      htmlFor={id}
      className={`pl-2.5 font-medium select-none text-sm
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
    "frente-cambia": [],
    "frente-agota": [],
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
  usePreventScroll(isUpdateModalOpen && !isClosingUpdateModal);
  usePreventScroll(showUnclassified && !isClosingUnclassified);
  usePreventScroll(isExpiringModalOpen && !isClosingExpiringModal);

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
  }, [setUser]);

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
      // Restaurar el scroll después de cerrar el modal
      document.body.style.overflow = "";
    }, 150);
  };

  const handleCloseUpdateModal = () => {
    setIsClosingUpdateModal(true);
    setTimeout(() => {
      setIsUpdateModalOpen(false);
      setEditingProduct(null);
      setIsClosingUpdateModal(false);
      // Restaurar el scroll después de cerrar el modal
      document.body.style.overflow = "";
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

      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        unclassifiedCount={products["sin-clasificar"].length}
        onUnclassifiedClick={() => setShowUnclassified(!showUnclassified)}
      />

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
                  .map((product) => (
                    <ProductCard
                      key={product.producto?._id}
                      product={product}
                      isSelected={
                        selectedProduct?.producto?._id === product.producto?._id
                      }
                      isExpiringSoon={isExpiringSoon}
                      lastUpdatedProductId={lastUpdatedProductId}
                      onProductClick={(p) => {
                        handleProductClick(p);
                        handleUpdateClick(p);
                      }}
                      onUpdateClick={handleUpdateClick}
                      onDeleteClick={handleDeleteClick}
                    />
                  ))}
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
                  {productList.map((product) => (
                    <ProductCard
                      key={product.producto?._id}
                      product={product}
                      isSelected={
                        selectedProduct?.producto?._id === product.producto?._id
                      }
                      isExpiringSoon={isExpiringSoon}
                      lastUpdatedProductId={lastUpdatedProductId}
                      onProductClick={handleProductClick}
                      onUpdateClick={handleUpdateClick}
                      onDeleteClick={handleDeleteClick}
                    />
                  ))}
                </div>
              </div>
            )
        )}
      </div>

      {/* Modal de actualización */}
      <UpdateModal
        isOpen={isUpdateModalOpen}
        isClosing={isClosingUpdateModal}
        editingProduct={editingProduct}
        updateForm={updateForm}
        setUpdateForm={setUpdateForm}
        isUpdating={isUpdating}
        onClose={handleCloseUpdateModal}
        onSubmit={handleSubmitUpdate}
      />

      {/* Modal de productos próximos a caducar */}
      <ExpiringModal
        isOpen={isExpiringModalOpen}
        isClosing={isClosingExpiringModal}
        groupedProducts={getGroupedExpiringProducts()}
        onClose={handleCloseExpiringModal}
        onProductClick={navigateToProduct}
      />

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
