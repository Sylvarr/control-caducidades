import { LogOut, Users, Package, CloudOff, Bell } from "lucide-react";
import PropTypes from "prop-types";
import { useSyncContext } from "../hooks/useSyncContext";
import OfflineManager from "../services/offlineManager";
import OfflineFeatureModal from "./OfflineFeatureModal";
import { useState } from "react";

const HeaderSection = ({
  user,
  expiringCount,
  hasExpiredProducts,
  onLogout,
  onUserManagementClick,
  onCatalogManagementClick,
  onExpiringClick,
}) => {
  const { pendingChanges } = useSyncContext();
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const handleUserManagementClick = () => {
    if (OfflineManager.isOfflineMode) {
      setShowOfflineModal(true);
    } else {
      onUserManagementClick();
    }
  };

  // Si no hay usuario, no renderizar nada
  if (!user) return null;

  return (
    <>
      <div className="flex flex-col items-center justify-center gap-1 mb-8">
        {/* Información del usuario y botones */}
        <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-3">
          <div className="flex items-center gap-2">
            <span className="select-none">
              {user.username} ·{" "}
              {user.role === "supervisor"
                ? "Supervisor"
                : user.role === "encargado"
                ? "Encargado"
                : "Gerente"}
            </span>
            <div className="flex items-center gap-2">
              {pendingChanges > 0 && (
                <div className="flex items-center gap-1 text-gray-600">
                  <CloudOff size={20} />
                  <span>{pendingChanges}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "supervisor" && (
              <>
                <button
                  onClick={onCatalogManagementClick}
                  className="p-2 text-gray-400 hover:text-[#1d5030]
                    hover:bg-[#1d5030]/10 rounded-md transition-colors"
                  title="Gestionar Catálogo"
                >
                  <Package className="w-5 h-5" />
                </button>
                <button
                  onClick={handleUserManagementClick}
                  className="p-2 text-gray-400 hover:text-[#1d5030]
                    hover:bg-[#1d5030]/10 rounded-md transition-colors"
                  title="Gestionar Usuarios"
                >
                  <Users className="w-5 h-5" />
                </button>
              </>
            )}
            <button
              onClick={onLogout}
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
          {expiringCount > 0 && (
            <button
              onClick={onExpiringClick}
              className={`
                relative inline-flex items-center justify-center
                min-w-[24px] h-[24px]
                ${
                  hasExpiredProducts
                    ? "bg-red-600 text-white"
                    : "bg-[#ffb81c] text-[#1a1a1a]"
                }
                rounded-full px-2
                font-['Noto Sans'] font-bold text-sm
                shadow-sm select-none
                transition-all duration-200
                hover:opacity-90 hover:shadow
                active:scale-95
                ${hasExpiredProducts ? "animate-pulse" : ""}
              `}
              aria-label="Ver productos próximos a caducar"
            >
              {expiringCount}
            </button>
          )}
        </div>
      </div>

      <OfflineFeatureModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        featureName="Gestión de Usuarios"
      />
    </>
  );
};

HeaderSection.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    role: PropTypes.oneOf(["supervisor", "encargado", "gerente"]).isRequired,
  }),
  expiringCount: PropTypes.number.isRequired,
  hasExpiredProducts: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onUserManagementClick: PropTypes.func.isRequired,
  onCatalogManagementClick: PropTypes.func.isRequired,
  onExpiringClick: PropTypes.func.isRequired,
};

export default HeaderSection;
