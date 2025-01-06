import { useEffect, useRef } from "react";

const usePreventScroll = (isOpen) => {
  const previousOverflowRef = useRef("");

  useEffect(() => {
    if (isOpen) {
      // Guardar el valor actual de overflow
      previousOverflowRef.current = document.body.style.overflow;

      // Prevenir scroll en el body
      document.body.style.overflow = "hidden";

      // Prevenir scroll en dispositivos táctiles
      const preventDefault = (e) => {
        const modalContent = e.target.closest("[data-modal-content]");
        if (!modalContent || !modalContent.contains(e.target)) {
          e.preventDefault();
        }
      };

      document.body.addEventListener("touchmove", preventDefault, {
        passive: false,
      });
      document.body.addEventListener("wheel", preventDefault, {
        passive: false,
      });

      // Cleanup
      return () => {
        document.body.style.overflow = previousOverflowRef.current;
        document.body.removeEventListener("touchmove", preventDefault);
        document.body.removeEventListener("wheel", preventDefault);
      };
    }
  }, [isOpen]);
};

export default usePreventScroll;
