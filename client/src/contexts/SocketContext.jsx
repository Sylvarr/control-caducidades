import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import PropTypes from "prop-types";

const SOCKET_URL = import.meta.env.PROD
  ? "https://tudominio.com"
  : "http://localhost:5000";

const RECONNECTION_ATTEMPTS = 5;
const RECONNECTION_DELAY = 1000;
const RECONNECTION_DELAY_MAX = 5000;

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [error, setError] = useState(null);

  // Función para manejar la reconexión
  const handleReconnect = useCallback((attemptNumber) => {
    console.log(`Intento de reconexión #${attemptNumber}`);
    setReconnectAttempt(attemptNumber);
  }, []);

  // Función para manejar errores de conexión
  const handleConnectionError = useCallback(
    (error) => {
      console.error("Error de conexión WebSocket:", error);
      setIsConnected(false);
      setError(error.message);

      // Si alcanzamos el máximo de intentos, mostrar error
      if (reconnectAttempt >= RECONNECTION_ATTEMPTS) {
        console.error(
          "No se pudo establecer conexión después de múltiples intentos"
        );
      }
    },
    [reconnectAttempt]
  );

  // Función para limpiar el estado
  const cleanupSocket = useCallback((socketInstance) => {
    if (!socketInstance) return;

    // Remover todos los listeners
    socketInstance.removeAllListeners();
    // Desconectar el socket
    socketInstance.disconnect();
    // Limpiar el estado
    setSocket(null);
    setIsConnected(false);
    setError(null);
    setReconnectAttempt(0);
  }, []);

  useEffect(() => {
    // Crear conexión Socket.IO con opciones mejoradas
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: RECONNECTION_ATTEMPTS,
      reconnectionDelay: RECONNECTION_DELAY,
      reconnectionDelayMax: RECONNECTION_DELAY_MAX,
      timeout: 10000,
    });

    // Manejar eventos de conexión
    socketInstance.on("connect", () => {
      console.log("WebSocket conectado exitosamente");
      setIsConnected(true);
      setError(null);
      setReconnectAttempt(0);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("WebSocket desconectado:", reason);
      setIsConnected(false);

      // Manejar diferentes razones de desconexión
      if (reason === "io server disconnect") {
        // El servidor forzó la desconexión
        console.log("Desconexión forzada por el servidor");
      } else if (reason === "transport close") {
        // Conexión perdida, intentará reconectar automáticamente
        console.log("Conexión perdida, intentando reconectar...");
      }
    });

    socketInstance.on("connect_error", handleConnectionError);
    socketInstance.on("reconnect", handleReconnect);
    socketInstance.on("reconnect_attempt", handleReconnect);
    socketInstance.on("reconnect_failed", () => {
      console.error("Falló la reconexión después de todos los intentos");
      setError("No se pudo restablecer la conexión");
    });

    setSocket(socketInstance);

    // Cleanup al desmontar
    return () => cleanupSocket(socketInstance);
  }, [handleConnectionError, handleReconnect, cleanupSocket]);

  const value = {
    socket,
    isConnected,
    error,
    reconnectAttempt,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Hook personalizado para usar el socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket debe ser usado dentro de un SocketProvider");
  }
  return context;
};

export default SocketContext;
