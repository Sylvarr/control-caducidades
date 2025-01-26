import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.PROD
  ? window.location.origin
  : "http://localhost:5000";

const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const RECONNECTION_DELAY_MAX = 5000;

const useSocketStore = create(
  devtools(
    (set, get) => ({
      // Estado
      socket: null,
      isConnected: false,
      reconnectAttempt: 0,
      error: null,

      // Acciones
      initSocket: () => {
        const { socket } = get();
        if (socket) return; // Ya existe una conexión

        const socketInstance = io(SOCKET_URL, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: RECONNECTION_ATTEMPTS,
          reconnectionDelay: RECONNECTION_DELAY,
          reconnectionDelayMax: RECONNECTION_DELAY_MAX,
          timeout: 10000,
        });

        // Configurar eventos
        socketInstance.on("connect", () => {
          console.log("WebSocket conectado exitosamente");
          set({
            isConnected: true,
            error: null,
            reconnectAttempt: 0,
          });
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("WebSocket desconectado:", reason);
          set({ isConnected: false });

          if (reason === "io server disconnect") {
            console.log("Desconexión forzada por el servidor");
          } else if (reason === "transport close") {
            console.log("Conexión perdida, intentando reconectar...");
          }
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Error de conexión WebSocket:", error);
          set((state) => ({
            isConnected: false,
            error: error.message,
            reconnectAttempt: state.reconnectAttempt + 1,
          }));
        });

        socketInstance.on("reconnect", (attemptNumber) => {
          console.log(
            `Reconexión exitosa después de ${attemptNumber} intentos`
          );
          set({
            isConnected: true,
            error: null,
            reconnectAttempt: 0,
          });
        });

        socketInstance.on("reconnect_attempt", (attemptNumber) => {
          console.log(`Intento de reconexión #${attemptNumber}`);
          set({ reconnectAttempt: attemptNumber });
        });

        socketInstance.on("reconnect_failed", () => {
          console.error("Falló la reconexión después de todos los intentos");
          set({
            error: "No se pudo restablecer la conexión",
            isConnected: false,
          });
        });

        set({ socket: socketInstance });
      },

      // Limpiar conexión
      cleanup: () => {
        const { socket } = get();
        if (!socket) return;

        socket.removeAllListeners();
        socket.disconnect();
        set({
          socket: null,
          isConnected: false,
          error: null,
          reconnectAttempt: 0,
        });
      },

      // Emisión de eventos
      emit: (event, data) => {
        const { socket, isConnected } = get();
        if (!socket || !isConnected) {
          console.warn("No hay conexión disponible para emitir eventos");
          return false;
        }

        try {
          socket.emit(event, data);
          return true;
        } catch (error) {
          console.error(`Error al emitir evento ${event}:`, error);
          return false;
        }
      },

      // Suscripción a eventos
      subscribe: (event, callback) => {
        const { socket } = get();
        if (!socket) return () => {};

        socket.on(event, callback);
        return () => socket.off(event, callback);
      },
    }),
    {
      name: "Socket Store",
    }
  )
);

export default useSocketStore;
