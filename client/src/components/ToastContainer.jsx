import { X } from "lucide-react";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";

const getToastStyles = (type) => {
  switch (type) {
    case "success":
      return {
        container: "bg-[#1d5030] text-white",
        icon: "text-white",
      };
    case "error":
      return {
        container: "bg-[#1d5030] text-white",
        icon: "text-white",
      };
    case "warning":
      return {
        container: "bg-[#1d5030] text-white",
        icon: "text-white",
      };
    default:
      return {
        container: "bg-[#1d5030] text-white",
        icon: "text-white",
      };
  }
};

const Toast = ({ toast, onRemove }) => {
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

  return (
    <div
      className={`
        ${styles.container}
        px-3 py-2.5 rounded-lg shadow-lg
        flex items-center justify-between
        w-[calc(100vw-32px)] sm:w-auto sm:min-w-[300px] sm:max-w-md
        ${isExiting ? "animate-slide-out" : "animate-slide-in"}
        font-['Noto Sans'] text-sm font-medium
        transform transition-all duration-200
      `}
    >
      <span className="mr-2">{toast.message}</span>
      <button
        onClick={handleManualClose}
        className={`
          ${styles.icon}
          p-1 rounded-full shrink-0
          hover:bg-black/10
          transition-colors duration-200
        `}
      >
        <X size={14} />
      </button>
    </div>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.number.isRequired,
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(["success", "error", "warning", "info"]).isRequired,
  }).isRequired,
  onRemove: PropTypes.func.isRequired,
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 items-end pointer-events-auto">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
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
    })
  ).isRequired,
  removeToast: PropTypes.func.isRequired,
};

export default ToastContainer;
