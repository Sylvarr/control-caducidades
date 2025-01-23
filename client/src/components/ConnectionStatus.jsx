import { useState, useEffect, useRef } from "react";
import { Wifi, WifiOff, Bug } from "lucide-react";
import FeatureManager from "../config/features";
import OfflineDebugger from "../utils/debugger";

const PING_INTERVAL = 30000; // 30 segundos
const PING_TIMEOUT = 5000; // 5 segundos
const CONNECTION_CHECK_INTERVAL = 5000; // Aumentado a 5 segundos para reducir ruido

const ConnectionStatus = () => {
  const currentOnlineState = useRef(navigator.onLine);
  const [connectionState, setConnectionState] = useState({
    isOnline: navigator.onLine,
    hasServerConnection: true,
    lastPingSuccess: Date.now(),
    latency: 0,
    lastStateChange: Date.now(),
  });
  const [showDebugger, setShowDebugger] = useState(false);
  const [logs, setLogs] = useState([]);

  // Función para verificar el estado de conexión
  const checkConnectionStatus = () => {
    const newOnlineStatus = navigator.onLine;
    const hasStateChanged = newOnlineStatus !== currentOnlineState.current;
    const timeSinceLastChange = Date.now() - connectionState.lastStateChange;

    // Solo actualizar y loggear si:
    // 1. Hay un cambio real en el estado Y
    // 2. Han pasado al menos 2 segundos desde el último cambio
    if (hasStateChanged && timeSinceLastChange > 2000) {
      const previousState = currentOnlineState.current;
      currentOnlineState.current = newOnlineStatus;

      setConnectionState((prev) => ({
        ...prev,
        isOnline: newOnlineStatus,
        hasServerConnection: newOnlineStatus ? prev.hasServerConnection : false,
        lastStateChange: Date.now(),
      }));

      OfflineDebugger.log(
        newOnlineStatus ? "BROWSER_ONLINE" : "BROWSER_OFFLINE",
        { previousState }
      );

      // Si estamos online, intentamos ping inmediatamente
      if (newOnlineStatus) {
        pingServer();
      }
    }
  };

  // Función para hacer ping al servidor
  const pingServer = async () => {
    // Si el navegador está offline, no intentamos hacer ping
    if (!navigator.onLine) {
      const wasOnline = currentOnlineState.current;
      currentOnlineState.current = false;

      setConnectionState((prev) => ({
        ...prev,
        isOnline: false,
        hasServerConnection: false,
      }));

      // Solo loggear si realmente estábamos online antes
      if (wasOnline) {
        OfflineDebugger.log("PING_SKIPPED_OFFLINE");
      }
      return;
    }

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT);

      const response = await fetch("/api/health", {
        method: "GET",
        signal: controller.signal,
        // Evitar cache
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const latency = Date.now() - startTime;
        setConnectionState((prev) => ({
          ...prev,
          isOnline: true,
          hasServerConnection: true,
          lastPingSuccess: Date.now(),
          latency,
        }));
        OfflineDebugger.log("SERVER_PING_SUCCESS", { latency });
      } else {
        throw new Error("Server response not OK");
      }
    } catch (error) {
      setConnectionState((prev) => ({
        ...prev,
        hasServerConnection: false,
      }));
      OfflineDebugger.error("SERVER_PING_FAILED", error);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      OfflineDebugger.log("ONLINE_EVENT_TRIGGERED");
      setConnectionState((prev) => ({
        ...prev,
        isOnline: true,
      }));
      // Intentar ping inmediatamente cuando detectamos conexión
      pingServer();
    };

    const handleOffline = () => {
      OfflineDebugger.log("OFFLINE_EVENT_TRIGGERED");
      setConnectionState((prev) => ({
        ...prev,
        isOnline: false,
        hasServerConnection: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Configurar ping periódico
    const pingInterval = setInterval(pingServer, PING_INTERVAL);

    // Configurar verificación periódica del estado de conexión
    const connectionCheckInterval = setInterval(
      checkConnectionStatus,
      CONNECTION_CHECK_INTERVAL
    );

    // Ping inicial y verificación inicial
    pingServer();
    checkConnectionStatus();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(pingInterval);
      clearInterval(connectionCheckInterval);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (showDebugger) {
        setLogs(OfflineDebugger.getLogHistory());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [showDebugger]);

  const toggleDebugger = () => {
    if (!showDebugger) {
      OfflineDebugger.enable();
    } else {
      OfflineDebugger.disable();
    }
    setShowDebugger(!showDebugger);
  };

  if (!FeatureManager.isEnabled("OFFLINE_MODE")) {
    return null;
  }

  const getConnectionStatus = () => {
    if (!connectionState.isOnline) {
      return {
        color: "bg-red-500",
        text: "Sin conexión",
        icon: <WifiOff className="w-4 h-4" />,
      };
    }
    if (!connectionState.hasServerConnection) {
      return {
        color: "bg-yellow-500",
        text: "Conexión limitada",
        icon: <Wifi className="w-4 h-4 opacity-50" />,
      };
    }
    return {
      color: "bg-green-500",
      text: `Online (${connectionState.latency}ms)`,
      icon: <Wifi className="w-4 h-4" />,
    };
  };

  const status = getConnectionStatus();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Estado de Conexión */}
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          ${status.color}
          text-white mb-2
        `}
      >
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
      </div>

      {/* Botón de Debug */}
      <button
        onClick={toggleDebugger}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
          ${showDebugger ? "bg-purple-600" : "bg-gray-600"}
          text-white
        `}
      >
        <Bug className="w-4 h-4" />
        <span className="text-sm font-medium">
          {showDebugger ? "Ocultar Debug" : "Mostrar Debug"}
        </span>
      </button>

      {/* Panel de Debug */}
      {showDebugger && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 overflow-auto bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-bold mb-2">Debug Log</h3>
          <pre className="text-xs">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {JSON.stringify(log, null, 2)}
              </div>
            ))}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
