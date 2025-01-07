import { useEffect, useRef } from "react";

const usePreventScroll = (isOpen) => {
  const previousOverflowRef = useRef("");

  useEffect(() => {
    if (isOpen) {
      // Guardar el valor actual de overflow
      previousOverflowRef.current = document.body.style.overflow;

      // Prevenir scroll en el body
      document.body.style.overflow = "hidden";

      // Prevenir scroll en dispositivos táctiles solo fuera de los modales
      const preventDefault = (e) => {
        const modalContent = e.target.closest("[data-modal-content]");
        const scrollableContent = e.target.closest("[data-scrollable]");

        if (modalContent && scrollableContent) {
          // Permitir scroll si estamos dentro de un área scrolleable dentro del modal
          const { scrollHeight, clientHeight, scrollTop } = scrollableContent;
          const isAtTop = scrollTop <= 0;
          const isAtBottom = scrollTop + clientHeight >= scrollHeight;

          // Permitir scroll si no estamos en los límites
          if (!isAtTop || !isAtBottom) {
            e.stopPropagation();
            return;
          }
        }

        // Prevenir scroll si estamos fuera de un modal o área scrolleable
        if (!modalContent && !scrollableContent) {
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
