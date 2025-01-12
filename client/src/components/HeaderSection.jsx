import { LogOut, Users, Package } from "lucide-react";
import PropTypes from "prop-types";

const HeaderSection = ({
  user,
  expiringCount,
  hasExpiredProducts,
  onLogout,
  onUserManagementClick,
  onCatalogManagementClick,
  onExpiringClick,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-1 mb-8">
      {/* Información del usuario y botones */}
      <div className="flex items-center gap-3 text-sm text-gray-500 font-medium mb-3">
        <span className="select-none">
          {user?.username} ·{" "}
          {user?.role === "supervisor"
            ? "Supervisor"
            : user?.role === "encargado"
            ? "Encargado"
            : "Gerente"}
        </span>
        <div className="flex items-center gap-2">
          {user?.role === "supervisor" && (
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
                onClick={onUserManagementClick}
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
  );
};

HeaderSection.propTypes = {
  user: PropTypes.shape({
    username: PropTypes.string.isRequired,
    role: PropTypes.oneOf(["supervisor", "encargado", "gerente"]).isRequired,
  }).isRequired,
  expiringCount: PropTypes.number.isRequired,
  hasExpiredProducts: PropTypes.bool.isRequired,
  onLogout: PropTypes.func.isRequired,
  onUserManagementClick: PropTypes.func.isRequired,
  onCatalogManagementClick: PropTypes.func.isRequired,
  onExpiringClick: PropTypes.func.isRequired,
};

export default HeaderSection;
