import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { X, Calendar, AlertCircle } from "lucide-react";
import usePreventScroll from "../hooks/usePreventScroll";

const CustomDateInput = ({ label, value, onChange, disabled = false }) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const keypadRef = useRef(null);

  // Usar el hook para prevenir scroll
  usePreventScroll(isOpen);

  // Formatear fecha inicial si existe
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        setInputValue(`${day}/${month}/${year}`);
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  // Manejar clics fuera del modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target) &&
        event.target.closest("[data-modal-backdrop]") // Solo cerrar si el click fue en el backdrop
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Validar fecha
  const isValidDate = useCallback((day, month, year) => {
    const date = new Date(year, month - 1, day);
    return (
      date.getDate() === parseInt(day) &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === parseInt(year)
    );
  }, []);

  // Validar que la fecha no sea anterior a hoy
  const isDateAfterToday = useCallback((day, month, year) => {
    const inputDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return inputDate >= today;
  }, []);

  // Formatear entrada mientras se escribe
  const formatInput = useCallback((input) => {
    const numbers = input.replace(/\D/g, "");
    let formatted = "";

    if (numbers.length > 0) {
      formatted += numbers.substring(0, 2);
    }
    if (numbers.length > 2) {
      formatted += "/" + numbers.substring(2, 4);
    }
    if (numbers.length > 4) {
      formatted += "/" + numbers.substring(4, 8);
    }

    return formatted;
  }, []);

  // Validar y actualizar valor
  const validateAndUpdate = useCallback(
    (dateString) => {
      const [day, month, year] = dateString.split("/").map(Number);

      if (dateString.length === 10) {
        if (!isValidDate(day, month, year)) {
          setError("Fecha inválida");
          return;
        }

        if (!isDateAfterToday(day, month, year)) {
          setError("La fecha no puede ser anterior a hoy");
          return;
        }

        setError("");
        const formattedDate = `${year}-${month
          .toString()
          .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        onChange(formattedDate);
        setIsOpen(false);
      }
    },
    [isValidDate, isDateAfterToday, onChange]
  );

  // Manejar entrada de teclado
  const handleInputChange = useCallback(
    (e) => {
      const formatted = formatInput(e.target.value);
      if (formatted.length <= 10) {
        setInputValue(formatted);
        if (formatted.length === 10) {
          validateAndUpdate(formatted);
        }
      }
    },
    [formatInput, validateAndUpdate]
  );

  // Manejar clic en número del teclado
  const handleKeypadClick = useCallback(
    (e, num) => {
      e.stopPropagation(); // Evitar que el click se propague

      // Si ya hay una fecha completa (10 caracteres), borrar todo y empezar de nuevo
      if (inputValue.length === 10) {
        setInputValue(num.toString());
        setError("");
        return;
      }

      if (inputValue.length < 10) {
        const newValue = formatInput(inputValue.replace(/\D/g, "") + num);
        setInputValue(newValue);
        if (newValue.length === 10) {
          validateAndUpdate(newValue);
        }
      }
    },
    [inputValue, formatInput, validateAndUpdate]
  );

  // Manejar borrado
  const handleDelete = useCallback((e) => {
    e.stopPropagation(); // Evitar que el click se propague
    setInputValue((prev) => {
      const newValue = prev.slice(0, -1);
      if (newValue.length < 10) {
        setError("");
      }
      return newValue;
    });
  }, []);

  // Manejar limpieza
  const handleClear = useCallback((e) => {
    e.stopPropagation(); // Evitar que el click se propague
    setInputValue("");
    setError("");
  }, []);

  return (
    <div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(true)}
          disabled={disabled}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-md
            font-medium text-sm transition-all duration-200
            ${
              disabled
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-[#2d3748] hover:bg-gray-50 active:bg-gray-100"
            }
            border border-gray-300 shadow-sm
          `}
        >
          <Calendar className="w-4 h-4" />
          {value ? (
            <span>{inputValue}</span>
          ) : (
            <span className="text-gray-500">Seleccionar {label}</span>
          )}
        </button>
        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setInputValue("");
            }}
            className="p-2 text-gray-400 hover:text-gray-600
              hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Modal con teclado numérico */}
      {isOpen && !disabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div
            data-modal-backdrop
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={modalRef}
            data-modal-content
            className="relative bg-white rounded-lg shadow-xl
              max-w-sm w-full mx-auto z-10 animate-slide-down
              overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#2d3748]">
                Seleccionar {label}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600
                  hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="max-h-[calc(100vh-8rem)] overflow-y-auto">
              {/* Input y error */}
              <div className="px-4">
                <div className="flex flex-col items-center space-y-3 py-4">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="DD/MM/YYYY"
                    className="w-full text-2xl text-center py-4 text-gray-800
                      rounded-md shadow-sm px-3
                      border border-gray-300 focus:border-[#1d5030] focus:ring-[#1d5030]
                      transition-colors duration-200
                      outline-none"
                  />
                  {error && (
                    <div
                      className="w-full bg-red-50 rounded-md px-3 py-2
                      flex items-center justify-center gap-2
                      animate-[slideDown_0.2s_ease-out]"
                    >
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <p className="text-base text-red-600">{error}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Separador */}
              <div className="border-t border-gray-200 my-2" />

              {/* Teclado numérico */}
              <div className="p-4">
                <div ref={keypadRef} className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={(e) => handleKeypadClick(e, num)}
                      className="w-14 h-14 flex items-center justify-center
                        text-[#2d3748] text-lg font-medium rounded-md
                        hover:bg-gray-100 active:bg-gray-200
                        transition-colors duration-150"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleClear}
                    className="w-14 h-14 flex items-center justify-center
                      text-gray-600 rounded-md
                      hover:bg-gray-100 active:bg-gray-200
                      transition-colors duration-150"
                  >
                    C
                  </button>
                  <button
                    onClick={(e) => handleKeypadClick(e, 0)}
                    className="w-14 h-14 flex items-center justify-center
                      text-[#2d3748] text-lg font-medium rounded-md
                      hover:bg-gray-100 active:bg-gray-200
                      transition-colors duration-150"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-14 h-14 flex items-center justify-center
                      text-gray-600 rounded-md
                      hover:bg-gray-100 active:bg-gray-200
                      transition-colors duration-150"
                  >
                    ←
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CustomDateInput.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default CustomDateInput;
