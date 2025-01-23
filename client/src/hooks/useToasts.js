import { useState, useCallback, useRef } from "react";

const useToasts = () => {
  const [toasts, setToasts] = useState([]);
  const toastCounter = useRef(0);

  const addToast = useCallback((message, type = "info", data = {}) => {
    const id = ++toastCounter.current;
    setToasts((currentToasts) => [
      ...currentToasts,
      { id, message, type, ...data },
    ]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== id)
    );
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
  };
};

export default useToasts;
