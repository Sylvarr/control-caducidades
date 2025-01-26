import { useEffect, useCallback } from "react";
import useSocketStore from "../stores/socketStore";

export const useSocket = () => {
  const {
    socket,
    isConnected,
    error,
    reconnectAttempt,
    initSocket,
    cleanup,
    emit,
    subscribe,
  } = useSocketStore();

  // Inicializar socket al montar el componente
  useEffect(() => {
    initSocket();
    return () => cleanup();
  }, [initSocket, cleanup]);

  // Wrapper para suscribirse a eventos con cleanup automático
  const on = useCallback(
    (event, callback) => {
      const unsubscribe = subscribe(event, callback);
      return unsubscribe;
    },
    [subscribe]
  );

  return {
    socket,
    isConnected,
    error,
    reconnectAttempt,
    emit,
    on,
  };
};
