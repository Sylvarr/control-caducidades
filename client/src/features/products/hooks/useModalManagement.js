import { useState, useCallback } from "react";

const ANIMATION_DURATION = 300;

export const useModalManagement = () => {
  // Estado de modales
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [showCatalogManagement, setShowCatalogManagement] = useState(false);

  // Estado de animaciones de cierre
  const [isClosingUnclassified, setIsClosingUnclassified] = useState(false);
  const [isClosingUpdateModal, setIsClosingUpdateModal] = useState(false);
  const [isClosingExpiringModal, setIsClosingExpiringModal] = useState(false);

  // Manejadores de cierre con animación
  const handleCloseUnclassified = useCallback(() => {
    setIsClosingUnclassified(true);
    setTimeout(() => {
      setShowUnclassified(false);
      setIsClosingUnclassified(false);
    }, ANIMATION_DURATION);
  }, []);

  const handleCloseUpdateModal = useCallback(() => {
    setIsClosingUpdateModal(true);
    setTimeout(() => {
      setIsUpdateModalOpen(false);
      setIsClosingUpdateModal(false);
    }, ANIMATION_DURATION);
  }, []);

  const handleCloseExpiringModal = useCallback(() => {
    setIsClosingExpiringModal(true);
    setTimeout(() => {
      setIsExpiringModalOpen(false);
      setIsClosingExpiringModal(false);
    }, ANIMATION_DURATION);
  }, []);

  return {
    // Estado de modales
    isUpdateModalOpen,
    isExpiringModalOpen,
    showUnclassified,
    isUserManagementOpen,
    showCatalogManagement,

    // Estado de animaciones
    isClosingUnclassified,
    isClosingUpdateModal,
    isClosingExpiringModal,

    // Setters
    setIsUpdateModalOpen,
    setIsExpiringModalOpen,
    setShowUnclassified,
    setIsUserManagementOpen,
    setShowCatalogManagement,

    // Manejadores de cierre
    handleCloseUnclassified,
    handleCloseUpdateModal,
    handleCloseExpiringModal,
  };
};
