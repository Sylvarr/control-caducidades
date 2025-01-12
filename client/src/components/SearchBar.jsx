import { Search, X } from "lucide-react";
import PropTypes from "prop-types";

function SearchBar({
  searchTerm,
  onSearchChange,
  unclassifiedCount,
  onUnclassifiedClick,
}) {
  return (
    <div className="flex gap-2 mb-6">
      {/* Buscador más compacto */}
      <div className="flex-1 relative search-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={searchTerm}
          onChange={(e) => {
            const value = e.target.value;
            // Solo permitir letras y espacios, máximo 15 caracteres
            if (
              /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ\s]*$/.test(value) &&
              value.length <= 15
            ) {
              onSearchChange(value);
            }
          }}
          className="w-full h-10 pl-9 pr-9 rounded-lg border-0 
            focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
            font-['Noto Sans'] text-sm font-medium placeholder:text-gray-400
            bg-white shadow-sm"
          maxLength={15}
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1d5030] w-4 h-4" />
        {searchTerm && (
          <button
            onClick={() => onSearchChange("")}
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
        onClick={onUnclassifiedClick}
        className={`
          h-10 px-3 rounded-lg
          font-['Noto Sans'] text-sm font-medium select-none
          transition-colors duration-200
          flex items-center gap-2
          bg-white text-[#1d5030] hover:bg-gray-50
          shadow-sm
        `}
      >
        Sin Clasificar
        <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs select-none">
          {unclassifiedCount}
        </span>
      </button>
    </div>
  );
}

SearchBar.propTypes = {
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  unclassifiedCount: PropTypes.number.isRequired,
  onUnclassifiedClick: PropTypes.func.isRequired,
};

export default SearchBar;
