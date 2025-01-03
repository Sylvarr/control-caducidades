import { X } from "lucide-react";

const getToastStyles = (type) => {
  switch (type) {
    case "success":
      return {
        container: "bg-[#1d5030] text-white",
        icon: "text-white",
      };
    case "error":
      return {
        container: "bg-white border-2 border-red-500 text-red-500",
        icon: "text-red-500",
      };
    case "warning":
      return {
        container: "bg-white border-2 border-[#ffb81c] text-[#ffb81c]",
        icon: "text-[#ffb81c]",
      };
    default:
      return {
        container: "bg-white border-2 border-[#1d5030] text-[#1d5030]",
        icon: "text-[#1d5030]",
      };
  }
};

const ToastContainer = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type);
        return (
          <div
            key={toast.id}
            className={`
              ${styles.container}
              px-4 py-3 rounded-lg shadow-lg
              flex items-center justify-between
              min-w-[300px] max-w-md
              animate-slide-in
              font-['Noto Sans'] font-medium
            `}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className={`
                ${styles.icon}
                p-1 rounded-full
                hover:bg-black/10
                transition-colors duration-200
              `}
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
