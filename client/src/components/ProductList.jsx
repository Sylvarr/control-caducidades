import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../App";
import ToastContainer from "./ToastContainer";
import UserManagement from "./UserManagement";
import CatalogManagement from "./CatalogManagement";
import { useSocket } from "../contexts/SocketContext";
import usePreventScroll from "../hooks/usePreventScroll";
import useToasts from "../hooks/useToasts";
import SearchBar from "./SearchBar";
import UpdateModal from "./UpdateModal";
import ExpiringModal from "./ExpiringModal";
import HeaderSection from "./HeaderSection";
import CategorySection from "./CategorySection";
import ModalContainer from "./ModalContainer";
import ProductListContainer from "./ProductListContainer";
import LoadingErrorContainer from "./LoadingErrorContainer";
import { useProductManagement } from "../hooks/useProductManagement";
import { useModalManagement } from "../hooks/useModalManagement";
import { useExpiringProducts } from "../hooks/useExpiringProducts";
import { isExpiringSoon } from "../utils/dateUtils";

const ProductList = () => {
  const navigate = useNavigate();
  const {
    user: authUser,
    setIsAuthenticated,
    setUser,
  } = useContext(AuthContext);
  const { socket } = useSocket();
  const { toasts, addToast, removeToast } = useToasts();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    cajaUnica: false,
    hayOtrasFechas: false,
    noHayEnAlmacen: false,
  });

  // Custom Hooks
  const {
    products,
    loading,
    error,
    lastUpdatedProductId,
    loadAllProducts,
    handleUpdateProduct,
    handleDeleteProduct,
    filterProducts,
  } = useProductManagement((message, type) => addToast(message, type));

  const {
    isUpdateModalOpen,
    isExpiringModalOpen,
    showUnclassified,
    isUserManagementOpen,
    showCatalogManagement,
    isClosingUnclassified,
    isClosingUpdateModal,
    isClosingExpiringModal,
    setIsUpdateModalOpen,
    setIsExpiringModalOpen,
    setShowUnclassified,
    setIsUserManagementOpen,
    setShowCatalogManagement,
    handleCloseUnclassified,
    handleCloseUpdateModal,
    handleCloseExpiringModal,
  } = useModalManagement();

  const { calculateExpiringProducts, getGroupedExpiringProducts } =
    useExpiringProducts(products);

  // Prevenir scroll cuando los modales están abiertos
  usePreventScroll(isUpdateModalOpen && !isClosingUpdateModal);
  usePreventScroll(showUnclassified && !isClosingUnclassified);
  usePreventScroll(isExpiringModalOpen && !isClosingExpiringModal);

  // Funciones de utilidad
  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
  };

  // Manejadores de eventos
  const handleProductClick = useCallback((product) => {
    setSelectedProduct((current) => {
      const newSelected =
        current?.producto?._id === product.producto?._id ? null : product;

      if (newSelected) {
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

  const handleUpdateClick = useCallback(
    (product, e) => {
      e?.stopPropagation();
      setEditingProduct(product);

      const defaultDate = product.fechaFrente
        ? new Date(product.fechaFrente).toISOString().split("T")[0]
        : `${new Date().getFullYear()}-MM-DD`;

      setUpdateForm({
        fechaFrente: product.fechaFrente
          ? new Date(product.fechaFrente).toISOString().split("T")[0]
          : defaultDate,
        fechaAlmacen:
          product.estado === "frente-agota"
            ? ""
            : product.fechaAlmacen
            ? new Date(product.fechaAlmacen).toISOString().split("T")[0]
            : defaultDate,
        cajaUnica: product.cajaUnica || false,
        hayOtrasFechas: product.hayOtrasFechas || false,
        noHayEnAlmacen: product.estado === "frente-agota",
      });

      setIsUpdateModalOpen(true);
    },
    [setIsUpdateModalOpen]
  );

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

      const updateData = {
        fechaFrente: updateForm.fechaFrente,
        fechaAlmacen: updateForm.noHayEnAlmacen
          ? null
          : updateForm.fechaAlmacen || null,
        cajaUnica: Boolean(updateForm.cajaUnica),
        hayOtrasFechas: Boolean(updateForm.hayOtrasFechas),
        estado: updateForm.noHayEnAlmacen ? "frente-agota" : "frente-cambia",
      };

      const success = await handleUpdateProduct(
        editingProduct.producto._id,
        updateData
      );

      if (success) {
        setIsUpdateModalOpen(false);
        setShowUnclassified(false);
        setEditingProduct(null);
        setSelectedProduct(null);
        setSearchTerm("");

        setTimeout(() => {
          const productElement = document.querySelector(
            `[data-product-id="${editingProduct.producto._id}"]`
          );
          if (productElement) {
            productElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 100);
      }
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteClick = async (product, e) => {
    e.stopPropagation();
    const success = await handleDeleteProduct(product.producto?._id);
    if (success) {
      setSelectedProduct(null);
      setSearchTerm("");
    }
  };

  const navigateToProduct = useCallback(
    (product) => {
      setIsExpiringModalOpen(false);
      setTimeout(() => {
        setSelectedProduct(product);
        setSearchTerm(product.producto.nombre);

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
        }, 100);
      }, 300);
    },
    [setIsExpiringModalOpen]
  );

  // Efectos
  useEffect(() => {
    loadAllProducts();
  }, [loadAllProducts]);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      const productCard = event.target.closest(".product-card");

      if (selectedProduct && !productCard) {
        setSelectedProduct(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedProduct]);

  useEffect(() => {
    if (!socket) return;

    socket.on("productStatusUpdate", (data) => {
      console.log("Recibida actualización de estado:", data);
      loadAllProducts();
    });

    return () => {
      socket.off("productStatusUpdate");
    };
  }, [socket, loadAllProducts]);

  const groupedProducts = getGroupedExpiringProducts();
  const hasExpiredProducts = groupedProducts.expired.products.length > 0;

  return (
    <LoadingErrorContainer
      loading={loading}
      error={error}
      onRetry={loadAllProducts}
    >
      <div className="max-w-md mx-auto p-4 bg-[#f8f8f8]">
        <ToastContainer toasts={toasts} removeToast={removeToast} />

        <HeaderSection
          user={authUser}
          expiringCount={calculateExpiringProducts()}
          hasExpiredProducts={hasExpiredProducts}
          onLogout={handleLogout}
          onUserManagementClick={() => setIsUserManagementOpen(true)}
          onCatalogManagementClick={() => setShowCatalogManagement(true)}
          onExpiringClick={() => setIsExpiringModalOpen(true)}
        />

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          unclassifiedCount={products["sin-clasificar"].length}
          onUnclassifiedClick={() => setShowUnclassified(!showUnclassified)}
        />

        {/* Lista de productos sin clasificar */}
        {showUnclassified && (
          <ModalContainer
            isOpen={showUnclassified}
            isClosing={isClosingUnclassified}
            onClose={handleCloseUnclassified}
            title={`Productos Sin Clasificar (${products["sin-clasificar"].length})`}
          >
            <div className="flex-1 overflow-y-auto overscroll-contain p-4">
              <CategorySection
                category="sin-clasificar"
                products={products["sin-clasificar"]}
                selectedProduct={selectedProduct}
                isExpiringSoon={isExpiringSoon}
                lastUpdatedProductId={lastUpdatedProductId}
                onProductClick={(p) => {
                  handleProductClick(p);
                  handleUpdateClick(p);
                }}
                onUpdateClick={handleUpdateClick}
                onDeleteClick={handleDeleteClick}
              />
            </div>
          </ModalContainer>
        )}

        {/* Lista de productos clasificados */}
        <ProductListContainer
          filteredProducts={filterProducts(searchTerm)}
          selectedProduct={selectedProduct}
          isExpiringSoon={isExpiringSoon}
          lastUpdatedProductId={lastUpdatedProductId}
          onProductClick={handleProductClick}
          onUpdateClick={handleUpdateClick}
          onDeleteClick={handleDeleteClick}
          searchTerm={searchTerm}
        />

        {/* Modales */}
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

        <ExpiringModal
          isOpen={isExpiringModalOpen}
          isClosing={isClosingExpiringModal}
          groupedProducts={groupedProducts}
          onClose={handleCloseExpiringModal}
          onProductClick={navigateToProduct}
        />

        <UserManagement
          isOpen={isUserManagementOpen}
          onClose={() => setIsUserManagementOpen(false)}
          currentUser={authUser}
        />

        <CatalogManagement
          isOpen={showCatalogManagement}
          onClose={() => {
            setShowCatalogManagement(false);
            loadAllProducts();
          }}
        />
      </div>
    </LoadingErrorContainer>
  );
};

export default ProductList;
