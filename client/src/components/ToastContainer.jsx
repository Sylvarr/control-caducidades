import { X, Undo2 } from "lucide-react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const getToastStyles = (type) => {
  switch (type) {
    case "success":
      return {
        container: "bg-white border-2 border-[#1d5030] text-[#1d5030]",
        icon: "text-[#1d5030]",
        button: "bg-[#1d5030] text-white hover:bg-[#1d5030]/90",
      };
    case "error":
      return {
        container: "bg-white border-2 border-red-600 text-red-600",
        icon: "text-red-600",
        button: "bg-red-600 text-white hover:bg-red-700",
      };
    case "warning":
      return {
        container: "bg-white border-2 border-[#1d5030] text-[#1d5030]",
        icon: "text-[#1d5030]",
        button: "bg-[#1d5030] text-white hover:bg-[#1d5030]/90",
      };
    default:
      return {
        container: "bg-white border-2 border-[#1d5030] text-[#1d5030]",
        icon: "text-[#1d5030]",
        button: "bg-[#1d5030] text-white hover:bg-[#1d5030]/90",
      };
  }
};

const Toast = ({ toast, onRemove, onUndo }) => {
  const [isExiting, setIsExiting] = useState(false);
  const styles = getToastStyles(toast.type);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onRemove(toast.id);
      }, 150); // Duración de la animación de salida
    }, 3000); // Duración del toast

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const handleManualClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 150);
  };

  const showUndo = toast.message.endsWith("desclasificado correctamente.");

  const handleUndo = async () => {
    console.log("Toast data:", {
      message: toast.message,
      productId: toast.productId,
      hasUndoFunction: !!onUndo,
    });

    if (onUndo && toast.productId) {
      try {
        await onUndo(toast.productId);
        handleManualClose();
      } catch (error) {
        console.error("Error en handleUndo:", error);
      }
    } else {
      console.warn("No se puede deshacer: falta productId o función onUndo");
    }
  };

  return (
    <div
      className={`
        ${styles.container}
        px-4 py-3 rounded-lg shadow-lg
        flex items-center justify-between
        w-[calc(100vw-32px)] sm:w-auto sm:min-w-[300px] sm:max-w-md
        ${isExiting ? "animate-slide-out" : "animate-slide-in"}
        font-['Noto Sans'] text-sm font-medium
        transform transition-all duration-200
      `}
    >
      <span className="mr-2">{toast.message}</span>
      <div className="flex items-center gap-2">
        {showUndo && (
          <button
            onClick={handleUndo}
            className={`
              ${styles.button}
              px-3 py-1.5 rounded-md
              transition-colors duration-200
              flex items-center gap-1.5
              text-sm font-medium
            `}
          >
            <Undo2 className="w-4 h-4" />
            Deshacer
          </button>
        )}
        <button
          onClick={handleManualClose}
          className={`
            ${styles.icon}
            p-1.5 rounded-full
            hover:bg-gray-100
            transition-colors duration-200
          `}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
    productId: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

const ToastContainer = ({ toasts, removeToast, onUndo }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            onUndo={onUndo}
          />
        ))}
      </div>
    </div>
  );
};

ToastContainer.propTypes = {
  toasts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      message: PropTypes.string.isRequired,
      type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
      productId: PropTypes.string,
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired,
  onUndo: PropTypes.func,
};

export default ToastContainer;
