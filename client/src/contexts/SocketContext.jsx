import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import PropTypes from "prop-types";

const SOCKET_URL = import.meta.env.PROD
  ? "https://tudominio.com" // URL de producción
  : "http://localhost:5000"; // URL de desarrollo

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Crear conexión Socket.IO
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Manejar eventos de conexión
    socketInstance.on("connect", () => {
      console.log("WebSocket conectado");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("WebSocket desconectado");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Error de conexión WebSocket:", error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Limpiar al desmontar
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, []);

  const value = {
    socket,
    isConnected,
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
